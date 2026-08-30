-- 100_one_youth_programme_directory.sql
--
-- Owner, 2026-08-30: "take youth development next."
--
-- THE PARALLEL PAIR, AGAIN
--
--   knowledge_camps      migration 095 — provider submits, Education Operator
--                        publishes, people register with a waitlist, capacity
--                        decided under a row lock. 0 rows.
--   youth_programs       one read endpoint, `SELECT * ... ORDER BY enrolled
--                        DESC`, no workflow, no registration. 0 rows since
--                        migration 096 removed its six seeded entries.
--
-- A youth programme and a knowledge camp are the same object: a youth-oriented
-- programme, run by an organisation, with an age range, dates, a capacity and
-- people who want a place. The rows migration 096 deleted make the point —
-- "Youth Innovation Bootcamp" (Dubai Future Foundation) and "STEM Excellence
-- Academy" (Ministry of Education) are camps in all but name, and they carried
-- invented enrolment the read endpoint then sorted by.
--
-- Keeping both would give the platform a THIRD programme table with its own
-- workflow, review queue and registration — after folding university programmes
-- into academic_programs this morning for exactly that reason.
--
-- THE RENAME, AND WHY IT IS DONE PROPERLY THIS TIME
--
-- A table called knowledge_camps serving the Youth Development page is the
-- naming lie criticised in migration 098's header, so the table takes the name
-- that fits both: youth_programs.
--
-- Migration 098 renamed a table and left seventeen constraints, three indexes
-- and two sequences carrying the old name, needing migration 099 to clean up.
-- That lesson is applied INLINE here: the renames happen in this migration, not
-- the next one.
--
-- `stream` is what lets one table serve two pages, exactly as `level` does for
-- academic_programs: Knowledge Camps shows 'camp', Youth Development shows
-- 'development'. One directory, one review queue, one registration mechanism.
--
-- PRECONDITION, verified on dghr_prod 2026-08-30:
--   * knowledge_camps 0 rows, camp_registrations 0 rows, youth_programs 0 rows
--   * camp_registrations is the ONLY foreign key onto either table
--   * youth_programs is read by exactly one endpoint,
--     GET /api/education/content/youth-programs, retired in the same commit

BEGIN;

-- ------------------------------- the vestigial table goes first ------------
-- Empty, seeded-only, and its name is needed. Nothing references it.
DROP TABLE IF EXISTS youth_programs;

-- ------------------------------------------------- one directory -----------
ALTER TABLE knowledge_camps      RENAME TO youth_programs;
ALTER TABLE camp_registrations   RENAME TO youth_program_registrations;

ALTER TABLE youth_programs
    ADD COLUMN IF NOT EXISTS stream VARCHAR(20) NOT NULL DEFAULT 'camp';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'youth_programs_stream_ck') THEN
        ALTER TABLE youth_programs ADD CONSTRAINT youth_programs_stream_ck
            CHECK (stream IN ('camp', 'development'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_youth_programs_stream ON youth_programs(stream);

-- --------------------- the 099 lesson, applied in the same migration -------
-- Postgres renames the table and nothing else. Left alone, youth_programs would
-- wear knowledge_camps_status_ck and camp_registrations_pkey for ever.
DO $$
DECLARE
    r RECORD;
    new_name TEXT;
BEGIN
    FOR r IN
        SELECT c.conname, c.conrelid::regclass::text AS tbl
          FROM pg_constraint c
         WHERE c.conrelid IN ('youth_programs'::regclass,
                              'youth_program_registrations'::regclass)
           AND (c.conname LIKE 'knowledge\_camps%' OR c.conname LIKE 'camp\_registrations%')
    LOOP
        new_name := replace(replace(r.conname, 'knowledge_camps', 'youth_programs'),
                            'camp_registrations', 'youth_program_registrations');
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = new_name) THEN
            EXECUTE format('ALTER TABLE %s RENAME CONSTRAINT %I TO %I',
                           r.tbl, r.conname, new_name);
        END IF;
    END LOOP;

    FOR r IN
        SELECT indexname FROM pg_indexes
         WHERE schemaname = 'public'
           AND (indexname LIKE 'knowledge\_camps%' OR indexname LIKE '%camp\_registrations%'
                OR indexname LIKE 'idx\_knowledge\_camps%')
    LOOP
        EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname,
                       replace(replace(r.indexname, 'knowledge_camps', 'youth_programs'),
                               'camp_registrations', 'youth_program_registrations'));
    END LOOP;

    FOR r IN
        SELECT sequencename FROM pg_sequences
         WHERE schemaname = 'public'
           AND (sequencename LIKE 'knowledge\_camps%' OR sequencename LIKE 'camp\_registrations%')
    LOOP
        EXECUTE format('ALTER SEQUENCE %I RENAME TO %I', r.sequencename,
                       replace(replace(r.sequencename, 'knowledge_camps', 'youth_programs'),
                               'camp_registrations', 'youth_program_registrations'));
    END LOOP;
END $$;

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect youth_programs and youth_program_registrations, and neither old name:
--   SELECT table_name FROM information_schema.tables WHERE table_schema='public'
--    AND table_name IN ('youth_programs','youth_program_registrations',
--                       'knowledge_camps','camp_registrations');
--
-- Expect NO stale names (this is what 098 forgot and 099 had to repair):
--   SELECT conname FROM pg_constraint
--    WHERE conrelid IN ('youth_programs'::regclass,'youth_program_registrations'::regclass)
--      AND (conname LIKE 'knowledge%' OR conname LIKE 'camp%');
--   SELECT indexname FROM pg_indexes WHERE indexname LIKE '%knowledge_camps%'
--                                       OR indexname LIKE '%camp_registrations%';
--
-- Expect the stream constraint to bite (run and roll back):
--   INSERT INTO youth_programs (title, stream) VALUES ('ZZ','other');   -- rejected
--   INSERT INTO youth_programs (title, stream) VALUES ('ZZ','development'); -- accepted
--
-- Expect migration 095's status rule to have survived the rename:
--   INSERT INTO youth_programs (title, status) VALUES ('ZZ','nonsense'); -- rejected
