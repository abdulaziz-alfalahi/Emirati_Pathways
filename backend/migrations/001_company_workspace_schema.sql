-- ============================================================================
-- Multi-Tenant Company Workspace Schema Migration
-- Emirati Pathways Platform
-- Created: 2026-03-21
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Company Employees (Links recruited Emiratis to companies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active',           -- active, on_leave, terminated
    job_title VARCHAR(255),
    department VARCHAR(100),
    start_date DATE,
    end_date DATE,
    employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, intern, contract, part_time
    hired_via VARCHAR(50),                          -- platform, direct, referral
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_employees_company ON company_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_company_employees_user ON company_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_company_employees_status ON company_employees(status);

-- ============================================================================
-- 2. Company Resource Assignments (Trainings, Certs, Mentors, Coaches → Employee)
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_resource_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES company_employees(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    resource_type VARCHAR(50) NOT NULL,            -- training, certification, mentor, coach
    resource_id VARCHAR(255),                      -- FK to respective resource table (loosely typed)
    resource_name VARCHAR(255) NOT NULL,
    resource_description TEXT,
    status VARCHAR(50) DEFAULT 'assigned',         -- assigned, in_progress, completed, cancelled
    priority VARCHAR(20) DEFAULT 'normal',         -- low, normal, high, urgent
    due_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_assignments_company ON company_resource_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_employee ON company_resource_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_type ON company_resource_assignments(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_status ON company_resource_assignments(status);

-- ============================================================================
-- 3. Add workspace columns to companies table
-- ============================================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_slug VARCHAR(100);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_admin_id INTEGER REFERENCES users(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS provisioned_by INTEGER REFERENCES users(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS workspace_settings JSONB DEFAULT '{}';

-- Create unique index on slug only where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_workspace_slug 
    ON companies(workspace_slug) WHERE workspace_slug IS NOT NULL;

-- ============================================================================
-- 4. Add current_company_id to users for quick company context lookup
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_company_id UUID;
-- Note: Not adding FK constraint here since companies use UUID and this is optional

-- ============================================================================
-- 5. Verification queries
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE 'Created tables: company_employees, company_resource_assignments';
    RAISE NOTICE 'Altered tables: companies (workspace columns), users (current_company_id)';
END $$;
