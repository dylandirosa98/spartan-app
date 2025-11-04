-- Add canvasser field to mobile_users table
-- This field links canvasser role users to their Twenty CRM canvasser

-- Add canvasser column (nullable, optional for all roles except canvasser)
ALTER TABLE mobile_users
  ADD COLUMN IF NOT EXISTS canvasser VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mobile_users_canvasser ON mobile_users(canvasser);

-- Create a partial unique index that only applies to canvasser role
-- This ensures one canvasser per company, but allows multiple users without canvasser assignment
CREATE UNIQUE INDEX IF NOT EXISTS idx_mobile_users_company_canvasser_unique
  ON mobile_users(company_id, canvasser)
  WHERE role = 'canvasser' AND canvasser IS NOT NULL;

-- Update comment
COMMENT ON COLUMN mobile_users.canvasser IS 'Canvasser name from Twenty CRM. Required for canvasser role, optional for other roles.';
