-- 🗄️ Emirati Journey Platform - Database Setup Script
-- This script creates the complete database schema for the platform

-- Create database and user (run as PostgreSQL superuser)
-- CREATE DATABASE emirati_journey;
-- CREATE USER emirati_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE emirati_journey TO emirati_user;

-- Connect to the emirati_journey database before running the rest

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('candidate', 'recruiter', 'employer', 'mentor', 'admin');
CREATE TYPE application_status AS ENUM ('pending', 'reviewed', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'expired');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'candidate',
    emirate VARCHAR(50),
    nationality VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    profile_picture VARCHAR(255),
    bio TEXT,
    skills TEXT[],
    experience_years INTEGER DEFAULT 0,
    education_level VARCHAR(50),
    preferred_salary_min INTEGER,
    preferred_salary_max INTEGER,
    preferred_location VARCHAR(100),
    is_uae_national BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    website VARCHAR(255),
    logo VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    emirate VARCHAR(50),
    country VARCHAR(50) DEFAULT 'UAE',
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(100),
    trade_license VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    emiratization_percentage DECIMAL(5,2) DEFAULT 0.00,
    emiratization_target DECIMAL(5,2) DEFAULT 0.00,
    total_employees INTEGER DEFAULT 0,
    uae_national_employees INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    posted_by UUID REFERENCES users(id),
    job_type VARCHAR(50), -- full-time, part-time, contract, internship
    experience_level VARCHAR(50), -- entry, mid, senior, executive
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10) DEFAULT 'AED',
    location VARCHAR(255),
    emirate VARCHAR(50),
    is_remote BOOLEAN DEFAULT FALSE,
    skills_required TEXT[],
    education_required VARCHAR(100),
    language_requirements TEXT[],
    emiratization_priority BOOLEAN DEFAULT FALSE,
    uae_nationals_only BOOLEAN DEFAULT FALSE,
    visa_sponsorship BOOLEAN DEFAULT FALSE,
    status job_status DEFAULT 'draft',
    application_deadline DATE,
    positions_available INTEGER DEFAULT 1,
    positions_filled INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status application_status DEFAULT 'pending',
    cover_letter TEXT,
    cv_file VARCHAR(255),
    additional_documents TEXT[],
    expected_salary INTEGER,
    available_from DATE,
    notes TEXT,
    recruiter_notes TEXT,
    interview_date TIMESTAMP,
    interview_location VARCHAR(255),
    interview_type VARCHAR(50), -- in-person, video, phone
    offer_amount INTEGER,
    offer_details TEXT,
    rejection_reason TEXT,
    skills_match_score DECIMAL(5,2),
    experience_match_score DECIMAL(5,2),
    overall_match_score DECIMAL(5,2),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, file, system
    file_attachments TEXT[],
    status message_status DEFAULT 'sent',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    parent_message_id UUID REFERENCES messages(id),
    related_job_id UUID REFERENCES jobs(id),
    related_application_id UUID REFERENCES applications(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User verifications table
CREATE TABLE user_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL, -- email, phone, identity
    verification_code VARCHAR(10),
    verification_token VARCHAR(255),
    status verification_status DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_data JSONB,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job views table
CREATE TABLE job_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    view_duration INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved jobs table
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id)
);

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User skills table
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    years_experience DECIMAL(3,1),
    is_certified BOOLEAN DEFAULT FALSE,
    certification_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50), -- application, message, job_match, system
    related_id UUID, -- ID of related object (job, application, etc.)
    is_read BOOLEAN DEFAULT FALSE,
    is_email_sent BOOLEAN DEFAULT FALSE,
    is_push_sent BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_emirate ON users(emirate);
CREATE INDEX idx_users_is_uae_national ON users(is_uae_national);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_emirate ON companies(emirate);
CREATE INDEX idx_companies_is_verified ON companies(is_verified);

CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_emirate ON jobs(emirate);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX idx_jobs_emiratization_priority ON jobs(emiratization_priority);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_published_at ON jobs(published_at);
CREATE INDEX idx_jobs_application_deadline ON jobs(application_deadline);

CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_reviewed_by ON applications(reviewed_by);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

