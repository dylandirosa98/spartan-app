import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
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

    // Introspection query to check attachment-related types
    const introspectionQuery = `
      query IntrospectAttachment {
        __schema {
          types {
            name
            kind
            fields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      }
    `;

    const data = await (twentyClient as any).request(introspectionQuery);

    // Filter for attachment-related types
    const attachmentTypes = data.__schema.types.filter((type: any) =>
      type.name && (
        type.name.toLowerCase().includes('attachment') ||
        type.name.toLowerCase().includes('file')
      )
    );

    console.log('[Introspect] Found attachment types:', attachmentTypes.map((t: any) => t.name));

    return NextResponse.json({
      attachmentTypes,
      allTypeNames: data.__schema.types.map((t: any) => t.name).filter((n: any) =>
        n && (n.toLowerCase().includes('attachment') || n.toLowerCase().includes('file'))
      )
    });
  } catch (error) {
    console.error('[Introspect] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to introspect Twenty CRM schema',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
