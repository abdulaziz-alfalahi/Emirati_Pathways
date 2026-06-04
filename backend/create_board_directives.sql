-- Migration: Create Board Directives and Responses
-- Purpose: Enable bidirectional communication between EHDC Board Members and Admin Team
-- Created: 2026-05-31

CREATE TABLE IF NOT EXISTS board_directives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id VARCHAR(50) REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  body TEXT,
  category VARCHAR(50) NOT NULL, -- strategic_priority, data_request, improvement_suggestion, policy_direction
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  status VARCHAR(30) DEFAULT 'open', -- open, in_progress, resolved, deferred
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_directive_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directive_id UUID REFERENCES board_directives(id),
  responder_id VARCHAR(50) REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_board_directives_status ON board_directives(status);
CREATE INDEX IF NOT EXISTS idx_board_directives_author ON board_directives(author_id);
CREATE INDEX IF NOT EXISTS idx_board_directive_responses_directive ON board_directive_responses(directive_id);
