-- 072: who assigned a caseload member, and how they got there
--
-- WHY: an operator can now allocate a candidate to a career coach from the CRM
-- (owner decision 2026-08-17). Two things the table cannot currently express are
-- needed for that to be honest:
--
--   origin       whether the candidate CHOSE this coach or was allocated to
--                them. The coach needs to tell those apart — the first asked for
--                them, the second did not — and a hand-back is only offered for
--                allocated work. Without this column the coach dashboard would
--                have to guess, and would guess wrong for every row.
--
--   assigned_by  which operator made the allocation. When a coach hands a client
--                back, the notification has to reach the person who assigned
--                them; without this it would go nowhere, or to everyone.
--
-- BOTH TABLES, NOT JUST THE COACH ONE. `caseload_assignment_routes.assign()` is
-- generic over `_CASELOAD_TYPES` and builds one INSERT for every caseload kind.
-- Adding the columns to `coach_client_assignments` alone would make that INSERT
-- reference columns that do not exist on `advisor_student_assignments` — the
-- advisor caseload would start failing as a side effect of a coaching change.
-- The advisor subsystem gains two nullable columns it does not yet use, which is
-- the cheaper of the two mistakes available here.
--
-- NULLABLE, NO BACKFILL. Existing rows genuinely have no known origin, and
-- inventing one would be worse than admitting it: NULL means "written before
-- this distinction existed". Both tables are empty today so no row is affected,
-- but the columns stay nullable because that is the honest shape.
--
-- NO CHECK CONSTRAINT ON status. Tempting, since `status` is a free-form varchar
-- carrying five distinct meanings. Deliberately not added here: the two writers
-- do not yet agree on the vocabulary at the database level, and a CHECK added
-- before `backend/caseload_states.py` is the single source would convert a
-- silent inconsistency into a production 500. Worth doing once both paths are
-- observed writing only the five known states.
--
-- PRECONDITION (verified live 2026-08-17): coach_client_assignments has 5
-- columns and 0 rows; advisor_student_assignments has 0 rows; neither has an
-- origin or assigned_by column. Both already carry UNIQUE (staff, member),
-- which the assign upsert's ON CONFLICT depends on.

BEGIN;

ALTER TABLE coach_client_assignments
    ADD COLUMN IF NOT EXISTS origin      VARCHAR(20),
    ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(15);

ALTER TABLE advisor_student_assignments
    ADD COLUMN IF NOT EXISTS origin      VARCHAR(20),
    ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(15);

COMMENT ON COLUMN coach_client_assignments.origin IS
    '''requested'' when the candidate chose this coach via POST /api/coach/request, '
    '''assigned'' when a career-services operator allocated them via '
    'POST /api/caseload/coach/assign. NULL for rows written before 2026-08-17. '
    'Only ''assigned'' relationships may be handed back — see backend/caseload_states.py.';

COMMENT ON COLUMN coach_client_assignments.assigned_by IS
    'Emirates ID of the operator who made the allocation, so a hand-back can '
    'notify the person who assigned. NULL for candidate-initiated requests, '
    'which nobody assigned.';

-- No index: both tables are read by staff_id/member_id, which the existing
-- unique constraint already serves, and neither has the volume to justify more.

COMMIT;

-- Verification:
--   SELECT column_name, data_type, is_nullable FROM information_schema.columns
--    WHERE table_name IN ('coach_client_assignments','advisor_student_assignments')
--      AND column_name IN ('origin','assigned_by') ORDER BY table_name, column_name;
--   -- expect 4 rows, character varying, all YES
--
--   SELECT origin, count(*) FROM coach_client_assignments GROUP BY 1;  -- expect 0 rows
