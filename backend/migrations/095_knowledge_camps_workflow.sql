-- 095_knowledge_camps_workflow.sql
--
-- Owner request, 2026-08-29: make Knowledge Camps a one-stop shop where listing
-- and registration both happen, with stakeholders posting and an operator
-- reviewing. Design: docs/knowledge_camps_design.md
--
-- WHAT WAS THERE
--
-- Six seed rows written on 2026-05-04 by ensure_camps_table(), with invented
-- ratings (4.5-4.9), invented enrolment counts (45/60, 52/60) and invented
-- prices. The page summed the fabricated counts into a public "Students
-- Enrolled" figure, and its register button ran a Google search for the camp's
-- name. No registrations table existed and no endpoint could create a camp.
--
-- PRECONDITION, verified against dghr_prod on 2026-08-29:
--   * knowledge_camps holds exactly 6 rows, all created 2026-05-04, all seeds
--   * no table references knowledge_camps
--   * institutions(id INT) / institution_staff(user_id CHAR, institution_id INT)
--   * training_centers(id INT) / training_center_staff(user_id, training_center_id)
--
-- The seed block in ensure_camps_table() is removed in the same change. Deleting
-- the rows without that would simply re-insert them on the next request.

BEGIN;

-- ------------------------------------------------- keep what was there ------
CREATE TABLE IF NOT EXISTS _backup_knowledge_camps_095 AS
SELECT *, now() AS captured_at FROM knowledge_camps;

-- ------------------------------------------------------ the workflow --------
ALTER TABLE knowledge_camps
    ADD COLUMN IF NOT EXISTS status         VARCHAR(20) NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS created_by     CHAR(15),
    ADD COLUMN IF NOT EXISTS submitted_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by    CHAR(15),
    ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMPTZ,
    -- The operator's reason. Shown to the PROVIDER: a rejection they cannot
    -- read is a rejection they will repeat.
    ADD COLUMN IF NOT EXISTS review_note    TEXT,
    -- Which organisation is running it. Exactly one of these is set, and the
    -- submitter must be bound to it (institution_staff / training_center_staff).
    ADD COLUMN IF NOT EXISTS provider_institution_id     INTEGER REFERENCES institutions(id),
    ADD COLUMN IF NOT EXISTS provider_training_center_id INTEGER REFERENCES training_centers(id),
    -- The dates a camp actually has. career_services_routes has been selecting
    -- start_date/end_date since it was written — inside a bare `except:`, so it
    -- has silently returned an empty list to every parent. These are the names
    -- it already asks for.
    ADD COLUMN IF NOT EXISTS start_date     DATE,
    ADD COLUMN IF NOT EXISTS end_date       DATE,
    ADD COLUMN IF NOT EXISTS registration_closes_on DATE,
    ADD COLUMN IF NOT EXISTS contact_email  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS location_ar    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_camps_status_ck') THEN
        ALTER TABLE knowledge_camps ADD CONSTRAINT knowledge_camps_status_ck
            CHECK (status IN ('draft','submitted','published','rejected','archived'));
    END IF;
    -- A camp belongs to ONE organisation, or to none while an operator is
    -- entering a legacy record by hand. Never to both.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_camps_one_provider_ck') THEN
        ALTER TABLE knowledge_camps ADD CONSTRAINT knowledge_camps_one_provider_ck
            CHECK (NOT (provider_institution_id IS NOT NULL
                        AND provider_training_center_id IS NOT NULL));
    END IF;
END $$;

-- --------------------------------------- the numbers that were invented -----
-- `rating` had values between 4.5 and 4.9 and no rating system behind them.
-- `enrolled` is now a count of camp_registrations rows, not a stored number.
ALTER TABLE knowledge_camps
    DROP COLUMN IF EXISTS rating,
    DROP COLUMN IF EXISTS enrolled;

-- ------------------------------------------------------ registration --------
CREATE TABLE IF NOT EXISTS camp_registrations (
    id             SERIAL PRIMARY KEY,
    camp_id        INTEGER NOT NULL REFERENCES knowledge_camps(id) ON DELETE CASCADE,
    user_id        CHAR(15) NOT NULL,
    -- waitlisted rather than refused when a camp is full: demand the operator
    -- cannot see is demand the platform throws away.
    status         VARCHAR(20) NOT NULL DEFAULT 'registered'
                   CHECK (status IN ('registered','waitlisted','cancelled','attended')),
    registered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at   TIMESTAMPTZ,
    -- Consent for minors is a POLICY question the owner has not yet answered,
    -- so nothing here invents one. These two columns exist so the answer can be
    -- applied without another migration; see the design note.
    guardian_user_id  CHAR(15),
    minor_consent_at  TIMESTAMPTZ,
    note           TEXT,
    -- A double-click must not register somebody twice.
    UNIQUE (camp_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_camp_registrations_camp ON camp_registrations(camp_id);
CREATE INDEX IF NOT EXISTS idx_camp_registrations_user ON camp_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_camps_status  ON knowledge_camps(status);

-- ------------------------------------------- remove the fabricated rows -----
-- Every row in the table is a seed from 2026-05-04 carrying invented figures.
-- They describe six programmes that may not exist, to the public, with enrolment
-- numbers nobody counted. The page renders honestly empty until a provider
-- submits something and an operator publishes it.
DELETE FROM knowledge_camps
 WHERE id IN (SELECT id FROM _backup_knowledge_camps_095);

COMMIT;

-- ------------------------------------------------------------- verify -------
-- Expect 0 and 6:
--   SELECT count(*) FROM knowledge_camps;
--   SELECT count(*) FROM _backup_knowledge_camps_095;
--
-- Expect the workflow columns to exist and rating/enrolled to be gone:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'knowledge_camps' ORDER BY ordinal_position;
--
-- Expect the status constraint to reject anything else (rolled back):
--   BEGIN; INSERT INTO knowledge_camps (title, status) VALUES ('ZZ', 'nonsense'); ROLLBACK;
--
-- Restore, if ever needed — note rating/enrolled no longer exist as columns:
--   INSERT INTO knowledge_camps (id, title, title_ar, description, description_ar,
--          category, age_group, location, organizer, duration, price, capacity,
--          featured, is_active, created_at)
--   SELECT id, title, title_ar, description, description_ar, category, age_group,
--          location, organizer, duration, price, capacity, featured, is_active, created_at
--     FROM _backup_knowledge_camps_095;
