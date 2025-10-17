import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { isUsingMockData, mockDb, logMockDataWarning } from '@/lib/db/mock-data';

export interface AdminUser {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'salesperson';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUser {
  companyId: string;
  name: string;
  email: string;
  password: string;
  role: 'owner' | 'manager' | 'salesperson';
  isActive?: boolean;
}

// GET - List all users across all companies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Use mock data if Supabase is not configured
    if (isUsingMockData()) {
      logMockDataWarning();
      const users = companyId ? mockDb.getUsers(companyId) : mockDb.getUsers();
      return NextResponse.json({ users, usingMockData: true });
    }

    let query = supabase
      .from('users')
      .select(`
        id,
        company_id,
        name,
        email,
        role,
        is_active,
        last_login,
        created_at,
        updated_at,
        companies (
          name
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by company if specified
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data to match AdminUser interface
    const transformedUsers = (users || []).map((user: any) => ({
      id: user.id,
      companyId: user.company_id,
      companyName: user.companies?.name || 'Unknown Company',
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      name,
      email,
      password,
      role,
      isActive = true,
    }: CreateAdminUser = body;

    // Validation
    if (!companyId || !name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use mock data if Supabase is not configured
    if (isUsingMockData()) {
      const newUser = mockDb.createUser({
        companyId,
        companyName: '', // Will be filled by mockDb
        name,
        email,
        role,
        isActive,
      });
      return NextResponse.json(
        {
          message: 'User created successfully (mock data)',
          user: newUser,
          usingMockData: true,
        },
        { status: 201 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Prepare user data
    const userData = {
      company_id: companyId,
      name,
      email,
      password_hash: password, // In production, hash this properly
      role,
      is_active: isActive,
    };

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser.id,
          companyId: newUser.company_id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.is_active,
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use mock data if Supabase is not configured
    if (isUsingMockData()) {
      const updatedUser = mockDb.updateUser(id, updates);
      if (!updatedUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: 'User updated successfully (mock data)',
        user: updatedUser,
        usingMockData: true,
      });
    }

    // Build update object
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.password !== undefined) updateData.password_hash = updates.password;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        companyId: updatedUser.company_id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use mock data if Supabase is not configured
    if (isUsingMockData()) {
      const success = mockDb.deleteUser(id);
      if (!success) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        message: 'User deleted successfully (mock data)',
        usingMockData: true,
      });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
