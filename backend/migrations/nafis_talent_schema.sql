-- NAFIS Job Seeker Onboarding Schema
-- Tracks imported job seekers from NAFIS CSV exports

-- Import batch tracking
CREATE TABLE IF NOT EXISTS nafis_import_batches (
    id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    filename VARCHAR(255),
    total_records INTEGER DEFAULT 0,
    successful INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    duplicates INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nafis_batches_code ON nafis_import_batches(batch_code);
CREATE INDEX IF NOT EXISTS idx_nafis_batches_status ON nafis_import_batches(status);

-- Individual job seeker records
CREATE TABLE IF NOT EXISTS nafis_job_seekers (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES nafis_import_batches(id) ON DELETE SET NULL,
    emirates_id VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(20),
    education_level VARCHAR(100),
    experience_years INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'imported' CHECK (status IN ('imported', 'profile_created', 'matched', 'placed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nafis_seekers_eid ON nafis_job_seekers(emirates_id);
CREATE INDEX IF NOT EXISTS idx_nafis_seekers_status ON nafis_job_seekers(status);
CREATE INDEX IF NOT EXISTS idx_nafis_seekers_batch ON nafis_job_seekers(batch_id);
CREATE INDEX IF NOT EXISTS idx_nafis_seekers_user ON nafis_job_seekers(user_id);
