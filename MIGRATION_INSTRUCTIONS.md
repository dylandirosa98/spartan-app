# Database Migration Instructions

## Problem
The `mobile_users` table does not exist yet. This table is needed for the mobile user authentication system.

## Solution
Run the following SQL in your Supabase SQL Editor to create the mobile_users table:

### Step 1: Go to Supabase Dashboard
1. Navigate to https://supabase.com/dashboard
2. Select your project (twrjqxsnqstqounhrool)
3. Click on "SQL Editor" in the left sidebar
4. Click "New query"

### Step 2: Paste and Run This SQL

```sql
-- Create mobile_users table for mobile app authentication
-- These users are sales reps who login to the mobile app with username (not email)
CREATE TABLE IF NOT EXISTS mobile_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  sales_rep VARCHAR(100) NOT NULL, -- Links to Twenty CRM sales rep
  role TEXT NOT NULL DEFAULT 'sales_rep' CHECK (role IN ('sales_rep', 'mobile_user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_mobile_users_company_id ON mobile_users(company_id);
CREATE INDEX IF NOT EXISTS idx_mobile_users_username ON mobile_users(username);
CREATE INDEX IF NOT EXISTS idx_mobile_users_email ON mobile_users(email);
CREATE INDEX IF NOT EXISTS idx_mobile_users_sales_rep ON mobile_users(sales_rep);
CREATE INDEX IF NOT EXISTS idx_mobile_users_is_active ON mobile_users(is_active);

-- Create unique constraint: one mobile user per sales rep per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_mobile_users_company_sales_rep
  ON mobile_users(company_id, sales_rep);

-- Create updated_at trigger (assumes update_updated_at_column function exists from previous migrations)
CREATE TRIGGER update_mobile_users_updated_at
  BEFORE UPDATE ON mobile_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE mobile_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON mobile_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow read access for anon users (for API routes)
CREATE POLICY "Allow read access for anon users"
  ON mobile_users
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow write access for anon users (for API routes - needed for registration/login)
CREATE POLICY "Allow write access for anon users"
  ON mobile_users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add comments to explain the table
COMMENT ON TABLE mobile_users IS 'Mobile app users who login with username. Each user is linked to a sales rep from Twenty CRM and can only view their assigned leads.';
COMMENT ON COLUMN mobile_users.sales_rep IS 'Sales rep name from Twenty CRM (e.g., JIMMY, NOT_ASSIGNED_YET)';
COMMENT ON COLUMN mobile_users.username IS 'Username for mobile app login (not email)';
```

### Step 3: Click "Run" or press Ctrl+Enter

You should see a success message.

### Step 4: Verify the Migration

Run this query to verify the columns were added:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mobile_users'
  AND column_name IN ('sales_rep', 'company_id');
```

You should see both columns listed.

## What This Migration Does

1. **sales_rep column**: Stores the sales rep name from Twenty CRM (e.g., "JIMMY", "NOT_ASSIGNED_YET")
2. **company_id column**: Links mobile users to their company for multi-tenant support
3. **Indexes**: Speeds up queries when filtering by sales rep or company
4. **Foreign key**: Ensures data integrity - mobile users are automatically deleted if their company is deleted

## After Migration

Once the migration is complete, you'll be able to:

1. Create mobile user accounts at `/company/{company_id}/mobile-users`
2. Link each mobile user to a sales rep from Twenty CRM
3. Mobile users can login with their username and password
4. Mobile users will only see leads assigned to their sales rep
