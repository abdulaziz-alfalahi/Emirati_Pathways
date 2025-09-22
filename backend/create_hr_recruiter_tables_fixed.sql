-- HR/Recruiter Database Schema (Fixed)
-- Emirati Journey Platform - HR/Recruiter Core Functionality
-- Updated to match existing database schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update existing companies table with additional columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS company_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS headquarters_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS trade_license VARCHAR(100),
ADD COLUMN IF NOT EXISTS emiratization_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS established_year INTEGER,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_documents JSONB,
ADD COLUMN IF NOT EXISTS social_media_links JSONB,
ADD COLUMN IF NOT EXISTS company_culture TEXT,
ADD COLUMN IF NOT EXISTS benefits_offered JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- HR Profiles table
CREATE TABLE IF NOT EXISTS hr_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    position_title VARCHAR(255),
    department VARCHAR(100),
    years_of_experience INTEGER DEFAULT 0,
    specializations JSONB, -- ['recruitment', 'talent_acquisition', 'employee_relations', 'compensation']
    contact_preferences JSONB, -- {'email': true, 'phone': false, 'whatsapp': true}
    hiring_authority_level VARCHAR(50), -- 'junior', 'senior', 'manager', 'director', 'c-level'
    regions_of_focus JSONB, -- ['dubai', 'abu_dhabi', 'sharjah', 'remote']
    industries_of_expertise JSONB,
    languages_spoken JSONB,
    certifications JSONB,
    linkedin_profile VARCHAR(255),
    professional_summary TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Company team members table
CREATE TABLE IF NOT EXISTS company_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL, -- 'admin', 'hr_manager', 'recruiter', 'interviewer'
    permissions JSONB, -- {'can_post_jobs': true, 'can_schedule_interviews': true, 'can_manage_team': false}
    invited_by UUID REFERENCES users(id),
    invitation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, user_id)
);

-- Company settings table
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    setting_category VARCHAR(100) NOT NULL, -- 'branding', 'notifications', 'hiring_process', 'compliance'
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, setting_category, setting_key)
);

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB, -- {'education': [], 'skills': [], 'experience': '', 'languages': []}
    responsibilities JSONB,
    benefits JSONB,
    salary_range_min DECIMAL(12,2),
    salary_range_max DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'AED',
    location VARCHAR(255),
    remote_work_allowed BOOLEAN DEFAULT FALSE,
    employment_type VARCHAR(50), -- 'full-time', 'part-time', 'contract', 'internship'
    experience_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'executive'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'paused', 'closed', 'expired'
    priority_level VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    application_deadline TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    uae_compliance_checked BOOLEAN DEFAULT FALSE,
    emiratization_target DECIMAL(5,2),
    visa_sponsorship_available BOOLEAN DEFAULT FALSE,
    tags JSONB, -- ['remote', 'urgent', 'senior-level']
    seo_keywords JSONB,
    external_job_id VARCHAR(100), -- For integration with external job boards
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job templates table
CREATE TABLE IF NOT EXISTS job_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    template_name VARCHAR(255) NOT NULL,
    template_category VARCHAR(100), -- 'engineering', 'marketing', 'sales', 'finance'
    title_template VARCHAR(255),
    description_template TEXT,
    requirements_template JSONB,
    responsibilities_template JSONB,
    benefits_template JSONB,
    is_public BOOLEAN DEFAULT FALSE, -- Can be shared with other companies
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job requirements table (for detailed requirements tracking)
CREATE TABLE IF NOT EXISTS job_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    requirement_type VARCHAR(50) NOT NULL, -- 'skill', 'education', 'certification', 'experience'
    requirement_name VARCHAR(255) NOT NULL,
    requirement_level VARCHAR(50), -- 'required', 'preferred', 'nice-to-have'
    proficiency_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced', 'expert'
    years_required INTEGER,
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.00, -- For scoring candidates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job benefits table
CREATE TABLE IF NOT EXISTS job_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    benefit_category VARCHAR(100), -- 'health', 'financial', 'time-off', 'professional-development'
    benefit_name VARCHAR(255) NOT NULL,
    benefit_description TEXT,
    benefit_value VARCHAR(100), -- '100% health coverage', '25 days PTO'
    is_highlighted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES job_postings(id),
    interviewer_id UUID NOT NULL REFERENCES users(id),
    candidate_id UUID NOT NULL REFERENCES users(id),
    interview_round INTEGER DEFAULT 1, -- 1st round, 2nd round, etc.
    interview_type VARCHAR(50) NOT NULL, -- 'phone', 'video', 'in-person', 'technical', 'panel'
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(255), -- Physical address or 'Remote'
    meeting_link VARCHAR(500), -- Zoom, Teams, etc.
    meeting_password VARCHAR(100),
    agenda TEXT,
    preparation_notes TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled'
    cancellation_reason TEXT,
    rescheduled_from UUID REFERENCES interviews(id),
    reminder_sent BOOLEAN DEFAULT FALSE,
    confirmation_required BOOLEAN DEFAULT TRUE,
    candidate_confirmed BOOLEAN DEFAULT FALSE,
    interviewer_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interview feedback table
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES users(id),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
    communication_skills_rating INTEGER CHECK (communication_skills_rating >= 1 AND communication_skills_rating <= 5),
    cultural_fit_rating INTEGER CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    detailed_feedback TEXT,
    recommendation VARCHAR(50), -- 'strong_hire', 'hire', 'no_hire', 'strong_no_hire'
    next_steps TEXT,
    questions_asked JSONB,
    candidate_questions JSONB,
    additional_notes TEXT,
    is_final_feedback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interview availability table (for scheduling)
