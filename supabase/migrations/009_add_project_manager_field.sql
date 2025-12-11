-- Add project_manager field to mobile_users table
-- This field stores the Twenty CRM project manager enum value that the PM user is assigned to

-- Add project_manager column (nullable, optional for all roles)
ALTER TABLE mobile_users
  ADD COLUMN IF NOT EXISTS project_manager VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mobile_users_project_manager ON mobile_users(project_manager);

-- Update comment
COMMENT ON COLUMN mobile_users.project_manager IS 'Project manager value from Twenty CRM Lead.projectManager enum. Used to filter which leads/tasks a PM user can see.';
