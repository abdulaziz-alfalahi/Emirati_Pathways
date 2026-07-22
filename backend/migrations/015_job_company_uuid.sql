-- =============================================================================
-- 015 — job_postings.company_id: text → uuid FK to companies(id) (issue #14)
--
-- job_postings.company_id was free text holding a MIX of formats — live DB
-- 2026-07-21: 3 rows with valid company uuids, 12 × 'company_default',
-- 9 × 'unknown', 2 × 'Test Dev Company' (matches no company), 2 × NULL.
-- The recruiter ownership join (job → company → hr_profile) therefore
-- returned 0 rows and recruiter matching could never surface candidates
-- (#9/#13 fixed the 500; this fixes the emptiness).
--
-- All job-creation code paths already write a real companies.id or NULL
-- (jd_routes_v2._normalize_company_id_for_storage, hr context lookups,
-- growth import). This migration cleans history, flips the type, and adds
-- the FK so a junk write now fails loudly instead of poisoning matching.
--
-- Backfill decision: values that are not a uuid of an existing company
-- become NULL — every one is a dev/test artifact with no resolvable
-- company (verified live; 'Test Dev Company' matches nothing by any
-- normalisation). Snapshot taken first.
--
-- ON DELETE SET NULL: deleting a company must not delete job history.
--
-- Idempotent: safe to run repeatedly.
-- =============================================================================

BEGIN;

-- Scoped to the public schema: the DB also carries stale qa/dev schema
-- clones (the DB_SCHEMA isolation mechanism); qa.job_postings has no
-- companies table to reference and no backend runs against it.

CREATE TABLE IF NOT EXISTS public._backup_job_company_015 AS
SELECT id, company_id FROM public.job_postings
WHERE company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id::text = public.job_postings.company_id);

UPDATE public.job_postings SET company_id = NULL
WHERE company_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id::text = public.job_postings.company_id);

DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'job_postings' AND column_name = 'company_id') <> 'uuid' THEN
        ALTER TABLE public.job_postings
            ALTER COLUMN company_id TYPE uuid USING company_id::uuid;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.job_postings'::regclass
          AND conname = 'job_postings_company_id_fkey'
    ) THEN
        ALTER TABLE public.job_postings
            ADD CONSTRAINT job_postings_company_id_fkey
            FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;

-- Verification:
--   SELECT data_type FROM information_schema.columns
--   WHERE table_name='job_postings' AND column_name='company_id';   -- uuid
--   SELECT conname FROM pg_constraint
--   WHERE conname='job_postings_company_id_fkey';                   -- 1 row
--   INSERT INTO job_postings (title, company_id) VALUES
--     ('x', gen_random_uuid());                                     -- must FAIL (FK)
--   SELECT count(*) FROM _backup_job_company_015;                   -- 23
