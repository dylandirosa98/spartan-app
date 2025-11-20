import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/office-managers/team
 * Get all sales reps and canvassers assigned to an office manager
 * Query params: username (office manager username)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Office manager username is required' },
        { status: 400 }
      );
    }

    // Fetch all users assigned to this office manager
    const { data: teamMembers, error } = await supabase
      .from('mobile_users')
      .select('*')
      .eq('office_manager', username)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Office Manager Team API] Error fetching team:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Separate by role
    const salesReps = teamMembers?.filter((user) => user.role === 'sales_rep') || [];
    const canvassers = teamMembers?.filter((user) => user.role === 'canvasser') || [];

    return NextResponse.json({
      success: true,
      team: {
        salesReps,
        canvassers,
        totalMembers: teamMembers?.length || 0,
      },
    });
  } catch (error) {
    console.error('[Office Manager Team API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
