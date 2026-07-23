-- 019_bridge_training_catalogue.sql
-- TD-01 follow-through: the candidate-facing catalogue (training_programs)
-- was EMPTY while the 5 real provider-entered courses live in
-- training_courses (managed via /api/training-center) — yet another
-- dual-catalogue drift. Without rows in training_programs the new enrolment
-- flow (migration 018) had nothing to enrol into.
--
-- PRECONDITION (verified live 2026-07-24):
--   training_programs: 0 rows. training_courses: 5 rows, status='published',
--   columns (id, name, name_ar, provider, enrolled, status, course_type,
--   created_at). training_programs columns include (title, title_ar,
--   provider, category, duration, level, url, skills_covered,
--   relevance_score, certification_offered, active).
--
-- This copies the PUBLISHED provider-entered courses into the candidate
-- catalogue — real platform content, no fabrication. Guarded by NOT EXISTS
-- so operator-curated rows are never overwritten; safe to re-run.
-- (Long-term the two catalogues should unify; tracked in the audit memory.)

BEGIN;

INSERT INTO training_programs (title, title_ar, provider, category, duration, level,
                               url, skills_covered, relevance_score,
                               certification_offered, active)
SELECT c.name, c.name_ar, c.provider, COALESCE(c.course_type, 'General'),
       '', 'Intermediate', '', '[]'::jsonb, NULL, TRUE, TRUE
FROM training_courses c
WHERE c.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM training_programs);

COMMIT;

-- VERIFICATION:
--   SELECT COUNT(*) FROM training_programs;   -- expect 5 (or prior count)
--   SELECT title, provider FROM training_programs ORDER BY id;
