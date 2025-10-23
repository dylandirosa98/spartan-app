import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Validation schema for mobile user login
 */
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/mobile-users/login
 * Authenticate a mobile app user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Fetch user from database
    const { data: user, error: fetchError } = await supabase
      .from('mobile_users')
      .select('id, username, email, password_hash, sales_rep, company_id, role, is_active')
      .eq('username', username)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await supabase
      .from('mobile_users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    console.log('[Mobile Users API] Login successful:', username, 'Sales Rep:', user.sales_rep);

    // Return user data (excluding password hash)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        salesRep: user.sales_rep,
        companyId: user.company_id,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('[Mobile Users API] Error during login:', error);
    return NextResponse.json(
      {
        error: 'Failed to login',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
