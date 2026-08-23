-- 083_scholarship_link_verification.sql
--
-- WHY
--
-- The scholarship directory points at programmes run by KHDA, MoHESR,
-- universities and foundations (owner decision 2026-08-23, docs/
-- scope_scholarship_scouting.md). Its entire value is that the links work: an
-- entry nobody has checked sends a candidate to a closed application, which is
-- worse than not listing it.
--
-- Phase 0 of that scope: give an entry somewhere to record what happened when
-- its link was last checked, and what KIND of link it is.
--
-- FOUR STATES, NOT TWO — this is the point of the migration
--
--     verified_ok   fetched, and it still looks like the programme
--     changed       fetched, but the page is not what it was
--     gone          fetched, and it is a 404 or says the programme has closed
--     unreachable   WE could not fetch it (proxy, TLS, timeout, rate limit)
--
-- Collapsing the last one into "expired" is the mistake this schema exists to
-- prevent. Measured live on 2026-08-23, the first source tried — KHDA, which
-- runs the AED 1.1bn Hamdan bin Mohammed programme — failed verification from
-- inside the container:
--
--     www.khda.gov.ae is configured correctly and serves a full chain, but it
--     302s to web.khda.gov.ae, which serves ONLY its leaf certificate. OpenSSL
--     reports "Verify return code: 21 (unable to verify the first
--     certificate)". Browsers and curl do not notice, because they follow the
--     certificate's Authority Information Access extension and fetch the
--     missing intermediate themselves; Python and OpenSSL do not.
--
-- So the site looks fine to every human who checks it and fails for our
-- fetcher. A checker with only "ok / expired" would have reported a false death
-- on the most important source in the directory and invited an operator to
-- archive a live government programme.
--
-- LINK TYPE
--
-- Not every application lives at a URL. The Hamdan bin Mohammed application
-- happens INSIDE the Dubai Now app: no server can test that link, and neither
-- can a link checker — only a person on a device can. Those entries are never
-- machine-checked and must never be silently marked good, so the type is
-- recorded and the checker refuses to judge anything that is not 'web'.
--
-- PRECONDITION, verified live 2026-08-23: `scholarships` exists with columns
-- id, title, provider_name, description, amount, coverage_type, deadline,
-- min_gpa, academic_level, eligible_majors, application_link, is_active,
-- created_at, institution_id — and none of the five columns added here.
--
-- Additive only: every column is nullable or defaulted, nothing is rewritten,
-- and an installation that already has them is unaffected.

BEGIN;

ALTER TABLE scholarships
    ADD COLUMN IF NOT EXISTS link_type          TEXT NOT NULL DEFAULT 'web',
    ADD COLUMN IF NOT EXISTS link_status        TEXT,
    ADD COLUMN IF NOT EXISTS link_status_detail TEXT,
    ADD COLUMN IF NOT EXISTS link_checked_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS link_fingerprint   TEXT;

-- Constrain the vocabularies. Migration 081 exists because two spellings of one
-- category were allowed to accumulate in a free-text column; there is no reason
-- to repeat that here when the sets are known and small.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scholarships_link_type_chk') THEN
        ALTER TABLE scholarships ADD CONSTRAINT scholarships_link_type_chk
            CHECK (link_type IN ('web', 'app', 'in_person'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scholarships_link_status_chk') THEN
        ALTER TABLE scholarships ADD CONSTRAINT scholarships_link_status_chk
            CHECK (link_status IS NULL OR link_status IN
                   ('verified_ok', 'changed', 'gone', 'unreachable'));
    END IF;
END $$;

COMMENT ON COLUMN scholarships.link_type IS
    'web = a URL a checker can fetch; app = a deep link only a person can test '
    '(the Hamdan bin Mohammed application lives in the Dubai Now app); '
    'in_person = no link to test. Only ''web'' is ever machine-checked.';

COMMENT ON COLUMN scholarships.link_status IS
    'Result of the last check. ''unreachable'' means WE could not fetch it and '
    'is NOT evidence the programme has ended — see migration 083''s header for '
    'the KHDA case that makes the distinction load-bearing. Only ''changed'' '
    'and ''gone'' belong in the operator''s queue.';

COMMENT ON COLUMN scholarships.link_fingerprint IS
    'Hash of the page''s visible text at the last successful check, for change '
    'detection. Script/style blocks and whitespace are stripped first so a CMS '
    'redeploy does not read as the programme changing.';

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. The five columns exist with the right defaults. Expect 5 rows,
--    link_type NOT NULL default 'web', the rest nullable.
--
--    SELECT column_name, data_type, is_nullable, column_default
--      FROM information_schema.columns
--     WHERE table_name = 'scholarships'
--       AND column_name IN ('link_type','link_status','link_status_detail',
--                           'link_checked_at','link_fingerprint')
--     ORDER BY column_name;
--
-- 2. Both constraints are present. Expect 2 rows.
--
--    SELECT conname FROM pg_constraint
--     WHERE conname IN ('scholarships_link_type_chk','scholarships_link_status_chk');
--
-- 3. The status vocabulary is enforced. Expect an error, then ROLLBACK.
--
--    BEGIN;
--      UPDATE scholarships SET link_status = 'expired';   -- must fail
--    ROLLBACK;
--
-- 4. Existing rows are untouched and default correctly.
--
--    SELECT link_type, COUNT(*) FROM scholarships GROUP BY 1;
