-- Recruiter Services Extensions: documents, shortlists, offers, approvals, distribution
-- Date: 2025-10-19

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Job documents uploaded by recruiters (JD attachments, role justifications, etc.)
CREATE TABLE IF NOT EXISTS job_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    document_type VARCHAR(100), -- 'jd', 'role_justification', 'budget_approval', 'other'
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    content_type VARCHAR(255),
    size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_documents_job ON job_documents(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_documents_uploader ON job_documents(uploaded_by);

-- Shortlist of candidates for a given job posting
CREATE TABLE IF NOT EXISTS job_shortlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_posting_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_job_shortlists_job ON job_shortlists(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_shortlists_candidate ON job_shortlists(candidate_id);

-- Offers and e-signature tracking
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    application_id UUID REFERENCES job_applications(id) ON DELETE SET NULL,
    candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recruiter_id INTEGER NOT NULL REFERENCES users(id),
    offer_data JSONB NOT NULL, -- salary, benefits, start_date, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft','sent','signed','accepted','declined','expired'
    signature_token VARCHAR(128), -- simple token for demo e-sign flow
    signed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offers_job ON offers(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_offers_candidate ON offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- Approval workflow for postings and offers
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL, -- 'job_posting','offer'
    resource_id UUID NOT NULL,
    requested_by INTEGER NOT NULL REFERENCES users(id),
    approver_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending','approved','rejected'
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMPTZ,
    UNIQUE(resource_type, resource_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_company ON approval_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_resource ON approval_requests(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);

-- External job board distribution tracking
CREATE TABLE IF NOT EXISTS external_job_distribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    target VARCHAR(100) NOT NULL, -- 'linkedin','indeed','bayt','monster','other'
    payload JSONB, -- request body we will send to the external API
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued','sent','published','error'
    external_id VARCHAR(255),
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_external_dist_job ON external_job_distribution(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_external_dist_target ON external_job_distribution(target);
CREATE INDEX IF NOT EXISTS idx_external_dist_status ON external_job_distribution(status);

-- Trigger to maintain updated_at columns where relevant
