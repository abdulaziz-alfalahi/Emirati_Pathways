-- Job Application Database Schema
-- Emirati Journey Platform - Complete Job Application System
-- Author: Manus AI
-- Date: September 20, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(100) NOT NULL, -- Job posting reference
    application_status VARCHAR(50) DEFAULT 'submitted' CHECK (
        application_status IN (
            'submitted', 'under_review', 'interview_scheduled', 
            'interview_completed', 'offer_extended', 'offer_accepted', 
            'offer_declined', 'rejected', 'withdrawn', 'hired'
        )
    ),
    cover_letter TEXT NOT NULL,
    expected_salary DECIMAL(12,2),
    expected_salary_currency VARCHAR(3) DEFAULT 'AED',
    availability_date DATE,
    notice_period_days INTEGER DEFAULT 30,
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    visa_status VARCHAR(50),
    additional_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    
    -- Indexes for performance
    CONSTRAINT unique_user_job_application UNIQUE(user_id, job_id)
);

-- Application Documents Table
CREATE TABLE IF NOT EXISTS application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN (
            'resume', 'cv', 'cover_letter', 'portfolio', 
            'certificate', 'transcript', 'reference_letter', 
            'work_sample', 'other'
        )
    ),
    file_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    is_required BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID NOT NULL REFERENCES users(id)
);

-- Application Status History Table
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    status_reason VARCHAR(200),
    notes TEXT,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notification_sent BOOLEAN DEFAULT FALSE
);

-- Application Interview Schedule Table
CREATE TABLE IF NOT EXISTS application_interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    interview_type VARCHAR(50) NOT NULL CHECK (
        interview_type IN (
            'phone_screening', 'video_interview', 'technical_interview',
            'panel_interview', 'final_interview', 'assessment_center'
        )
    ),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(500),
    meeting_link VARCHAR(500),
    interviewer_name VARCHAR(200),
    interviewer_email VARCHAR(255),
    interviewer_phone VARCHAR(20),
    preparation_notes TEXT,
    interview_status VARCHAR(30) DEFAULT 'scheduled' CHECK (
        interview_status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')
    ),
    feedback TEXT,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Application Feedback Table
CREATE TABLE IF NOT EXISTS application_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL CHECK (
        feedback_type IN ('screening', 'interview', 'assessment', 'final_decision')
    ),
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    recommendations TEXT,
    provided_by UUID NOT NULL REFERENCES users(id),
    provided_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_shared_with_candidate BOOLEAN DEFAULT FALSE
);

-- Application Notifications Table
CREATE TABLE IF NOT EXISTS application_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (
        notification_type IN (
            'application_received', 'status_update', 'interview_scheduled',
            'interview_reminder', 'offer_extended', 'application_rejected'
        )
    ),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Job Application Analytics Table
CREATE TABLE IF NOT EXISTS application_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_text VARCHAR(500),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Examples of metrics:
    -- 'time_to_submit' (minutes from job view to application)
    -- 'application_completeness_score' (0-100)
    -- 'profile_match_score' (0-100)
    -- 'cv_quality_score' (0-100)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_job_applications_submitted_at ON job_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_application_interviews_application_id ON application_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_application_interviews_scheduled_date ON application_interviews(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_application_notifications_user_id ON application_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_application_notifications_is_read ON application_notifications(is_read);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON job_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_application_interviews_updated_at ON application_interviews;
CREATE TRIGGER update_application_interviews_updated_at 
    BEFORE UPDATE ON application_interviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically log status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.application_status IS DISTINCT FROM NEW.application_status THEN
        INSERT INTO application_status_history (
            application_id, 
            previous_status, 
            new_status, 
            changed_by,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.application_status,
            NEW.application_status,
            NEW.reviewed_by,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply status change trigger
DROP TRIGGER IF EXISTS log_status_change ON job_applications;
CREATE TRIGGER log_status_change
    AFTER UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION log_application_status_change();

-- Insert sample job application statuses for reference
INSERT INTO application_status_history (application_id, previous_status, new_status, notes, changed_at) 
VALUES 
    (uuid_generate_v4(), NULL, 'submitted', 'Initial application submission', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW application_summary AS
SELECT 
    ja.id,
    ja.user_id,
    ja.job_id,
    ja.application_status,
    ja.submitted_at,
    ja.updated_at,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(ad.id) as document_count,
    COUNT(ai.id) as interview_count,
    MAX(ash.changed_at) as last_status_change
FROM job_applications ja
LEFT JOIN users u ON ja.user_id = u.id
LEFT JOIN application_documents ad ON ja.id = ad.application_id
LEFT JOIN application_interviews ai ON ja.id = ai.application_id
LEFT JOIN application_status_history ash ON ja.id = ash.application_id
GROUP BY ja.id, u.first_name, u.last_name, u.email;

-- Create view for application analytics
CREATE OR REPLACE VIEW application_metrics AS
SELECT 
    ja.job_id,
    ja.application_status,
    COUNT(*) as application_count,
    AVG(EXTRACT(EPOCH FROM (ja.updated_at - ja.submitted_at))/3600) as avg_processing_hours,
    COUNT(CASE WHEN ja.application_status IN ('offer_extended', 'hired') THEN 1 END) as successful_applications,
    COUNT(CASE WHEN ja.application_status = 'rejected' THEN 1 END) as rejected_applications
FROM job_applications ja
GROUP BY ja.job_id, ja.application_status;

-- Grant permissions (adjust as needed for your user)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO emirati_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO emirati_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO emirati_user;
