-- 022_workspace_phase2_tables.sql
-- Cluster B2 (end-to-end audit): backend/routes/workspace_phase2_routes.py is
-- registered at /api/workspace and drives the four Phase-2 workspace feature
-- sets (Emiratisation & Compliance, Document Generation & CSV Import,
-- Engagement Analytics & Mentor Reports, Branding & Resource Vault). Every one
-- of its handlers SELECTs/INSERTs into seven relations that were never created
-- on the live DB, so each endpoint 500'd with "relation ... does not exist".
--
-- WHY: build the feature (do not hide it). Creating the tables empty lets the
-- GET endpoints return real, empty payloads (200) and lets the POST/PUT/upload
-- handlers write, instead of erroring. Column names/types are taken verbatim
-- from the handlers' SQL so there is zero drift.
--
-- PRECONDITION (verified live 2026-07-24 via information_schema):
--   - workspace_emiratization_targets  : ABSENT
--   - workspace_document_templates      : ABSENT
--   - workspace_generated_documents     : ABSENT
--   - workspace_csv_uploads             : ABSENT
--   - workspace_engagement_events       : ABSENT
--   - workspace_mentor_reports          : ABSENT
--   - workspace_resource_vault          : ABSENT
--   - companies.id                      : uuid
--   - company_employees.id              : uuid
--   - company_resource_assignments.id   : uuid
--   - users.id                          : character(15)
--   - gen_random_uuid()                 : available
--
-- Idempotent and additive: CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT
-- EXISTS only. NO DROP. No fabricated seed rows.

BEGIN;

-- ─── Feature Set 1: Emiratisation & Compliance ──────────────────────────────
-- INSERT ...(company_id,year,quarter,target_percentage,mohre_deadline,
--   salary_support_amount,grant_projections,notes) ON CONFLICT(company_id,year,
--   quarter); UPDATE ...(actual_percentage,total_headcount,emirati_headcount,
--   salary_support_amount,compliance_status,notes,grant_projections,updated_at)
CREATE TABLE IF NOT EXISTS workspace_emiratization_targets (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    year                  INTEGER NOT NULL,
    quarter               INTEGER NOT NULL,
    target_percentage     NUMERIC,
    actual_percentage     NUMERIC,
    total_headcount       INTEGER,
    emirati_headcount     INTEGER,
    mohre_deadline        DATE,
    salary_support_amount NUMERIC,
    compliance_status     TEXT,
    grant_projections     JSONB NOT NULL DEFAULT '{}',
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, year, quarter)
);
CREATE INDEX IF NOT EXISTS idx_ws_emir_targets_company
    ON workspace_emiratization_targets (company_id);

