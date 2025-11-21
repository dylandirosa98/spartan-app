import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import type { MobileUserInsert, MobileUserUpdate } from '@/lib/db/supabase';
import bcrypt from 'bcryptjs';

// GET - List all mobile users
export async function GET(_request: NextRequest) {
  try {
    // Fetch all users from Supabase
    const { data: users, error } = await supabase
      .from('mobile_users')
      .select('id, username, email, role, sales_rep, canvasser, office_manager, company_id, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mobile users:', error);
      throw error;
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Error fetching mobile users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new mobile user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email, role, workspaceId, twentyApiKey, salesRep, canvasser, officeManager } = body;

    // Validation
    if (!username || !password || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: username, password, email, role' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'manager', 'sales_rep', 'canvasser', 'office_manager', 'project_manager'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: admin, manager, sales_rep, canvasser, office_manager, or project_manager' },
        { status: 400 }
      );
    }

    // Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData: MobileUserInsert = {
      username,
      password_hash,
      email,
      role,
      workspace_id: workspaceId || 'default',
      twenty_api_key: twentyApiKey || null,
      is_active: true,
      sales_rep: salesRep || null,
      canvasser: canvasser || null,
      office_manager: officeManager || null,
    };

    // Insert into Supabase
    const { data: newUser, error } = await supabase
      .from('mobile_users')
      .insert([userData])
      .select('id, username, email, role, workspace_id, is_active, created_at, updated_at')
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('username')) {
          return NextResponse.json(
            { error: 'Username already exists' },
            { status: 409 }
          );
        }
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          );
        }
      }
      throw error;
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating mobile user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT - Update mobile user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, username, password, email, role, isActive, salesRep, canvasser, officeManager } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: MobileUserUpdate = {};

    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;

    // Hash new password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Update role-specific fields
    if (salesRep !== undefined) updateData.sales_rep = salesRep;
    if (canvasser !== undefined) updateData.canvasser = canvasser;
    if (officeManager !== undefined) updateData.office_manager = officeManager;

    // Update in Supabase
    const { data: updatedUser, error } = await supabase
      .from('mobile_users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, email, role, sales_rep, canvasser, office_manager, company_id, is_active, created_at, updated_at')
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('username')) {
          return NextResponse.json(
            { error: 'Username already exists' },
            { status: 409 }
          );
        }
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          );
        }
      }

      // Handle not found
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
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating mobile user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete mobile user
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

    // Delete from Supabase
    const { error } = await supabase
      .from('mobile_users')
      .delete()
      .eq('id', id);

    if (error) {
      // Handle not found
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
    console.error('Error deleting mobile user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
