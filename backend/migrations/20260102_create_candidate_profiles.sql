-- Create candidate_profiles table
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_summary TEXT,
    experience_years INTEGER,
    current_position VARCHAR(255),
    current_company VARCHAR(255),
    salary_expectation DECIMAL(12, 2),
    notice_period VARCHAR(50),
    preferred_locations JSONB DEFAULT '[]',
    remote_work_preference BOOLEAN DEFAULT false,
    personal_info JSONB DEFAULT '{}',
    education JSONB DEFAULT '[]',
    skills JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);

-- Add comments for documentation
COMMENT ON TABLE candidate_profiles IS 'Stores extended profile information for candidates';
COMMENT ON COLUMN candidate_profiles.personal_info IS 'JSON field storing DOB, gender, nationality, phone, etc.';
