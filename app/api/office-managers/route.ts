import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/office-managers?companyId=xxx
 * Fetch available office manager options from Twenty CRM
 */
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

    // Introspection query to get enum values for officeManager field
    const introspectionQuery = `
      query GetOfficeManagerEnum {
        __type(name: "LeadOfficemanagerEnum") {
          name
          enumValues {
            name
          }
        }
      }
    `;

    console.log('[Office Managers API] Fetching office manager enum values...');

    const data = await (twentyClient as any).request(introspectionQuery);

    const officeManagers = data.__type?.enumValues?.map((v: any) => v.name) || [];

    console.log('[Office Managers API] Found office managers:', officeManagers);

    return NextResponse.json({ officeManagers });
  } catch (error) {
    console.error('[Office Managers API] Error fetching office managers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch office managers from Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}