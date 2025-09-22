-- =====================================================
-- FOREIGN KEY RELATIONSHIPS AND CONSTRAINTS
-- Emirati Journey Platform - Database Integrity Implementation
-- =====================================================

-- =====================================================
-- ADDITIONAL FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add missing foreign key constraints for existing tables that may not have them

-- Job Applications to Users relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_applications_user_id_fkey'
    ) THEN
        ALTER TABLE job_applications 
        ADD CONSTRAINT job_applications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Job Applications to Job Postings relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_applications_job_posting_id_fkey'
    ) THEN
        ALTER TABLE job_applications 
        ADD CONSTRAINT job_applications_job_posting_id_fkey 
        FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Job Postings to Companies relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_postings_company_id_fkey'
    ) THEN
        ALTER TABLE job_postings 
        ADD CONSTRAINT job_postings_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Job Postings to HR Profiles relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_postings_created_by_fkey'
    ) THEN
        ALTER TABLE job_postings 
        ADD CONSTRAINT job_postings_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES hr_profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Applications to Users relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_user_id_fkey'
    ) THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Applications to Jobs relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'applications_job_id_fkey'
    ) THEN
        ALTER TABLE applications 
        ADD CONSTRAINT applications_job_id_fkey 
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Saved Jobs relationships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'saved_jobs_user_id_fkey'
    ) THEN
        ALTER TABLE saved_jobs 
        ADD CONSTRAINT saved_jobs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'saved_jobs_job_id_fkey'
    ) THEN
        ALTER TABLE saved_jobs 
        ADD CONSTRAINT saved_jobs_job_id_fkey 
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- User Skills relationships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_skills_user_id_fkey'
    ) THEN
        ALTER TABLE user_skills 
        ADD CONSTRAINT user_skills_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_skills_skill_id_fkey'
    ) THEN
        ALTER TABLE user_skills 
        ADD CONSTRAINT user_skills_skill_id_fkey 
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
    END IF;
END $$;

-- User Sessions relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_sessions_user_id_fkey'
    ) THEN
        ALTER TABLE user_sessions 
        ADD CONSTRAINT user_sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- User Verifications relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_verifications_user_id_fkey'
    ) THEN
        ALTER TABLE user_verifications 
        ADD CONSTRAINT user_verifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Messages relationships
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_sender_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_recipient_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_recipient_id_fkey 
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Notifications relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'notifications_user_id_fkey'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- CHECK CONSTRAINTS FOR DATA VALIDATION
-- =====================================================

-- User role validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_role_check 
        CHECK (role IN ('candidate', 'recruiter', 'educator', 'mentor', 'assessor', 'admin'));
    END IF;
END $$;

-- Email format validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_email_format_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_email_format_check 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
END $$;

-- Phone format validation (UAE format)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_phone_format_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_phone_format_check 
        CHECK (phone IS NULL OR phone ~* '^\+971[0-9]{8,9}$');
    END IF;
END $$;

-- Emirate validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_emirate_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_emirate_check 
        CHECK (emirate IS NULL OR emirate IN ('Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'));
    END IF;
END $$;

-- Gender validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_gender_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_gender_check 
        CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Other', 'Prefer not to say'));
    END IF;
END $$;

-- Experience years validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_experience_years_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_experience_years_check 
        CHECK (experience_years >= 0 AND experience_years <= 70);
    END IF;
END $$;

-- Candidate Profiles constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'candidate_profiles_experience_years_check'
    ) THEN
        ALTER TABLE candidate_profiles 
        ADD CONSTRAINT candidate_profiles_experience_years_check 
        CHECK (experience_years >= 0 AND experience_years <= 70);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'candidate_profiles_salary_expectation_check'
    ) THEN
        ALTER TABLE candidate_profiles 
        ADD CONSTRAINT candidate_profiles_salary_expectation_check 
        CHECK (salary_expectation IS NULL OR salary_expectation > 0);
    END IF;
END $$;

-- HR Profiles constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'hr_profiles_experience_years_check'
    ) THEN
        ALTER TABLE hr_profiles 
        ADD CONSTRAINT hr_profiles_experience_years_check 
        CHECK (years_of_experience >= 0 AND years_of_experience <= 70);
    END IF;
