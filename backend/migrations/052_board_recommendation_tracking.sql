-- 052: Board recommendation tracking — owner, due date, completion
--
-- WHY: the board asked to see implementation status of its recommendations:
-- how many are completed, outstanding and in progress, the completion
-- percentage of each, and an overall figure. board_directives already carries
-- title/body/category/priority/status, but status is only 'open' or 'resolved'
-- and there is no owner, no due date and no measure of progress.
--
-- DELIBERATE: completion_percent is SET BY A PERSON — the owner of the
-- recommendation — and is never inferred by the platform. This is the same
-- rule applied after the executive dashboard was found reporting 1,542
-- placements it had inferred from roster attrition. Board-facing numbers must
-- be attributable, so completion_updated_by/at record who last set the figure
-- and when. The overall percentage is a plain average of these values,
-- computed at read time, and is never stored.
--
-- PRECONDITION (verified live 2026-08-05): board_directives has none of the
-- columns below; it holds 4 rows with status values 'open' (3) and 'resolved'
-- (1). Legacy 'resolved' is preserved and counted as completed by the API
-- rather than rewritten, so no existing record is altered.
--
-- Purely additive.

BEGIN;

ALTER TABLE board_directives
    -- Who is accountable for implementing it (users.id = Emirates ID).
    ADD COLUMN IF NOT EXISTS owner_id              char(15),
    ADD COLUMN IF NOT EXISTS due_date              date,
    -- 0-100, set manually by the owner. NULL = not yet assessed, which the UI
    -- must show as "not set" rather than as 0% — an unassessed recommendation
    -- is not a recommendation with no progress.
    ADD COLUMN IF NOT EXISTS completion_percent    smallint
        CHECK (completion_percent IS NULL OR (completion_percent BETWEEN 0 AND 100)),
    ADD COLUMN IF NOT EXISTS completion_note       text,
    ADD COLUMN IF NOT EXISTS completion_updated_by char(15),
    ADD COLUMN IF NOT EXISTS completion_updated_at timestamptz,
    -- Which board meeting raised it, once meetings exist (migration 050).
    ADD COLUMN IF NOT EXISTS meeting_id            uuid;

CREATE INDEX IF NOT EXISTS idx_board_directives_status  ON board_directives (status);
CREATE INDEX IF NOT EXISTS idx_board_directives_owner   ON board_directives (owner_id);
CREATE INDEX IF NOT EXISTS idx_board_directives_meeting ON board_directives (meeting_id);

COMMENT ON COLUMN board_directives.completion_percent IS
    'Manually set by the recommendation owner (0-100). NEVER inferred by the '
    'platform. NULL means not yet assessed — display as "not set", not 0%.';

COMMIT;

-- Verification:
--   SELECT count(*) FROM information_schema.columns
--    WHERE table_name='board_directives'
--      AND column_name IN ('owner_id','due_date','completion_percent',
--                          'completion_note','completion_updated_by',
--                          'completion_updated_at','meeting_id');   -- expect 7
--   UPDATE board_directives SET completion_percent = 150;           -- must fail the CHECK
--   SELECT status, count(*) FROM board_directives GROUP BY 1;       -- 3 open, 1 resolved (unchanged)
