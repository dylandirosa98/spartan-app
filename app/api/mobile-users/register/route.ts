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
  salesRep: z.string().optional(),
  canvasser: z.string().optional(),
  officeManager: z.string().optional(),
  projectManager: z.string().optional(),
  companyId: z.string().uuid('Invalid company ID'),
  role: z.enum(['sales_rep', 'canvasser', 'office_manager', 'project_manager'], {
    errorMap: () => ({ message: 'Role must be sales_rep, canvasser, office_manager, or project_manager' })
  }),
}).refine(
  (data) => {
    // salesRep is required only for sales_rep role
    if (data.role === 'sales_rep') {
      return data.salesRep && data.salesRep.length > 0;
    }
    return true;
  },
  {
    message: 'Sales rep is required for sales rep role',
    path: ['salesRep'],
  }
);

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

    const { username, email, password, salesRep, canvasser, officeManager, projectManager, companyId, role } = validation.data;

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

    // Only verify sales rep exists in Twenty CRM for sales_rep role
    if (role === 'sales_rep' && salesRep) {
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
    }

    // Verify canvasser exists in Twenty CRM for canvasser role (if provided)
    if (role === 'canvasser' && canvasser) {
      const canvassersResponse = await fetch(
        `${request.nextUrl.origin}/api/canvassers?companyId=${companyId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!canvassersResponse.ok) {
        throw new Error('Failed to fetch canvassers from Twenty CRM');
      }

      const { canvassers } = await canvassersResponse.json();

      if (!canvassers.includes(canvasser)) {
        return NextResponse.json(
          {
            error: 'Invalid canvasser',
            message: `Canvasser "${canvasser}" does not exist in Twenty CRM. Available options: ${canvassers.join(', ')}`,
            availableCanvassers: canvassers,
          },
          { status: 400 }
        );
      }
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

    // Check if sales rep already has an account (only for sales_rep role with salesRep value)
    if (role === 'sales_rep' && salesRep) {
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
    }

    // Check if canvasser already has an account (only for canvasser role with canvasser value)
    if (role === 'canvasser' && canvasser) {
      const { data: existingCanvasser } = await supabase
        .from('mobile_users')
        .select('id, username')
        .eq('canvasser', canvasser)
        .eq('company_id', companyId)
        .single();

      if (existingCanvasser) {
        return NextResponse.json(
          {
            error: 'Canvasser already has an account',
            message: `An account already exists for canvasser "${canvasser}" with username "${existingCanvasser.username}"`,
          },
          { status: 409 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Only sales_rep role needs a Twenty CRM sales rep
    // Only canvasser role needs a Twenty CRM canvasser
    // Only office_manager role needs an office manager value
    // Only project_manager role needs a Twenty CRM project manager
    const salesRepValue = role === 'sales_rep' ? salesRep : null;
    const canvasserValue = role === 'canvasser' ? (canvasser || null) : null;
    const officeManagerValue = role === 'office_manager' ? (officeManager || null) : null;
    const projectManagerValue = role === 'project_manager' ? projectManager : null;

    // Create mobile user
    const { data: newUser, error: insertError } = await supabase
      .from('mobile_users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        sales_rep: salesRepValue,
        canvasser: canvasserValue,
        office_manager: officeManagerValue,
        project_manager: projectManagerValue,
        company_id: companyId,
        role: role,
        is_active: true,
      })
      .select('id, username, email, sales_rep, canvasser, office_manager, project_manager, company_id, role, created_at')
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
        canvasser: newUser.canvasser,
        officeManager: newUser.office_manager,
        projectManager: newUser.project_manager,
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