CREATE INDEX idx_job_views_job_id ON job_views(job_id);
CREATE INDEX idx_job_views_user_id ON job_views(user_id);
CREATE INDEX idx_job_views_created_at ON job_views(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('platform_name', 'Emirati Journey Platform', 'string', 'Name of the platform', true),
('platform_version', '1.0.0', 'string', 'Current platform version', true),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', false),
('registration_enabled', 'true', 'boolean', 'Allow new user registrations', false),
('email_verification_required', 'true', 'boolean', 'Require email verification for new users', false),
('phone_verification_required', 'true', 'boolean', 'Require phone verification for new users', false),
('max_file_upload_size', '16777216', 'number', 'Maximum file upload size in bytes (16MB)', false),
('supported_file_types', '["pdf", "doc", "docx", "jpg", "jpeg", "png"]', 'json', 'Supported file types for uploads', false),
('default_currency', 'AED', 'string', 'Default currency for the platform', true),
('default_timezone', 'Asia/Dubai', 'string', 'Default timezone for the platform', true),
('emiratization_target_default', '10.0', 'number', 'Default Emiratization target percentage', false),
('job_posting_approval_required', 'false', 'boolean', 'Require admin approval for job postings', false),
('application_auto_expire_days', '30', 'number', 'Days after which applications auto-expire', false),
('session_timeout_hours', '24', 'number', 'User session timeout in hours', false);

-- Insert default skills
INSERT INTO skills (name, category) VALUES
-- Technical Skills
('Python', 'Programming'),
('JavaScript', 'Programming'),
('Java', 'Programming'),
('C++', 'Programming'),
('React', 'Frontend'),
('Angular', 'Frontend'),
('Vue.js', 'Frontend'),
('Node.js', 'Backend'),
('Django', 'Backend'),
('Flask', 'Backend'),
('PostgreSQL', 'Database'),
('MySQL', 'Database'),
('MongoDB', 'Database'),
('Redis', 'Database'),
('AWS', 'Cloud'),
('Azure', 'Cloud'),
('Docker', 'DevOps'),
('Kubernetes', 'DevOps'),
('Git', 'Version Control'),

-- Business Skills
('Project Management', 'Management'),
('Team Leadership', 'Management'),
('Strategic Planning', 'Management'),
('Business Analysis', 'Analysis'),
('Data Analysis', 'Analysis'),
('Financial Analysis', 'Analysis'),
('Marketing', 'Marketing'),
('Digital Marketing', 'Marketing'),
('Sales', 'Sales'),
('Customer Service', 'Customer Service'),
('Communication', 'Soft Skills'),
('Problem Solving', 'Soft Skills'),
('Critical Thinking', 'Soft Skills'),
('Time Management', 'Soft Skills'),

-- UAE-specific Skills
('Arabic Language', 'Language'),
('English Language', 'Language'),
('UAE Labor Law', 'Legal'),
('Islamic Banking', 'Finance'),
('Oil & Gas', 'Industry'),
('Tourism & Hospitality', 'Industry'),
('Real Estate', 'Industry'),
('Healthcare', 'Industry'),
('Education', 'Industry'),
('Government Relations', 'Government');

-- Create views for common queries
CREATE VIEW active_jobs AS
SELECT j.*, c.name as company_name, c.logo as company_logo, c.emirate as company_emirate
FROM jobs j
JOIN companies c ON j.company_id = c.id
WHERE j.status = 'active' AND j.expires_at > CURRENT_TIMESTAMP;

CREATE VIEW job_applications_summary AS
SELECT 
    j.id as job_id,
    j.title as job_title,
    c.name as company_name,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN a.status = 'reviewed' THEN 1 END) as reviewed_applications,
    COUNT(CASE WHEN a.status = 'interview' THEN 1 END) as interview_applications,
    COUNT(CASE WHEN a.status = 'offer' THEN 1 END) as offer_applications,
    COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_applications,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_applications
FROM jobs j
LEFT JOIN applications a ON j.id = a.job_id
JOIN companies c ON j.company_id = c.id
GROUP BY j.id, j.title, c.name;

CREATE VIEW user_application_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_applications,
    COUNT(CASE WHEN a.status = 'interview' THEN 1 END) as interview_applications,
    COUNT(CASE WHEN a.status = 'offer' THEN 1 END) as offer_applications,
    COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_applications
FROM users u
LEFT JOIN applications a ON u.id = a.user_id
WHERE u.role = 'candidate'
GROUP BY u.id, u.first_name, u.last_name, u.email;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO emirati_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO emirati_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO emirati_user;

-- Success message
SELECT 'Database setup completed successfully!' as status;

