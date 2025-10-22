import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { createTwentyClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

/**
 * GET /api/leads
 * Fetch leads for a specific company
 * Query params: company_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch leads from Supabase
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Leads API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: error.message },
        { status: 500 }
      );
    }

    // Transform to match frontend Lead interface
    const transformedLeads = (leads || []).map((lead: any) => ({
      ...lead,
      twentyId: lead.twenty_id,
      zipCode: lead.zip_code,
      assignedTo: lead.assigned_to,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      source: lead.source || 'twenty_crm',
      medium: 'organic', // Default medium
    }));

    return NextResponse.json({ leads: transformedLeads });

  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company_id, ...leadData } = body;

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    // Transform field names to Supabase schema
    const supabaseData = {
      company_id,
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email || null,
      address: leadData.address,
      city: leadData.city,
      state: leadData.state,
      zip_code: leadData.zipCode || leadData.zip_code,
      status: leadData.status || 'new',
      notes: leadData.notes || null,
      source: leadData.source || 'website',
      assigned_to: leadData.assignedTo || leadData.assigned_to || null,
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([supabaseData])
      .select()
      .single();

    if (error) {
      console.error('[Leads API] Create error:', error);
      return NextResponse.json(
        { error: 'Failed to create lead', details: error.message },
        { status: 500 }
      );
    }

    // Transform back to frontend format
    const transformedLead = {
      ...data,
      twentyId: data.twenty_id,
      zipCode: data.zip_code,
      assignedTo: data.assigned_to,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      medium: 'organic',
    };

    return NextResponse.json({ lead: transformedLead }, { status: 201 });

  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/leads
 * Update an existing lead
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, company_id, ...leadData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Transform field names to Supabase schema
    const supabaseData: any = {};
    if (leadData.name !== undefined) supabaseData.name = leadData.name;
    if (leadData.phone !== undefined) supabaseData.phone = leadData.phone;
    if (leadData.email !== undefined) supabaseData.email = leadData.email;
    if (leadData.address !== undefined) supabaseData.address = leadData.address;
    if (leadData.city !== undefined) supabaseData.city = leadData.city;
    if (leadData.state !== undefined) supabaseData.state = leadData.state;
    if (leadData.zipCode !== undefined) supabaseData.zip_code = leadData.zipCode;
    if (leadData.zip_code !== undefined) supabaseData.zip_code = leadData.zip_code;
    if (leadData.status !== undefined) supabaseData.status = leadData.status;
    if (leadData.notes !== undefined) supabaseData.notes = leadData.notes;
    if (leadData.source !== undefined) supabaseData.source = leadData.source;
    if (leadData.assignedTo !== undefined) supabaseData.assigned_to = leadData.assignedTo;
    if (leadData.assigned_to !== undefined) supabaseData.assigned_to = leadData.assigned_to;

    const { data, error } = await supabase
      .from('leads')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Leads API] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update lead', details: error.message },
        { status: 500 }
      );
    }

    // Sync to Twenty CRM if this lead has a twenty_id
    if (data.twenty_id && data.company_id) {
      try {
        console.log('[Leads API] Syncing lead update to Twenty CRM...');

        // Get company's Twenty CRM configuration
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('twenty_api_url, twenty_api_key')
          .eq('id', data.company_id)
          .single();

        if (!companyError && company?.twenty_api_url && company?.twenty_api_key) {
          // Decrypt the API key
          const decryptedApiKey = decrypt(company.twenty_api_key);

          // Create Twenty CRM client
          const twentyClient = createTwentyClient(
            company.twenty_api_url,
            decryptedApiKey
          );

          // Build update payload for Twenty CRM
          const twentyUpdates: any = {};

          if (supabaseData.name) twentyUpdates.name = supabaseData.name;
          if (supabaseData.email !== undefined) twentyUpdates.email = supabaseData.email;
          if (supabaseData.phone !== undefined) twentyUpdates.phone = supabaseData.phone;
          if (supabaseData.city !== undefined) {
            twentyUpdates.address = {
              addressCity: supabaseData.city,
              addressState: supabaseData.state,
              addressStreet1: supabaseData.address,
              addressPostcode: supabaseData.zip_code,
            };
          }

          // Update in Twenty CRM
          await twentyClient.updateLead(data.twenty_id, twentyUpdates);
          console.log('[Leads API] Successfully synced to Twenty CRM');
        }
      } catch (syncError) {
        // Log the error but don't fail the whole update
        console.error('[Leads API] Twenty CRM sync error:', syncError);
      }
    }

    // Transform back to frontend format
    const transformedLead = {
      ...data,
      twentyId: data.twenty_id,
      zipCode: data.zip_code,
      assignedTo: data.assigned_to,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      medium: 'organic',
    };

    return NextResponse.json({ lead: transformedLead });

  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads
 * Delete a lead
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Leads API] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete lead', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
