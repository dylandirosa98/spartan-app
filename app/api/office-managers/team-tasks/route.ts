import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { decrypt } from '@/lib/api/encryption';

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

    // Get company Twenty CRM credentials
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('twenty_api_url, twenty_api_key')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('[Office Manager Team Tasks API] Error fetching company:', companyError);
      return NextResponse.json(
        { error: 'Failed to fetch company credentials' },
        { status: 500 }
      );
    }

    // Decrypt API key
    const twentyApiKey = decrypt(company.twenty_api_key);
    const twentyApiUrl = company.twenty_api_url;

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

    // Fetch all people (leads) from Twenty CRM
    const { data: allPeople } = await axios.get(
      `${twentyApiUrl}/people`,
      {
        headers: {
          Authorization: `Bearer ${twentyApiKey}`,
        },
      }
    );

    // Filter to only show appointments from assigned team members
    const teamTasks = (allPeople?.data?.people || [])
      .filter((person: any) => {
        const assignedTo = person.assignedCanvasser?.name || person.salesRep?.name;
        const hasAppointment = person.appointmentDate;
        return (
          hasAppointment &&
          (salesRepNames.includes(assignedTo) || canvasserNames.includes(assignedTo))
        );
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();
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
