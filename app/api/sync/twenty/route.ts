import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { createTwentyClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

/**
 * Initial sync endpoint for Twenty CRM
 * Fetches all leads from Twenty and populates Supabase
 *
 * Usage: POST /api/sync/twenty?company=<company_id>
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('company');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID required as query parameter' },
        { status: 400 }
      );
    }

    // Get company's Twenty CRM configuration
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

    if (!company.twenty_api_url || !company.twenty_api_key) {
      return NextResponse.json(
        { error: 'Company does not have Twenty CRM configured' },
        { status: 400 }
      );
    }

    // Decrypt the API key
    const decryptedApiKey = decrypt(company.twenty_api_key);
    console.log('[Twenty Sync] Decrypted API key length:', decryptedApiKey.length);

    // Create Twenty CRM client
    const twentyClient = createTwentyClient(
      company.twenty_api_url,
      decryptedApiKey
    );

    console.log('[Twenty Sync] Fetching leads from Twenty CRM...');

    // Fetch all leads from Twenty
    const twentyLeads = await twentyClient.getLeads({ limit: 1000 });

    if (!twentyLeads || twentyLeads.length === 0) {
      return NextResponse.json({
        message: 'No leads found in Twenty CRM',
        synced: 0,
      });
    }

    console.log(`[Twenty Sync] Found ${twentyLeads.length} leads in Twenty CRM`);

    // Transform and upsert to Supabase
    const leadsToSync = twentyLeads.map((lead) => ({
      company_id: companyId,
      twenty_id: lead.id,
      name: (typeof lead.name === 'string' ? lead.name : `${lead.name?.firstName || ''} ${lead.name?.lastName || ''}`.trim()) || 'Unknown',
      phone: lead.phone || null,
      email: lead.email || null,
      address: lead.address?.addressStreet1 || null,
      city: lead.city || null,
      state: lead.address?.addressState || null,
      zip_code: lead.address?.addressPostcode || null,
      status: 'new', // Default status
      notes: null,
      source: 'twenty_crm',
      updated_at: new Date().toISOString(),
    }));

    // Batch upsert to Supabase
    const { data, error } = await supabase
      .from('leads')
      .upsert(leadsToSync, {
        onConflict: 'company_id,twenty_id',
        ignoreDuplicates: false, // Update existing records
      })
      .select();

    if (error) {
      console.error('[Twenty Sync] Supabase upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to sync leads to database', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[Twenty Sync] Successfully synced ${data?.length || 0} leads`);

    return NextResponse.json({
      message: 'Sync completed successfully',
      synced: data?.length || 0,
      total: twentyLeads.length,
    });

  } catch (error) {
    console.error('[Twenty Sync] Error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
