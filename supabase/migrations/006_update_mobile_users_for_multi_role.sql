-- Update mobile_users table to support multiple roles
-- This migration adds support for canvasser, office_manager, and project_manager roles

-- Drop the old role constraint
ALTER TABLE mobile_users
  DROP CONSTRAINT IF EXISTS mobile_users_role_check;

-- Add new role constraint with all supported roles
ALTER TABLE mobile_users
  ADD CONSTRAINT mobile_users_role_check
  CHECK (role IN ('sales_rep', 'canvasser', 'office_manager', 'project_manager'));

-- Drop the unique constraint on company_id + sales_rep
-- This allows multiple users with the same sales_rep value (needed for non-sales rep roles)
DROP INDEX IF EXISTS idx_mobile_users_company_sales_rep;

-- Create a partial unique index that only applies to sales_rep role
-- This ensures one sales rep per company, but allows multiple non-sales rep users
CREATE UNIQUE INDEX IF NOT EXISTS idx_mobile_users_company_sales_rep_unique
  ON mobile_users(company_id, sales_rep)
  WHERE role = 'sales_rep';

-- Make sales_rep column nullable for non-sales rep roles
ALTER TABLE mobile_users
  ALTER COLUMN sales_rep DROP NOT NULL;

-- Update comment to reflect new usage
COMMENT ON COLUMN mobile_users.sales_rep IS 'Sales rep name from Twenty CRM (e.g., JIMMY, NOT_ASSIGNED_YET). Required for sales_rep role, optional for other roles.';
COMMENT ON TABLE mobile_users IS 'Mobile app users who login with username. Sales rep role users are linked to a sales rep from Twenty CRM. Other roles (canvasser, office_manager, project_manager) are independent users.';
