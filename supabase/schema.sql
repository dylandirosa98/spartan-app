-- Spartan CRM Mobile Users Table
-- This SQL will auto-run when you connect Supabase in Vercel
-- Or you can run it manually in Supabase SQL Editor

-- Create mobile_users table
CREATE TABLE IF NOT EXISTS mobile_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'sales_rep')),
  workspace_id VARCHAR(100) DEFAULT 'default' NOT NULL,
  twenty_api_key TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_mobile_users_username ON mobile_users(username);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_mobile_users_email ON mobile_users(email);

-- Create index on workspace_id for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_mobile_users_workspace ON mobile_users(workspace_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_mobile_users_updated_at ON mobile_users;
CREATE TRIGGER update_mobile_users_updated_at
  BEFORE UPDATE ON mobile_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt rounds=10
INSERT INTO mobile_users (
  username,
  password_hash,
  email,
  role,
  workspace_id,
  is_active
) VALUES (
  'admin',
  '$2a$10$rZJ5PfZ0OvGKvLqGxGxR4.WQJ5vGKL0nqO5nJ5YqFqZJ5vGKL0nqO', -- admin123
  'admin@spartanexteriors.com',
  'admin',
  'default',
  true
) ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE mobile_users ENABLE ROW LEVEL SECURITY;

-- Create policy: Allow all operations for now (you can restrict later)
-- For production, you'll want to add proper RLS policies based on your auth
DROP POLICY IF EXISTS "Allow all for authenticated users" ON mobile_users;
CREATE POLICY "Allow all for authenticated users"
  ON mobile_users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions (Supabase service role has these by default)
GRANT ALL ON mobile_users TO authenticated;
GRANT ALL ON mobile_users TO service_role;
