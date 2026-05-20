-- =============================================================================
-- EID-First Schema Migration
-- Emirati Pathways Platform — Pre-Production Refactor
-- Generated: 2026-05-20
-- =============================================================================
-- IMPORTANT: Run pg_dump BEFORE executing this script!
--   pg_dump -Fc -h 10.228.145.66 -p 5454 -U dghr_prod dghr_prod > pre_eid_backup.dump
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 0: Create UUID→EID mapping & assign synthetic EIDs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS _eid_migration_map (
    old_uuid UUID PRIMARY KEY,
    new_eid  CHAR(15) NOT NULL UNIQUE,
    email    VARCHAR(255),
    role     VARCHAR(50),
    mapped_at TIMESTAMP DEFAULT NOW()
);

-- Assign synthetic EIDs to all 24 existing users (no real EIDs exist yet)
-- Format: 784 + 0000 + 7-digit seq + check digit 0
INSERT INTO _eid_migration_map (old_uuid, new_eid, email, role)
SELECT
    id,
    '784' || '0000' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 7, '0') || '0',
    email,
    role
FROM users
ON CONFLICT (old_uuid) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 1: Add eid column to users table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS eid CHAR(15);

-- Populate from mapping
UPDATE users u
SET eid = m.new_eid
FROM _eid_migration_map m
WHERE u.id = m.old_uuid;

-- Add constraints
ALTER TABLE users ADD CONSTRAINT chk_eid_format CHECK (eid ~ '^[0-9]{15}$');
ALTER TABLE users ADD CONSTRAINT uq_users_eid UNIQUE (eid);
ALTER TABLE users ALTER COLUMN eid SET NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 2: Drop ALL existing FK constraints that reference users.id
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_user_id_fkey;
ALTER TABLE admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_target_user_id_fkey;
ALTER TABLE admin_roles DROP CONSTRAINT IF EXISTS admin_roles_created_by_fkey;
ALTER TABLE admin_settings DROP CONSTRAINT IF EXISTS admin_settings_updated_by_fkey;
ALTER TABLE admin_user_roles DROP CONSTRAINT IF EXISTS admin_user_roles_user_id_fkey;
ALTER TABLE admin_user_roles DROP CONSTRAINT IF EXISTS admin_user_roles_assigned_by_fkey;
ALTER TABLE admin_user_sessions DROP CONSTRAINT IF EXISTS admin_user_sessions_user_id_fkey;
ALTER TABLE cms_content DROP CONSTRAINT IF EXISTS cms_content_created_by_fkey;
ALTER TABLE cms_content DROP CONSTRAINT IF EXISTS cms_content_updated_by_fkey;
ALTER TABLE cms_content_versions DROP CONSTRAINT IF EXISTS cms_content_versions_created_by_fkey;
ALTER TABLE cms_content_workflows DROP CONSTRAINT IF EXISTS cms_content_workflows_assigned_to_fkey;
ALTER TABLE cms_media DROP CONSTRAINT IF EXISTS cms_media_uploaded_by_fkey;
ALTER TABLE cms_workflows DROP CONSTRAINT IF EXISTS cms_workflows_created_by_fkey;
ALTER TABLE job_shortlists DROP CONSTRAINT IF EXISTS job_shortlists_candidate_id_fkey;
ALTER TABLE job_shortlists DROP CONSTRAINT IF EXISTS job_shortlists_added_by_fkey;

-- Also drop any FK constraints from candidate_profiles children
ALTER TABLE candidate_assessments DROP CONSTRAINT IF EXISTS candidate_assessments_profile_id_fkey;
ALTER TABLE candidate_certifications DROP CONSTRAINT IF EXISTS candidate_certifications_profile_id_fkey;
ALTER TABLE candidate_education_entries DROP CONSTRAINT IF EXISTS candidate_education_entries_profile_id_fkey;
ALTER TABLE candidate_experience_entries DROP CONSTRAINT IF EXISTS candidate_experience_entries_profile_id_fkey;
ALTER TABLE candidate_skills DROP CONSTRAINT IF EXISTS candidate_skills_profile_id_fkey;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 3: ALTER all user-referencing columns to CHAR(15)
-- ─────────────────────────────────────────────────────────────────────────────
-- Strategy: For each column, we ALTER TYPE using an expression that maps
-- the old UUID/int/varchar value → the new EID via the mapping table.
-- Since this is pre-production with minimal data, we use subquery casts.
-- ─────────────────────────────────────────────────────────────────────────────

-- === Group A: UUID columns (currently match users.id type) ===

ALTER TABLE admin_audit_log
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = user_id);

ALTER TABLE admin_notifications
    ALTER COLUMN target_user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = target_user_id);

ALTER TABLE admin_roles
    ALTER COLUMN created_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = created_by);

ALTER TABLE admin_settings
    ALTER COLUMN updated_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = updated_by);

