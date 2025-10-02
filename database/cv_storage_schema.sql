-- CV Storage Schema for Emirati Journey Platform
-- Stores user CVs with version history and metadata

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CV Templates table
CREATE TABLE IF NOT EXISTS cv_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- government, tech, business, creative
    template_data JSONB, -- Template configuration and styling
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User CVs table
CREATE TABLE IF NOT EXISTS user_cvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References users table
    title VARCHAR(200) NOT NULL,
    template_id UUID REFERENCES cv_templates(id),
    language VARCHAR(10) DEFAULT 'en', -- en, ar
    
    -- Personal Information
    personal_info JSONB NOT NULL DEFAULT '{}',
    
    -- CV Content
    professional_summary TEXT,
    technical_skills TEXT[], -- Array of technical skills
    soft_skills TEXT[], -- Array of soft skills
    languages_spoken JSONB DEFAULT '[]', -- Language proficiency data
    
    -- Experience and Education (stored as JSONB for flexibility)
    work_experience JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    
    -- CV Metadata
    cv_score INTEGER DEFAULT 0, -- CV completeness score (0-100)
    ats_score INTEGER DEFAULT 0, -- ATS optimization score (0-100)
    last_analyzed_at TIMESTAMP,
    
    -- Status and Visibility
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    is_public BOOLEAN DEFAULT false,
    sharing_token VARCHAR(100), -- For sharing CVs with recruiters
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CV Version History table
CREATE TABLE IF NOT EXISTS cv_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES user_cvs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Snapshot of CV data at this version
    cv_data JSONB NOT NULL,
    
    -- Version metadata
    change_summary TEXT,
    created_by UUID, -- User who made the changes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(cv_id, version_number)
);

-- CV Analytics table
CREATE TABLE IF NOT EXISTS cv_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES user_cvs(id) ON DELETE CASCADE,
    
    -- View and interaction metrics
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_time_spent INTEGER DEFAULT 0, -- seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Job application metrics
    applications_sent INTEGER DEFAULT 0,
    interviews_received INTEGER DEFAULT 0,
    job_offers_received INTEGER DEFAULT 0,
    
    -- Last updated
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CV Sharing table (for recruiter access)
CREATE TABLE IF NOT EXISTS cv_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES user_cvs(id) ON DELETE CASCADE,
    shared_with_email VARCHAR(255),
    shared_with_name VARCHAR(100),
    company VARCHAR(100),
    
    -- Sharing metadata
    sharing_token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Access tracking
    accessed_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default CV templates
INSERT INTO cv_templates (name, display_name, description, category, template_data) VALUES
(
    'government-executive',
    'Government Executive',
    'Professional template designed for UAE government positions and leadership roles',
    'government',
    '{
        "colors": {
            "primary": "#1e40af",
            "secondary": "#374151", 
            "accent": "#059669"
        },
        "fonts": {
            "title_size": 26,
            "heading_size": 18,
            "body_size": 11
        },
        "layout": "traditional",
        "features": ["D33 Aligned", "Leadership Focus", "Government Style"]
    }'::jsonb
),
(
    'tech-innovator',
    'Tech Innovator', 
    'Modern template for technology professionals in UAE digital transformation',
    'technology',
    '{
        "colors": {
            "primary": "#7c3aed",
            "secondary": "#0891b2",
            "accent": "#6b7280"
        },
        "fonts": {
            "title_size": 24,
            "heading_size": 16,
            "body_size": 11
        },
        "layout": "modern",
        "features": ["Talent33 Focus", "Innovation Highlight", "Tech Skills Matrix"]
    }'::jsonb
),
(
    'business-leader',
    'Business Leader',
    'Executive template for business professionals and entrepreneurs in UAE market',
    'business', 
    '{
        "colors": {
            "primary": "#059669",
            "secondary": "#dc2626",
            "accent": "#6b7280"
        },
        "fonts": {
            "title_size": 25,
            "heading_size": 17,
            "body_size": 11
        },
        "layout": "executive",
        "features": ["Executive Style", "Results Driven", "UAE Market Focus"]
    }'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_cvs_user_id ON user_cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cvs_status ON user_cvs(status);
CREATE INDEX IF NOT EXISTS idx_user_cvs_created_at ON user_cvs(created_at);
CREATE INDEX IF NOT EXISTS idx_cv_versions_cv_id ON cv_versions(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_analytics_cv_id ON cv_analytics(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_shares_token ON cv_shares(sharing_token);
CREATE INDEX IF NOT EXISTS idx_cv_shares_cv_id ON cv_shares(cv_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_cvs_updated_at ON user_cvs;
CREATE TRIGGER update_user_cvs_updated_at
    BEFORE UPDATE ON user_cvs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cv_templates_updated_at ON cv_templates;
CREATE TRIGGER update_cv_templates_updated_at
    BEFORE UPDATE ON cv_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();