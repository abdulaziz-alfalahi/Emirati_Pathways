-- 096_remove_fabricated_education_listings.sql
--
-- Owner instruction, 2026-08-30: "Do the removal migration now."
--
-- WHY, AND WHY THIS ONE IS URGENT
--
-- Two more tables carry seed rows of the kind migration 095 removed from
-- knowledge_camps. These are worse, because the invented figures are attributed
-- to NAMED REAL INSTITUTIONS on a government platform.
--
-- graduate_programs — 6 rows, all written 2026-06-17 in one instant, with
-- invented tuition, an invented rating (4.5-4.9) from a rating system that does
-- not exist, and invented enrolment:
--
--   Mohammed Bin Rashid School of Government  MBA   AED 95,000  4.9  45/50
--   Khalifa University                        MSc   AED 78,000  4.8  60/70
--   American University of Sharjah            MSc   AED 72,000  4.7  35/45
--   UAE University                            MPA   AED 55,000  4.6  40/60
--   Masdar Institute - Khalifa University     PhD   "Fully Funded"   15/20
--   University of Sharjah                     LLM   AED 65,000  4.5  28/35
--
-- These are factual claims about third parties' fees and capacity. A wrong
-- tuition figure is the Council publishing incorrect financial information
-- about a named university, and "Fully Funded" is a claim a prospective student
-- would act on.
--
-- youth_programs — 6 rows, all written 2026-05-31, with invented participation
-- attributed to real federal bodies:
--
--   Ministry of Defence          National Service Career Track  1200/1200 "full"
--   Federal Youth Authority      Future Leaders Initiative       450/500
--   Ministry of Education        STEM Excellence Academy         320/400
--   Dubai Future Foundation / Dubai Culture / Khalifa Fund       ...
--
-- A fabricated national-service participation figure attributed to the Ministry
-- of Defence is the single worst item either table holds.
--
-- PRECONDITION, verified against dghr_prod on 2026-08-30:
--   * graduate_programs holds exactly 6 rows, one distinct created_at
--   * youth_programs   holds exactly 6 rows, one distinct created_at
--   * university_programs is EMPTY but its seeder would fill it on the next
--     request; that seeder is removed in the same change
--   * nothing references either table
--
-- Both pages render honestly empty afterwards, exactly as Knowledge Camps does
-- now. The seed blocks in ensure_grad_programs_table() and
-- ensure_youth_programs_table() are removed in the same commit — deleting rows
-- without that simply re-inserts them on the next request, which is the trap
-- migration 095 had to avoid for the camps.

BEGIN;

CREATE TABLE IF NOT EXISTS _backup_graduate_programs_096 AS
SELECT *, now() AS captured_at FROM graduate_programs;

CREATE TABLE IF NOT EXISTS _backup_youth_programs_096 AS
SELECT *, now() AS captured_at FROM youth_programs;

DELETE FROM graduate_programs
 WHERE id IN (SELECT id FROM _backup_graduate_programs_096);

DELETE FROM youth_programs
 WHERE id IN (SELECT id FROM _backup_youth_programs_096);

COMMIT;

-- ------------------------------------------------------------- verify -------
-- Expect 0 and 0:
--   SELECT count(*) FROM graduate_programs;
--   SELECT count(*) FROM youth_programs;
--
-- Expect 6 and 6:
--   SELECT count(*) FROM _backup_graduate_programs_096;
--   SELECT count(*) FROM _backup_youth_programs_096;
--
-- Expect no invented tuition to remain anywhere public:
--   SELECT count(*) FROM graduate_programs WHERE tuition IS NOT NULL;
--
-- Restore, if a curated directory later wants them as a STARTING POINT — they
-- must be checked against each institution before being shown again:
--   INSERT INTO graduate_programs SELECT (each column) FROM _backup_graduate_programs_096;
--   INSERT INTO youth_programs    SELECT (each column) FROM _backup_youth_programs_096;
