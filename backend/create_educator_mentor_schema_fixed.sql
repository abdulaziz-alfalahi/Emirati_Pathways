-- =====================================================
-- EDUCATOR AND MENTOR PERSONA DATABASE SCHEMA (FIXED)
-- Emirati Journey Platform - Complete Schema Implementation
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- EDUCATOR PERSONA TABLES (CORRECT DEPENDENCY ORDER)
-- =====================================================

-- Educational Institutions (Base table - no dependencies)
CREATE TABLE IF NOT EXISTS educational_institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    institution_type VARCHAR(100) NOT NULL, -- University, School, Training Center, etc.
    accreditation_level VARCHAR(100), -- MOE, KHDA, CAA, etc.
    license_number VARCHAR(100),
    establishment_year INTEGER,
    description TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    emirate VARCHAR(50),
    country VARCHAR(100) DEFAULT 'UAE',
    postal_code VARCHAR(20),
    logo VARCHAR(255),
    accreditation_documents JSONB DEFAULT '[]'::jsonb,
    facilities JSONB DEFAULT '[]'::jsonb,
    programs_offered JSONB DEFAULT '[]'::jsonb,
    student_capacity INTEGER DEFAULT 0,
    current_enrollment INTEGER DEFAULT 0,
    faculty_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_status VARCHAR(50) DEFAULT 'pending',
    social_media_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Educator Profiles (Depends on users and educational_institutions)
CREATE TABLE IF NOT EXISTS educator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES educational_institutions(id),
    position_title VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    years_of_experience INTEGER DEFAULT 0,
    education_level VARCHAR(100), -- Bachelor, Master, PhD, etc.
    teaching_subjects JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    specializations JSONB DEFAULT '[]'::jsonb,
    languages_taught JSONB DEFAULT '[]'::jsonb,
    teaching_methodology TEXT,
    professional_summary TEXT,
    research_interests TEXT,
    publications JSONB DEFAULT '[]'::jsonb,
    awards_recognition JSONB DEFAULT '[]'::jsonb,
    professional_memberships JSONB DEFAULT '[]'::jsonb,
    contact_preferences JSONB DEFAULT '{}'::jsonb,
    availability_schedule JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Courses and Programs (Depends on educational_institutions and educator_profiles)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES educational_institutions(id) ON DELETE CASCADE,
    educator_id UUID REFERENCES educator_profiles(id),
    course_code VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_description TEXT,
    course_level VARCHAR(100), -- Beginner, Intermediate, Advanced
    course_type VARCHAR(100), -- Academic, Professional, Certification
    subject_area VARCHAR(255),
    duration_weeks INTEGER,
    credit_hours INTEGER,
    prerequisites JSONB DEFAULT '[]'::jsonb,
    learning_outcomes JSONB DEFAULT '[]'::jsonb,
    course_materials JSONB DEFAULT '[]'::jsonb,
    assessment_methods JSONB DEFAULT '[]'::jsonb,
    grading_criteria JSONB DEFAULT '{}'::jsonb,
    max_students INTEGER DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    course_fee DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'AED',
    start_date DATE,
    end_date DATE,
    schedule JSONB DEFAULT '{}'::jsonb,
    delivery_mode VARCHAR(50) DEFAULT 'in-person', -- in-person, online, hybrid
    language VARCHAR(50) DEFAULT 'English',
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, course_code)
);

-- Course Modules (Depends on courses)
CREATE TABLE IF NOT EXISTS course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_number INTEGER NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    module_description TEXT,
    learning_objectives JSONB DEFAULT '[]'::jsonb,
    content_outline TEXT,
    duration_hours INTEGER,
    resources JSONB DEFAULT '[]'::jsonb,
    assignments JSONB DEFAULT '[]'::jsonb,
    is_mandatory BOOLEAN DEFAULT true,
    order_sequence INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, module_number)
);

