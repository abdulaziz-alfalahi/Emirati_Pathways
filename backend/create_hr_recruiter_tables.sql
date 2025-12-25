-- HR/Recruiter Database Schema
-- Emirati Journey Platform - HR/Recruiter Core Functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (New table -> Use UUID)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(100),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    headquarters_location VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(500),
    trade_license VARCHAR(100),
    emiratization_percentage DECIMAL(5,2) DEFAULT 0.00,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    established_year INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents JSONB,
    social_media_links JSONB,
    company_culture TEXT,
    benefits_offered JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HR Profiles table (Links Integer User to UUID Company)
CREATE TABLE IF NOT EXISTS hr_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    position_title VARCHAR(255),
    department VARCHAR(100),
    years_of_experience INTEGER DEFAULT 0,
    specializations JSONB,
    contact_preferences JSONB,
    hiring_authority_level VARCHAR(50),
    regions_of_focus JSONB,
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
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    permissions JSONB,
    invited_by INTEGER REFERENCES users(id),
    invitation_status VARCHAR(50) DEFAULT 'pending',
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, user_id)
);

-- Company settings table
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    setting_category VARCHAR(100) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, setting_category, setting_key)
);

-- Job postings table (Existing table -> Integer ID)
-- If it exists, we assume correct columns. But for new installs we use Integer ID if creating.
-- However, we can't easily conditionally create with specific types.
-- We assume it EXISTS. If not, this create might fail/conflict if we don't align.
-- Since we found it uses Integer ID, we define it as SERIAL if creating.
CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    company_id VARCHAR(255), -- Looser content matching existing varchar
    created_by INTEGER REFERENCES users(id),
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
    application_deadline TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    uae_compliance_checked BOOLEAN DEFAULT FALSE,
    emiratization_target DECIMAL(5,2),
    visa_sponsorship_available BOOLEAN DEFAULT FALSE,
    tags JSONB,
    seo_keywords JSONB,
    external_job_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job templates table
CREATE TABLE IF NOT EXISTS job_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    template_name VARCHAR(255) NOT NULL,
    template_category VARCHAR(100),
    title_template VARCHAR(255),
    description_template TEXT,
    requirements_template JSONB,
    responsibilities_template JSONB,
    benefits_template JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job requirements table (FK must be Integer for JobPosting)
CREATE TABLE IF NOT EXISTS job_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    requirement_type VARCHAR(50) NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    requirement_level VARCHAR(50),
    proficiency_level VARCHAR(50),
    years_required INTEGER,
    description TEXT,
    weight DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job benefits table
CREATE TABLE IF NOT EXISTS job_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    benefit_category VARCHAR(100),
    benefit_name VARCHAR(255) NOT NULL,
    benefit_description TEXT,
    benefit_value VARCHAR(100),
    is_highlighted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