END $$;

-- Educator Profiles constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'educator_profiles_experience_years_check'
    ) THEN
        ALTER TABLE educator_profiles 
        ADD CONSTRAINT educator_profiles_experience_years_check 
        CHECK (years_of_experience >= 0 AND years_of_experience <= 70);
    END IF;
END $$;

-- Mentor Profiles constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'mentor_profiles_experience_years_check'
    ) THEN
        ALTER TABLE mentor_profiles 
        ADD CONSTRAINT mentor_profiles_experience_years_check 
        CHECK (years_of_experience >= 0 AND years_of_experience <= 70);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'mentor_profiles_rating_check'
    ) THEN
        ALTER TABLE mentor_profiles 
        ADD CONSTRAINT mentor_profiles_rating_check 
        CHECK (rating >= 0.0 AND rating <= 5.0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'mentor_profiles_hourly_rate_check'
    ) THEN
        ALTER TABLE mentor_profiles 
        ADD CONSTRAINT mentor_profiles_hourly_rate_check 
        CHECK (hourly_rate IS NULL OR hourly_rate >= 0);
    END IF;
END $$;

-- Assessor Profiles constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'assessor_profiles_experience_years_check'
    ) THEN
        ALTER TABLE assessor_profiles 
        ADD CONSTRAINT assessor_profiles_experience_years_check 
        CHECK (years_of_experience >= 0 AND years_of_experience <= 70);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'assessor_profiles_rating_check'
    ) THEN
        ALTER TABLE assessor_profiles 
        ADD CONSTRAINT assessor_profiles_rating_check 
        CHECK (rating >= 0.0 AND rating <= 5.0);
    END IF;
END $$;

-- Companies constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'companies_total_employees_check'
    ) THEN
        ALTER TABLE companies 
        ADD CONSTRAINT companies_total_employees_check 
        CHECK (total_employees >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'companies_uae_national_employees_check'
    ) THEN
        ALTER TABLE companies 
        ADD CONSTRAINT companies_uae_national_employees_check 
        CHECK (uae_national_employees >= 0 AND uae_national_employees <= total_employees);
    END IF;
END $$;

-- Courses constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'courses_duration_weeks_check'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_duration_weeks_check 
        CHECK (duration_weeks IS NULL OR duration_weeks > 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'courses_max_students_check'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_max_students_check 
        CHECK (max_students > 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'courses_current_enrollment_check'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_current_enrollment_check 
        CHECK (current_enrollment >= 0 AND current_enrollment <= max_students);
    END IF;
END $$;

-- Assessment constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'assessments_duration_minutes_check'
    ) THEN
        ALTER TABLE assessments 
        ADD CONSTRAINT assessments_duration_minutes_check 
        CHECK (duration_minutes > 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'assessments_passing_score_check'
    ) THEN
        ALTER TABLE assessments 
        ADD CONSTRAINT assessments_passing_score_check 
        CHECK (passing_score IS NULL OR (passing_score >= 0 AND passing_score <= 100));
    END IF;
END $$;

-- Assessment Questions constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'assessment_questions_points_possible_check'
    ) THEN
        ALTER TABLE assessment_questions 
        ADD CONSTRAINT assessment_questions_points_possible_check 
        CHECK (points_possible > 0);
    END IF;
END $$;

-- Assessment Responses constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'assessment_responses_percentage_score_check'
    ) THEN
        ALTER TABLE assessment_responses 
        ADD CONSTRAINT assessment_responses_percentage_score_check 
        CHECK (percentage_score IS NULL OR (percentage_score >= 0 AND percentage_score <= 100));
    END IF;
END $$;

-- =====================================================
-- UNIQUE CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Ensure unique email addresses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_email_unique'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_email_unique 
        UNIQUE (email);
    END IF;
END $$;

-- Ensure unique phone numbers (if provided)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_phone_unique'
    ) THEN
        CREATE UNIQUE INDEX users_phone_unique 
        ON users (phone) 
        WHERE phone IS NOT NULL;
    END IF;
END $$;

-- Ensure unique course codes within institutions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'courses_institution_code_unique'
    ) THEN
        ALTER TABLE courses 
        ADD CONSTRAINT courses_institution_code_unique 
        UNIQUE (institution_id, course_code);
    END IF;
