-- Minimal job application tables compatible with existing users (INTEGER IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id VARCHAR(100) NOT NULL,
  application_status VARCHAR(50) DEFAULT 'submitted' CHECK (
    application_status IN ('submitted','under_review','interview_scheduled','interview_completed','offer_extended','offer_accepted','offer_declined','rejected','withdrawn','hired')
  ),
  cover_letter TEXT NOT NULL,
  expected_salary DECIMAL(12,2),
  expected_salary_currency VARCHAR(3) DEFAULT 'AED',
  availability_date DATE,
  notice_period_days INTEGER DEFAULT 30,
  willing_to_relocate BOOLEAN DEFAULT FALSE,
  visa_status VARCHAR(50),
  additional_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by INTEGER REFERENCES users(id),
  CONSTRAINT unique_user_job_application UNIQUE(user_id, job_id)
);

CREATE TABLE IF NOT EXISTS application_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (
    document_type IN ('resume','cv','cover_letter','portfolio','certificate','transcript','reference_letter','work_sample','other')
  ),
  file_name VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  is_required BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS application_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  status_reason VARCHAR(200),
  notes TEXT,
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS application_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  interview_type VARCHAR(50) NOT NULL CHECK (
    interview_type IN ('phone_screening','video_interview','technical_interview','panel_interview','final_interview','assessment_center')
  ),
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(500),
  meeting_link VARCHAR(500),
  interviewer_name VARCHAR(200),
  interviewer_email VARCHAR(255),
  interviewer_phone VARCHAR(20),
  preparation_notes TEXT,
  interview_status VARCHAR(30) DEFAULT 'scheduled' CHECK (
    interview_status IN ('scheduled','confirmed','completed','cancelled','rescheduled')
  ),
  feedback TEXT,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL CHECK (
    feedback_type IN ('screening','interview','assessment','final_decision')
  ),
  feedback_text TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  recommendations TEXT,
  provided_by INTEGER NOT NULL REFERENCES users(id),
  provided_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_shared_with_candidate BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS application_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (
    notification_type IN ('application_received','status_update','interview_scheduled','interview_reminder','offer_extended','application_rejected')
  ),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_via_email BOOLEAN DEFAULT FALSE,
  sent_via_sms BOOLEAN DEFAULT FALSE,
  sent_via_push BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS application_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4),
  metric_text VARCHAR(500),
  recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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