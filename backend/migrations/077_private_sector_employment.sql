-- 077: employment records for Emiratis in Dubai's private sector
--
-- WHY: a 33,352-row file of Emirati private-sector employees in Dubai (owner,
-- 2026-08-21) is the first sight the platform has of the EMPLOYED population.
-- Everything loaded until now has been job seekers (NAFIS) or CRM contacts.
--
-- WHY A SEPARATE TABLE, NOT MORE COLUMNS ON candidate_profiles:
--   * candidate_profiles already carries 64 columns; employer, job title,
--     sector, start date and four benefit flags would push it past 70 for facts
--     that describe a JOB rather than a person.
--   * this feed refreshes — an "add and drop" sheet arrives periodically — so
--     the employment record has its own lifecycle, and rows must be able to
--     appear and disappear without touching the person.
--   * it mirrors nafis_job_seekers, which is the established pattern here for
--     an external roster that is joined to users by Emirates ID.
--
-- EMIRATES ID IS THE JOIN and it is safe: users.id IS the EID by design, and
-- every row in this file carries one. Verified against the source: 33,352 of
-- 33,354 rows hold a well-formed 784-prefixed 15-digit EID, with ZERO
-- duplicates. The two rejects are a blank row and an Excel footer recording the
-- export filter ("EmirateOfOrigin is Dubai, Private is 1").
--
-- user_id IS NULLABLE ON PURPOSE. An employment record is a fact about a person
-- whether or not that person has a platform account, and 32,047 of them do not
-- yet. Requiring the link would force account creation as a side effect of
-- recording employment, which is the wrong order.
--
-- WHAT IS DELIBERATELY NOT STORED HERE: the person's name, phone and marital
-- status. Those belong to the person (users / candidate_profiles), not to the
-- job, and duplicating them would create a second copy to drift — the failure
-- this codebase has hit repeatedly.
--
-- PRECONDITION (verified live 2026-08-21): no table named
-- private_sector_employment exists; users holds 5,336 rows; nafis_job_seekers
-- holds 3,969.

BEGIN;

CREATE TABLE IF NOT EXISTS private_sector_employment (
    id                  BIGSERIAL PRIMARY KEY,
    emirates_id         CHAR(15)     NOT NULL,
    user_id             CHAR(15),
    company_code        VARCHAR(32),
    company_sector      VARCHAR(120),
    job_name            VARCHAR(200),
    job_name_ar         VARCHAR(200),
    job_start_date      DATE,
    employment_status   VARCHAR(40),
    employment_category VARCHAR(40),
    job_emirate         VARCHAR(60),
    -- Benefit flags, stored as booleans rather than the source's Yes/No text so
    -- nothing downstream has to re-interpret a string.
    salary_support      BOOLEAN,
    child_allowance     BOOLEAN,
    pension             BOOLEAN,
    merit               BOOLEAN,
    source_created_date DATE,
    source_file         VARCHAR(160) NOT NULL,
    imported_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- One current employment record per person per source. A refresh UPDATEs rather
-- than accumulating duplicates, which is what makes an add-and-drop sheet safe
-- to re-run.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pse_person_source
    ON private_sector_employment (emirates_id, source_file);

-- The employer rollup is the highest-value query against this table: which
-- companies employ Emiratis, and how many.
CREATE INDEX IF NOT EXISTS idx_pse_company_code
    ON private_sector_employment (company_code)
    WHERE company_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pse_user
    ON private_sector_employment (user_id)
    WHERE user_id IS NOT NULL;

COMMENT ON TABLE private_sector_employment IS
    'Emirati private-sector employment records sourced from an external roster. '
    'Joined to users by Emirates ID; user_id is NULL until that person has an '
    'account. Refreshed by re-import, keyed on (emirates_id, source_file).';
COMMENT ON COLUMN private_sector_employment.salary_support IS
    'As supplied. 87.5% of the first file is flagged Yes — confirm with the '
    'source whether this means CURRENTLY RECEIVING or ever-received/eligible '
    'before any figure derived from it is published.';

DO $$
DECLARE
    n INTEGER;
BEGIN
    SELECT COUNT(*) INTO n FROM private_sector_employment;
    IF n <> 0 THEN
        RAISE EXCEPTION 'expected an empty table, found % rows. Refusing.', n;
    END IF;
    RAISE NOTICE 'private_sector_employment created, empty and ready';
END $$;

COMMIT;

-- Verification:
--   SELECT count(*) FROM private_sector_employment;            -- expect 0
--   SELECT indexname FROM pg_indexes WHERE tablename = 'private_sector_employment';
--   -- expect uq_pse_person_source, idx_pse_company_code, idx_pse_user
