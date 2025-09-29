-- School Programs Database Schema for PostgreSQL
-- KHDA Content Management System for Dubai School Programs
-- Compatible with existing Emirati Journey Platform database
-- Created: 2025-09-27

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- KHDA school code
    location VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    coordinates POINT, -- Geographic coordinates
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website_url VARCHAR(500),
    khda_rating VARCHAR(50), -- Outstanding, Very Good, Good, Acceptable
    curriculum_type TEXT[], -- British, American, IB, UAE National, etc.
    student_capacity INTEGER,
    current_enrollment INTEGER,
    established_year INTEGER,
    principal_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create school_programs table
CREATE TABLE IF NOT EXISTS school_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title_en VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500) NOT NULL,
    description_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- STEM, Arts, Sports, Languages, etc.
    subcategory VARCHAR(100),
    target_age_min INTEGER NOT NULL,
    target_age_max INTEGER NOT NULL,
    duration_value INTEGER NOT NULL,
    duration_unit VARCHAR(20) NOT NULL DEFAULT 'years', -- years, months, weeks
    capacity_total INTEGER NOT NULL,
    capacity_available INTEGER NOT NULL,
    fees_currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    fees_amount DECIMAL(10,2) NOT NULL,
    fees_frequency VARCHAR(20) NOT NULL DEFAULT 'annual', -- annual, monthly, one-time
    start_date DATE,
    end_date DATE,
    application_deadline DATE,
    requirements TEXT[],
    learning_outcomes TEXT[],
    assessment_methods TEXT[],
    certification_offered VARCHAR(255),
    language_of_instruction TEXT[] DEFAULT ARRAY['English'],
    schedule_days TEXT[], -- Monday, Tuesday, etc.
    schedule_time_start TIME,
    schedule_time_end TIME,
    location_on_campus BOOLEAN DEFAULT TRUE,
    location_details TEXT,
    equipment_provided TEXT[],
    prerequisites TEXT[],
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    image_urls TEXT[],
    video_urls TEXT[],
    brochure_url VARCHAR(500),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'published', 'archived', 'rejected')),
    workflow_stage VARCHAR(50) NOT NULL DEFAULT 'content_creation' CHECK (workflow_stage IN (
        'content_creation', 'submission', 'technical_review', 'educational_review', 
        'policy_review', 'final_approval', 'staging', 'publication', 'maintenance'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id)
);

-- Create program_success_metrics table
CREATE TABLE IF NOT EXISTS program_success_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    graduation_rate DECIMAL(5,2), -- percentage
    employment_rate DECIMAL(5,2), -- percentage
    satisfaction_score DECIMAL(3,2), -- out of 5.0
    industry_partnerships INTEGER DEFAULT 0,
    awards_received TEXT[],
    alumni_achievements TEXT[],
    parent_feedback_score DECIMAL(3,2),
    student_retention_rate DECIMAL(5,2),
    university_acceptance_rate DECIMAL(5,2),
    scholarship_recipients INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create program_workflow_history table
CREATE TABLE IF NOT EXISTS program_workflow_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    stage_from VARCHAR(50) NOT NULL,
    stage_to VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'submit', 'approve', 'reject', 'request_revision'
    actor_id UUID NOT NULL REFERENCES users(id),
    actor_role VARCHAR(100) NOT NULL, -- 'content_creator', 'technical_reviewer', 'educational_reviewer', etc.
    comments TEXT,
    review_notes TEXT,
    attachments TEXT[],
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create program_reviews table
CREATE TABLE IF NOT EXISTS program_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    review_type VARCHAR(50) NOT NULL, -- 'technical', 'educational', 'policy', 'final'
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
    score INTEGER CHECK (score >= 1 AND score <= 5),
    feedback TEXT,
    checklist_items JSONB, -- structured review checklist
    recommendations TEXT[],
    compliance_notes TEXT,
    khda_standards_met BOOLEAN,
    education33_alignment BOOLEAN,
    d33_alignment BOOLEAN,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE
);

-- Create program_categories table
CREATE TABLE IF NOT EXISTS program_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL UNIQUE,
    name_ar VARCHAR(100) NOT NULL UNIQUE,
    description_en TEXT,
    description_ar TEXT,
    icon_name VARCHAR(50), -- Lucide icon name
    color_code VARCHAR(10), -- Hex color for UI
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create program_tags table
CREATE TABLE IF NOT EXISTS program_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_type VARCHAR(50) DEFAULT 'general', -- 'skill', 'technology', 'methodology', 'general'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, tag_name)
);

-- Create program_enrollments table
CREATE TABLE IF NOT EXISTS program_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES users(id),
    enrollment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (enrollment_status IN (
        'pending', 'approved', 'rejected', 'waitlisted', 'enrolled', 'completed', 'withdrawn'
    )),
    application_data JSONB,
    enrollment_date DATE,
    completion_date DATE,
    grade_achieved VARCHAR(10),
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create program_notifications table
CREATE TABLE IF NOT EXISTS program_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id),
    notification_type VARCHAR(100) NOT NULL, -- 'workflow_update', 'review_assigned', 'deadline_reminder', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_location ON schools(location);
CREATE INDEX IF NOT EXISTS idx_schools_active ON schools(is_active);

