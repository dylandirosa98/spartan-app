import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/leads/[id]/twenty?companyId=xxx
 * Fetch full lead data from Twenty CRM
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const leadId = params.id;

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

    // Fetch lead with all fields from Twenty CRM
    const query = `
      query GetLead($leadId: UUID!) {
        lead(filter: { id: { eq: $leadId } }) {
          id
          name
          email {
            primaryEmail
            additionalEmails
          }
          phone {
            primaryPhoneNumber
            additionalPhones
          }
          city
          adress
          zipCode
          status
          source
          medium
          salesRep
          estValue {
            amountMicros
            currencyCode
          }
          notes
          aiSummary
          appointmentTime
          rawUtmSource
          utmMedium
          utmCampaign
          utmContent
          utmTerm
          gclid
          fbclid
          wbraid
          callPage {
            primaryLinkUrl
            primaryLinkLabel
            secondaryLinks
          }
          createdAt
          updatedAt
          deletedAt
          createdBy {
            source
            workspaceMemberId
            name
          }
          position
        }
      }
    `;

    const data = await (twentyClient as any).request(query, { leadId });

    return NextResponse.json({ lead: data.lead });
  } catch (error) {
    console.error('[Twenty Lead API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead from Twenty CRM', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