-- Course Enrollments (Depends on courses and users)
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrollment_status VARCHAR(50) DEFAULT 'active', -- active, completed, withdrawn, suspended
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
    payment_amount DECIMAL(10,2),
    payment_date TIMESTAMP,
    completion_date TIMESTAMP,
    final_grade VARCHAR(10),
    grade_points DECIMAL(4,2),
    attendance_percentage DECIMAL(5,2),
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comments TEXT,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_user_id)
);

-- Course Assessments (Depends on courses and course_modules)
CREATE TABLE IF NOT EXISTS course_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES course_modules(id),
    assessment_name VARCHAR(255) NOT NULL,
    assessment_type VARCHAR(100) NOT NULL, -- quiz, assignment, project, exam
    description TEXT,
    instructions TEXT,
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    duration_minutes INTEGER,
    attempt_limit INTEGER DEFAULT 1,
    due_date TIMESTAMP,
    is_published BOOLEAN DEFAULT false,
    weight_percentage DECIMAL(5,2), -- Weight in final grade
    rubric JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course Certificates (Depends on course_enrollments)
CREATE TABLE IF NOT EXISTS course_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    certificate_type VARCHAR(100) DEFAULT 'completion', -- completion, achievement, participation
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    verification_code VARCHAR(100) UNIQUE,
    certificate_url VARCHAR(500),
    digital_signature TEXT,
    is_verified BOOLEAN DEFAULT true,
    verification_status VARCHAR(50) DEFAULT 'valid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Progress Tracking (Depends on course_enrollments and course_modules)
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
    module_id UUID REFERENCES course_modules(id),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, module_id)
);

-- Curriculum Standards (UAE MOE Standards) - Independent table
CREATE TABLE IF NOT EXISTS curriculum_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_code VARCHAR(100) UNIQUE NOT NULL,
    standard_name VARCHAR(255) NOT NULL,
    subject_area VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50),
    description TEXT,
    learning_objectives JSONB DEFAULT '[]'::jsonb,
    assessment_criteria JSONB DEFAULT '[]'::jsonb,
    moe_reference VARCHAR(255),
    effective_date DATE,
    revision_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Educator Qualifications (Depends on educator_profiles)
CREATE TABLE IF NOT EXISTS educator_qualifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    educator_id UUID NOT NULL REFERENCES educator_profiles(id) ON DELETE CASCADE,
    qualification_type VARCHAR(100) NOT NULL, -- degree, certification, license
    qualification_name VARCHAR(255) NOT NULL,
    issuing_institution VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    verification_status VARCHAR(50) DEFAULT 'pending',
    document_url VARCHAR(500),
    grade_gpa VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Institution Partnerships (Depends on educational_institutions)
CREATE TABLE IF NOT EXISTS institution_partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES educational_institutions(id) ON DELETE CASCADE,
    partner_type VARCHAR(100) NOT NULL, -- industry, government, international
    partner_name VARCHAR(255) NOT NULL,
    partnership_type VARCHAR(100), -- MOU, collaboration, exchange
    description TEXT,
    start_date DATE,
    end_date DATE,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    benefits JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Resources (Depends on courses, course_modules, educator_profiles)
CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id),
    module_id UUID REFERENCES course_modules(id),
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- document, video, audio, link, interactive
    resource_url VARCHAR(500),
    file_size_mb DECIMAL(10,2),
    description TEXT,
    access_level VARCHAR(50) DEFAULT 'enrolled', -- public, enrolled, premium
    download_allowed BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    tags JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES educator_profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Educator Analytics (Depends on educator_profiles and courses)
