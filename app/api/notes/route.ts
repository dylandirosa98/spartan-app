import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/notes?leadId=xxx&companyId=xxx
 * Fetch notes for a specific lead from Twenty CRM
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const companyId = searchParams.get('companyId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Get company configuration from Supabase
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
        { error: 'Twenty CRM not configured for this company' },
        { status: 400 }
      );
    }

    // Decrypt the API key
    const decryptedApiKey = decrypt(company.twenty_api_key);

    // Create Twenty CRM client
    const twentyClient = new TwentyCRMClient(
      company.twenty_api_url,
      decryptedApiKey
    );

    // Fetch notes for the lead
    const notes = await twentyClient.getNotesForLead(leadId);

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('[Notes API] Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notes
 * Create a new note for a lead in Twenty CRM
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, companyId, title, noteBody } = body;

    if (!leadId || !noteBody) {
      return NextResponse.json(
        { error: 'leadId and noteBody are required' },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    // Get company configuration from Supabase
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
        { error: 'Twenty CRM not configured for this company' },
        { status: 400 }
      );
    }

    // Decrypt the API key
    const decryptedApiKey = decrypt(company.twenty_api_key);

    // Create Twenty CRM client
    const twentyClient = new TwentyCRMClient(
      company.twenty_api_url,
      decryptedApiKey
    );

    // Create the note
    const note = await twentyClient.createNoteForLead(leadId, title || 'Note', noteBody);

    return NextResponse.json({ note });
  } catch (error) {
    console.error('[Notes API] Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