-- ─── Feature Set 2: Document Generation ─────────────────────────────────────
-- company_id NULLABLE by design: SELECT ... WHERE company_id = %s
--   OR (is_default = TRUE AND company_id IS NULL) — global default templates.
-- INSERT ...(company_id,template_name,template_type,html_template,metadata,
--   created_by)
CREATE TABLE IF NOT EXISTS workspace_document_templates (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id     UUID REFERENCES companies(id) ON DELETE CASCADE,
    template_name  TEXT NOT NULL,
    template_type  TEXT NOT NULL DEFAULT 'custom',
    html_template  TEXT NOT NULL,
    metadata       JSONB NOT NULL DEFAULT '{}',
    is_default     BOOLEAN NOT NULL DEFAULT FALSE,
    created_by     CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ws_doc_templates_company
    ON workspace_document_templates (company_id);

-- INSERT ...(company_id,template_id,employee_id,document_type,document_data,
--   generated_by); history JOINs eu.id = gd.employee_id (users.id CHAR(15)).
CREATE TABLE IF NOT EXISTS workspace_generated_documents (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    template_id    UUID REFERENCES workspace_document_templates(id) ON DELETE SET NULL,
    employee_id    CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    document_type  TEXT,
    document_data  JSONB NOT NULL DEFAULT '{}',
    generated_by   CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ws_gen_docs_company
    ON workspace_generated_documents (company_id);

-- ─── Feature Set 2: CSV Import ──────────────────────────────────────────────
-- INSERT ...(company_id,upload_type,original_filename,file_path,column_mapping,
--   row_count,status,uploaded_by); later UPDATE sets success_count,error_count,
--   error_log,status,completed_at.
CREATE TABLE IF NOT EXISTS workspace_csv_uploads (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    upload_type       TEXT NOT NULL,
    original_filename TEXT,
    file_path         TEXT,
    column_mapping    JSONB NOT NULL DEFAULT '{}',
    row_count         INTEGER,
    success_count     INTEGER,
    error_count       INTEGER,
    error_log         JSONB,
    status            TEXT NOT NULL DEFAULT 'pending',
    completed_at      TIMESTAMPTZ,
    uploaded_by       CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ws_csv_uploads_company
    ON workspace_csv_uploads (company_id);

-- ─── Feature Set 3: Engagement Analytics ────────────────────────────────────
-- Read-only in this module: JOIN ... ee.employee_id = ce.user_id (users.id
-- CHAR(15)) AND ee.company_id = ce.company_id; grouped by DATE(ee.created_at).
-- event_type/event_data are the natural payload columns an emitter will write.
CREATE TABLE IF NOT EXISTS workspace_engagement_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id  CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    event_type   TEXT,
    event_data   JSONB NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ws_engagement_company_created
    ON workspace_engagement_events (company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ws_engagement_employee
    ON workspace_engagement_events (employee_id);

-- ─── Feature Set 3: Mentor Reports ──────────────────────────────────────────
-- INSERT ...(company_id,resource_assignment_id,employee_id,mentor_id,
--   report_type,summary,rating,strengths,areas_for_improvement,recommendations,
--   is_visible_to_employee); JOINs u.id=mr.mentor_id, eu.id=mr.employee_id.
CREATE TABLE IF NOT EXISTS workspace_mentor_reports (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id             UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    resource_assignment_id UUID REFERENCES company_resource_assignments(id) ON DELETE SET NULL,
    employee_id            CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    mentor_id              CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    report_type            TEXT NOT NULL DEFAULT 'progress',
    summary                TEXT NOT NULL,
    rating                 NUMERIC,
    strengths              JSONB NOT NULL DEFAULT '[]',
    areas_for_improvement  JSONB NOT NULL DEFAULT '[]',
    recommendations        TEXT,
    is_visible_to_employee BOOLEAN NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ws_mentor_reports_company
    ON workspace_mentor_reports (company_id);
CREATE INDEX IF NOT EXISTS idx_ws_mentor_reports_employee
    ON workspace_mentor_reports (employee_id);

-- ─── Feature Set 4: Resource Vault ──────────────────────────────────────────
-- INSERT ...(company_id,file_name,file_type,file_size_bytes,file_path,category,
--   description,is_public,tags,uploaded_by); listing filters by rv.category.
CREATE TABLE IF NOT EXISTS workspace_resource_vault (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    file_name       TEXT,
    file_type       TEXT,
    file_size_bytes BIGINT,
    file_path       TEXT,
    category        TEXT,
    description     TEXT,
    is_public       BOOLEAN NOT NULL DEFAULT FALSE,
    tags            JSONB NOT NULL DEFAULT '[]',
    uploaded_by     CHAR(15) REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ws_resource_vault_company
    ON workspace_resource_vault (company_id);

COMMIT;

-- VERIFICATION:
--   SELECT COUNT(*) FROM workspace_emiratization_targets;  -- 0
--   SELECT COUNT(*) FROM workspace_document_templates;     -- 0
--   SELECT COUNT(*) FROM workspace_generated_documents;    -- 0
--   SELECT COUNT(*) FROM workspace_csv_uploads;            -- 0
--   SELECT COUNT(*) FROM workspace_engagement_events;      -- 0
--   SELECT COUNT(*) FROM workspace_mentor_reports;         -- 0
--   SELECT COUNT(*) FROM workspace_resource_vault;         -- 0
