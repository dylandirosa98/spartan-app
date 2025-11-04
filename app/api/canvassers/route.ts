import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/canvassers?companyId=xxx
 * Fetch available canvasser options from Twenty CRM
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

    // Introspection query to get enum values for canvasser field
    const introspectionQuery = `
      query GetCanvasserEnum {
        __type(name: "LeadCanvasserEnum") {
          name
          enumValues {
            name
          }
        }
      }
    `;

    console.log('[Canvassers API] Fetching canvasser enum values...');

    const data = await (twentyClient as any).request(introspectionQuery);

    const canvassers = data.__type?.enumValues?.map((v: any) => v.name) || [];

    console.log('[Canvassers API] Found canvassers:', canvassers);

    return NextResponse.json({ canvassers });
  } catch (error) {
    console.error('[Canvassers API] Error fetching canvassers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch canvassers from Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