END $$;

-- Ensure unique assessment codes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessments_code_unique'
    ) THEN
        ALTER TABLE assessments 
        ADD CONSTRAINT assessments_code_unique 
        UNIQUE (assessment_code);
    END IF;
END $$;

-- Ensure unique certificate numbers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'course_certificates_number_unique'
    ) THEN
        ALTER TABLE course_certificates 
        ADD CONSTRAINT course_certificates_number_unique 
        UNIQUE (certificate_number);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assessment_certifications_number_unique'
    ) THEN
        ALTER TABLE assessment_certifications 
        ADD CONSTRAINT assessment_certifications_number_unique 
        UNIQUE (certificate_number);
    END IF;
END $$;

-- =====================================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_email 
ON users (email) 
WHERE is_verified = true;

-- Index for published courses only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_published 
ON courses (institution_id, subject_area) 
WHERE is_published = true AND is_active = true;

-- Index for active job postings only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_active 
ON job_postings (company_id, created_at) 
WHERE is_active = true AND status = 'published';

-- Index for available mentors only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_available 
ON mentor_profiles (industry, rating) 
WHERE is_available = true AND is_verified = true;

-- Index for verified assessors only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessor_profiles_verified 
ON assessor_profiles (rating, total_assessments) 
WHERE is_verified = true AND is_available = true;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update company employee counts
CREATE OR REPLACE FUNCTION update_company_employee_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total employees count
    UPDATE companies 
    SET total_employees = (
        SELECT COUNT(*) 
        FROM hr_profiles 
        WHERE company_id = NEW.company_id
    )
    WHERE id = NEW.company_id;
    
    -- Update UAE national employees count
    UPDATE companies 
    SET uae_national_employees = (
        SELECT COUNT(*) 
        FROM hr_profiles hp
        JOIN users u ON hp.user_id = u.id
        WHERE hp.company_id = NEW.company_id 
        AND u.nationality = 'UAE'
    )
    WHERE id = NEW.company_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update company employee counts when HR profiles change
DROP TRIGGER IF EXISTS trigger_update_company_employee_counts ON hr_profiles;
CREATE TRIGGER trigger_update_company_employee_counts
    AFTER INSERT OR UPDATE OR DELETE ON hr_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_company_employee_counts();

-- Function to update course enrollment counts
CREATE OR REPLACE FUNCTION update_course_enrollment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE courses 
        SET current_enrollment = current_enrollment + 1
        WHERE id = NEW.course_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE courses 
        SET current_enrollment = current_enrollment - 1
        WHERE id = OLD.course_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update course enrollment counts
DROP TRIGGER IF EXISTS trigger_update_course_enrollment_counts ON course_enrollments;
CREATE TRIGGER trigger_update_course_enrollment_counts
    AFTER INSERT OR DELETE ON course_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_enrollment_counts();

-- Function to update mentor mentee counts
CREATE OR REPLACE FUNCTION update_mentor_mentee_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.match_status = 'active' THEN
        UPDATE mentor_profiles 
        SET current_mentees = current_mentees + 1
        WHERE id = NEW.mentor_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.match_status = 'active' AND NEW.match_status != 'active' THEN
            UPDATE mentor_profiles 
            SET current_mentees = current_mentees - 1
            WHERE id = NEW.mentor_id;
        ELSIF OLD.match_status != 'active' AND NEW.match_status = 'active' THEN
            UPDATE mentor_profiles 
            SET current_mentees = current_mentees + 1
            WHERE id = NEW.mentor_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.match_status = 'active' THEN
        UPDATE mentor_profiles 
        SET current_mentees = current_mentees - 1
        WHERE id = OLD.mentor_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update mentor mentee counts
DROP TRIGGER IF EXISTS trigger_update_mentor_mentee_counts ON mentorship_matching;
CREATE TRIGGER trigger_update_mentor_mentee_counts
    AFTER INSERT OR UPDATE OR DELETE ON mentorship_matching
    FOR EACH ROW
    EXECUTE FUNCTION update_mentor_mentee_counts();

-- Success message
SELECT 'Foreign key relationships and constraints added successfully!' as status;
