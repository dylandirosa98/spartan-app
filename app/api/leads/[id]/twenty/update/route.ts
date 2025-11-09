import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TwentyCRMClient } from '@/lib/api/twenty-crm';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/leads/[id]/twenty/update
 * Update lead fields in Twenty CRM
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const body = await request.json();
    const { companyId, updates } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'updates object is required' },
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

    // Transform updates to match Twenty CRM schema
    const transformedUpdates: Record<string, any> = {};

    for (const [field, value] of Object.entries(updates)) {
      // Handle nested objects
      if (field === 'email') {
        transformedUpdates.email = {
          primaryEmail: value,
          additionalEmails: null,
        };
      } else if (field === 'phone') {
        transformedUpdates.phone = {
          primaryPhoneNumber: value,
          additionalPhones: null,
        };
      } else if (field === 'estValue') {
        // Convert dollars to micros
        const dollars = parseFloat(value as string);
        if (!isNaN(dollars)) {
          transformedUpdates.estValue = {
            amountMicros: Math.round(dollars * 1000000),
            currencyCode: 'USD',
          };
        }
      } else {
        // Direct field mapping
        transformedUpdates[field] = value;
      }
    }

    // Build GraphQL mutation
    const mutation = `
      mutation UpdateLead($leadId: UUID!, $data: LeadUpdateInput!) {
        updateLead(id: $leadId, data: $data) {
          id
          name
          email {
            primaryEmail
          }
          phone {
            primaryPhoneNumber
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
          demo
          updatedAt
        }
      }
    `;

    const data = await (twentyClient as any).request(mutation, {
      leadId,
      data: transformedUpdates,
    });

    console.log('[Twenty Update API] Lead updated:', data.updateLead);

    return NextResponse.json({
      success: true,
      lead: data.updateLead,
    });
  } catch (error) {
    console.error('[Twenty Update API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update lead in Twenty CRM',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
