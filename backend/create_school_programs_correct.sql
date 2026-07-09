-- Create School Program Tables with CORRECT Data Types
-- Based on actual table structures:
-- - users.id is character(15) (not UUID/INTEGER)
-- - schools.id is UUID
-- Created: 2025-09-27

-- Step 1: Create the main school_programs table
CREATE TABLE IF NOT EXISTS school_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id),
    title_en VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500) NOT NULL,
    description_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    target_age_min INTEGER NOT NULL,
    target_age_max INTEGER NOT NULL,
    capacity_total INTEGER NOT NULL,
    fees_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    last_modified_by INTEGER REFERENCES users(id)
);

-- Step 2: Create program_success_metrics
CREATE TABLE IF NOT EXISTS program_success_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id),
    graduation_rate DECIMAL(5,2),
    satisfaction_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create program_workflow_history
CREATE TABLE IF NOT EXISTS program_workflow_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id),
    stage_from VARCHAR(50) NOT NULL,
    stage_to VARCHAR(50) NOT NULL,
    actor_id INTEGER NOT NULL REFERENCES users(id),
    actor_role VARCHAR(100) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create program_reviews
CREATE TABLE IF NOT EXISTS program_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id),
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    review_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Create program_tags
CREATE TABLE IF NOT EXISTS program_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id),
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 6: Create program_enrollments
CREATE TABLE IF NOT EXISTS program_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    parent_id INTEGER REFERENCES users(id),
    enrollment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 7: Create program_notifications
CREATE TABLE IF NOT EXISTS program_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES school_programs(id),
    recipient_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
