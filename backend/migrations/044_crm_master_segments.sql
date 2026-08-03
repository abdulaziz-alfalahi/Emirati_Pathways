-- 044: Career Services CRM — segment membership, roster fields, weekly history
--
-- WHY: the CRM team tracks Dubai job seekers in "Main Master File" Excel
-- workbooks (latest: 27 July '26 — 3,418 candidates). The workbook carries
-- segment membership (Active / 1st-3rd Priority / Hatta / CDA / Special
-- Request / GDO / No Answer / Prev+Never Employed 21-24), roster fields the
-- platform never stored (CV status, looking status, call date, source,
-- EHRDC reference), and a weekly/monthly added-removed series driving their
-- dashboards. The owner is onboarding the CRM team to work directly on the
-- Career Services Operator dashboard instead of Excel, so the platform must
-- hold this data.
--
-- PRECONDITION (verified live 2026-08-03): candidate_profiles exists with
-- CRM columns call_status/work_status/job_seeker_type/counseling_remarks/
-- assigned_to; NONE of the columns added below exist yet (checked
-- information_schema: crm_segments/cv_status/looking_status/date_of_call
-- count = 0); crm_roster_history does not exist. users.id = real Emirates ID
-- for roster candidates (4,078/4,091 users have id = emirates_id_enc).
-- If a column already exists elsewhere, ADD COLUMN IF NOT EXISTS makes this
-- file a no-op for it.
--
-- Purely additive — no destructive statements, no backup table needed.

BEGIN;

ALTER TABLE candidate_profiles
    ADD COLUMN IF NOT EXISTS crm_segments        jsonb        DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS crm_reference       varchar(30),
    ADD COLUMN IF NOT EXISTS cv_status           varchar(80),
    ADD COLUMN IF NOT EXISTS looking_status      varchar(50),
    ADD COLUMN IF NOT EXISTS date_of_call        date,
    ADD COLUMN IF NOT EXISTS candidates_source   varchar(80),
    ADD COLUMN IF NOT EXISTS education_level     varchar(80),
    ADD COLUMN IF NOT EXISTS specialization      varchar(160),
    ADD COLUMN IF NOT EXISTS emirate_of_residence varchar(60),
    ADD COLUMN IF NOT EXISTS age_group           varchar(20),
    ADD COLUMN IF NOT EXISTS gender              varchar(12),
    ADD COLUMN IF NOT EXISTS is_student          boolean,
    ADD COLUMN IF NOT EXISTS salary_expectations varchar(60),
    ADD COLUMN IF NOT EXISTS job_seeker_date     timestamp,
    ADD COLUMN IF NOT EXISTS crm_registered_on   timestamp;

-- Fast segment filtering (?[] / @> queries)
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_crm_segments
    ON candidate_profiles USING gin (crm_segments);

-- Weekly/monthly roster movement series (imported from the workbook's
-- "Add & Remove Pivot" and appended by future platform-side imports).
CREATE TABLE IF NOT EXISTS crm_roster_history (
    id           serial PRIMARY KEY,
    period_type  varchar(10) NOT NULL CHECK (period_type IN ('week', 'month')),
    period_date  date        NOT NULL,
    period_label varchar(30) NOT NULL,
    added        integer     NOT NULL DEFAULT 0,
    removed      integer     NOT NULL DEFAULT 0,
    total        integer,
    source       varchar(120),
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (period_type, period_date)
);

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.columns
--    WHERE table_name='candidate_profiles'
--      AND column_name IN ('crm_segments','crm_reference','cv_status',
--          'looking_status','date_of_call','candidates_source','education_level',
--          'specialization','emirate_of_residence','age_group','gender',
--          'is_student','salary_expectations','job_seeker_date','crm_registered_on');
--   -- expect 15
--   SELECT count(*) FROM crm_roster_history;  -- expect 0 (before import)
