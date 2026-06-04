-- Notifications table for cross-persona event-driven notifications
-- G1: Offer lifecycle notifications (pending_approval, approved, sent, accepted, etc.)
-- Extensible for all canonical domain events

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,           -- offer_pending_approval, offer_approved, offer_sent, offer_accepted, etc.
    title VARCHAR(500) NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',           -- offer_id, job_id, company_name, candidate_name, etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Fast lookup: all notifications for a user, newest first
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- Fast count: unread notifications per user
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

DO $$
BEGIN
    RAISE NOTICE 'Notifications table migration complete';
END $$;
