-- 087_void_unapproved_outbound_invitations.sql
--
-- WHY
--
-- Migration 086 retired the board-notification backlog. This one deals with the
-- other half: invitation tokens. They are not a queue — nothing fires them on a
-- timer — but every one is a live credential addressed to somebody, and a bulk
-- "resend pending" is one operator click. With mail about to be switched on for
-- the first time, an unapproved link to a real company is the same risk as an
-- unapproved email to one.
--
-- WHAT WAS OUTSTANDING (measured on the live DB, 2026-08-25)
--
--   job_verification_tokens   126 live (of 431), ALL created on 2026-08-21
--   company_invitations         1 live, created 2026-08-22, expires 2026-08-29
--   event_invitations           4 outstanding, invited 14-17 Aug
--   seeker/staff/team           0 live
--
-- The 126 are the important ones. They are addressed to REAL UAE employers —
-- Al Rostamani Group, Prime Health, Gargash Hospital, Azadea, Majid Al Futtaim,
-- NMC, and personal gmail/hotmail addresses across 219 distinct domains. NOT
-- ONE of the 126 has a company name matching ZZ- or TEST: they came from a real
-- NAFIS vacancy CSV, imported during a test run on a single day. Nothing was
-- ever delivered, because email has never worked — so no recipient has ever
-- seen or consented to any of this.
--
-- The owner's instruction (2026-08-25): all previous attempts were tests, and
-- nothing may reach a real user or company that has not been verified and
-- approved. So every outstanding token is voided here, and anything genuinely
-- wanted is reissued deliberately after mail is proven.
--
-- HOW THINGS ARE VOIDED, AND WHY NOT is_used
--
-- Setting is_used = true would record that somebody redeemed the link. Nobody
-- did. Expiry is the honest statement — "this link no longer works" — and it
-- is what every redemption path already checks, so voiding needs no code
-- change and cannot be missed by a call site that forgot about a new column.
--
-- PRECONDITION VERIFIED ON THE LIVE DB 2026-08-25
--   job_verification_tokens: 431 rows, 126 with expires_at > now() AND NOT is_used
--   company_invitations:     1 with status='pending' AND expires_at > now()
--   event_invitations:       4 with response IN ('invited','confirmed')
--   no CHECK constraint on status in any of these tables; event_invitations
--   constrains response to (invited, confirmed, declined, no_answer)
--
-- Every statement is written against the CONDITION, not against those counts.

BEGIN;

-- ── Snapshot everything before it is voided ─────────────────────────────────
CREATE TABLE IF NOT EXISTS _backup_job_tokens_087 AS
SELECT *, now() AS captured_at FROM job_verification_tokens
 WHERE expires_at > now() AND NOT is_used;

CREATE TABLE IF NOT EXISTS _backup_company_invites_087 AS
SELECT *, now() AS captured_at FROM company_invitations
 WHERE status = 'pending' AND expires_at > now();

CREATE TABLE IF NOT EXISTS _backup_seeker_invites_087 AS
SELECT *, now() AS captured_at FROM seeker_invitations
 WHERE status = 'pending' AND expires_at > now();

CREATE TABLE IF NOT EXISTS _backup_staff_invites_087 AS
SELECT *, now() AS captured_at FROM staff_invitations
 WHERE status = 'pending' AND expires_at > now();

CREATE TABLE IF NOT EXISTS _backup_team_invites_087 AS
SELECT *, now() AS captured_at FROM team_invitations
 WHERE status = 'pending' AND expires_at > now();

CREATE TABLE IF NOT EXISTS _backup_event_invites_087 AS
SELECT *, now() AS captured_at FROM event_invitations
 WHERE response IN ('invited', 'confirmed');

-- ── Void ────────────────────────────────────────────────────────────────────
UPDATE job_verification_tokens
   SET expires_at = now() - interval '1 second'
 WHERE expires_at > now() AND NOT is_used;

UPDATE company_invitations
   SET status = 'revoked', expires_at = now() - interval '1 second'
 WHERE status = 'pending' AND expires_at > now();

UPDATE seeker_invitations
   SET status = 'revoked', expires_at = now() - interval '1 second'
 WHERE status = 'pending' AND expires_at > now();

UPDATE staff_invitations
   SET status = 'revoked', revoked_at = now(), expires_at = now() - interval '1 second'
 WHERE status = 'pending' AND expires_at > now();

UPDATE team_invitations
   SET status = 'revoked', expires_at = now() - interval '1 second'
 WHERE status = 'pending' AND expires_at > now();

-- 'no_answer' is the only terminal value the CHECK allows that does not claim
-- the person answered. These were never delivered, so no answer is literally true.
UPDATE event_invitations
   SET response = 'no_answer'
 WHERE response IN ('invited', 'confirmed');

COMMIT;

-- ── Verification ────────────────────────────────────────────────────────────
--
-- 1. Nothing outstanding anywhere. Every count must be ZERO:
--      SELECT count(*) FROM job_verification_tokens WHERE expires_at > now() AND NOT is_used;
--      SELECT count(*) FROM company_invitations WHERE status='pending' AND expires_at > now();
--      SELECT count(*) FROM seeker_invitations  WHERE status='pending' AND expires_at > now();
--      SELECT count(*) FROM staff_invitations   WHERE status='pending' AND expires_at > now();
--      SELECT count(*) FROM team_invitations    WHERE status='pending' AND expires_at > now();
--      SELECT count(*) FROM event_invitations   WHERE response IN ('invited','confirmed');
--
-- 2. Nothing was lost — expect 126 / 1 / 4:
--      SELECT count(*) FROM _backup_job_tokens_087;
--      SELECT count(*) FROM _backup_company_invites_087;
--      SELECT count(*) FROM _backup_event_invites_087;
--
-- 3. Already-accepted history is untouched (voiding must not rewrite the past):
--      SELECT status, count(*) FROM company_invitations GROUP BY status;
--        -- 'accepted' must still be 1
--
-- 4. A NEW invitation can still be issued normally — this migration closes the
--    backlog, it does not disable invitations:
--      BEGIN;
--        INSERT INTO job_verification_tokens (job_id, token, email, expires_at)
--        SELECT job_id, 'ZZ-087-probe', email, now() + interval '7 days'
--          FROM _backup_job_tokens_087 LIMIT 1;          -- must succeed
--        SELECT count(*) FROM job_verification_tokens
--         WHERE expires_at > now() AND NOT is_used;      -- must be 1
--      ROLLBACK;