ALTER TABLE admin_user_roles
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = user_id);

ALTER TABLE admin_user_roles
    ALTER COLUMN assigned_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = assigned_by);

ALTER TABLE admin_user_sessions
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = user_id);

ALTER TABLE cms_content
    ALTER COLUMN created_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = created_by);

ALTER TABLE cms_content
    ALTER COLUMN updated_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = updated_by);

ALTER TABLE cms_content_versions
    ALTER COLUMN created_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = created_by);

ALTER TABLE cms_content_workflows
    ALTER COLUMN assigned_to TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = assigned_to);

ALTER TABLE cms_media
    ALTER COLUMN uploaded_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = uploaded_by);

ALTER TABLE cms_workflows
    ALTER COLUMN created_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = created_by);

ALTER TABLE cv_analytics
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = user_id);

ALTER TABLE cv_versions
    ALTER COLUMN created_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = created_by);

ALTER TABLE enhanced_analytics_events
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = user_id);

ALTER TABLE job_shortlists
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = candidate_id);

ALTER TABLE job_shortlists
    ALTER COLUMN added_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = added_by);

ALTER TABLE learning_resources
    ALTER COLUMN created_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = created_by);

ALTER TABLE recruiter_vacancies
    ALTER COLUMN posted_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = posted_by);

ALTER TABLE user_cvs
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = user_id);

ALTER TABLE user_journey_analytics
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid = user_id);

-- === Group B: VARCHAR/TEXT columns (store UUID as string) ===

ALTER TABLE candidate_profiles
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = user_id);

ALTER TABLE candidate_shortlist
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = candidate_id);

ALTER TABLE candidate_shortlist
    ALTER COLUMN recruiter_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = recruiter_id);

ALTER TABLE communication_logs
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = candidate_id);

ALTER TABLE communication_logs
    ALTER COLUMN recruiter_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = recruiter_id);

ALTER TABLE conversation_participants
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = user_id);

ALTER TABLE conversations
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = candidate_id);

ALTER TABLE cv_usage_logs
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = user_id);

ALTER TABLE feedback
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = user_id);

ALTER TABLE interview_participants
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = user_id);

ALTER TABLE interview_schedules
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = candidate_id);

ALTER TABLE interview_schedules
    ALTER COLUMN recruiter_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = recruiter_id);

ALTER TABLE interview_sessions
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = candidate_id);

ALTER TABLE interview_sessions
    ALTER COLUMN recruiter_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = recruiter_id);

ALTER TABLE job_applications
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = candidate_id);

ALTER TABLE job_offers
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = candidate_id);

ALTER TABLE job_offers
    ALTER COLUMN recruiter_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = recruiter_id);

ALTER TABLE job_offers
    ALTER COLUMN approved_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = approved_by);

ALTER TABLE job_offers
    ALTER COLUMN created_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = created_by);

ALTER TABLE job_postings
    ALTER COLUMN recruiter_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = recruiter_id);

ALTER TABLE job_postings
    ALTER COLUMN posted_by TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = posted_by);

ALTER TABLE job_descriptions
    ALTER COLUMN recruiter_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = recruiter_id);

ALTER TABLE messages
    ALTER COLUMN sender_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = sender_id);

ALTER TABLE messages
    ALTER COLUMN recipient_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = recipient_id);

ALTER TABLE notifications
    ALTER COLUMN user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = user_id);

ALTER TABLE shortlisted_candidates
    ALTER COLUMN candidate_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = candidate_id);

ALTER TABLE shortlisted_candidates
    ALTER COLUMN hr_user_id TYPE CHAR(15)
    USING (SELECT new_eid FROM _eid_migration_map WHERE old_uuid::text = hr_user_id);

-- === Group C: INTEGER columns (legacy serial IDs — these hold no real data) ===
-- These columns currently contain integer values that do NOT map to users.id (UUID).
-- Since this is pre-production with near-zero data in these tables, we ALTER to
-- CHAR(15) and NULL out any orphaned values.

