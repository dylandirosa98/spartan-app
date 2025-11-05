import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/leads/enums?companyId=xxx
 * Fetch enum values for Lead fields from Twenty CRM
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

    // Fetch enum values via GraphQL introspection
    const query = `
      query GetLeadEnums {
        __type(name: "Lead") {
          name
          fields {
            name
            type {
              name
              kind
              enumValues {
                name
              }
            }
          }
        }
      }
    `;

    const data = await (twentyClient as any).request(query);

    // Extract enum values for specific fields
    const fields = data.__type.fields;
    const enums: Record<string, Array<{ value: string; label: string }>> = {
      status: [],
      source: [],
      medium: [],
      salesRep: [],
      canvasser: [],
      demo: [],
    };

    // Helper to format enum value for display
    const formatEnumLabel = (value: string) => {
      return value
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Find and extract enum values
    for (const field of fields) {
      if (field.name === 'status' && field.type.enumValues) {
        enums.status = field.type.enumValues.map((ev: any) => ({
          value: ev.name,
          label: formatEnumLabel(ev.name),
        }));
      } else if (field.name === 'source' && field.type.enumValues) {
        enums.source = field.type.enumValues.map((ev: any) => ({
          value: ev.name,
          label: formatEnumLabel(ev.name),
        }));
      } else if (field.name === 'medium' && field.type.enumValues) {
        enums.medium = field.type.enumValues.map((ev: any) => ({
          value: ev.name,
          label: formatEnumLabel(ev.name),
        }));
      } else if (field.name === 'salesRep' && field.type.enumValues) {
        enums.salesRep = field.type.enumValues.map((ev: any) => ({
          value: ev.name,
          label: formatEnumLabel(ev.name),
        }));
      } else if (field.name === 'canvasser' && field.type.enumValues) {
        enums.canvasser = field.type.enumValues.map((ev: any) => ({
          value: ev.name,
          label: formatEnumLabel(ev.name),
        }));
      } else if (field.name === 'demo' && field.type.enumValues) {
        enums.demo = field.type.enumValues.map((ev: any) => ({
          value: ev.name,
          label: formatEnumLabel(ev.name),
        }));
      }
    }

    console.log('[Lead Enums API] Fetched enums:', enums);

    return NextResponse.json({ enums });
  } catch (error) {
    console.error('[Lead Enums API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch lead enums from Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
