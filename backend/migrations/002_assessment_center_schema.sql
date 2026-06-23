-- Migration: Assessment Center and Applications Schema
CREATE TABLE IF NOT EXISTS assessment_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id VARCHAR(255) NOT NULL REFERENCES users(id),
    template_id INTEGER NOT NULL, -- References assessment_templates in planning system
    company_id UUID NOT NULL REFERENCES companies(id), -- Scoped to the center
    status VARCHAR(50) NOT NULL DEFAULT 'applied', -- 'applied', 'scheduled', 'completed', 'cancelled'
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE (candidate_id, template_id, status)
);

CREATE INDEX IF NOT EXISTS idx_assess_app_candidate ON assessment_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_assess_app_company ON assessment_applications(company_id);
