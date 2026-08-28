-- 094_eliminate_credentials_from_the_accidental_import.sql
--
-- Owner instruction, 2026-08-27: "The 268 are basically a mistake and I don't
-- want them to exist. Eliminate it."
--
-- WHY
--
-- Migration 093 removed the 268 MESSAGES composed without anyone deciding to
-- write to a recipient. It deliberately left the credentials those messages
-- carried, because expiring them decides something separate. The owner has now
-- decided: they should not exist.
--
--   * 267 job_verification_tokens — every row in that table, all created in the
--     same 11:15:38 transaction, all live, none used. Each is a 7-day link
--     letting an employer confirm one NAFIS vacancy.
--
--   * 1 company_invitations row (c166da7b-ad95-434d-9ee0-c5bd4014fe45,
--     al Rostamani Group). A magic link conferring employer_admin on whoever
--     redeems it — the highest-value of the 268, since redeeming it makes
--     somebody an HR manager on that company's account.
--
-- None was ever transmitted. Deleting them means the links cannot be redeemed
-- by anyone who somehow holds one, and closes the gap where a cancelled
-- invitation still works.
--
-- WHAT THIS KEEPS, ON PURPOSE
--
-- The 153 companies and 267 job_postings that import created. The vacancy DATA
-- is wanted — the team filters companies by vacancy count to decide who to
-- onboard first — and it was never the mistake. Only the mail and the
-- credentials were. Removing a token does not touch the vacancy it verified;
-- issuing a fresh one later is a normal operator action.
--
-- PRECONDITION, verified against dghr_prod on 2026-08-27:
--   * job_verification_tokens holds exactly 267 rows, all from that import,
--     0 used, 267 unexpired
--   * company_invitations holds 9 rows; exactly 1 is the al Rostamani record
--   * NO foreign key anywhere references either table, so nothing is orphaned
--     by these deletes (checked in information_schema, both directions)
--
-- The deletes are keyed on the id set captured in the backups, so re-running
-- this removes nothing further.

BEGIN;

-- ------------------------------------------------ 1. keep the evidence -----
-- Whole rows, tokens included. These are dead credentials once deleted, and
-- the record of what was created by accident is worth more than the secrecy of
-- a string that was never sent to anybody.
CREATE TABLE IF NOT EXISTS _backup_job_verification_tokens_094 AS
SELECT t.*, now() AS captured_at
  FROM job_verification_tokens t
 WHERE t.created_at >= TIMESTAMPTZ '2026-08-27 11:15:00+04'
   AND t.created_at <  TIMESTAMPTZ '2026-08-27 11:17:00+04';

CREATE TABLE IF NOT EXISTS _backup_company_invitations_094 AS
SELECT ci.*, now() AS captured_at
  FROM company_invitations ci
 WHERE ci.id = 'c166da7b-ad95-434d-9ee0-c5bd4014fe45';

-- ------------------------------------------------------- 2. eliminate ------
DELETE FROM job_verification_tokens
 WHERE id IN (SELECT id FROM _backup_job_verification_tokens_094);

DELETE FROM company_invitations
 WHERE id IN (SELECT id FROM _backup_company_invitations_094);

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 0 — every token in that table came from the accidental import:
--   SELECT count(*) FROM job_verification_tokens;
--
-- Expect 267 and 1:
--   SELECT count(*) FROM _backup_job_verification_tokens_094;
--   SELECT count(*) FROM _backup_company_invitations_094;
--
-- Expect 8 — the other invitations are untouched:
--   SELECT count(*) FROM company_invitations;
--
-- Expect 153 and 267 — the vacancy data is deliberately kept:
--   SELECT count(*) FROM job_postings
--    WHERE created_at >= TIMESTAMPTZ '2026-08-27 11:15:00+04'
--      AND created_at <  TIMESTAMPTZ '2026-08-27 11:17:00+04';
--
-- Expect 0 — no vacancy is left pointing at a token that no longer exists,
-- because job_postings never referenced tokens; the reference runs the other
-- way and is now gone with the token:
--   SELECT count(*) FROM job_verification_tokens t
--    WHERE NOT EXISTS (SELECT 1 FROM job_postings j WHERE j.id = t.job_id);
