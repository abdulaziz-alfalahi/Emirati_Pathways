-- Migration 032 — Training-center entity + canonical-catalogue foundation
--
-- WHY: The "professional_dev_operator ↔ training center ↔ programs ↔ AI" pipeline
-- was fragmented (owner review 2026-07-25). Training providers self-claimed a role
-- with no vetting, listed courses into `training_courses`, while the AI recommender
-- and candidate catalogue read a DIFFERENT table (`training_programs`) — so listed
-- courses were invisible to candidates and the AI. Owner decision: mirror the
-- advisor/institution model — the Professional Dev Operator creates & vets training
-- centers and binds their representatives; `training_programs` becomes the single
-- canonical catalogue with a provider FK and an approval lifecycle.
--
-- This migration is the FOUNDATION (additive only, no data copy — that is 033):
--   * training_centers        — the vetted entity (like `institutions`)
--   * training_center_staff    — representative bindings (like `institution_staff`)
--   * training_programs.+cols  — provider_id FK, status lifecycle, created_by,
--                                description, approved_by
--
-- PRECONDITION (verified live against dghr_prod on 2026-07-25):
--   * to_regclass('training_centers') / ('training_center_staff') -> NULL (absent)
--   * training_programs lacks provider_id/status/created_by/description/approved_by
--   * training_programs has 4 seeded rows (all currently public) — they are
--     backfilled to status='published' so nothing disappears from the catalogue.
--
-- Idempotent (IF NOT EXISTS throughout). No destructive statements; the existing
-- training_programs rows are only column-backfilled, so no backup table is needed.

BEGIN;

-- The vetted training-center entity. Operator-created, so it starts 'approved'.
CREATE TABLE IF NOT EXISTS training_centers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    name_ar         VARCHAR(255),
    accreditations  JSONB,
    specializations JSONB,
    website         VARCHAR(255),
    emirate         VARCHAR(50),
    status          VARCHAR(20) NOT NULL DEFAULT 'approved',  -- approved | suspended
    created_by      CHAR(15),
    approved_by     CHAR(15),
    created_at      TIMESTAMP DEFAULT NOW()
);
-- Case-insensitive name uniqueness so a center never forks into two rows
-- (never match/onboard a center by raw name string — resolve to this id).
CREATE UNIQUE INDEX IF NOT EXISTS ux_training_centers_name_ci ON training_centers (LOWER(name));

-- Representative bindings (mirror institution_staff). Binding also grants the
-- 'training_provider' role at the application layer.
CREATE TABLE IF NOT EXISTS training_center_staff (
    id                 SERIAL PRIMARY KEY,
    user_id            CHAR(15) NOT NULL,
    training_center_id INTEGER  NOT NULL REFERENCES training_centers(id) ON DELETE CASCADE,
    staff_role         VARCHAR(30) NOT NULL DEFAULT 'representative',
    status             VARCHAR(20) NOT NULL DEFAULT 'active',
    created_by         CHAR(15),
    created_at         TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, training_center_id, staff_role)
);
CREATE INDEX IF NOT EXISTS idx_training_center_staff_user ON training_center_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_training_center_staff_ctr  ON training_center_staff(training_center_id);

-- Canonical catalogue: bind each program to its center + give it an approval
-- lifecycle. status DEFAULT 'published' backfills the existing rows so they stay
-- visible; provider submissions set status='submitted' explicitly (033/Phase 2).
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS provider_id INTEGER REFERENCES training_centers(id);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS created_by CHAR(15);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS approved_by CHAR(15);
CREATE INDEX IF NOT EXISTS idx_training_programs_provider ON training_programs(provider_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_status ON training_programs(status);

-- Any pre-existing rows with a NULL status (shouldn't happen with the default,
-- but guard the case) are treated as already-public catalogue entries.
UPDATE training_programs SET status = 'published' WHERE status IS NULL;

COMMIT;

-- Verification (expected):
--   SELECT to_regclass('training_centers'), to_regclass('training_center_staff'); -- both non-NULL
--   SELECT column_name FROM information_schema.columns WHERE table_name='training_programs'
--     AND column_name IN ('provider_id','status','created_by','description','approved_by'); -- 5 rows
--   SELECT DISTINCT status FROM training_programs;  -- 'published'
