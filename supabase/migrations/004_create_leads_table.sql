-- Create leads table (mirrors Twenty CRM)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  twenty_id TEXT, -- ID from Twenty CRM (null if created locally first)

  -- Lead info
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Status pipeline
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost')),

  -- Assignment
  assigned_to UUID REFERENCES users(id),

  -- Additional data
  notes TEXT,
  source TEXT, -- where lead came from

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one Twenty ID per company
  UNIQUE(company_id, twenty_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_twenty_id ON leads(twenty_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies: Users see leads from their company only
CREATE POLICY "Users see own company leads"
  ON leads FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = (
        SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      )
    )
  );

-- Allow all operations for anon users (for API routes)
CREATE POLICY "Allow all operations for anon users"
  ON leads FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Enable real-time for leads
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
