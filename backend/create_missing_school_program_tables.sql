-- Create Missing School Program Tables Only
-- Don't drop anything, just create what's missing
-- We know schools, program_categories, and school_programs already exist
-- Created: 2025-09-27

-- Create program_success_metrics table
CREATE TABLE IF NOT EXISTS program_success_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    stage_from VARCHAR(50) NOT NULL,
    stage_to VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
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
    due_date TIMESTAMP WITH TIME ZONE
);

-- Create program_tags table
CREATE TABLE IF NOT EXISTS program_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, tag_name)
);

-- Create program_enrollments table
CREATE TABLE IF NOT EXISTS program_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES users(id),
    enrollment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
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
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_program_success_metrics_program ON program_success_metrics(program_id);
CREATE INDEX IF NOT EXISTS idx_program_workflow_history_program ON program_workflow_history(program_id);
CREATE INDEX IF NOT EXISTS idx_program_workflow_history_actor ON program_workflow_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_program_reviews_program ON program_reviews(program_id);
CREATE INDEX IF NOT EXISTS idx_program_reviews_reviewer ON program_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_program_tags_program ON program_tags(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program ON program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_student ON program_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_program_notifications_recipient ON program_notifications(recipient_id);

-- Create triggers for automatic timestamp updates (only if function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Add triggers only if the function exists
        CREATE TRIGGER update_program_success_metrics_updated_at 
            BEFORE UPDATE ON program_success_metrics 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        CREATE TRIGGER update_program_enrollments_updated_at 
            BEFORE UPDATE ON program_enrollments 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
