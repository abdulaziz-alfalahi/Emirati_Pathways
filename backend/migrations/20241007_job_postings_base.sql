CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB,
  responsibilities JSONB,
  benefits JSONB,
  salary_range_min DECIMAL(12,2),
  salary_range_max DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'AED',
  location VARCHAR(255),
  remote_work_allowed BOOLEAN DEFAULT FALSE,
  employment_type VARCHAR(50),
  experience_level VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  priority_level VARCHAR(20) DEFAULT 'normal',
  application_deadline TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  uae_compliance_checked BOOLEAN DEFAULT FALSE,
  emiratization_target DECIMAL(5,2),
  visa_sponsorship_available BOOLEAN DEFAULT FALSE,
  tags JSONB,
  seo_keywords JSONB,
  external_job_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at);