CREATE TABLE IF NOT EXISTS educator_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    educator_id UUID NOT NULL REFERENCES educator_profiles(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    metric_date DATE DEFAULT CURRENT_DATE,
    course_id UUID REFERENCES courses(id),
    additional_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MENTOR PERSONA TABLES
-- =====================================================

-- Mentor Profiles (Depends on users)
CREATE TABLE IF NOT EXISTS mentor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_title VARCHAR(255) NOT NULL,
    current_company VARCHAR(255),
    industry VARCHAR(255),
    years_of_experience INTEGER DEFAULT 0,
    expertise_areas JSONB DEFAULT '[]'::jsonb,
    mentoring_specializations JSONB DEFAULT '[]'::jsonb,
    languages_spoken JSONB DEFAULT '[]'::jsonb,
    professional_summary TEXT,
    mentoring_philosophy TEXT,
    achievements JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    education_background JSONB DEFAULT '[]'::jsonb,
    professional_memberships JSONB DEFAULT '[]'::jsonb,
    linkedin_profile VARCHAR(255),
    portfolio_url VARCHAR(255),
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'AED',
    availability_hours JSONB DEFAULT '{}'::jsonb,
    time_zone VARCHAR(100) DEFAULT 'Asia/Dubai',
    preferred_communication JSONB DEFAULT '[]'::jsonb,
    max_mentees INTEGER DEFAULT 5,
    current_mentees INTEGER DEFAULT 0,
    mentoring_approach VARCHAR(100), -- structured, flexible, goal-oriented
    session_duration_preference INTEGER DEFAULT 60, -- minutes
    is_available BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '[]'::jsonb,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Mentorship Programs (Depends on mentor_profiles)
CREATE TABLE IF NOT EXISTS mentorship_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_name VARCHAR(255) NOT NULL,
    program_description TEXT,
    program_type VARCHAR(100) NOT NULL, -- career, leadership, entrepreneurship, technical
    target_audience VARCHAR(255),
    duration_weeks INTEGER,
    session_frequency VARCHAR(100), -- weekly, bi-weekly, monthly
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    program_fee DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'AED',
    start_date DATE,
    end_date DATE,
    application_deadline DATE,
    eligibility_criteria JSONB DEFAULT '[]'::jsonb,
    learning_outcomes JSONB DEFAULT '[]'::jsonb,
    program_structure JSONB DEFAULT '[]'::jsonb,
    resources_provided JSONB DEFAULT '[]'::jsonb,
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    application_status VARCHAR(50) DEFAULT 'open', -- open, closed, full
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship Sessions (Depends on mentor_profiles, users, mentorship_programs)
CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    mentee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES mentorship_programs(id),
    session_title VARCHAR(255),
    session_description TEXT,
    session_type VARCHAR(100) DEFAULT 'one-on-one', -- one-on-one, group, workshop
    scheduled_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    session_status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
    meeting_link VARCHAR(500),
    meeting_platform VARCHAR(100), -- zoom, teams, google-meet, in-person
    agenda JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    action_items JSONB DEFAULT '[]'::jsonb,
    resources_shared JSONB DEFAULT '[]'::jsonb,
    mentor_feedback TEXT,
    mentee_feedback TEXT,
    session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship Goals (Depends on users, mentor_profiles, mentorship_programs)
CREATE TABLE IF NOT EXISTS mentorship_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES mentorship_programs(id),
    goal_title VARCHAR(255) NOT NULL,
    goal_description TEXT,
    goal_category VARCHAR(100), -- career, skill, personal, leadership
    priority_level VARCHAR(50) DEFAULT 'medium', -- high, medium, low
    target_date DATE,
    current_status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed, on_hold
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    milestones JSONB DEFAULT '[]'::jsonb,
    success_criteria TEXT,
    resources_needed JSONB DEFAULT '[]'::jsonb,
    challenges_faced TEXT,
    mentor_notes TEXT,
    is_achieved BOOLEAN DEFAULT false,
    achievement_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship Feedback (Depends on mentorship_sessions)
CREATE TABLE IF NOT EXISTS mentorship_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES mentorship_sessions(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL, -- mentor_to_mentee, mentee_to_mentor, program_feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    areas_of_improvement TEXT,
    strengths_highlighted TEXT,
    recommendations TEXT,
    would_recommend BOOLEAN,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship Matching (Depends on users and mentor_profiles)
CREATE TABLE IF NOT EXISTS mentorship_matching (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2), -- AI-calculated compatibility score
    match_criteria JSONB DEFAULT '{}'::jsonb,
    match_status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, active, completed
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    mentorship_type VARCHAR(100), -- formal, informal, program-based
    goals_alignment JSONB DEFAULT '[]'::jsonb,
    communication_preferences JSONB DEFAULT '{}'::jsonb,
    success_metrics JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mentee_user_id, mentor_id, match_date)
);