ALTER TABLE analytics_events ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE application_documents ALTER COLUMN uploaded_by TYPE CHAR(15) USING NULL;
ALTER TABLE application_feedback ALTER COLUMN provided_by TYPE CHAR(15) USING NULL;
ALTER TABLE application_notifications ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE application_status_history ALTER COLUMN changed_by TYPE CHAR(15) USING NULL;
ALTER TABLE approval_requests ALTER COLUMN requested_by TYPE CHAR(15) USING NULL;
ALTER TABLE approval_requests ALTER COLUMN approver_id TYPE CHAR(15) USING NULL;
ALTER TABLE attendance ALTER COLUMN marked_by TYPE CHAR(15) USING NULL;
ALTER TABLE career_development_plans ALTER COLUMN mentee_user_id TYPE CHAR(15) USING NULL;
ALTER TABLE company_invitations ALTER COLUMN created_user_id TYPE CHAR(15) USING NULL;
ALTER TABLE company_invitations ALTER COLUMN invited_by TYPE CHAR(15) USING NULL;
ALTER TABLE company_team_members ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE company_team_members ALTER COLUMN invited_by TYPE CHAR(15) USING NULL;
ALTER TABLE course_enrollments ALTER COLUMN student_user_id TYPE CHAR(15) USING NULL;
ALTER TABLE cv_profiles ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE educator_profiles ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE growth_operator_activity_log ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE growth_operator_assignments ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE growth_operator_assignments ALTER COLUMN assigned_by TYPE CHAR(15) USING NULL;
ALTER TABLE hr_profiles ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE interview_recordings ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE job_descriptions ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE job_documents ALTER COLUMN uploaded_by TYPE CHAR(15) USING NULL;
ALTER TABLE job_postings ALTER COLUMN created_by TYPE CHAR(15) USING NULL;
ALTER TABLE job_templates ALTER COLUMN created_by TYPE CHAR(15) USING NULL;
ALTER TABLE mentor_profiles ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE mentorship_analytics ALTER COLUMN mentee_user_id TYPE CHAR(15) USING NULL;
ALTER TABLE mentorship_goals ALTER COLUMN mentee_user_id TYPE CHAR(15) USING NULL;
ALTER TABLE mentorship_matching ALTER COLUMN mentee_user_id TYPE CHAR(15) USING NULL;
ALTER TABLE mentorship_sessions ALTER COLUMN mentee_user_id TYPE CHAR(15) USING NULL;
ALTER TABLE nafis_import_batches ALTER COLUMN uploaded_by TYPE CHAR(15) USING NULL;
ALTER TABLE nafis_job_seekers ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE offer_approval_requests ALTER COLUMN candidate_id TYPE CHAR(15) USING NULL;
ALTER TABLE offer_approval_requests ALTER COLUMN recruiter_id TYPE CHAR(15) USING NULL;
ALTER TABLE offer_approval_requests ALTER COLUMN approved_by TYPE CHAR(15) USING NULL;
ALTER TABLE offer_approval_requests ALTER COLUMN approver_id TYPE CHAR(15) USING NULL;
ALTER TABLE offers ALTER COLUMN candidate_id TYPE CHAR(15) USING NULL;
ALTER TABLE offers ALTER COLUMN recruiter_id TYPE CHAR(15) USING NULL;
ALTER TABLE parent_communications ALTER COLUMN educator_id TYPE CHAR(15) USING NULL;
ALTER TABLE program_enrollments ALTER COLUMN student_id TYPE CHAR(15) USING NULL;
ALTER TABLE program_enrollments ALTER COLUMN parent_id TYPE CHAR(15) USING NULL;
ALTER TABLE program_notifications ALTER COLUMN recipient_id TYPE CHAR(15) USING NULL;
ALTER TABLE program_reviews ALTER COLUMN reviewer_id TYPE CHAR(15) USING NULL;
ALTER TABLE program_workflow_history ALTER COLUMN actor_id TYPE CHAR(15) USING NULL;
ALTER TABLE recruiter_activity_log ALTER COLUMN recruiter_id TYPE CHAR(15) USING NULL;
ALTER TABLE role_requests ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE role_requests ALTER COLUMN reviewer_id TYPE CHAR(15) USING NULL;
ALTER TABLE saved_jobs ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE seeker_invitations ALTER COLUMN invited_by TYPE CHAR(15) USING NULL;
ALTER TABLE student_behavior ALTER COLUMN reported_by TYPE CHAR(15) USING NULL;
ALTER TABLE students ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE team_members ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE user_activity_log ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE user_roles ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE user_roles ALTER COLUMN assigned_by TYPE CHAR(15) USING NULL;
ALTER TABLE user_sessions ALTER COLUMN user_id TYPE CHAR(15) USING NULL;
ALTER TABLE video_interview_sessions ALTER COLUMN candidate_id TYPE CHAR(15) USING NULL;
ALTER TABLE video_interview_sessions ALTER COLUMN interviewer_id TYPE CHAR(15) USING NULL;

-- candidate_profiles.profile_id children: These reference candidate_profiles.id (integer).
-- We convert candidate_profiles.id to CHAR(15) using user_id as the new PK link.
-- First, add user_eid to candidate_profiles children tables.

-- Add user_eid column to each child, populate from candidate_profiles.user_id
ALTER TABLE candidate_assessments ADD COLUMN user_eid CHAR(15);
UPDATE candidate_assessments ca SET user_eid = cp.user_id
FROM candidate_profiles cp WHERE ca.profile_id = cp.id;
ALTER TABLE candidate_assessments DROP COLUMN profile_id;
ALTER TABLE candidate_assessments RENAME COLUMN user_eid TO user_id;

