import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'spartan-crm-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      valid: true,
      user: {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role,
        workspaceId: payload.workspaceId,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
