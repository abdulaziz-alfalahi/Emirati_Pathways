-- G22+G23: Stealth Headhunter — employment status for passive talent
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'job_seeker';
-- Values: job_seeker, employed_open, employed_not_looking, freelancer
COMMENT ON COLUMN users.employment_status IS 'G22: Employment status for passive talent filtering';
