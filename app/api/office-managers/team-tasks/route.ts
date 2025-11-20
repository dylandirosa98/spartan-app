import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/office-managers/team-tasks
 * Get all tasks/appointments from Twenty CRM for team members assigned to an office manager
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
      console.error('[Office Manager Team Tasks API] Error fetching team:', teamError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        tasks: [],
        totalTasks: 0,
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

    // Filter to only show leads with appointments from assigned team members
    const teamTasks = allLeads
      .filter((lead: any) => {
        const hasAppointment = lead.appointmentDate || lead.appointmentTime;
        const belongsToTeam = (
          salesRepNames.includes(lead.salesRep) ||
          canvasserNames.includes(lead.canvasser)
        );
        return hasAppointment && belongsToTeam;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.appointmentDate || a.createdAt).getTime();
        const dateB = new Date(b.appointmentDate || b.createdAt).getTime();
        return dateA - dateB;
      });

    return NextResponse.json({
      success: true,
      tasks: teamTasks,
      totalTasks: teamTasks.length,
      teamMemberCount: teamMembers.length,
    });
  } catch (error) {
    console.error('[Office Manager Team Tasks API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team tasks',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
