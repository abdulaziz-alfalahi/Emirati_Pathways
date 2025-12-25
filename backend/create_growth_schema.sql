-- Growth & Verification Schema
-- Support for "Verification Loop" (Magic Links)

-- Table for storing One-Time-Use verification tokens for Jobs
-- job_id must be INTEGER to matches job_postings(id)
CREATE TABLE IF NOT EXISTS job_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL, -- The email this token was sent to
    company_name_snapshot VARCHAR(255), -- Snapshot of company name at generation time
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_job_verification_tokens_token ON job_verification_tokens(token);

-- Update OLD companies table if it exists with legacy schema
DO $$
BEGIN
    -- Ensure company_name exists (legacy table has 'name')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'company_name') THEN
        ALTER TABLE companies ADD COLUMN company_name VARCHAR(255);
        -- Backfill from 'name' if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'name') THEN
             UPDATE companies SET company_name = name;
        END IF;
    END IF;

    -- Ensure contact_email exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'contact_email') THEN
        ALTER TABLE companies ADD COLUMN contact_email VARCHAR(255);
    END IF;

    -- Ensure is_verified exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'is_verified') THEN
        ALTER TABLE companies ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Ensure description exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'description') THEN
        ALTER TABLE companies ADD COLUMN description TEXT;
    END IF;
END $$;

-- We need to ensure job_postings has columns for Nafis data mapping
-- These might already exist, but ensuring they are there
DO $$
BEGIN
    -- Add nafis_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'nafis_job_id') THEN
        ALTER TABLE job_postings ADD COLUMN jd_id VARCHAR(255);
    END IF;

    -- Ensure recruiter_id exists in job_postings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'recruiter_id') THEN
         ALTER TABLE job_postings ADD COLUMN recruiter_id VARCHAR(255);
    END IF;
END $$;

-- Patch HR Profiles
DO $$
BEGIN
    -- Ensure position_title exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_profiles' AND column_name = 'position_title') THEN
        ALTER TABLE hr_profiles ADD COLUMN position_title VARCHAR(255);
    END IF;

    -- Ensure department exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hr_profiles' AND column_name = 'department') THEN
        ALTER TABLE hr_profiles ADD COLUMN department VARCHAR(255);
    END IF;
END $$;

DO $$
BEGIN
    -- Add education_level if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'education_level') THEN
        ALTER TABLE job_postings ADD COLUMN education_level VARCHAR(100);
    END IF;

    -- Add gender_preference if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'gender_preference') THEN
        ALTER TABLE job_postings ADD COLUMN gender_preference VARCHAR(50);
    END IF;
    
    -- Add number_of_vacancies if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'number_of_vacancies') THEN
        ALTER TABLE job_postings ADD COLUMN number_of_vacancies INTEGER DEFAULT 1;
    END IF;
    
    -- Add contact_email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'contact_email') THEN
        ALTER TABLE job_postings ADD COLUMN contact_email VARCHAR(255);
    END IF;
    
    -- Ensure created_by exists (it wasn't in inspect results, weirdly)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_postings' AND column_name = 'created_by') THEN
         ALTER TABLE job_postings ADD COLUMN created_by INTEGER REFERENCES users(id);
    END IF;
END $$;
