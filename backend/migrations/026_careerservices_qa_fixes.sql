-- =============================================================================
-- 026 — Career-services column drift + QA assessor-bias tables (B10 / B17)
--
-- Two clusters were failing at runtime because the code and the live schema
-- had diverged. This migration adds the columns and tables the code has
-- always read/written, so the endpoints return real (empty) data instead of
-- 500. It fabricates no rows and drops nothing.
--
-- B10 — career_services_routes.py:
--   * create_internship / create_gig INSERT a `posted_by` owner column, and
--     get_my_postings filters `WHERE posted_by = %s`, but neither internships
--     nor gigs had the column -> 500 on POST /internships, POST /gigs and
--     GET /my-postings. We add posted_by (VARCHAR, matches the CHAR(15)
--     Emirates-ID user id) rather than dropping the feature's owner scoping.
--   * The educator approval workflow (get_pending_approvals,
--     approve_application, reject_application, get_child_applications) reads
--     and writes educator_status / educator_notes / educator_id on
--     internship_applications and gig_applications, none of which existed
--     -> 500. This is a distinct axis from the application's own `status`
--     (applied/accepted/rejected), so it gets its own additive columns rather
--     than overloading `status`. applicant_name / applicant_email are NOT
--     added — they are resolved by JOIN to users (the real source) in code,
--     never denormalised here.
--
-- B17 — quality_assurance_system.py:
--   * _store_bias_analysis and get_quality_dashboard read/write two tables
--     that never existed: assessor_bias_analysis and assessor_quality_scores
--     -> 500 on GET /api/qa/assessor/<id>/dashboard. We create them to match
--     the code's exact columns and ON CONFLICT targets. (The cp.gender / age /
--     education_level / years_experience drift in detect_assessment_bias is
--     fixed in code by dropping those non-existent SELECT dimensions; no
--     schema change is needed for that part.)
--
-- assessor_id is VARCHAR to match assessments.assessor_id and
-- quality_assurance_metrics.assessor_id (both character varying); the routes'
-- int path param is normalised to str in code.
--
-- PRECONDITION verified against the live DB (2026-07-24):
--   internships, gigs, internship_applications, gig_applications all exist and
--   lack posted_by / educator_* ; assessor_bias_analysis and
--   assessor_quality_scores do not exist (to_regclass -> NULL).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE TABLE/INDEX IF NOT EXISTS.
-- Safe to run repeatedly. No DROP. No data rows inserted.
-- =============================================================================

BEGIN;

-- ── B10: owner column for marketplace postings ──────────────────────────────
ALTER TABLE internships ADD COLUMN IF NOT EXISTS posted_by VARCHAR(64);
ALTER TABLE gigs        ADD COLUMN IF NOT EXISTS posted_by VARCHAR(64);

-- ── B10: educator approval workflow columns ─────────────────────────────────
ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS educator_status VARCHAR(32);
ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS educator_notes  TEXT;
ALTER TABLE internship_applications ADD COLUMN IF NOT EXISTS educator_id     VARCHAR(64);

ALTER TABLE gig_applications ADD COLUMN IF NOT EXISTS educator_status VARCHAR(32);
ALTER TABLE gig_applications ADD COLUMN IF NOT EXISTS educator_notes  TEXT;
ALTER TABLE gig_applications ADD COLUMN IF NOT EXISTS educator_id     VARCHAR(64);

-- ── B17: assessor bias analysis (one row per assessor + bias_type) ──────────
CREATE TABLE IF NOT EXISTS assessor_bias_analysis (
    id                        SERIAL PRIMARY KEY,
    assessor_id               VARCHAR(64) NOT NULL,
    bias_type                 VARCHAR(64) NOT NULL,
    detected                  BOOLEAN,
    severity_level            VARCHAR(32),
    statistical_significance  DOUBLE PRECISION,
    affected_groups           TEXT[],
    recommendations           JSONB,
    analysis_data             JSONB,
    analyzed_at               TIMESTAMP,
    CONSTRAINT uq_assessor_bias_analysis UNIQUE (assessor_id, bias_type)
);

-- ── B17: assessor overall quality/bias score (one row per assessor) ─────────
CREATE TABLE IF NOT EXISTS assessor_quality_scores (
    id                  SERIAL PRIMARY KEY,
    assessor_id         VARCHAR(64) NOT NULL,
    overall_bias_score  DOUBLE PRECISION,
    last_analyzed       TIMESTAMP,
    CONSTRAINT uq_assessor_quality_scores UNIQUE (assessor_id)
);

COMMIT;
