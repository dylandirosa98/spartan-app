import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import type { Company, CreateCompany, UpdateCompany } from '@/types';
import { encrypt, decrypt } from '@/lib/api/encryption';

// GET - List all companies
export async function GET(_request: NextRequest) {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // Decrypt API keys before sending
    const decryptedCompanies = (companies || []).map((company: any) => ({
      ...company,
      twentyApiKey: company.twenty_api_key ? decrypt(company.twenty_api_key) : '',
      supabaseKey: company.supabase_key ? decrypt(company.supabase_key) : undefined,
      // Convert snake_case to camelCase
      twentyApiUrl: company.twenty_api_url,
      supabaseUrl: company.supabase_url,
      contactEmail: company.contact_email,
      contactPhone: company.contact_phone,
      zipCode: company.zip_code,
      isActive: company.is_active,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    }));

    return NextResponse.json({ companies: decryptedCompanies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST - Create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      logo,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      zipCode,
      twentyApiUrl,
      twentyApiKey,
      supabaseUrl,
      supabaseKey,
      isActive = true,
    }: CreateCompany = body;

    // Validation
    if (!name || !contactEmail || !contactPhone || !address || !city || !state || !zipCode || !twentyApiUrl || !twentyApiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Encrypt sensitive data
    const encryptedApiKey = encrypt(twentyApiKey);
    const encryptedSupabaseKey = supabaseKey ? encrypt(supabaseKey) : null;

    // Prepare company data with snake_case for DB
    const companyData = {
      name,
      logo: logo || null,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      address,
      city,
      state,
      zip_code: zipCode,
      twenty_api_url: twentyApiUrl,
      twenty_api_key: encryptedApiKey,
      supabase_url: supabaseUrl || null,
      supabase_key: encryptedSupabaseKey,
      is_active: isActive,
    };

    const { data: newCompany, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Company with this name already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    // Convert to camelCase for response
    const response: Company = {
      id: newCompany.id,
      name: newCompany.name,
      logo: newCompany.logo,
      contactEmail: newCompany.contact_email,
      contactPhone: newCompany.contact_phone,
      address: newCompany.address,
      city: newCompany.city,
      state: newCompany.state,
      zipCode: newCompany.zip_code,
      twentyApiUrl: newCompany.twenty_api_url,
      twentyApiKey: decrypt(newCompany.twenty_api_key),
      supabaseUrl: newCompany.supabase_url,
      supabaseKey: newCompany.supabase_key ? decrypt(newCompany.supabase_key) : undefined,
      isActive: newCompany.is_active,
      createdAt: newCompany.created_at,
      updatedAt: newCompany.updated_at,
    };

    return NextResponse.json(
      {
        message: 'Company created successfully',
        company: response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}

// PUT - Update company
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates }: UpdateCompany & { id: string } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Build update object with snake_case
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.logo !== undefined) updateData.logo = updates.logo;
    if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
    if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.zipCode !== undefined) updateData.zip_code = updates.zipCode;
    if (updates.twentyApiUrl !== undefined) updateData.twenty_api_url = updates.twentyApiUrl;
    if (updates.twentyApiKey !== undefined) updateData.twenty_api_key = encrypt(updates.twentyApiKey);
    if (updates.supabaseUrl !== undefined) updateData.supabase_url = updates.supabaseUrl;
    if (updates.supabaseKey !== undefined) updateData.supabase_key = updates.supabaseKey ? encrypt(updates.supabaseKey) : null;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data: updatedCompany, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Convert to camelCase for response
    const response: Company = {
      id: updatedCompany.id,
      name: updatedCompany.name,
      logo: updatedCompany.logo,
      contactEmail: updatedCompany.contact_email,
      contactPhone: updatedCompany.contact_phone,
      address: updatedCompany.address,
      city: updatedCompany.city,
      state: updatedCompany.state,
      zipCode: updatedCompany.zip_code,
      twentyApiUrl: updatedCompany.twenty_api_url,
      twentyApiKey: decrypt(updatedCompany.twenty_api_key),
      supabaseUrl: updatedCompany.supabase_url,
      supabaseKey: updatedCompany.supabase_key ? decrypt(updatedCompany.supabase_key) : undefined,
      isActive: updatedCompany.is_active,
      createdAt: updatedCompany.created_at,
      updatedAt: updatedCompany.updated_at,
    };

    return NextResponse.json({
      message: 'Company updated successfully',
      company: response,
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// DELETE - Delete company
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      message: 'Company deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
