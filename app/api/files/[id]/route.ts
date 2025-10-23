import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DELETE /api/files/[id]?companyId=xxx
 * Delete a file attachment from Twenty CRM
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
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

    // Delete attachment mutation
    const mutation = `
      mutation DeleteAttachment($attachmentId: UUID!) {
        deleteAttachment(id: $attachmentId) {
          id
        }
      }
    `;

    const data = await (twentyClient as any).request(mutation, {
      attachmentId: fileId,
    });

    console.log('[Files API] Deleted attachment:', fileId);

    return NextResponse.json({
      success: true,
      deletedId: data.deleteAttachment.id,
    });
  } catch (error) {
    console.error('[Files API] Error deleting file:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete file from Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
