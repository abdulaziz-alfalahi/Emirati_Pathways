-- Job Documents storage for recruiter services
-- Associates uploaded files with job_postings and tracks metadata

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS job_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(150),
    file_size INTEGER,
    storage_path VARCHAR(1024) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_documents_job ON job_documents(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_documents_uploaded_by ON job_documents(uploaded_by);
