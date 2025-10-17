-- Create users table for company employees
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'salesperson')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow read access for anon users (for API routes)
CREATE POLICY "Allow read access for anon users"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow insert/update/delete for anon users (for API routes)
CREATE POLICY "Allow write access for anon users"
  ON users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
