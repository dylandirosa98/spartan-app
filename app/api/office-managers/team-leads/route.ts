import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/office-managers/team-leads
 * Get all leads from Twenty CRM for sales reps and canvassers assigned to an office manager
 * Query params: username (office manager username), companyId
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const companyId = searchParams.get('companyId');

    if (!username || !companyId) {
      return NextResponse.json(
        { error: 'Office manager username and companyId are required' },
        { status: 400 }
      );
    }

    // Get all team members assigned to this office manager
    const { data: teamMembers, error: teamError } = await supabase
      .from('mobile_users')
      .select('username, sales_rep, canvasser, role')
      .eq('office_manager', username)
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (teamError) {
      console.error('[Office Manager Team Leads API] Error fetching team:', teamError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        leads: [],
        totalLeads: 0,
      });
    }

    // Get sales rep names from team members
    const salesRepNames = teamMembers
      .filter((member) => member.role === 'sales_rep' && member.sales_rep)
      .map((member) => member.sales_rep);

    // Get canvasser names from team members
    const canvasserNames = teamMembers
      .filter((member) => member.role === 'canvasser' && member.canvasser)
      .map((member) => member.canvasser);

    // Fetch all leads using the existing /api/leads endpoint
    const { data: leadsResponse } = await axios.get(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/leads`,
      {
        params: {
          company_id: companyId,
        },
      }
    );

    const allLeads = leadsResponse.leads || [];

    // Filter to only show leads from assigned team members
    const teamLeads = allLeads.filter((lead: any) => {
      return (
        salesRepNames.includes(lead.salesRep) ||
        canvasserNames.includes(lead.canvasser)
      );
    });

    return NextResponse.json({
      success: true,
      leads: teamLeads,
      totalLeads: teamLeads.length,
      teamMemberCount: teamMembers.length,
    });
  } catch (error) {
    console.error('[Office Manager Team Leads API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
