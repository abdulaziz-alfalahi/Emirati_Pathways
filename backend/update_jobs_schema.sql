-- Add new columns to job_postings table to support Nafis CSV data and Batch Upload
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS posted_date TIMESTAMP;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS salary_range_min INTEGER;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS salary_range_max INTEGER;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'AED';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS location VARCHAR(200);
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS priority_level VARCHAR(50) DEFAULT 'normal';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS application_deadline DATE;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS expires_at DATE;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS uae_compliance_checked BOOLEAN DEFAULT FALSE;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS emiratization_target INTEGER DEFAULT 0;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS visa_sponsorship_available BOOLEAN DEFAULT FALSE;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '[]';

