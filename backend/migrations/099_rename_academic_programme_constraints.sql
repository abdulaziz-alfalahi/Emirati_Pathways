-- 099_rename_academic_programme_constraints.sql
--
-- Migration 098 renamed graduate_programs to academic_programs. Postgres renames
-- the TABLE and leaves every constraint, index and sequence carrying the old
-- name, so the directory now looks like this:
--
--   academic_programs
--     academic_programs_level_ck          <- added by 098
--     graduate_programs_pkey
--     graduate_programs_sourced_ck        <- the rule that matters most here
--     graduate_programs_status_ck
--     graduate_programs_provider_institution_id_fkey
--     ...
--
-- Harmless to Postgres and misleading to people. A constraint named for a table
-- that no longer exists is exactly the drift this week has been spent removing —
-- the same shape as a role called growth_operator_company on a platform whose
-- role is employer_relations. Somebody searching for why a publish was refused
-- will grep `academic_programs_sourced_ck` and find nothing.
--
-- Caught by a test asserting the new name, which is why the test was written to
-- expect the name the schema OUGHT to have rather than the one it happened to
-- have.
--
-- PRECONDITION, verified on dghr_prod 2026-08-30: the constraints below exist
-- under their old names on academic_programs / academic_program_interest.
-- Idempotent: each rename is guarded on the old name still being present.

BEGIN;

DO $$
DECLARE
    r RECORD;
    new_name TEXT;
BEGIN
    FOR r IN
        SELECT c.conname, c.conrelid::regclass::text AS tbl
          FROM pg_constraint c
         WHERE c.conrelid IN ('academic_programs'::regclass,
                              'academic_program_interest'::regclass)
           AND c.conname LIKE 'graduate\_program%'
    LOOP
        new_name := replace(r.conname, 'graduate_program', 'academic_program');
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = new_name) THEN
            EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I',
                           r.tbl, r.conname, new_name);
        END IF;
    END LOOP;
END $$;

-- Indexes and sequences carry the old name too, for the same reason.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT indexname FROM pg_indexes
         WHERE schemaname = 'public' AND indexname LIKE 'graduate\_program%'
    LOOP
        EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname,
                       replace(r.indexname, 'graduate_program', 'academic_program'));
    END LOOP;

    FOR r IN
        SELECT sequencename FROM pg_sequences
         WHERE schemaname = 'public' AND sequencename LIKE 'graduate\_program%'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I RENAME TO %I', r.sequencename,
                       replace(r.sequencename, 'graduate_program', 'academic_program'));
    END LOOP;
END $$;

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect no rows:
--   SELECT conname FROM pg_constraint
--    WHERE conrelid IN ('academic_programs'::regclass,
--                       'academic_program_interest'::regclass)
--      AND conname LIKE 'graduate%';
--   SELECT indexname FROM pg_indexes WHERE indexname LIKE 'graduate_program%';
--   SELECT sequencename FROM pg_sequences WHERE sequencename LIKE 'graduate_program%';
--
-- Expect the sourced rule still to bite, now under its proper name:
--   INSERT INTO academic_programs (title, university, status)
--   VALUES ('ZZ','ZZ','published');   -- violates academic_programs_sourced_ck
