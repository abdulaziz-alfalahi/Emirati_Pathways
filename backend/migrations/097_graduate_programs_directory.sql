-- 097_graduate_programs_directory.sql
--
-- Owner, 2026-08-30: "take graduate programs next. I need you to cover the full
-- workflow and the involved personas." Design: docs/graduate_programs_design.md
--
-- WHY THIS SHAPE
--
-- Migration 096 removed six rows that attributed invented tuition, invented
-- enrolment and a non-existent rating to six named real universities. What
-- replaces them has to make that class of claim impossible rather than merely
-- absent: every published programme carries a SOURCE LINK and a DATE ITS
-- DETAILS WERE CHECKED, and figures are attributed to the institution rather
-- than asserted by the platform.
--
-- The columns mirror `scholarships`, which already is a curated directory with
-- verified links — application_link, link_type, link_status, link_status_detail,
-- link_checked_at, link_fingerprint — fed by a scout the operator reviews and
-- re-verified nightly by emirati-link-check. Graduate programmes join that
-- machinery instead of starting a third pattern.
--
-- Camps (migration 095) are submitted by schools and centres who will actually
-- log in. Nobody at Khalifa University is going to log in and post an MSc, so
-- the primary path here is CURATION, with institutional submission secondary.
--
-- PRECONDITION, verified against dghr_prod on 2026-08-30:
--   * graduate_programs is EMPTY (migration 096), so no row needs backfilling
--     into the new required fields
--   * its seeder is removed, so nothing will refill it
--   * scholarships carries the link-verification columns being mirrored here
--   * institutions(id INT) / institution_staff(user_id CHAR, institution_id INT)

BEGIN;

-- --------------------------------------------------- the workflow ----------
ALTER TABLE graduate_programs
    ADD COLUMN IF NOT EXISTS status       VARCHAR(20) NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS created_by   CHAR(15),
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by  CHAR(15),
    ADD COLUMN IF NOT EXISTS reviewed_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_note  TEXT,
    ADD COLUMN IF NOT EXISTS provider_institution_id INTEGER REFERENCES institutions(id),
    ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now(),
    -- The two fields that make a listing accountable. Publishing without them
    -- is refused; see the API and its tests.
    ADD COLUMN IF NOT EXISTS application_link      TEXT,
    ADD COLUMN IF NOT EXISTS details_checked_on    DATE,
    ADD COLUMN IF NOT EXISTS application_deadline  DATE,
    ADD COLUMN IF NOT EXISTS source_note           TEXT,
    -- Mirrors scholarships exactly, so verify_links.py can treat both alike.
    ADD COLUMN IF NOT EXISTS link_type          VARCHAR(30),
    ADD COLUMN IF NOT EXISTS link_status        VARCHAR(30),
    ADD COLUMN IF NOT EXISTS link_status_detail TEXT,
    ADD COLUMN IF NOT EXISTS link_checked_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS link_fingerprint   TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'graduate_programs_status_ck') THEN
        ALTER TABLE graduate_programs ADD CONSTRAINT graduate_programs_status_ck
            CHECK (status IN ('draft','submitted','published','rejected','archived'));
    END IF;
    -- The rule the removed rows broke, made structural: a PUBLISHED programme
    -- must say where its details came from and when they were last checked.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'graduate_programs_sourced_ck') THEN
        ALTER TABLE graduate_programs ADD CONSTRAINT graduate_programs_sourced_ck
            CHECK (status <> 'published'
                   OR (application_link IS NOT NULL AND details_checked_on IS NOT NULL));
    END IF;
END $$;

-- ------------------------------------- numbers the platform cannot know -----
-- `rating` came from no rating system. `enrolled` and `capacity` are the
-- university's own figures, and the removed rows carried invented ones (60/70,
-- 45/50). Nothing here can learn them, so nothing here stores them.
ALTER TABLE graduate_programs
    DROP COLUMN IF EXISTS rating,
    DROP COLUMN IF EXISTS enrolled,
    DROP COLUMN IF EXISTS capacity;

-- --------------------------------------------- the candidate's journey -----
-- Named `interest`, not `applications`. The platform records what a person told
-- us; it does not process an application, and a table called `applications`
-- would invite the next reader to build a submit button that cannot exist.
CREATE TABLE IF NOT EXISTS graduate_program_interest (
    id          SERIAL PRIMARY KEY,
    program_id  INTEGER NOT NULL REFERENCES graduate_programs(id) ON DELETE CASCADE,
    user_id     CHAR(15) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'interested'
                CHECK (status IN ('interested','applying','admitted','declined','withdrawn')),
    note        TEXT,
    noted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (program_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_grad_interest_user    ON graduate_program_interest(user_id);
CREATE INDEX IF NOT EXISTS idx_grad_interest_program ON graduate_program_interest(program_id);
CREATE INDEX IF NOT EXISTS idx_grad_programs_status  ON graduate_programs(status);

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 0 (096 emptied it and the seeder is gone):
--   SELECT count(*) FROM graduate_programs;
--
-- Expect rating/enrolled/capacity absent and the new columns present:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'graduate_programs' ORDER BY ordinal_position;
--
-- Expect BOTH to be rejected (run inside a transaction and roll back):
--   INSERT INTO graduate_programs (title, status) VALUES ('ZZ', 'nonsense');
--   INSERT INTO graduate_programs (title, status) VALUES ('ZZ', 'published');
-- and this one to be accepted:
--   INSERT INTO graduate_programs (title, status, application_link, details_checked_on)
--   VALUES ('ZZ', 'published', 'https://example.ac.ae/msc', CURRENT_DATE);
