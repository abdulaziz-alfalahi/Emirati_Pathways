-- G20: Assessment Room — Interview Scorecards
-- Allows each panelist to submit individual scorecards per interview

CREATE TABLE IF NOT EXISTS interview_scorecards (
    id SERIAL PRIMARY KEY,
    interview_id VARCHAR(100) NOT NULL,
    panelist_id VARCHAR(100) NOT NULL,
    communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
    technical_score INTEGER CHECK (technical_score BETWEEN 1 AND 5),
    cultural_fit_score INTEGER CHECK (cultural_fit_score BETWEEN 1 AND 5),
    leadership_score INTEGER CHECK (leadership_score BETWEEN 1 AND 5),
    overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 5),
    notes TEXT,
    recommendation VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(interview_id, panelist_id)
);

-- Add guest_token column to interview_schedules for guest access links
ALTER TABLE interview_schedules ADD COLUMN IF NOT EXISTS guest_token VARCHAR(64) UNIQUE;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_scorecards_interview ON interview_scorecards(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_scorecards_panelist ON interview_scorecards(panelist_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_guest_token ON interview_schedules(guest_token);
