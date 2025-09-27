-- School Programs Database Schema for PostgreSQL (Compatible Version)
-- Compatible with existing Emirati Journey Platform database structure
-- Matches existing primary key naming conventions
-- Created: 2025-09-27

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create school_programs table (main table)
CREATE TABLE IF NOT EXISTS school_programs (
    program_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    title_en VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500) NOT NULL,
    description_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    target_age_min INTEGER NOT NULL,
    target_age_max INTEGER NOT NULL,
    duration_value INTEGER NOT NULL,
    duration_unit VARCHAR(20) NOT NULL DEFAULT 'years',
    capacity_total INTEGER NOT NULL,
    capacity_available INTEGER NOT NULL,
    fees_currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    fees_amount DECIMAL(10,2) NOT NULL,
    fees_frequency VARCHAR(20) NOT NULL DEFAULT 'annual',
    start_date DATE,
    end_date DATE,
    application_deadline DATE,
    requirements TEXT[],
    learning_outcomes TEXT[],
    assessment_methods TEXT[],
    certification_offered VARCHAR(255),
    language_of_instruction TEXT[] DEFAULT ARRAY['English'],
    schedule_days TEXT[],
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
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    workflow_stage VARCHAR(50) NOT NULL DEFAULT 'content_creation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    last_modified_by UUID REFERENCES users(user_id),
    CONSTRAINT check_status CHECK (status IN ('draft', 'under_review', 'published', 'archived', 'rejected')),
    CONSTRAINT check_workflow_stage CHECK (workflow_stage IN (
        'content_creation', 'submission', 'technical_review', 'educational_review', 
        'policy_review', 'final_approval', 'staging', 'publication', 'maintenance'
    ))
);

-- Create program_success_metrics table
CREATE TABLE IF NOT EXISTS program_success_metrics (
    metrics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(program_id) ON DELETE CASCADE,
    graduation_rate DECIMAL(5,2),
    employment_rate DECIMAL(5,2),
    satisfaction_score DECIMAL(3,2),
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
    workflow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(program_id) ON DELETE CASCADE,
    stage_from VARCHAR(50) NOT NULL,
    stage_to VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(user_id),
    actor_role VARCHAR(100) NOT NULL,
    comments TEXT,
    review_notes TEXT,
    attachments TEXT[],
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create program_reviews table
CREATE TABLE IF NOT EXISTS program_reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(program_id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(user_id),
    review_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    score INTEGER,
    feedback TEXT,
    checklist_items JSONB,
    recommendations TEXT[],
    compliance_notes TEXT,
    khda_standards_met BOOLEAN,
    education33_alignment BOOLEAN,
    d33_alignment BOOLEAN,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_review_status CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
    CONSTRAINT check_score CHECK (score >= 1 AND score <= 5)
);

-- Create program_tags table
CREATE TABLE IF NOT EXISTS program_tags (
    tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(program_id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, tag_name)
);

-- Create program_enrollments table
CREATE TABLE IF NOT EXISTS program_enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(program_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(user_id),
    parent_id UUID REFERENCES users(user_id),
    enrollment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    application_data JSONB,
    enrollment_date DATE,
    completion_date DATE,
    grade_achieved VARCHAR(10),
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_enrollment_status CHECK (enrollment_status IN (
        'pending', 'approved', 'rejected', 'waitlisted', 'enrolled', 'completed', 'withdrawn'
    ))
);

-- Create program_notifications table
CREATE TABLE IF NOT EXISTS program_notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(program_id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(user_id),
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create indexes for performance
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

CREATE TRIGGER update_school_programs_updated_at 
    BEFORE UPDATE ON school_programs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_success_metrics_updated_at 
    BEFORE UPDATE ON program_success_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_enrollments_updated_at 
    BEFORE UPDATE ON program_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