-- Mentorship Resources (Depends on mentor_profiles)
CREATE TABLE IF NOT EXISTS mentorship_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_title VARCHAR(255) NOT NULL,
    resource_description TEXT,
    resource_type VARCHAR(100) NOT NULL, -- article, video, book, tool, template
    resource_url VARCHAR(500),
    resource_category VARCHAR(100), -- career, leadership, skills, industry
    target_audience VARCHAR(100), -- mentors, mentees, both
    difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
    estimated_time_minutes INTEGER,
    tags JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES mentor_profiles(id),
    view_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship Analytics (Depends on mentor_profiles, users, mentorship_programs)
CREATE TABLE IF NOT EXISTS mentorship_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES mentor_profiles(id),
    mentee_user_id UUID REFERENCES users(id),
    program_id UUID REFERENCES mentorship_programs(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    metric_date DATE DEFAULT CURRENT_DATE,
    additional_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Career Development Plans (Depends on users and mentor_profiles)
CREATE TABLE IF NOT EXISTS career_development_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    plan_title VARCHAR(255) NOT NULL,
    current_position VARCHAR(255),
    target_position VARCHAR(255),
    target_industry VARCHAR(255),
    timeline_months INTEGER,
    skills_to_develop JSONB DEFAULT '[]'::jsonb,
    experience_to_gain JSONB DEFAULT '[]'::jsonb,
    education_requirements JSONB DEFAULT '[]'::jsonb,
    networking_goals JSONB DEFAULT '[]'::jsonb,
    action_steps JSONB DEFAULT '[]'::jsonb,
    progress_milestones JSONB DEFAULT '[]'::jsonb,
    current_progress DECIMAL(5,2) DEFAULT 0.00,
    plan_status VARCHAR(50) DEFAULT 'active', -- active, completed, on_hold, cancelled
    review_frequency VARCHAR(50) DEFAULT 'monthly',
    last_review_date DATE,
    next_review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship Schedules (Depends on mentor_profiles)
CREATE TABLE IF NOT EXISTS mentorship_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    max_sessions_per_slot INTEGER DEFAULT 1,
    session_duration_minutes INTEGER DEFAULT 60,
    buffer_time_minutes INTEGER DEFAULT 15,
    time_zone VARCHAR(100) DEFAULT 'Asia/Dubai',
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentor Specializations (Depends on mentor_profiles)
CREATE TABLE IF NOT EXISTS mentor_specializations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    specialization_name VARCHAR(255) NOT NULL,
    specialization_category VARCHAR(100), -- technical, leadership, industry, functional
    proficiency_level VARCHAR(50), -- expert, advanced, intermediate
    years_of_experience INTEGER,
    description TEXT,
    certifications JSONB DEFAULT '[]'::jsonb,
    success_stories TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mentorship Outcomes (Depends on mentorship_matching)
CREATE TABLE IF NOT EXISTS mentorship_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentorship_matching_id UUID NOT NULL REFERENCES mentorship_matching(id) ON DELETE CASCADE,
    outcome_type VARCHAR(100) NOT NULL, -- career_advancement, skill_development, goal_achievement
    outcome_description TEXT,
    achievement_date DATE,
    quantifiable_result VARCHAR(255),
    impact_level VARCHAR(50), -- high, medium, low
    success_metrics JSONB DEFAULT '{}'::jsonb,
    mentor_contribution TEXT,
    mentee_effort_level VARCHAR(50),
    external_factors TEXT,
    lessons_learned TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_source VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success message
SELECT 'Educator and Mentor persona database schema created successfully!' as status;
