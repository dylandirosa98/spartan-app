import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { supabase } from '@/lib/db/supabase';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'spartan-crm-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user in Supabase by username
    const { data: user, error } = await supabase
      .from('mobile_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive. Contact your administrator.' },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      workspaceId: user.workspace_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d') // Token expires in 30 days
      .sign(JWT_SECRET);

    // Return user data and token (exclude password_hash)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        workspaceId: user.workspace_id,
        twentyApiKey: user.twenty_api_key || process.env.TWENTY_API_KEY || '',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
