
-- Drop existing constraints if they exist
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- Re-add constraints with ALL existing roles and 'educator' included
-- Roles found: student, candidate, recruiter, hr_manager, job_seeker, administrator, admin, growth_operator
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role::text = ANY (ARRAY[
        'candidate'::text, 
        'employer'::text, 
        'admin'::text, 
        'administrator'::text,
        'student'::text, 
        'educator'::text,
        'recruiter'::text,
        'hr_manager'::text,
        'job_seeker'::text,
        'growth_operator'::text
    ]));

ALTER TABLE users ADD CONSTRAINT users_user_type_check 
    CHECK (user_type::text = ANY (ARRAY[
        'candidate'::text, 
        'employer'::text, 
        'admin'::text, 
        'administrator'::text,
        'student'::text, 
        'educator'::text,
        'recruiter'::text,
        'hr_manager'::text,
        'job_seeker'::text,
        'growth_operator'::text
    ]));