CREATE INDEX IF NOT EXISTS idx_school_programs_school ON school_programs(school_id);
CREATE INDEX IF NOT EXISTS idx_school_programs_category ON school_programs(category);
CREATE INDEX IF NOT EXISTS idx_school_programs_status ON school_programs(status);
CREATE INDEX IF NOT EXISTS idx_school_programs_workflow_stage ON school_programs(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_school_programs_featured ON school_programs(featured);
CREATE INDEX IF NOT EXISTS idx_school_programs_age_range ON school_programs(target_age_min, target_age_max);
CREATE INDEX IF NOT EXISTS idx_school_programs_dates ON school_programs(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_program_workflow_history_program ON program_workflow_history(program_id);
CREATE INDEX IF NOT EXISTS idx_program_workflow_history_actor ON program_workflow_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_program_workflow_history_stage ON program_workflow_history(stage_to);

CREATE INDEX IF NOT EXISTS idx_program_reviews_program ON program_reviews(program_id);
CREATE INDEX IF NOT EXISTS idx_program_reviews_reviewer ON program_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_program_reviews_status ON program_reviews(status);
CREATE INDEX IF NOT EXISTS idx_program_reviews_type ON program_reviews(review_type);

CREATE INDEX IF NOT EXISTS idx_program_tags_program ON program_tags(program_id);
CREATE INDEX IF NOT EXISTS idx_program_tags_name ON program_tags(tag_name);

CREATE INDEX IF NOT EXISTS idx_program_enrollments_program ON program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_student ON program_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON program_enrollments(enrollment_status);

CREATE INDEX IF NOT EXISTS idx_program_notifications_recipient ON program_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_program_notifications_unread ON program_notifications(is_read) WHERE is_read = FALSE;

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schools_updated_at 
    BEFORE UPDATE ON schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_programs_updated_at 
    BEFORE UPDATE ON school_programs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_success_metrics_updated_at 
    BEFORE UPDATE ON program_success_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_enrollments_updated_at 
    BEFORE UPDATE ON program_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default program categories
INSERT INTO program_categories (name_en, name_ar, description_en, description_ar, icon_name, color_code, sort_order) VALUES
('STEM', 'العلوم والتكنولوجيا', 'Science, Technology, Engineering, and Mathematics programs', 'برامج العلوم والتكنولوجيا والهندسة والرياضيات', 'Cpu', '#3B82F6', 1),
('Arts', 'الفنون', 'Creative arts and cultural programs', 'برامج الفنون الإبداعية والثقافية', 'Palette', '#EC4899', 2),
('Sports', 'الرياضة', 'Physical education and sports programs', 'برامج التربية البدنية والرياضة', 'Trophy', '#10B981', 3),
('Languages', 'اللغات', 'Language learning and communication programs', 'برامج تعلم اللغات والتواصل', 'Languages', '#F59E0B', 4),
('Business', 'الأعمال', 'Entrepreneurship and business skills programs', 'برامج ريادة الأعمال والمهارات التجارية', 'Briefcase', '#8B5CF6', 5),
('Life Skills', 'المهارات الحياتية', 'Personal development and life skills programs', 'برامج التطوير الشخصي والمهارات الحياتية', 'User', '#06B6D4', 6)
ON CONFLICT (name_en) DO NOTHING;

-- Insert sample schools
INSERT INTO schools (name_en, name_ar, code, location, district, contact_email, khda_rating, curriculum_type, student_capacity, current_enrollment, established_year, is_active) VALUES
('Dubai International Academy', 'أكاديمية دبي الدولية', 'DIA001', 'Al Barsha', 'Al Barsha', 'info@dia.ae', 'Outstanding', ARRAY['IB', 'British'], 1200, 1050, 2005, TRUE),
('GEMS Wellington Academy', 'أكاديمية جيمس ويلينغتون', 'GWA002', 'Silicon Oasis', 'Dubai Silicon Oasis', 'admissions@wellington.ae', 'Very Good', ARRAY['British'], 1500, 1350, 2010, TRUE),
('American School of Dubai', 'المدرسة الأمريكية في دبي', 'ASD003', 'Jumeirah', 'Jumeirah', 'info@asdubai.org', 'Outstanding', ARRAY['American'], 1800, 1650, 1966, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Add user roles for School Programs if they don't exist
DO $$
BEGIN
    -- Check if user_roles table exists and add roles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        -- Add KHDA and school-related roles
        INSERT INTO user_roles (role_name, description, permissions) VALUES
        ('khda_staff', 'KHDA Staff Member', ARRAY['view_all_programs', 'review_programs', 'approve_programs', 'manage_workflow']),
        ('khda_director', 'KHDA Director', ARRAY['view_all_programs', 'review_programs', 'approve_programs', 'manage_workflow', 'final_approval']),
        ('content_creator', 'Content Creator', ARRAY['create_programs', 'edit_programs', 'submit_programs']),
        ('school_admin', 'School Administrator', ARRAY['manage_school_programs', 'view_enrollments', 'manage_enrollments']),
        ('technical_reviewer', 'Technical Reviewer', ARRAY['review_technical_aspects', 'approve_technical']),
        ('educational_reviewer', 'Educational Reviewer', ARRAY['review_educational_content', 'approve_educational']),
        ('policy_reviewer', 'Policy Reviewer', ARRAY['review_policy_compliance', 'approve_policy'])
        ON CONFLICT (role_name) DO NOTHING;
    END IF;
END $$;

COMMENT ON TABLE schools IS 'Dubai schools registered with KHDA';
COMMENT ON TABLE school_programs IS 'Educational programs offered by Dubai schools';
COMMENT ON TABLE program_workflow_history IS 'KHDA 25-day approval workflow tracking';
COMMENT ON TABLE program_reviews IS 'Multi-stage review process for program approval';
COMMENT ON TABLE program_categories IS 'Program categorization system';
COMMENT ON TABLE program_tags IS 'Flexible tagging system for programs';
COMMENT ON TABLE program_enrollments IS 'Student enrollment management';
COMMENT ON TABLE program_notifications IS 'Workflow and system notifications';
