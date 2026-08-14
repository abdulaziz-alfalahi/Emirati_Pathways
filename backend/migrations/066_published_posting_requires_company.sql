-- 066: a published vacancy must belong to a company
--
-- WHY: every one of the 7 published job_postings on the platform has
-- company_id IS NULL, and all 9 job_applications ever submitted are against
-- them. A vacancy with no company can never appear in an employer's pipeline,
-- can never be listed under "employers attending" at an open day, and an
-- application to one goes nowhere — there is nobody on the other end.
--
-- Those 7 date from 29 June - 21 July 2026, before the company-verification
-- gate (issue #96) landed. The application layer now refuses: all three publish
-- routes were tested 2026-08-14 with a company-less recruiter and every one
-- refused, leaving the posting a draft.
--
-- So why a constraint at all? Because that rule is enforced in THREE separate
-- handlers (hr_job_posting_routes twice, recruiter/jd_routes_v2 once), and two
-- standalone scripts — backend/publish_jd.py and backend/publish_jd_manual.py —
-- set status = 'published' with no company check whatsoever. A fourth publish
-- path, or either script run against production, reopens it. The database is
-- the only place the rule cannot be forgotten.
--
-- NOT VALID, deliberately. It is the difference between protection now and
-- protection at cutover:
--   • existing rows are NOT scanned, so the 7 legacy postings are tolerated and
--     this migration applies cleanly to the live database TODAY
--   • every INSERT and UPDATE is checked from this moment, so nothing new can
--     be published without a company
-- After the production reset, when the legacy rows are gone, run:
--     ALTER TABLE job_postings VALIDATE CONSTRAINT job_postings_published_has_company;
-- which scans the table once and promotes it to a fully validated constraint.
-- Running VALIDATE before then will fail, loudly and harmlessly, listing the
-- offending row.
--
-- PRECONDITION (verified live 2026-08-14): job_postings holds 333 rows —
-- 7 published (all company_id NULL), 24 draft (23 NULL), 302
-- pending_verification (5 NULL). Only 'published' is constrained: a draft or a
-- pending import legitimately has no company yet, and blocking those would stop
-- the NAFIS vacancy import dead.

BEGIN;

ALTER TABLE job_postings
    DROP CONSTRAINT IF EXISTS job_postings_published_has_company;

ALTER TABLE job_postings
    ADD CONSTRAINT job_postings_published_has_company
    CHECK (status <> 'published' OR company_id IS NOT NULL)
    NOT VALID;

COMMENT ON CONSTRAINT job_postings_published_has_company ON job_postings IS
    'A published vacancy must name its company. NOT VALID until the production '
    'reset clears the 7 legacy company-less published rows; VALIDATE it then. '
    'Drafts and pending_verification imports are deliberately exempt.';

COMMIT;

-- Verification:
--   -- the 7 legacy rows survive untouched:
--   SELECT count(*) FROM job_postings WHERE status='published' AND company_id IS NULL;  -- 7
--   -- a NEW company-less publish is refused:
--   BEGIN;
--     INSERT INTO job_postings (title, description, status, company_id)
--     VALUES ('ZZ-probe', 'zz', 'published', NULL);
--   ROLLBACK;                                  -- must fail
--   -- promoting an existing draft is refused:
--   BEGIN;
--     UPDATE job_postings SET status='published'
--      WHERE status='draft' AND company_id IS NULL;
--   ROLLBACK;                                  -- must fail
--   -- a draft with no company is still fine:
--   BEGIN;
--     INSERT INTO job_postings (title, description, status, company_id)
--     VALUES ('ZZ-probe', 'zz', 'draft', NULL);
--   ROLLBACK;                                  -- must succeed
