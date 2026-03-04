-- Company Invitations Schema
-- Magic link invitation system for onboarding companies from NAFIS data

CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(255),
    company_email VARCHAR(255),
    company_phone VARCHAR(255),
    company_sector VARCHAR(255),
    trade_license VARCHAR(255),
    invited_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',  -- pending / accepted / expired
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_status ON company_invitations(status);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(company_email);
