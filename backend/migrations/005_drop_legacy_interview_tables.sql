-- 005_drop_legacy_interview_tables.sql
-- Interview consolidation, step 2 (run AFTER 004 and AFTER all code is repointed + verified).
--
-- Retires the two now-redundant, EMPTY interview tables that were consolidated into
-- interview_schedules:
--   * public.interviews          (was the HR blueprint's private store)
--   * public.interview_sessions  (was the live-session record store)
-- and the stray, empty qa-schema duplicates.
--
-- The AV child tables (interview_recordings, interview_participants) previously FK-referenced
-- interview_sessions(id) (a UUID). They now key on interview_schedules.interview_id (VARCHAR).
-- Both are empty, so we drop the FK and widen session_id to VARCHAR(100) in place. We do NOT
-- add a new FK to interview_schedules (the AV subsystem also has a divergent LiveKit/ORM
-- definition of interview_recordings; a hard FK would over-constrain it).
--
-- Idempotent and guarded so re-runs are safe.

-- 1. Break AV children off the retired interview_sessions.
DO $$
BEGIN
    -- interview_recordings.session_id -> VARCHAR, drop FK to interview_sessions
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name='interview_recordings') THEN
        EXECUTE (
            SELECT string_agg(format('ALTER TABLE public.interview_recordings DROP CONSTRAINT %I;', conname), ' ')
            FROM pg_constraint
            WHERE conrelid = 'public.interview_recordings'::regclass AND contype = 'f'
        );
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='interview_recordings'
                     AND column_name='session_id' AND data_type='uuid') THEN
            ALTER TABLE public.interview_recordings
                ALTER COLUMN session_id TYPE VARCHAR(100) USING session_id::text;
        END IF;
    END IF;

    -- interview_participants.session_id -> VARCHAR, drop FK to interview_sessions
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name='interview_participants') THEN
        EXECUTE (
            SELECT string_agg(format('ALTER TABLE public.interview_participants DROP CONSTRAINT %I;', conname), ' ')
            FROM pg_constraint
            WHERE conrelid = 'public.interview_participants'::regclass AND contype = 'f'
        );
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='public' AND table_name='interview_participants'
                     AND column_name='session_id' AND data_type='uuid') THEN
            ALTER TABLE public.interview_participants
                ALTER COLUMN session_id TYPE VARCHAR(100) USING session_id::text;
        END IF;
    END IF;
END $$;

-- 2. Drop the retired, empty tables. Guarded no-ops if already gone.
--    (Safety: only drop if the table is empty — a non-empty table means data landed after the
--    consolidation and we must NOT destroy it; the DO block raises to abort in that case.)
DO $$
DECLARE n bigint;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='interviews') THEN
        EXECUTE 'SELECT count(*) FROM public.interviews' INTO n;
        IF n > 0 THEN RAISE EXCEPTION 'public.interviews is not empty (% rows) — aborting drop', n; END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='interview_sessions') THEN
        EXECUTE 'SELECT count(*) FROM public.interview_sessions' INTO n;
        IF n > 0 THEN RAISE EXCEPTION 'public.interview_sessions is not empty (% rows) — aborting drop', n; END IF;
    END IF;
END $$;

DROP TABLE IF EXISTS public.interviews CASCADE;
DROP TABLE IF EXISTS public.interview_sessions CASCADE;

-- 3. Drop the stray, empty qa-schema duplicates (if the qa schema exists).
DROP TABLE IF EXISTS qa.interview_sessions CASCADE;
DROP TABLE IF EXISTS qa.interview_recordings CASCADE;
DROP TABLE IF EXISTS qa.interview_participants CASCADE;
