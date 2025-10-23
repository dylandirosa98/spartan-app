import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/files?companyId=xxx&leadId=xxx
 * Fetch all files/attachments for a lead from Twenty CRM
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const leadId = searchParams.get('leadId');

    if (!companyId || !leadId) {
      return NextResponse.json(
        { error: 'companyId and leadId are required' },
        { status: 400 }
      );
    }

    // Get company configuration
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('twenty_api_url, twenty_api_key')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Decrypt API key
    const decryptedApiKey = decrypt(company.twenty_api_key);

    // Create Twenty CRM client
    const twentyClient = new TwentyCRMClient(
      company.twenty_api_url,
      decryptedApiKey
    );

    // Query attachments for the lead
    const query = `
      query GetAttachments($leadId: UUID!) {
        attachments(filter: { leadId: { eq: $leadId } }) {
          edges {
            node {
              id
              name
              fullPath
              type
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    console.log('[Files API] Fetching attachments for leadId:', leadId);

    const data = await (twentyClient as any).request(query, { leadId });

    const files = data.attachments?.edges?.map((edge: any) => edge.node) || [];

    console.log('[Files API] Fetched files for lead:', leadId, files.length);

    return NextResponse.json({ files });
  } catch (error) {
    console.error('[Files API] Error fetching files:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch files from Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Upload a file and attach it to a lead in Twenty CRM
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('leadId') as string;
    const companyId = formData.get('companyId') as string;

    if (!file || !leadId || !companyId) {
      return NextResponse.json(
        { error: 'file, leadId, and companyId are required' },
        { status: 400 }
      );
    }

    // Get company configuration
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('twenty_api_url, twenty_api_key')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Decrypt API key
    const decryptedApiKey = decrypt(company.twenty_api_key);

    const graphqlUrl = `${company.twenty_api_url.replace(/\/$/, '')}/graphql`;
    console.log('[Files API] GraphQL URL:', graphqlUrl);

    // Step 1: Create attachment record to get attachment ID
    console.log('[Files API] Step 1: Creating attachment record...');

    const createAttachmentMutation = `
      mutation CreateAttachment($leadId: ID!, $fileName: String!, $mimeType: String!) {
        createAttachment(data: {
          name: $fileName
          type: $mimeType
          leadId: $leadId
        }) {
          id
          name
          fullPath
          type
          createdAt
        }
      }
    `;

    const createResponse = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${decryptedApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createAttachmentMutation,
        variables: {
          leadId: leadId,
          fileName: file.name,
          mimeType: file.type,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[Files API] Create attachment failed:', errorText);
      throw new Error(`Failed to create attachment: ${createResponse.status} ${errorText}`);
    }

    const createResult = await createResponse.json();
    console.log('[Files API] Create response:', createResult);

    if (createResult.errors) {
      console.error('[Files API] GraphQL errors:', createResult.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(createResult.errors)}`);
    }

    const attachment = createResult.data.createAttachment;
    console.log('[Files API] Attachment created:', attachment);

    // Step 2: Upload file using multipart GraphQL upload
    console.log('[Files API] Step 2: Uploading file content...');

    const operations = {
      query: `
        mutation UploadFile($file: Upload!, $fileFolder: FileFolder) {
          uploadFile(file: $file, fileFolder: $fileFolder) {
            path
            token
          }
        }
      `,
      variables: {
        file: null,
        fileFolder: 'Attachment'
      }
    };

    const map = {
      '0': ['variables.file']
    };

    const uploadFormData = new FormData();
    uploadFormData.append('operations', JSON.stringify(operations));
    uploadFormData.append('map', JSON.stringify(map));
    uploadFormData.append('0', file, file.name);

    const uploadResponse = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${decryptedApiKey}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[Files API] File upload failed:', errorText);
      throw new Error(`Failed to upload file: ${uploadResponse.status} ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('[Files API] Upload result:', uploadResult);

    if (uploadResult.errors) {
      console.error('[Files API] Upload errors:', uploadResult.errors);
      throw new Error(`Upload errors: ${JSON.stringify(uploadResult.errors)}`);
    }

    const filePath = uploadResult.data?.uploadFile?.path;
    console.log('[Files API] File uploaded to path:', filePath);

    // Step 3: Update attachment with the uploaded file path
    console.log('[Files API] Step 3: Updating attachment with file path...');

    const updateAttachmentMutation = `
      mutation UpdateAttachment($id: UUID!, $fullPath: String!) {
        updateAttachment(id: $id, data: { fullPath: $fullPath }) {
          id
          name
          fullPath
          type
          createdAt
        }
      }
    `;

    const updateResponse = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${decryptedApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: updateAttachmentMutation,
        variables: {
          id: attachment.id,
          fullPath: filePath,
        },
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('[Files API] Update attachment failed:', errorText);
      throw new Error(`Failed to update attachment: ${updateResponse.status} ${errorText}`);
    }

    const updateResult = await updateResponse.json();
    console.log('[Files API] Update result:', updateResult);

    if (updateResult.errors) {
      console.error('[Files API] Update errors:', updateResult.errors);
      throw new Error(`Update errors: ${JSON.stringify(updateResult.errors)}`);
    }

    const finalAttachment = updateResult.data.updateAttachment;
    console.log('[Files API] Attachment finalized:', finalAttachment);

    return NextResponse.json({
      success: true,
      file: finalAttachment,
    });
  } catch (error) {
    console.error('[Files API] Error uploading file:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file to Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
