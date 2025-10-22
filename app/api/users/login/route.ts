import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { isUsingMockData, mockDb } from '@/lib/db/mock-data';

/**
 * Login endpoint for company users
 * Checks the users table in Supabase (not the master admin)
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use mock data if Supabase not configured
    if (isUsingMockData()) {
      const mockUsers = mockDb.getUsers();
      const mockUser = mockUsers.find(u => u.email === email);

      if (!mockUser || !mockUser.isActive) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // In mock mode, accept the password stored in the users table (not hashed)
      // This is just for development
      return NextResponse.json({
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
        }
      });
    }

    // Check Supabase users table
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !dbUser) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Simple password check (in production, this should use bcrypt)
    // For now, we're storing plaintext passwords in the password_hash field
    if (dbUser.password_hash !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', dbUser.id);

    // Return user data
    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        company_id: dbUser.company_id,
        createdAt: dbUser.created_at,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
