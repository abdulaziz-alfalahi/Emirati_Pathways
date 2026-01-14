ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_roles TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS role_requests (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    requested_role VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    documents JSONB,
    admin_notes TEXT,
    reviewer_id INTEGER REFERENCES users(id) -- Optional
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_role_requests_user_id ON role_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_requests_status ON role_requests(status);
