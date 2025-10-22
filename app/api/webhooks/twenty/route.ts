import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * Webhook endpoint for Twenty CRM
 * Receives real-time updates when leads change in Twenty CRM
 *
 * Setup in Twenty:
 * 1. Go to Settings → Developers → Webhooks
 * 2. Create webhook: https://your-app.vercel.app/api/webhooks/twenty
 * 3. Select events: person.created, person.updated, person.deleted
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    console.log('[Twenty Webhook] Received event:', event.type);

    // Extract lead data from Twenty webhook
    const leadData = event.data;
    if (!leadData) {
      return NextResponse.json({ error: 'No data in webhook' }, { status: 400 });
    }

    // Find which company this lead belongs to by matching the API key
    // (You'll need to add API key to the webhook or use a company identifier)
    const companyId = await getCompanyIdFromWebhook(request, leadData);

    if (!companyId) {
      console.error('[Twenty Webhook] Could not determine company');
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    // Handle different event types
    if (event.type === 'person.created' || event.type === 'person.updated') {
      // Upsert lead to Supabase
      const { error } = await supabase
        .from('leads')
        .upsert({
          company_id: companyId,
          twenty_id: leadData.id,
          name: `${leadData.name?.firstName || ''} ${leadData.name?.lastName || ''}`.trim(),
          phone: leadData.phone || null,
          email: leadData.email || null,
          address: leadData.address?.addressStreet1 || null,
          city: leadData.address?.addressCity || null,
          state: leadData.address?.addressState || null,
          zip_code: leadData.address?.addressPostcode || null,
          status: mapTwentyStatusToOurStatus(leadData.status),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'company_id,twenty_id'
        });

      if (error) {
        console.error('[Twenty Webhook] Supabase upsert error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log('[Twenty Webhook] Lead synced:', leadData.id);
    }

    if (event.type === 'person.deleted') {
      // Delete from Supabase
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('company_id', companyId)
        .eq('twenty_id', leadData.id);

      if (error) {
        console.error('[Twenty Webhook] Delete error:', error);
      }

      console.log('[Twenty Webhook] Lead deleted:', leadData.id);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Twenty Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Determine which company this webhook is for
 * Option 1: Match by API URL in the webhook
 * Option 2: Add company_id to webhook metadata in Twenty
 * Option 3: Have separate webhook URLs per company
 */
async function getCompanyIdFromWebhook(
  request: NextRequest,
  leadData: any
): Promise<string | null> {
  // For now, try to match by the webhook URL query parameter
  // Example: /api/webhooks/twenty?company=<company_id>
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company');

  if (companyId) {
    return companyId;
  }

  // Fallback: If webhook doesn't have company identifier,
  // you might need to match by API endpoint or other means
  // For single-company deployments, you could hardcode it

  // Get the first active company (for demo purposes)
  const { data: companies } = await supabase
    .from('companies')
    .select('id')
    .eq('is_active', true)
    .limit(1);

  return companies?.[0]?.id || null;
}

/**
 * Map Twenty CRM status to our status
 */
function mapTwentyStatusToOurStatus(twentyStatus: string | undefined): string {
  const statusMap: Record<string, string> = {
    'new': 'new',
    'contacted': 'contacted',
    'qualified': 'qualified',
    'proposal': 'quoted',
    'won': 'won',
    'lost': 'lost',
  };

  return statusMap[twentyStatus?.toLowerCase() || ''] || 'new';
}
