import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/office-managers/team-activity
 * Get recent activity feed from all team members
 * Query params: username (office manager username), companyId, limit (optional, default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!username || !companyId) {
      return NextResponse.json(
        { error: 'Office manager username and companyId are required' },
        { status: 400 }
      );
    }

    // Get all team members assigned to this office manager
    const { data: teamMembers, error: teamError } = await supabase
      .from('mobile_users')
      .select('username, sales_rep, canvasser, role, email')
      .eq('office_manager', username)
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (teamError) {
      console.error('[Office Manager Activity API] Error fetching team:', teamError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        activity: [],
        teamMemberCount: 0,
      });
    }

    // Get sales rep and canvasser names from team members
    const salesRepNames = teamMembers
      .filter((member) => member.role === 'sales_rep' && member.sales_rep)
      .map((member) => member.sales_rep);

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

    // Filter to team members' leads and get recent updates
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivity = allLeads
      .filter((lead: any) => {
        const belongsToTeam = (
          salesRepNames.includes(lead.salesRep) ||
          canvasserNames.includes(lead.canvasser)
        );
        const hasRecentUpdate = lead.updatedAt && new Date(lead.updatedAt) >= thirtyDaysAgo;
        return hasRecentUpdate && belongsToTeam;
      })
      .sort((a: any, b: any) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, limit)
      .map((lead: any) => {
        const assignedTo = lead.salesRep || lead.canvasser;
        const teamMember = teamMembers.find(
          (m) => m.sales_rep === assignedTo || m.canvasser === assignedTo
        );

        return {
          leadId: lead.id,
          leadName: lead.name || '',
          leadStatus: lead.status,
          assignedTo,
          assigneeRole: teamMember?.role,
          assigneeEmail: teamMember?.email,
          updatedAt: lead.updatedAt,
          createdAt: lead.createdAt,
          appointmentDate: lead.appointmentDate,
          address: lead.address,
        };
      });

    return NextResponse.json({
      success: true,
      activity: recentActivity,
      teamMemberCount: teamMembers.length,
    });
  } catch (error) {
    console.error('[Office Manager Activity API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team activity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
