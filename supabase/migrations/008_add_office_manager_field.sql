-- Add office_manager field to mobile_users table
-- This field tracks which office manager a user (sales_rep or canvasser) is assigned to

-- Add office_manager column (nullable, optional for all roles)
ALTER TABLE mobile_users
  ADD COLUMN IF NOT EXISTS office_manager VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mobile_users_office_manager ON mobile_users(office_manager);

-- Update comment
COMMENT ON COLUMN mobile_users.office_manager IS 'Office manager username that this user is assigned to. Used to track which sales reps and canvassers are managed by which office manager.';
