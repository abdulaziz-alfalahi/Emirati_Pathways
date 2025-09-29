-- Minimal Test Schema for School Programs
-- Test one table at a time to identify the exact issue
-- Created: 2025-09-27

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Test 1: Create just the main school_programs table
CREATE TABLE IF NOT EXISTS school_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test 2: Add foreign key constraint separately
-- ALTER TABLE school_programs ADD CONSTRAINT fk_school_programs_school 
-- FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
