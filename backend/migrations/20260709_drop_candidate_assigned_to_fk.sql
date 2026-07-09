-- 20260709: Drop the foreign key on candidate_profiles.assigned_to
--
-- The Career Services CRM UI (CareerServicesDashboard) stores the operator's
-- NAME as free text in candidate_profiles.assigned_to (e.g. 'Fatima Al Mansoori',
-- 'Career Services Op', 'Unassigned') — not a users.id. The column is already
-- VARCHAR, but it carried a foreign key to users(id), so every CRM candidate save
-- failed with:
--   insert or update on table "candidate_profiles" violates foreign key
--   constraint "candidate_profiles_assigned_to_fkey"
--   DETAIL: Key (assigned_to)=(<name>) is not present in table "users".
--
-- Dropping the constraint lets the column hold the operator name (matching the UI).
-- (Longer term, assigned_to could instead store an operator user_id with a proper
--  operator picker; that is a separate UI/data change.)

ALTER TABLE candidate_profiles
    DROP CONSTRAINT IF EXISTS candidate_profiles_assigned_to_fkey;