CREATE TABLE IF NOT EXISTS interview_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE,
    effective_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interview notifications table
CREATE TABLE IF NOT EXISTS interview_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(100) NOT NULL, -- 'scheduled', 'reminder', 'cancelled', 'rescheduled'
    notification_method VARCHAR(50), -- 'email', 'sms', 'push', 'in-app'
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_company_size ON companies(company_size);
CREATE INDEX IF NOT EXISTS idx_companies_headquarters_location ON companies(headquarters_location);

CREATE INDEX IF NOT EXISTS idx_hr_profiles_user_id ON hr_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_profiles_company_id ON hr_profiles(company_id);

CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON job_postings(location);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON job_postings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_experience_level ON job_postings(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at);

CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_date ON interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- Create triggers for updated_at timestamps (only for new tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create triggers for new tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hr_profiles_updated_at') THEN
        CREATE TRIGGER update_hr_profiles_updated_at BEFORE UPDATE ON hr_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_team_members_updated_at') THEN
        CREATE TRIGGER update_company_team_members_updated_at BEFORE UPDATE ON company_team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_settings_updated_at') THEN
        CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_job_postings_updated_at') THEN
        CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_job_templates_updated_at') THEN
        CREATE TRIGGER update_job_templates_updated_at BEFORE UPDATE ON job_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interviews_updated_at') THEN
        CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interview_feedback_updated_at') THEN
        CREATE TRIGGER update_interview_feedback_updated_at BEFORE UPDATE ON interview_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interview_availability_updated_at') THEN
        CREATE TRIGGER update_interview_availability_updated_at BEFORE UPDATE ON interview_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample data for testing (using existing column names)
INSERT INTO companies (name, industry, size, description, company_type, emiratization_percentage) VALUES
('Emirates Tech Solutions', 'Technology', '51-200', 'Leading technology solutions provider in the UAE', 'private', 25.00),
('Abu Dhabi Government Services', 'Government', '1000+', 'Government services and digital transformation', 'government', 85.00),
('Gulf Innovation Hub', 'Technology', '11-50', 'Innovation hub for emerging technologies', 'startup', 15.00)
ON CONFLICT DO NOTHING;

-- Create views for easier querying (fixed to match existing schema)
CREATE OR REPLACE VIEW candidate_search_view AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.emirate,
    u.nationality,
    u.education_level,
    u.created_at as registered_at,
    COUNT(ja.id) as total_applications,
    MAX(ja.submitted_at) as last_application_date
FROM users u
LEFT JOIN job_applications ja ON u.id = ja.user_id
WHERE u.role = 'candidate'
GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.emirate, u.nationality, u.education_level, u.created_at;

CREATE OR REPLACE VIEW hr_dashboard_stats AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    COUNT(DISTINCT jp.id) as total_job_postings,
    COUNT(DISTINCT CASE WHEN jp.status = 'published' THEN jp.id END) as active_job_postings,
    COUNT(DISTINCT ja.id) as total_applications,
    COUNT(DISTINCT CASE WHEN ja.application_status = 'submitted' THEN ja.id END) as new_applications,
    COUNT(DISTINCT i.id) as total_interviews,
    COUNT(DISTINCT CASE WHEN i.status = 'scheduled' THEN i.id END) as upcoming_interviews
FROM companies c
LEFT JOIN job_postings jp ON c.id = jp.company_id
LEFT JOIN job_applications ja ON jp.id::text = ja.job_id
LEFT JOIN interviews i ON ja.id = i.application_id
GROUP BY c.id, c.name;
