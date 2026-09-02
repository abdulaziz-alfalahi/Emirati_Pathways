-- 107_verification_requires_an_approver.sql
--
-- `companies.is_verified` is an APPROVAL DECISION, not a display flag. It is
-- what `_unverified_company_block` reads before any vacancy may be published
-- (issue #96), so it decides which employers can reach candidates at all.
--
-- WHAT WAS FOUND, 2026-09-02, reviewing the company workspace workflow:
--
--   companies ....................................... 278
--   holding a real trade licence .................... 269
--   VERIFIED ......................................... 9
--   verified AND holding a trade licence ............. 0
--   verified with verified_by set (i.e. approved by
--     an actual person or source) .................... 0
--
-- The nine verified companies are Airbus, Amazon, Google, HSBC, JPMorgan,
-- Marriott, Microsoft, Pfizer and Shell. None has a trade licence, and NOBODY
-- VERIFIED ANY OF THEM: verified_by and verified_at are NULL on all nine. They
-- were inserted with is_verified = TRUE by a seed, so the approval gate has
-- never been exercised by anyone.
--
-- The consequence is the wrong way round. Publishing is gated on verification,
-- so the only companies on the platform that COULD publish a vacancy are nine
-- seeded multinationals, while 269 companies holding genuine UAE trade licences
-- — including SEDDIQI HOLDING (L.L.C), licence 595724, the one real company
-- with a provisioned workspace — cannot.
--
-- THE INVARIANT
--
-- A company is verified only if somebody or something stands behind it. That is
-- exactly what verified_by records: an operator id for an operator decision, or
-- the provenance for a MOHRE-sourced one. Requiring it makes verification
-- unsettable by a seed, an import or a stray UPDATE, because the writer has to
-- name who is accountable.
--
-- Trade licence is deliberately NOT part of the constraint. It is a separate
-- axis — company identity resolves on the licence (CLAUDE.md), while
-- verification is about who approved. Conflating them here would block a
-- legitimate approval routed through MOHRE provenance.
--
-- NOTHING IS UNPUBLISHED BY THIS. The 7 published vacancies carry a company_id
-- that matches no company row, so removing verification from the nine takes no
-- vacancy off the platform. Verified goes 9 -> 0, which is the truthful count:
-- nobody has approved an employer yet.

BEGIN;

-- Snapshot before the write. Nine rows, and undoing this must be trivial if the
-- seeded companies turn out to be needed for a demo.
CREATE TABLE IF NOT EXISTS _backup_unapproved_verification_107 AS
SELECT id, company_name, is_verified, verified_by, verified_at, trade_license_no,
       now() AS backed_up_at
  FROM companies
 WHERE is_verified IS TRUE AND verified_by IS NULL;

UPDATE companies
   SET is_verified = FALSE,
       verified_at = NULL
 WHERE is_verified IS TRUE
   AND verified_by IS NULL;

-- Going forward, verification cannot be set without naming who approved it.
-- NOT VALID would let existing rows through, but there are none left to let
-- through — the UPDATE above cleared them — so the constraint is validated.
ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_verification_needs_an_approver;
ALTER TABLE companies
  ADD CONSTRAINT companies_verification_needs_an_approver
  CHECK (is_verified IS NOT TRUE OR verified_by IS NOT NULL);

COMMENT ON CONSTRAINT companies_verification_needs_an_approver ON companies IS
  'is_verified is an approval decision that gates publishing. It may only be '
  'true when verified_by names who approved it — an operator, or the '
  'provenance of a MOHRE-sourced verification. Added 2026-09-02 after nine '
  'seeded companies were found verified with no approver and no trade licence.';

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 0 — no company is verified without an approver:
--   SELECT count(*) FROM companies WHERE is_verified AND verified_by IS NULL;
--
-- Expect 9 — recoverable:
--   SELECT count(*) FROM _backup_unapproved_verification_107;
--
-- Expect 0 verified, which is the truthful number until an operator approves
-- somebody:
--   SELECT count(*) FILTER (WHERE is_verified) FROM companies;
--
-- Expect the constraint to REFUSE this (run inside a transaction and roll back):
--   UPDATE companies SET is_verified = TRUE WHERE id = (SELECT id FROM companies LIMIT 1);
--
-- To restore the seeded state:
--   UPDATE companies c SET is_verified = b.is_verified, verified_at = b.verified_at
--     FROM _backup_unapproved_verification_107 b WHERE b.id = c.id;
--   (the constraint will refuse it while verified_by is NULL — which is the point)
