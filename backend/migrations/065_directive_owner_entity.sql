-- 065: name the entity responsible for a board recommendation
--
-- WHY: board_directives already carries owner_id — a platform user — and the
-- implementation view renders "No owner assigned" for every row, because
-- nothing in the product ever set it. But the request is broader than a user:
--
--   "Would it be possible to add the Board Member or relevant ENTITY
--    responsible for each recommendation? This would help clearly identify the
--    owner of each recommendation and facilitate follow-up and accountability."
--   — fb_1786703276_f842dd5f, 2026-08-14
--
-- Responsibility for a board recommendation frequently sits with a DEPARTMENT
-- or an external body — "DGHR Policy", "Ministry of Education" — which has no
-- user account and should not need one to be named as accountable. Forcing
-- those onto owner_id would mean inventing placeholder users, which corrupts
-- the users table to satisfy a display.
--
-- So the two coexist: owner_id when a named person is answerable, owner_entity
-- when an organisation is. Both may be set — a person AT an entity — and
-- neither is required, because "not yet assigned" is a real and common state
-- that the view already reports honestly.
--
-- Deliberately free text rather than a foreign key to some organisations table.
-- There is no canonical list of the bodies a board can hold accountable, and a
-- dropdown that cannot express "Ministry of Education" would be worse than a
-- box that can.
--
-- PRECONDITION (verified live 2026-08-14): board_directives exists with
-- owner_id (character) as its only owner_* column, no owner_entity, and 4 rows,
-- all with owner_id NULL. Nothing to backfill.
--
-- Purely additive.

BEGIN;

ALTER TABLE board_directives
    ADD COLUMN IF NOT EXISTS owner_entity varchar(200);

COMMENT ON COLUMN board_directives.owner_entity IS
    'The organisation answerable for this recommendation, when it is not an '
    'individual platform user — e.g. a department or an external body. '
    'Coexists with owner_id: a person, an entity, both, or neither.';

COMMIT;

-- Verification:
--   \d board_directives                          -- owner_entity present, nullable
--   SELECT count(*) FROM board_directives WHERE owner_entity IS NOT NULL;  -- 0
--   -- both may be set together:
--   BEGIN;
--     UPDATE board_directives SET owner_entity = 'ZZ-probe'
--      WHERE id = (SELECT id FROM board_directives LIMIT 1);
--   ROLLBACK;                                     -- must succeed
