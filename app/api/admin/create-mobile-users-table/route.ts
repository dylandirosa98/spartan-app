import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/create-mobile-users-table
 * Create the mobile_users table using direct PostgreSQL connection
 */
export async function POST(_request: NextRequest) {
  const { Client } = require('pg');

  // Use the pooled connection URL for better compatibility
  const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    return NextResponse.json(
      { error: 'Database connection string not configured' },
      { status: 500 }
    );
  }

  // Parse connection string and configure SSL properly for Supabase
  const config: any = {
    connectionString,
  };

  // Check if SSL is required in the connection string
  if (connectionString.includes('sslmode=require') || connectionString.includes('supabase')) {
    config.ssl = { rejectUnauthorized: false };
  }

  const client = new Client(config);

  try {
    console.log('[Create Table] Connecting to database...');
    await client.connect();
    console.log('[Create Table] Connected successfully');

    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'mobile_users'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('[Create Table] Table already exists!');
      await client.end();
      return NextResponse.json({
        success: true,
        message: 'mobile_users table already exists',
        alreadyExists: true,
      });
    }

    console.log('[Create Table] Table does not exist, creating now...');

    // Create the table
    await client.query(`
      CREATE TABLE mobile_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        sales_rep VARCHAR(100) NOT NULL,
        role TEXT NOT NULL DEFAULT 'sales_rep' CHECK (role IN ('sales_rep', 'mobile_user')),
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('[Create Table] ✓ Table created');

    // Create indexes
    await client.query(`
      CREATE INDEX idx_mobile_users_company_id ON mobile_users(company_id);
      CREATE INDEX idx_mobile_users_username ON mobile_users(username);
      CREATE INDEX idx_mobile_users_email ON mobile_users(email);
      CREATE INDEX idx_mobile_users_sales_rep ON mobile_users(sales_rep);
      CREATE INDEX idx_mobile_users_is_active ON mobile_users(is_active);
      CREATE UNIQUE INDEX idx_mobile_users_company_sales_rep ON mobile_users(company_id, sales_rep);
    `);
    console.log('[Create Table] ✓ Indexes created');

    // Create trigger
    await client.query(`
      CREATE TRIGGER update_mobile_users_updated_at
        BEFORE UPDATE ON mobile_users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('[Create Table] ✓ Trigger created');

    // Enable RLS
    await client.query(`ALTER TABLE mobile_users ENABLE ROW LEVEL SECURITY;`);
    console.log('[Create Table] ✓ RLS enabled');

    // Create policies
    await client.query(`
      CREATE POLICY "Allow all operations for authenticated users"
        ON mobile_users FOR ALL TO authenticated
        USING (true) WITH CHECK (true);
    `);

    await client.query(`
      CREATE POLICY "Allow read access for anon users"
        ON mobile_users FOR SELECT TO anon
        USING (true);
    `);

    await client.query(`
      CREATE POLICY "Allow write access for anon users"
        ON mobile_users FOR ALL TO anon
        USING (true) WITH CHECK (true);
    `);
    console.log('[Create Table] ✓ RLS policies created');

    await client.end();
    console.log('[Create Table] ✅ mobile_users table created successfully!');

    return NextResponse.json({
      success: true,
      message: 'mobile_users table created successfully with all indexes, triggers, and policies',
    });
  } catch (error) {
    console.error('[Create Table] Error:', error);
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup error
    }
    return NextResponse.json(
      {
        error: 'Failed to create table',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
