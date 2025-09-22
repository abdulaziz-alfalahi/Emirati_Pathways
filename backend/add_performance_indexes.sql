-- =====================================================
-- PERFORMANCE INDEXES FOR EMIRATI JOURNEY PLATFORM
-- Comprehensive indexing strategy for optimal query performance
-- =====================================================

-- =====================================================
-- CORE USER AND AUTHENTICATION INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_hash ON users USING hash (email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_emirate ON users (emirate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_nationality ON users (nationality);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users (last_login);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_verified ON users (is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_full_name_gin ON users USING gin (to_tsvector('english', full_name));

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_verified ON users (role, is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_emirate_role ON users (emirate, role);

-- User sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions USING hash (session_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active ON user_sessions (user_id, expires_at) WHERE is_active = true;

-- User verifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_verifications_user_id ON user_verifications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_verifications_token ON user_verifications (verification_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_verifications_type ON user_verifications (verification_type);

-- =====================================================
-- CANDIDATE PERSONA INDEXES
-- =====================================================

-- Candidate profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_profiles_experience ON candidate_profiles (experience_years);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_profiles_salary ON candidate_profiles (salary_expectation);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_profiles_location ON candidate_profiles (preferred_location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_profiles_job_type ON candidate_profiles (preferred_job_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_profiles_skills_gin ON candidate_profiles USING gin (skills);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_profiles_languages_gin ON candidate_profiles USING gin (languages);

-- Skills indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_name ON skills (skill_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_category ON skills (category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_name_gin ON skills USING gin (to_tsvector('english', skill_name));

-- User skills indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skills_user_id ON user_skills (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skills_skill_id ON user_skills (skill_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skills_proficiency ON user_skills (proficiency_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skills_composite ON user_skills (user_id, skill_id, proficiency_level);

-- =====================================================
-- JOB POSTING AND APPLICATION INDEXES
-- =====================================================

-- Jobs table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_title_gin ON jobs USING gin (to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location ON jobs (location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_job_type ON jobs (job_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_experience_level ON jobs (experience_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_salary_range ON jobs (salary_min, salary_max);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON jobs (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_skills_gin ON jobs USING gin (required_skills);

-- Job postings indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_company_id ON job_postings (company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_created_by ON job_postings (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_status ON job_postings (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_created_at ON job_postings (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_title_gin ON job_postings USING gin (to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_location ON job_postings (location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_job_type ON job_postings (job_type);

-- Composite indexes for job search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_search ON job_postings (status, location, job_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_company_status ON job_postings (company_id, status);

-- Applications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_id ON applications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_id ON applications (job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_applied_at ON applications (applied_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_status ON applications (user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_status ON applications (job_id, status);

-- Job applications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_user_id ON job_applications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_status ON job_applications (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_created_at ON job_applications (created_at);

-- Saved jobs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs (job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_saved_at ON saved_jobs (saved_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_user_saved ON saved_jobs (user_id, saved_at);

-- =====================================================
-- HR/RECRUITER PERSONA INDEXES
-- =====================================================

-- HR profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_profiles_user_id ON hr_profiles (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_profiles_company_id ON hr_profiles (company_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_profiles_department ON hr_profiles (department);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_profiles_experience ON hr_profiles (years_of_experience);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hr_profiles_specializations_gin ON hr_profiles USING gin (specializations);

-- Companies indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name ON companies (company_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_industry ON companies (industry);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_size ON companies (company_size);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_location ON companies (city, emirate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_employees ON companies (total_employees);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_verified ON companies (is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_gin ON companies USING gin (to_tsvector('english', company_name));

-- Composite indexes for company search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search ON companies (industry, company_size, emirate, is_verified);

-- =====================================================
-- EDUCATOR PERSONA INDEXES
-- =====================================================

-- Educator profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_profiles_user_id ON educator_profiles (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_profiles_institution_id ON educator_profiles (institution_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_profiles_experience ON educator_profiles (years_of_experience);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_profiles_verified ON educator_profiles (is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_profiles_subjects_gin ON educator_profiles USING gin (teaching_subjects);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_profiles_specializations_gin ON educator_profiles USING gin (specializations);

-- Educational institutions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educational_institutions_name ON educational_institutions (name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educational_institutions_type ON educational_institutions (institution_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educational_institutions_emirate ON educational_institutions (emirate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educational_institutions_verified ON educational_institutions (is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educational_institutions_name_gin ON educational_institutions USING gin (to_tsvector('english', name));

-- Courses indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_institution_id ON courses (institution_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_educator_id ON courses (educator_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_subject_area ON courses (subject_area);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_level ON courses (course_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_published ON courses (is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_dates ON courses (start_date, end_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_name_gin ON courses USING gin (to_tsvector('english', course_name));

-- Course enrollments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments (course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments (student_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_enrollments_status ON course_enrollments (enrollment_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_enrollments_date ON course_enrollments (enrollment_date);

-- Course modules indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_modules_course_id ON course_modules (course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_modules_sequence ON course_modules (course_id, order_sequence);

-- Student progress indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_progress_enrollment_id ON student_progress (enrollment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_progress_module_id ON student_progress (module_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_progress_status ON student_progress (completion_status);

-- =====================================================
-- MENTOR PERSONA INDEXES
-- =====================================================

-- Mentor profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_industry ON mentor_profiles (industry);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_experience ON mentor_profiles (years_of_experience);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_rating ON mentor_profiles (rating);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_available ON mentor_profiles (is_available);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_verified ON mentor_profiles (is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_rate ON mentor_profiles (hourly_rate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_expertise_gin ON mentor_profiles USING gin (expertise_areas);

-- Composite indexes for mentor search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_search ON mentor_profiles (industry, is_available, is_verified, rating);

-- Mentorship sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_sessions_mentor_id ON mentorship_sessions (mentor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_sessions_mentee_id ON mentorship_sessions (mentee_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_sessions_date ON mentorship_sessions (scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_sessions_status ON mentorship_sessions (session_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_sessions_program_id ON mentorship_sessions (program_id);

-- Mentorship matching indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_matching_mentee_id ON mentorship_matching (mentee_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_matching_mentor_id ON mentorship_matching (mentor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_matching_status ON mentorship_matching (match_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_matching_score ON mentorship_matching (match_score);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_matching_active ON mentorship_matching (is_active);

-- Mentorship goals indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_goals_mentee_id ON mentorship_goals (mentee_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_goals_mentor_id ON mentorship_goals (mentor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_goals_status ON mentorship_goals (current_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_goals_category ON mentorship_goals (goal_category);

-- Career development plans indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_career_development_plans_mentee_id ON career_development_plans (mentee_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_career_development_plans_mentor_id ON career_development_plans (mentor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_career_development_plans_status ON career_development_plans (plan_status);

-- =====================================================
-- ASSESSOR PERSONA INDEXES
-- =====================================================

-- Assessor profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessor_profiles_user_id ON assessor_profiles (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessor_profiles_level ON assessor_profiles (assessor_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessor_profiles_experience ON assessor_profiles (years_of_experience);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessor_profiles_rating ON assessor_profiles (rating);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessor_profiles_available ON assessor_profiles (is_available);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessor_profiles_verified ON assessor_profiles (is_verified);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessor_profiles_specializations_gin ON assessor_profiles USING gin (specialization_areas);

-- Assessments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_framework_id ON assessments (framework_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_assessor_id ON assessments (assessor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_type ON assessments (assessment_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_category ON assessments (assessment_category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_published ON assessments (is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_difficulty ON assessments (difficulty_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_name_gin ON assessments USING gin (to_tsvector('english', assessment_name));

-- Assessment responses indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_responses_assessment_id ON assessment_responses (assessment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_responses_candidate_id ON assessment_responses (candidate_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_responses_status ON assessment_responses (completion_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_responses_start_time ON assessment_responses (start_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_responses_score ON assessment_responses (percentage_score);

-- Assessment questions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions (assessment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_questions_type ON assessment_questions (question_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_questions_difficulty ON assessment_questions (difficulty_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_questions_number ON assessment_questions (assessment_id, question_number);

-- Assessment results indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_results_response_id ON assessment_results (response_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_results_type ON assessment_results (result_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_results_category ON assessment_results (result_category);

-- Assessment certifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_certifications_response_id ON assessment_certifications (response_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_certifications_number ON assessment_certifications (certificate_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_certifications_issue_date ON assessment_certifications (issue_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_certifications_expiry ON assessment_certifications (expiry_date);

-- =====================================================
-- COMMUNICATION AND MESSAGING INDEXES
-- =====================================================

-- Messages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recipient_id ON messages (recipient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sent_at ON messages (sent_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_read_status ON messages (is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages (sender_id, recipient_id, sent_at);

-- Notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications (notification_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read_status ON notifications (is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, is_read, created_at);

-- =====================================================
-- CROSS-PERSONA INTEGRATION INDEXES
-- =====================================================

-- Persona interactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persona_interactions_initiator ON persona_interactions (initiator_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persona_interactions_target ON persona_interactions (target_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persona_interactions_type ON persona_interactions (interaction_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_persona_interactions_status ON persona_interactions (interaction_status);

-- Professional networks indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_professional_networks_user_id ON professional_networks (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_professional_networks_connection_id ON professional_networks (connection_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_professional_networks_type ON professional_networks (connection_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_professional_networks_status ON professional_networks (connection_status);

-- Knowledge sharing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_sharing_author ON knowledge_sharing (author_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_sharing_type ON knowledge_sharing (content_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_sharing_category ON knowledge_sharing (category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_sharing_published ON knowledge_sharing (is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_sharing_title_gin ON knowledge_sharing USING gin (to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_sharing_tags_gin ON knowledge_sharing USING gin (tags);

-- =====================================================
-- ANALYTICS AND REPORTING INDEXES
-- =====================================================

-- Application analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_analytics_user_id ON application_analytics (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_analytics_metric_name ON application_analytics (metric_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_analytics_date ON application_analytics (metric_date);

-- Educator analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_analytics_educator_id ON educator_analytics (educator_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_analytics_metric_name ON educator_analytics (metric_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_analytics_date ON educator_analytics (metric_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_educator_analytics_course_id ON educator_analytics (course_id);

-- Mentorship analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_analytics_mentor_id ON mentorship_analytics (mentor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_analytics_mentee_id ON mentorship_analytics (mentee_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_analytics_metric_name ON mentorship_analytics (metric_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentorship_analytics_date ON mentorship_analytics (metric_date);

-- Assessment analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_analytics_assessment_id ON assessment_analytics (assessment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_analytics_assessor_id ON assessment_analytics (assessor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_analytics_metric_name ON assessment_analytics (metric_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_analytics_date ON assessment_analytics (metric_date);

-- Cross persona analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cross_persona_analytics_user_id ON cross_persona_analytics (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cross_persona_analytics_interaction_type ON cross_persona_analytics (interaction_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cross_persona_analytics_personas ON cross_persona_analytics (source_persona, target_persona);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cross_persona_analytics_date ON cross_persona_analytics (metric_date);

-- =====================================================
-- SYSTEM AND AUDIT INDEXES
-- =====================================================

-- Audit logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs (entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_severity ON audit_logs (severity);

-- API usage logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs (api_endpoint);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_logs_status ON api_usage_logs (response_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs (created_at);

-- System health metrics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_health_metrics_name ON system_health_metrics (metric_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_health_metrics_category ON system_health_metrics (metric_category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_health_metrics_service ON system_health_metrics (service_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_health_metrics_created_at ON system_health_metrics (created_at);

-- Data privacy settings indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_privacy_settings_user_id ON data_privacy_settings (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_privacy_settings_consent_date ON data_privacy_settings (consent_date);

-- Content management indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_management_slug ON content_management (content_slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_management_type ON content_management (content_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_management_status ON content_management (content_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_management_author ON content_management (author_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_management_publication_date ON content_management (publication_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_management_title_gin ON content_management USING gin (to_tsvector('english', content_title));

-- =====================================================
-- SPECIALIZED INDEXES FOR SEARCH AND FILTERING
-- =====================================================

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search_gin ON users USING gin (
    to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(email, ''))
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search_gin ON jobs USING gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, ''))
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_search_gin ON companies USING gin (
    to_tsvector('english', coalesce(company_name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(industry, ''))
);

-- Geospatial indexes (if location coordinates are added in future)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_location_gist ON companies USING gist (location_point);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location_gist ON jobs USING gist (location_point);

-- =====================================================
-- PARTIAL INDEXES FOR ACTIVE RECORDS
-- =====================================================

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_verified ON users (role, emirate) 
WHERE is_verified = true AND is_active = true;

-- Published job postings only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_published_active ON job_postings (location, job_type, created_at) 
WHERE status = 'published' AND is_active = true;

-- Available mentors only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mentor_profiles_available_verified ON mentor_profiles (industry, rating, hourly_rate) 
WHERE is_available = true AND is_verified = true;

-- Active courses only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_active_published ON courses (subject_area, course_level, start_date) 
WHERE is_active = true AND is_published = true;

-- Pending applications only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_pending ON applications (job_id, applied_at) 
WHERE status = 'pending';

-- Unread notifications only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications (user_id, created_at) 
WHERE is_read = false;

-- =====================================================
-- EXPRESSION INDEXES FOR COMPUTED VALUES
-- =====================================================

-- Lowercase email for case-insensitive searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower ON users (lower(email));

-- Full name search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_full_name_lower ON users (lower(full_name));

-- Company name search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_lower ON companies (lower(company_name));

-- Job title search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_title_lower ON jobs (lower(title));

-- =====================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- =====================================================

-- User profile lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_lookup ON users (id) 
INCLUDE (email, full_name, role, emirate, is_verified);

-- Job listing with company info
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_postings_listing ON job_postings (status, created_at) 
INCLUDE (title, location, job_type, company_id);

-- Application tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_tracking ON applications (user_id, status) 
INCLUDE (job_id, applied_at, updated_at);

-- =====================================================
-- STATISTICS UPDATE
-- =====================================================

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE candidate_profiles;
ANALYZE hr_profiles;
ANALYZE companies;
ANALYZE jobs;
ANALYZE job_postings;
ANALYZE applications;
ANALYZE job_applications;
ANALYZE educator_profiles;
ANALYZE educational_institutions;
ANALYZE courses;
ANALYZE mentor_profiles;
ANALYZE mentorship_sessions;
ANALYZE assessor_profiles;
ANALYZE assessments;
ANALYZE assessment_responses;

-- Success message
SELECT 'Performance indexes created successfully! Database is optimized for all personas.' as status;