ALTER TABLE candidate_certifications ADD COLUMN user_eid CHAR(15);
UPDATE candidate_certifications cc SET user_eid = cp.user_id
FROM candidate_profiles cp WHERE cc.profile_id = cp.id;
ALTER TABLE candidate_certifications DROP COLUMN profile_id;
ALTER TABLE candidate_certifications RENAME COLUMN user_eid TO user_id;

ALTER TABLE candidate_education_entries ADD COLUMN user_eid CHAR(15);
UPDATE candidate_education_entries ce SET user_eid = cp.user_id
FROM candidate_profiles cp WHERE ce.profile_id = cp.id;
ALTER TABLE candidate_education_entries DROP COLUMN profile_id;
ALTER TABLE candidate_education_entries RENAME COLUMN user_eid TO user_id;

ALTER TABLE candidate_experience_entries ADD COLUMN user_eid CHAR(15);
UPDATE candidate_experience_entries ce SET user_eid = cp.user_id
FROM candidate_profiles cp WHERE ce.profile_id = cp.id;
ALTER TABLE candidate_experience_entries DROP COLUMN profile_id;
ALTER TABLE candidate_experience_entries RENAME COLUMN user_eid TO user_id;

ALTER TABLE candidate_skills ADD COLUMN user_eid CHAR(15);
UPDATE candidate_skills cs SET user_eid = cp.user_id
FROM candidate_profiles cp WHERE cs.profile_id = cp.id;
ALTER TABLE candidate_skills DROP COLUMN profile_id;
ALTER TABLE candidate_skills RENAME COLUMN user_eid TO user_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 4: Swap users PK from UUID to EID
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users RENAME COLUMN id TO id_old_uuid;
ALTER TABLE users RENAME COLUMN eid TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 5: Recreate FK constraints
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE admin_audit_log ADD CONSTRAINT fk_admin_audit_log_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE admin_notifications ADD CONSTRAINT fk_admin_notifications_user FOREIGN KEY (target_user_id) REFERENCES users(id);
ALTER TABLE admin_roles ADD CONSTRAINT fk_admin_roles_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE admin_settings ADD CONSTRAINT fk_admin_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE admin_user_roles ADD CONSTRAINT fk_admin_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE admin_user_roles ADD CONSTRAINT fk_admin_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id);
ALTER TABLE admin_user_sessions ADD CONSTRAINT fk_admin_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE candidate_profiles ADD CONSTRAINT fk_candidate_profiles_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE cms_content ADD CONSTRAINT fk_cms_content_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE cms_content ADD CONSTRAINT fk_cms_content_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);
ALTER TABLE cms_content_versions ADD CONSTRAINT fk_cms_content_versions_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE cms_content_workflows ADD CONSTRAINT fk_cms_content_workflows_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id);
ALTER TABLE cms_media ADD CONSTRAINT fk_cms_media_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id);
ALTER TABLE cms_workflows ADD CONSTRAINT fk_cms_workflows_created_by FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE user_cvs ADD CONSTRAINT fk_user_cvs_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE job_shortlists ADD CONSTRAINT fk_job_shortlists_candidate FOREIGN KEY (candidate_id) REFERENCES users(id);
ALTER TABLE job_shortlists ADD CONSTRAINT fk_job_shortlists_added_by FOREIGN KEY (added_by) REFERENCES users(id);
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE messages ADD CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id);
ALTER TABLE user_roles ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 6: Performance indices
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cvs_user_id ON user_cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_id ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_shortlist_candidate_id ON candidate_shortlist(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_shortlist_recruiter_id ON candidate_shortlist(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter_id ON job_postings(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_id ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offers_candidate_id ON offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_assessments_user_id ON candidate_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_user_id ON candidate_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_education_user_id ON candidate_education_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_experience_user_id ON candidate_experience_entries(user_id);

-- Backward-compat UUID lookup during transition
CREATE INDEX IF NOT EXISTS idx_users_old_uuid ON users(id_old_uuid);

-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 7: Validation queries (run these manually to verify)
-- ─────────────────────────────────────────────────────────────────────────────

-- 7.1: Verify users PK is now CHAR(15)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name='users' AND column_name='id';
-- Expected: data_type = 'character'

-- 7.2: Verify NO integer/uuid user columns remain
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND column_name IN ('user_id','candidate_id','recruiter_id','mentee_user_id')
--   AND data_type IN ('integer','uuid')
-- ORDER BY table_name;
-- Expected: ZERO rows

-- 7.3: Verify all EIDs match format
-- SELECT id FROM users WHERE id !~ '^[0-9]{15}$';
-- Expected: ZERO rows

-- 7.4: Verify FK constraints exist
-- SELECT tc.table_name, kcu.column_name
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users'
-- ORDER BY tc.table_name;
