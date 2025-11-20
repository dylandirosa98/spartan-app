import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { decrypt } from '@/lib/api/encryption';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/office-managers/team-member
 * Get detailed information about a specific team member including their performance
 * Query params: username (office manager username), memberId, companyId
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const memberId = searchParams.get('memberId');
    const companyId = searchParams.get('companyId');

    if (!username || !memberId || !companyId) {
      return NextResponse.json(
        { error: 'Office manager username, memberId, and companyId are required' },
        { status: 400 }
      );
    }

    // Get the team member details
    const { data: member, error: memberError } = await supabase
      .from('mobile_users')
      .select('*')
      .eq('id', memberId)
      .eq('company_id', companyId)
      .eq('office_manager', username)
      .single();

    if (memberError || !member) {
      console.error('[Office Manager Team Member API] Error fetching member:', memberError);
      return NextResponse.json(
        { error: 'Team member not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Get company Twenty CRM credentials
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('twenty_api_url, twenty_api_key')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('[Office Manager Team Member API] Error fetching company:', companyError);
      return NextResponse.json(
        { error: 'Failed to fetch company credentials' },
        { status: 500 }
      );
    }

    // Decrypt API key
    const twentyApiKey = decrypt(company.twenty_api_key);
    const twentyApiUrl = company.twenty_api_url;

    // Fetch all people (leads) from Twenty CRM
    const { data: allPeople } = await axios.get(
      `${twentyApiUrl}/people`,
      {
        headers: {
          Authorization: `Bearer ${twentyApiKey}`,
        },
      }
    );

    // Get leads assigned to this team member
    const memberName = member.sales_rep || member.canvasser;
    const memberLeads = (allPeople?.data?.people || []).filter((person: any) => {
      const assignedTo = person.assignedCanvasser?.name || person.salesRep?.name;
      return assignedTo === memberName;
    });

    // Calculate performance metrics
    const totalLeads = memberLeads.length;
    const leadsWithAppointments = memberLeads.filter((lead: any) => lead.appointmentDate).length;
    const appointmentRate = totalLeads > 0 ? ((leadsWithAppointments / totalLeads) * 100).toFixed(1) : 0;

    // Count by status
    const statusBreakdown: Record<string, number> = {};
    memberLeads.forEach((lead: any) => {
      const status = lead.status || 'unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Get recent activity (leads with recent updates)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentActivity = memberLeads
      .filter((lead: any) => {
        if (!lead.updatedAt) return false;
        const updateDate = new Date(lead.updatedAt);
        return updateDate >= sevenDaysAgo;
      })
      .sort((a: any, b: any) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        username: member.username,
        email: member.email,
        role: member.role,
        salesRep: member.sales_rep,
        canvasser: member.canvasser,
        isActive: member.is_active,
        createdAt: member.created_at,
        lastLogin: member.updated_at,
      },
      performance: {
        totalLeads,
        leadsWithAppointments,
        appointmentRate: parseFloat(appointmentRate),
        statusBreakdown,
      },
      recentActivity,
      leads: memberLeads,
    });
  } catch (error) {
    console.error('[Office Manager Team Member API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team member details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
