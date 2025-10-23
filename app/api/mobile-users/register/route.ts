import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Validation schema for mobile user registration
 */
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  salesRep: z.string().min(1, 'Sales rep is required'),
  companyId: z.string().uuid('Invalid company ID'),
});

/**
 * POST /api/mobile-users/register
 * Register a new mobile app user linked to a sales rep
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { username, email, password, salesRep, companyId } = validation.data;

    // Check if company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, twenty_api_url, twenty_api_key')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Verify that the sales rep exists in Twenty CRM
    // (We'll fetch available sales reps and validate)
    const salesRepsResponse = await fetch(
      `${request.nextUrl.origin}/api/sales-reps?companyId=${companyId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!salesRepsResponse.ok) {
      throw new Error('Failed to fetch sales reps from Twenty CRM');
    }

    const { salesReps } = await salesRepsResponse.json();

    if (!salesReps.includes(salesRep)) {
      return NextResponse.json(
        {
          error: 'Invalid sales rep',
          message: `Sales rep "${salesRep}" does not exist in Twenty CRM. Available options: ${salesReps.join(', ')}`,
          availableSalesReps: salesReps,
        },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('mobile_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('mobile_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Check if sales rep already has an account
    const { data: existingSalesRep } = await supabase
      .from('mobile_users')
      .select('id, username')
      .eq('sales_rep', salesRep)
      .eq('company_id', companyId)
      .single();

    if (existingSalesRep) {
      return NextResponse.json(
        {
          error: 'Sales rep already has an account',
          message: `An account already exists for sales rep "${salesRep}" with username "${existingSalesRep.username}"`,
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create mobile user
    const { data: newUser, error: insertError } = await supabase
      .from('mobile_users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        sales_rep: salesRep,
        company_id: companyId,
        role: 'sales_rep',
        is_active: true,
      })
      .select('id, username, email, sales_rep, company_id, role, created_at')
      .single();

    if (insertError) {
      console.error('[Mobile Users API] Error creating user:', insertError);
      throw insertError;
    }

    console.log('[Mobile Users API] User created successfully:', newUser.username);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        salesRep: newUser.sales_rep,
        companyId: newUser.company_id,
        role: newUser.role,
        createdAt: newUser.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[Mobile Users API] Error during registration:', error);
    return NextResponse.json(
      {
        error: 'Failed to register user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
