-- Migration 033 — Consolidate the training catalogue into training_programs
--
-- WHY: `training_programs` is now the single canonical catalogue (migration 032 +
-- Phase 3). Provider-entered courses historically landed in a SEPARATE table
-- (`training_courses`), invisible to the candidate catalogue and the AI recommender
-- which read `training_programs`. This migration folds the remaining provider rows
-- into the canonical table and links rows to their center where the provider name
-- resolves to a training_centers record. Going forward, providers write directly
-- to training_programs (Phase 3 code repoint), so training_courses is frozen legacy
-- (kept, not dropped, for rollback).
--
-- PRECONDITION (verified live against dghr_prod on 2026-07-25):
--   * training_programs has 4 rows (INSEAD/PwC/Etisalat/42 Abu Dhabi), all published
--     via the 019 bridge; training_courses has 5 rows — 4 overlap by (title,provider),
--     1 does NOT: "Financial Analysis / CFA Institute" (status 'pending').
--   * training_programs.provider_id/status exist (migration 032).
--   * No training_centers rows exist yet, so the provider_id backfill is a safe no-op
--     now but will link any future name matches.
--
-- Idempotent: the copy inserts only rows absent by (LOWER(title),LOWER(provider));
-- re-running copies nothing. Backup-first before the copy.

BEGIN;

-- Snapshot the canonical catalogue before we add rows (rollback safety).
CREATE TABLE IF NOT EXISTS _backup_training_programs_033 AS TABLE training_programs;

-- Fold any training_courses row not already present into training_programs.
-- Map status: published->published, anything else (pending/active)->submitted.
INSERT INTO training_programs (title, title_ar, provider, category, status, active, created_at)
SELECT tc.name, tc.name_ar, tc.provider,
       COALESCE(NULLIF(tc.course_type, ''), 'General'),
       CASE WHEN tc.status = 'published' THEN 'published' ELSE 'submitted' END,
       (tc.status = 'published'),
       COALESCE(tc.created_at, NOW())
FROM training_courses tc
WHERE NOT EXISTS (
    SELECT 1 FROM training_programs tp
    WHERE LOWER(tp.title) = LOWER(tc.name)
      AND LOWER(COALESCE(tp.provider, '')) = LOWER(COALESCE(tc.provider, ''))
);

-- Link catalogue rows to their center where the provider name resolves to a
-- registered training center (case-insensitive). No-op until centers exist.
UPDATE training_programs tp
SET provider_id = c.id
FROM training_centers c
WHERE tp.provider_id IS NULL
  AND LOWER(TRIM(tp.provider)) = LOWER(TRIM(c.name));

COMMIT;

-- Verification (expected):
--   SELECT count(*) FROM training_programs;                       -- was 4, now 5
--   SELECT title, status FROM training_programs WHERE title = 'Financial Analysis'; -- submitted
--   SELECT count(*) FROM _backup_training_programs_033;           -- 4 (pre-copy snapshot)
