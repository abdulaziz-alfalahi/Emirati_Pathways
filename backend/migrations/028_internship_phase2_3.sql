-- Migration 028: Internship engagement Phase 2 (assessment + reporting) & Phase 3
-- (parent consent audit).
--
-- WHY: builds on migration 027 (the 3-way handshake). Phase 2 adds structured
-- assessment (who evaluated, mid vs final) on top of the existing
-- `internship_evaluations` table, plus a `internship_reports` table for the
-- student's periodic/final reports that recruiter + coordinator review. Phase 3
-- adds an append-only `internship_consent_audit` trail for every parent consent
-- decision (granted/denied), for accountability on minor placements.
--
-- PRECONDITION verified live 2026-07-24: internship_evaluations exists
-- (id, placement_id, evaluator_type, competencies jsonb, rating int, feedback text,
-- created_at) but has no evaluator_id / evaluation_type; internship_applications and
-- internship_placements exist (migration 027). users.id is char(15).
--
-- SAFETY: additive only (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS) —
-- safe to run repeatedly; no destructive statements, no backup required.

BEGIN;

-- ── Phase 2: assessment — enrich internship_evaluations ─────────────────────────────
ALTER TABLE internship_evaluations
    ADD COLUMN IF NOT EXISTS evaluator_id    CHAR(15),
    ADD COLUMN IF NOT EXISTS evaluation_type VARCHAR(20) DEFAULT 'final',  -- mid | final | academic
    ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP  DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_intern_eval_placement ON internship_evaluations (placement_id);

-- ── Phase 2: reporting — student periodic/final reports ─────────────────────────────
CREATE TABLE IF NOT EXISTS internship_reports (
    id               SERIAL PRIMARY KEY,
    application_id   INTEGER REFERENCES internship_applications(id),
    placement_id     INTEGER REFERENCES internship_placements(id),
    author_id        CHAR(15),
    author_role      VARCHAR(20) DEFAULT 'student',       -- student (may extend later)
    report_type      VARCHAR(20) DEFAULT 'periodic',      -- periodic | final
    period_label     VARCHAR(60) DEFAULT '',              -- e.g. 'Week 3', 'Month 1'
    title            VARCHAR(255) DEFAULT '',
    content          TEXT NOT NULL,
    status           VARCHAR(20) DEFAULT 'submitted',     -- submitted | reviewed
    reviewer_id      CHAR(15),
    reviewer_role    VARCHAR(20),
    reviewer_feedback TEXT,
    reviewed_at      TIMESTAMP,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intern_reports_application ON internship_reports (application_id);
CREATE INDEX IF NOT EXISTS idx_intern_reports_author      ON internship_reports (author_id);

-- ── Phase 3: parent consent audit — append-only trail ───────────────────────────────
CREATE TABLE IF NOT EXISTS internship_consent_audit (
    id             SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES internship_applications(id),
    actor_id       CHAR(15),                              -- the parent (or admin) who decided
    student_id     CHAR(15),
    decision       VARCHAR(20) NOT NULL,                  -- granted | denied
    reason         TEXT,
    created_at     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intern_consent_audit_application ON internship_consent_audit (application_id);

COMMIT;

-- Verification (expected):
--   SELECT column_name FROM information_schema.columns WHERE table_name='internship_evaluations'
--     AND column_name IN ('evaluator_id','evaluation_type');            -> 2 rows
--   SELECT to_regclass('public.internship_reports');                    -> internship_reports
--   SELECT to_regclass('public.internship_consent_audit');              -> internship_consent_audit
