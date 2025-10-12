-- Recruiter Services: Video Interview core tables
-- Creates video_interview_sessions and interview_reports used by video_interview_system

-- Enable UUIDs if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS video_interview_sessions (
    id VARCHAR(64) PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES users(id),
    candidate_id UUID NOT NULL REFERENCES users(id),
    interview_type VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    room_id VARCHAR(64) NOT NULL,
    recording_id VARCHAR(128),
    ai_analysis_id VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vis_application_id ON video_interview_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_vis_interviewer_id ON video_interview_sessions(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_vis_candidate_id ON video_interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_vis_scheduled_time ON video_interview_sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_vis_status ON video_interview_sessions(status);

-- Report table used by generate_interview_report()
CREATE TABLE IF NOT EXISTS interview_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) UNIQUE NOT NULL REFERENCES video_interview_sessions(id) ON DELETE CASCADE,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
