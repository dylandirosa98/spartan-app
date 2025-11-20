import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/office-managers/reassign-lead
 * Reassign a lead from one team member to another
 * Body: { username, companyId, leadId, newAssignee, assigneeType }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, companyId, leadId, newAssignee, assigneeType } = body;

    if (!username || !companyId || !leadId || !newAssignee || !assigneeType) {
      return NextResponse.json(
        { error: 'All fields are required: username, companyId, leadId, newAssignee, assigneeType' },
        { status: 400 }
      );
    }

    if (!['sales_rep', 'canvasser'].includes(assigneeType)) {
      return NextResponse.json(
        { error: 'assigneeType must be either "sales_rep" or "canvasser"' },
        { status: 400 }
      );
    }

    // Verify the office manager has access to both team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('mobile_users')
      .select('username, sales_rep, canvasser, role')
      .eq('office_manager', username)
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (teamError) {
      console.error('[Office Manager Reassign API] Error fetching team:', teamError);
      return NextResponse.json(
        { error: 'Failed to verify team members' },
        { status: 500 }
      );
    }

    // Check if the new assignee is part of the office manager's team
    const assigneeField = assigneeType === 'sales_rep' ? 'sales_rep' : 'canvasser';
    const isValidAssignee = teamMembers?.some(
      (member) => member[assigneeField] === newAssignee && member.role === assigneeType
    );

    if (!isValidAssignee) {
      return NextResponse.json(
        { error: 'New assignee is not part of your team' },
        { status: 403 }
      );
    }

    // Get company Twenty CRM credentials
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('twenty_api_url, twenty_api_key')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('[Office Manager Reassign API] Error fetching company:', companyError);
      return NextResponse.json(
        { error: 'Failed to fetch company credentials' },
        { status: 500 }
      );
    }

    // Decrypt API key
    const twentyApiKey = decrypt(company.twenty_api_key);
    const twentyApiUrl = company.twenty_api_url;

    // Update the lead in Twenty CRM
    const updateField = assigneeType === 'sales_rep' ? 'salesRepId' : 'assignedCanvasserId';

    // First, we need to find the Twenty CRM person object ID for the new assignee
    // Get all people to find the assignee's Twenty ID
    const { data: peopleResponse } = await axios.get(
      `${twentyApiUrl}/people`,
      {
        headers: {
          Authorization: `Bearer ${twentyApiKey}`,
        },
      }
    );

    // Find the person (sales rep or canvasser) in Twenty CRM
    const assignee = (peopleResponse?.data?.people || []).find((person: any) => {
      if (assigneeType === 'sales_rep') {
        return person.salesRep?.name === newAssignee;
      } else {
        return person.assignedCanvasser?.name === newAssignee;
      }
    });

    if (!assignee) {
      return NextResponse.json(
        { error: 'Could not find assignee in Twenty CRM' },
        { status: 404 }
      );
    }

    // Get the assignee ID from the found person's salesRep or assignedCanvasser object
    const assigneeId = assigneeType === 'sales_rep'
      ? assignee.salesRep?.id
      : assignee.assignedCanvasser?.id;

    // Update the lead in Twenty CRM
    const updateData: any = {};
    updateData[updateField] = assigneeId;

    await axios.patch(
      `${twentyApiUrl}/people/${leadId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${twentyApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[Office Manager Reassign API] Lead ${leadId} reassigned to ${newAssignee} (${assigneeType})`);

    return NextResponse.json({
      success: true,
      message: 'Lead reassigned successfully',
      leadId,
      newAssignee,
      assigneeType,
    });
  } catch (error) {
    console.error('[Office Manager Reassign API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reassign lead',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
