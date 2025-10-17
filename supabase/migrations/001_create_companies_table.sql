-- Create companies table for multi-tenant roofing company management
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  twenty_api_url TEXT NOT NULL,
  twenty_api_key TEXT NOT NULL, -- Encrypted
  supabase_url TEXT,
  supabase_key TEXT, -- Encrypted
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow read access for anon users (for API routes)
CREATE POLICY "Allow read access for anon users"
  ON companies
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow insert/update/delete for anon users (for API routes)
CREATE POLICY "Allow write access for anon users"
  ON companies
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
