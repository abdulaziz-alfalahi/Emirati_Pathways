-- Career Dial columns for candidate visibility and availability
-- G21: is_visible — when false, candidate excluded from all recruiter search and AI matching
-- G22: available_for_recruitment — when false, candidate excluded from active recruitment matching

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_for_recruitment BOOLEAN DEFAULT true;

-- Index for fast filtering in matching queries
CREATE INDEX IF NOT EXISTS idx_users_visibility ON users(is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_users_availability ON users(available_for_recruitment) WHERE available_for_recruitment = true;

DO $$
BEGIN
    RAISE NOTICE 'Career Dial migration complete: added is_visible and available_for_recruitment columns to users table';
END $$;
