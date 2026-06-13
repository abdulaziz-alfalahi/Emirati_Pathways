UPDATE users SET role = 'candidate' WHERE role IN ('job_seeker', 'student', 'retiree');
UPDATE users SET role = 'employer_admin' WHERE role IN ('hr_manager', 'hr', 'employer');
UPDATE users SET role = 'recruiter' WHERE role IN ('hr_recruiter');
UPDATE users SET role = 'training_provider' WHERE role IN ('educator', 'training_center_rep');
UPDATE users SET role = 'parent' WHERE role IN ('guardian');
UPDATE users SET role = 'admin' WHERE role IN ('administrator');
UPDATE users SET role = 'talent_operator' WHERE role IN ('growth_operator_candidate', 'nafis_talent_operator');
UPDATE users SET role = 'employer_relations' WHERE role IN ('growth_operator_company');
UPDATE users SET role = 'education_operator' WHERE role IN ('growth_operator_education');
UPDATE users SET role = 'assessment_operator' WHERE role IN ('growth_operator_assessment');
UPDATE users SET role = 'mentorship_operator' WHERE role IN ('growth_operator_mentorship');
UPDATE users SET role = 'community_operator' WHERE role IN ('growth_operator_community');
UPDATE users SET role = 'platform_operator' WHERE role IN ('growth_operator_monitoring', 'operations_monitor', 'operations_officer');
UPDATE users SET role = 'compliance_auditor' WHERE role IN ('government');

-- Do the same for user_type if it exists in the users table, it's safe to run in a DO block
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_type') THEN
    UPDATE users SET user_type = 'candidate' WHERE user_type IN ('job_seeker', 'student', 'retiree');
    UPDATE users SET user_type = 'employer_admin' WHERE user_type IN ('hr_manager', 'hr', 'employer');
    UPDATE users SET user_type = 'recruiter' WHERE user_type IN ('hr_recruiter');
    UPDATE users SET user_type = 'training_provider' WHERE user_type IN ('educator', 'training_center_rep');
    UPDATE users SET user_type = 'parent' WHERE user_type IN ('guardian');
    UPDATE users SET user_type = 'admin' WHERE user_type IN ('administrator');
    UPDATE users SET user_type = 'talent_operator' WHERE user_type IN ('growth_operator_candidate', 'nafis_talent_operator');
    UPDATE users SET user_type = 'employer_relations' WHERE user_type IN ('growth_operator_company');
    UPDATE users SET user_type = 'education_operator' WHERE user_type IN ('growth_operator_education');
    UPDATE users SET user_type = 'assessment_operator' WHERE user_type IN ('growth_operator_assessment');
    UPDATE users SET user_type = 'mentorship_operator' WHERE user_type IN ('growth_operator_mentorship');
    UPDATE users SET user_type = 'community_operator' WHERE user_type IN ('growth_operator_community');
    UPDATE users SET user_type = 'platform_operator' WHERE user_type IN ('growth_operator_monitoring', 'operations_monitor', 'operations_officer');
    UPDATE users SET user_type = 'compliance_auditor' WHERE user_type IN ('government');
  END IF;
END $$;
