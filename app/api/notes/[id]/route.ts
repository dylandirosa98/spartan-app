import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/notes/[id]?companyId=xxx
 * Update an existing note in Twenty CRM
 */
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const noteId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const body = await request.json();
    const { updates } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    if (!updates || (!updates.title && !updates.body)) {
      return NextResponse.json(
        { error: 'updates object with title or body is required' },
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

    // Update the note
    const updatedNote = await twentyClient.updateNote(noteId, updates);

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error('[Notes API] Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notes/[id]?companyId=xxx
 * Delete a note from Twenty CRM
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const noteId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

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

    // Delete the note
    await twentyClient.deleteNote(noteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notes API] Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
