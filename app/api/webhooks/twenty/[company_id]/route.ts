import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * Company-specific webhook endpoint for Twenty CRM
 * Receives real-time updates when leads change in Twenty CRM
 *
 * URL format: https://your-app.vercel.app/api/webhooks/twenty/{company_id}
 *
 * Setup in Twenty CRM:
 * 1. Go to Settings → Developers → Webhooks
 * 2. Create webhook with your company-specific URL
 * 3. Select events: lead.created, lead.updated, lead.deleted
 * 4. Save and activate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { company_id: string } }
) {
  try {
    const companyId = params.company_id;
    const event = await request.json();

    console.log(`[Twenty Webhook] Received event for company ${companyId}:`, event.type || 'unknown');

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('[Twenty Webhook] Company not found:', companyId);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Extract lead data from webhook
    // Twenty CRM sends different structures depending on webhook version
    const leadData = event.record || event.data || event;

    if (!leadData || !leadData.id) {
      console.error('[Twenty Webhook] Invalid webhook payload:', event);
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    console.log('[Twenty Webhook] Processing lead:', leadData.id);

    // Determine event type
    const eventType = event.type || event.action || 'lead.updated';

    // Handle lead creation or update
    if (eventType.includes('created') || eventType.includes('updated')) {
      // Transform Twenty CRM lead to our format
      const leadUpdate = {
        company_id: companyId,
        twenty_id: leadData.id,
        name: (typeof leadData.name === 'string'
          ? leadData.name
          : `${leadData.name?.firstName || ''} ${leadData.name?.lastName || ''}`.trim()) || 'Unknown',
        phone: leadData.phone?.primaryPhoneNumber || leadData.phone || null,
        email: leadData.email?.primaryEmail || leadData.email || null,
        address: leadData.address?.addressStreet1 || null,
        city: leadData.city || leadData.address?.addressCity || null,
        state: leadData.address?.addressState || null,
        zip_code: leadData.address?.addressPostcode || null,
        status: 'new', // Default status, you can map from Twenty if available
        notes: leadData.notes || null,
        source: 'twenty_crm',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('leads')
        .upsert(leadUpdate, {
          onConflict: 'company_id,twenty_id',
          ignoreDuplicates: false, // Update existing records
        })
        .select()
        .single();

      if (error) {
        console.error('[Twenty Webhook] Supabase upsert error:', error);
        return NextResponse.json(
          { error: 'Database error', details: error.message },
          { status: 500 }
        );
      }

      console.log(`[Twenty Webhook] Lead ${eventType.includes('created') ? 'created' : 'updated'}:`, data.id);

      return NextResponse.json({
        success: true,
        action: eventType.includes('created') ? 'created' : 'updated',
        leadId: data.id,
      });
    }

    // Handle lead deletion
    if (eventType.includes('deleted')) {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('company_id', companyId)
        .eq('twenty_id', leadData.id);

      if (error) {
        console.error('[Twenty Webhook] Delete error:', error);
        return NextResponse.json(
          { error: 'Delete failed', details: error.message },
          { status: 500 }
        );
      }

      console.log('[Twenty Webhook] Lead deleted:', leadData.id);

      return NextResponse.json({
        success: true,
        action: 'deleted',
        leadId: leadData.id,
      });
    }

    // Unknown event type
    console.log('[Twenty Webhook] Unhandled event type:', eventType);
    return NextResponse.json({
      success: true,
      message: 'Event received but not processed',
      eventType,
    });

  } catch (error) {
    console.error('[Twenty Webhook] Error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to verify webhook is working
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { company_id: string } }
) {
  const companyId = params.company_id;

  // Verify company exists
  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .single();

  if (error || !company) {
    return NextResponse.json(
      { error: 'Company not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: 'Twenty CRM Webhook Endpoint',
    company: company.name,
    companyId: companyId,
    status: 'active',
    supportedEvents: [
      'lead.created',
      'lead.updated',
      'lead.deleted',
    ],
  });
}
