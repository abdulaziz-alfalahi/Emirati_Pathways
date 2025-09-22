-- =====================================================
-- ASSESSOR PERSONA AND SYSTEM TABLES DATABASE SCHEMA
-- Emirati Journey Platform - Complete Schema Implementation
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ASSESSOR PERSONA TABLES
-- =====================================================

-- Assessor Profiles (Depends on users)
CREATE TABLE IF NOT EXISTS assessor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_title VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    certification_body VARCHAR(255),
    assessor_level VARCHAR(100), -- junior, senior, lead, master
    years_of_experience INTEGER DEFAULT 0,
    specialization_areas JSONB DEFAULT '[]'::jsonb,
    assessment_types JSONB DEFAULT '[]'::jsonb, -- technical, behavioral, competency
    industries_covered JSONB DEFAULT '[]'::jsonb,
    languages_supported JSONB DEFAULT '[]'::jsonb,
    professional_summary TEXT,
    qualifications JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    assessment_philosophy TEXT,
    methodology_preferences JSONB DEFAULT '[]'::jsonb,
    availability_schedule JSONB DEFAULT '{}'::jsonb,
    hourly_rate DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'AED',
    max_assessments_per_day INTEGER DEFAULT 5,
    preferred_assessment_duration INTEGER DEFAULT 120, -- minutes
    is_available BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '[]'::jsonb,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_assessments INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Assessment Frameworks (Independent table)
CREATE TABLE IF NOT EXISTS assessment_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_name VARCHAR(255) NOT NULL,
    framework_code VARCHAR(100) UNIQUE NOT NULL,
    framework_version VARCHAR(50),
    description TEXT,
    framework_type VARCHAR(100) NOT NULL, -- competency, behavioral, technical, cognitive
    target_audience VARCHAR(255),
    assessment_domains JSONB DEFAULT '[]'::jsonb,
    scoring_methodology TEXT,
    validity_evidence TEXT,
    reliability_metrics JSONB DEFAULT '{}'::jsonb,
    normative_data JSONB DEFAULT '{}'::jsonb,
    cultural_considerations TEXT,
    uae_localization JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES assessor_profiles(id),
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    version_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments (Depends on assessment_frameworks and assessor_profiles)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_name VARCHAR(255) NOT NULL,
    assessment_code VARCHAR(100) UNIQUE NOT NULL,
    framework_id UUID NOT NULL REFERENCES assessment_frameworks(id),
    assessor_id UUID NOT NULL REFERENCES assessor_profiles(id),
    assessment_type VARCHAR(100) NOT NULL, -- individual, group, self, 360-degree
    assessment_category VARCHAR(100), -- recruitment, development, certification, performance
    description TEXT,
    instructions TEXT,
    duration_minutes INTEGER NOT NULL,
    total_questions INTEGER,
    passing_score DECIMAL(5,2),
    difficulty_level VARCHAR(50), -- beginner, intermediate, advanced, expert
    target_roles JSONB DEFAULT '[]'::jsonb,
    required_experience_years INTEGER DEFAULT 0,
    prerequisites JSONB DEFAULT '[]'::jsonb,
    assessment_format VARCHAR(100), -- online, in-person, hybrid, remote-proctored
    question_randomization BOOLEAN DEFAULT true,
    time_limit_enforced BOOLEAN DEFAULT true,
    retake_policy JSONB DEFAULT '{}'::jsonb,
    feedback_provided BOOLEAN DEFAULT true,
    certificate_issued BOOLEAN DEFAULT false,
    cost DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'AED',
    validity_period_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Questions (Depends on assessments)
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type VARCHAR(100) NOT NULL, -- multiple-choice, essay, practical, scenario
    question_text TEXT NOT NULL,
    question_context TEXT,
    difficulty_level VARCHAR(50), -- easy, medium, hard
    cognitive_level VARCHAR(100), -- knowledge, comprehension, application, analysis, synthesis, evaluation
    competency_measured VARCHAR(255),
    time_allocation_minutes INTEGER,
    points_possible DECIMAL(5,2) NOT NULL,
    answer_options JSONB DEFAULT '[]'::jsonb,
    correct_answers JSONB DEFAULT '[]'::jsonb,
    explanation TEXT,
    rubric JSONB DEFAULT '{}'::jsonb,
    media_attachments JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, question_number)
);

-- Assessment Responses (Depends on assessments and users)
CREATE TABLE IF NOT EXISTS assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    total_duration_minutes INTEGER,
    completion_status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned, expired
    responses JSONB DEFAULT '{}'::jsonb,
    raw_score DECIMAL(8,2),
    percentage_score DECIMAL(5,2),
    scaled_score DECIMAL(8,2),
    pass_fail_status VARCHAR(50), -- pass, fail, pending
    detailed_results JSONB DEFAULT '{}'::jsonb,
    competency_scores JSONB DEFAULT '{}'::jsonb,
    feedback_summary TEXT,
    recommendations TEXT,
    proctoring_data JSONB DEFAULT '{}'::jsonb,
    browser_data JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    location_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, candidate_user_id, session_id)
);

-- Assessment Results (Depends on assessment_responses)
CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES assessment_responses(id) ON DELETE CASCADE,
    result_type VARCHAR(100) NOT NULL, -- overall, competency, domain, question
    result_category VARCHAR(100),
    result_name VARCHAR(255),
    raw_score DECIMAL(8,2),
    percentage_score DECIMAL(5,2),
    scaled_score DECIMAL(8,2),
    percentile_rank DECIMAL(5,2),
    grade_level VARCHAR(50),
    proficiency_level VARCHAR(100),
    interpretation TEXT,
    recommendations TEXT,
    strengths JSONB DEFAULT '[]'::jsonb,
    areas_for_improvement JSONB DEFAULT '[]'::jsonb,
    comparative_data JSONB DEFAULT '{}'::jsonb,
    confidence_interval JSONB DEFAULT '{}'::jsonb,
    measurement_error DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Certifications (Depends on assessment_responses)
CREATE TABLE IF NOT EXISTS assessment_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES assessment_responses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    certification_level VARCHAR(100),
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    verification_code VARCHAR(100) UNIQUE,
    digital_badge_url VARCHAR(500),
    certificate_url VARCHAR(500),
    blockchain_hash VARCHAR(255),
    issuing_authority VARCHAR(255),
    accreditation_body VARCHAR(255),
    is_verified BOOLEAN DEFAULT true,
    verification_status VARCHAR(50) DEFAULT 'valid',
    renewal_requirements TEXT,
    continuing_education_credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Standards (UAE Assessment Standards)
CREATE TABLE IF NOT EXISTS assessment_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_code VARCHAR(100) UNIQUE NOT NULL,
    standard_name VARCHAR(255) NOT NULL,
    standard_category VARCHAR(100), -- technical, professional, academic, vocational
    issuing_body VARCHAR(255),
    description TEXT,
    assessment_criteria JSONB DEFAULT '[]'::jsonb,
    performance_indicators JSONB DEFAULT '[]'::jsonb,
    quality_assurance_requirements TEXT,
    compliance_requirements JSONB DEFAULT '[]'::jsonb,
    uae_national_qualifications_framework_level INTEGER,
    international_equivalencies JSONB DEFAULT '[]'::jsonb,
    effective_date DATE,
    review_date DATE,
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competency Frameworks (Depends on assessment_standards)
CREATE TABLE IF NOT EXISTS competency_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    framework_name VARCHAR(255) NOT NULL,
    framework_code VARCHAR(100) UNIQUE NOT NULL,
    industry VARCHAR(255),
    job_family VARCHAR(255),
    competency_model VARCHAR(100), -- behavioral, technical, functional, leadership
    description TEXT,
    competencies JSONB DEFAULT '[]'::jsonb,
    proficiency_levels JSONB DEFAULT '[]'::jsonb,
    assessment_methods JSONB DEFAULT '[]'::jsonb,
    development_pathways JSONB DEFAULT '[]'::jsonb,
    standard_id UUID REFERENCES assessment_standards(id),
    created_by UUID REFERENCES assessor_profiles(id),
    version VARCHAR(50) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Analytics (Depends on assessments, assessor_profiles, assessment_responses)
CREATE TABLE IF NOT EXISTS assessment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id),
    assessor_id UUID REFERENCES assessor_profiles(id),
    response_id UUID REFERENCES assessment_responses(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    metric_date DATE DEFAULT CURRENT_DATE,
    metric_category VARCHAR(100), -- performance, quality, usage, outcome
    additional_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certification Tracking (Depends on assessment_certifications and users)
CREATE TABLE IF NOT EXISTS certification_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certification_id UUID NOT NULL REFERENCES assessment_certifications(id) ON DELETE CASCADE,
    holder_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tracking_status VARCHAR(50) DEFAULT 'active', -- active, expired, suspended, revoked
    renewal_date DATE,
    renewal_reminder_sent BOOLEAN DEFAULT false,
    continuing_education_completed INTEGER DEFAULT 0,
    continuing_education_required INTEGER DEFAULT 0,
    compliance_status VARCHAR(50) DEFAULT 'compliant',
    audit_trail JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Scheduling (Depends on assessments, assessor_profiles, users)
CREATE TABLE IF NOT EXISTS assessment_scheduling (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    candidate_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessor_id UUID REFERENCES assessor_profiles(id),
    scheduled_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    assessment_mode VARCHAR(100) DEFAULT 'online', -- online, in-person, remote-proctored
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    special_accommodations TEXT,
    booking_status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, completed
    reminder_sent BOOLEAN DEFAULT false,
    check_in_time TIMESTAMP,
    no_show BOOLEAN DEFAULT false,
    rescheduling_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proctoring Sessions (Depends on assessment_responses)
CREATE TABLE IF NOT EXISTS proctoring_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES assessment_responses(id) ON DELETE CASCADE,
    proctor_type VARCHAR(100) NOT NULL, -- human, ai, hybrid
    proctor_id UUID REFERENCES assessor_profiles(id),
    session_recording_url VARCHAR(500),
    screen_recording_url VARCHAR(500),
    webcam_recording_url VARCHAR(500),
    audio_recording_url VARCHAR(500),
    keystroke_data JSONB DEFAULT '{}'::jsonb,
    mouse_movement_data JSONB DEFAULT '{}'::jsonb,
    browser_activity JSONB DEFAULT '{}'::jsonb,
    suspicious_activities JSONB DEFAULT '[]'::jsonb,
    integrity_score DECIMAL(5,2),
    violations_detected JSONB DEFAULT '[]'::jsonb,
    proctor_notes TEXT,
    session_quality VARCHAR(50), -- excellent, good, fair, poor
    technical_issues JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Feedback (Depends on assessment_responses and assessor_profiles)
CREATE TABLE IF NOT EXISTS assessment_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES assessment_responses(id) ON DELETE CASCADE,
    assessor_id UUID REFERENCES assessor_profiles(id),
    feedback_type VARCHAR(100) NOT NULL, -- overall, question-specific, competency-based
    feedback_category VARCHAR(100), -- strengths, improvements, recommendations
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_public BOOLEAN DEFAULT false,
    development_suggestions TEXT,
    resource_recommendations JSONB DEFAULT '[]'::jsonb,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CROSS-PERSONA INTEGRATION TABLES
-- =====================================================

-- Persona Interactions (Depends on users)
CREATE TABLE IF NOT EXISTS persona_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(100) NOT NULL, -- referral, collaboration, consultation, mentoring
    interaction_context VARCHAR(255),
    interaction_status VARCHAR(50) DEFAULT 'initiated', -- initiated, accepted, declined, completed
    interaction_data JSONB DEFAULT '{}'::jsonb,
    outcome_summary TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referral Networks (Depends on users)
CREATE TABLE IF NOT EXISTS referral_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_type VARCHAR(100) NOT NULL, -- job, course, mentor, assessment, service
    referral_context VARCHAR(255),
    target_entity_type VARCHAR(100), -- job_posting, course, mentor_profile, assessment
    target_entity_id UUID,
    referral_status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, completed
    referral_message TEXT,
    success_outcome BOOLEAN DEFAULT false,
    reward_earned DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'AED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collaboration Projects (Depends on users)
CREATE TABLE IF NOT EXISTS collaboration_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name VARCHAR(255) NOT NULL,
    project_description TEXT,
    project_type VARCHAR(100), -- research, development, training, assessment
    project_status VARCHAR(50) DEFAULT 'planning', -- planning, active, completed, cancelled
    start_date DATE,
    end_date DATE,
    project_lead_user_id UUID NOT NULL REFERENCES users(id),
    participants JSONB DEFAULT '[]'::jsonb,
    deliverables JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    resources_required JSONB DEFAULT '[]'::jsonb,
    budget DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'AED',
    success_metrics JSONB DEFAULT '[]'::jsonb,
    outcomes JSONB DEFAULT '[]'::jsonb,
    lessons_learned TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Sharing (Depends on users)
CREATE TABLE IF NOT EXISTS knowledge_sharing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL, -- article, video, presentation, case-study, best-practice
    content TEXT,
    content_url VARCHAR(500),
    author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_personas JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(100),
    difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
    estimated_reading_time INTEGER, -- minutes
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    moderation_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Professional Networks (Depends on users)
CREATE TABLE IF NOT EXISTS professional_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_type VARCHAR(100) DEFAULT 'professional', -- professional, mentor, colleague, industry
    connection_strength VARCHAR(50) DEFAULT 'weak', -- strong, medium, weak
    connection_context VARCHAR(255),
    mutual_connections INTEGER DEFAULT 0,
    interaction_frequency VARCHAR(50), -- daily, weekly, monthly, rarely
    last_interaction_date DATE,
    connection_status VARCHAR(50) DEFAULT 'active', -- active, inactive, blocked
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, connection_user_id)
);

-- Industry Insights (Depends on users)
CREATE TABLE IF NOT EXISTS industry_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_title VARCHAR(255) NOT NULL,
    insight_type VARCHAR(100) NOT NULL, -- trend, forecast, analysis, report
    industry VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    data_sources JSONB DEFAULT '[]'::jsonb,
    key_findings JSONB DEFAULT '[]'::jsonb,
    implications JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    author_user_id UUID REFERENCES users(id),
    publication_date DATE DEFAULT CURRENT_DATE,
    relevance_score DECIMAL(3,2),
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    verification_source VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cross Persona Analytics (Depends on users)
CREATE TABLE IF NOT EXISTS cross_persona_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    interaction_type VARCHAR(100) NOT NULL,
    source_persona VARCHAR(100) NOT NULL,
    target_persona VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    metric_date DATE DEFAULT CURRENT_DATE,
    additional_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ENHANCED SYSTEM TABLES
-- =====================================================

-- Audit Logs (Depends on users)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    severity VARCHAR(50) DEFAULT 'info', -- debug, info, warning, error, critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Privacy Settings (Depends on users)
CREATE TABLE IF NOT EXISTS data_privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_processing_consent BOOLEAN DEFAULT false,
    marketing_consent BOOLEAN DEFAULT false,
    analytics_consent BOOLEAN DEFAULT false,
    third_party_sharing_consent BOOLEAN DEFAULT false,
    data_retention_period INTEGER DEFAULT 2555, -- days (7 years)
    right_to_be_forgotten_requested BOOLEAN DEFAULT false,
    data_export_requested BOOLEAN DEFAULT false,
    consent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consent_version VARCHAR(50) DEFAULT '1.0',
    privacy_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- API Usage Logs
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    api_endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    request_headers JSONB DEFAULT '{}'::jsonb,
    request_body JSONB DEFAULT '{}'::jsonb,
    response_status INTEGER NOT NULL,
    response_time_ms INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    api_key_id VARCHAR(255),
    rate_limit_remaining INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Health Metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(50),
    metric_category VARCHAR(100), -- performance, availability, security, usage
    service_name VARCHAR(100),
    server_instance VARCHAR(100),
    threshold_warning DECIMAL(15,2),
    threshold_critical DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'normal', -- normal, warning, critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup Schedules
CREATE TABLE IF NOT EXISTS backup_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(100) NOT NULL, -- full, incremental, differential
    database_name VARCHAR(255),
    schedule_cron VARCHAR(100) NOT NULL,
    retention_days INTEGER DEFAULT 30,
    backup_location VARCHAR(500),
    encryption_enabled BOOLEAN DEFAULT true,
    compression_enabled BOOLEAN DEFAULT true,
    last_backup_date TIMESTAMP,
    last_backup_status VARCHAR(50),
    last_backup_size_mb DECIMAL(12,2),
    next_backup_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration Endpoints
CREATE TABLE IF NOT EXISTS integration_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_name VARCHAR(255) NOT NULL,
    endpoint_type VARCHAR(100) NOT NULL, -- webhook, api, service
    endpoint_url VARCHAR(500) NOT NULL,
    authentication_type VARCHAR(100), -- none, basic, bearer, oauth2, api-key
    authentication_config JSONB DEFAULT '{}'::jsonb,
    request_format VARCHAR(50) DEFAULT 'json', -- json, xml, form
    response_format VARCHAR(50) DEFAULT 'json',
    timeout_seconds INTEGER DEFAULT 30,
    retry_attempts INTEGER DEFAULT 3,
    rate_limit_per_minute INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    health_check_url VARCHAR(500),
    last_health_check TIMESTAMP,
    health_status VARCHAR(50) DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Automation
CREATE TABLE IF NOT EXISTS workflow_automation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name VARCHAR(255) NOT NULL,
    workflow_description TEXT,
    trigger_type VARCHAR(100) NOT NULL, -- event, schedule, manual, api
    trigger_config JSONB DEFAULT '{}'::jsonb,
    workflow_steps JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    error_handling JSONB DEFAULT '{}'::jsonb,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_execution TIMESTAMP,
    last_execution_status VARCHAR(50),
    average_execution_time_ms INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Management
CREATE TABLE IF NOT EXISTS content_management (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_title VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL, -- page, post, announcement, policy, faq
    content_slug VARCHAR(255) UNIQUE NOT NULL,
    content_body TEXT,
    content_summary TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords JSONB DEFAULT '[]'::jsonb,
    featured_image VARCHAR(500),
    content_status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    publication_date TIMESTAMP,
    expiry_date TIMESTAMP,
    author_user_id UUID REFERENCES users(id),
    editor_user_id UUID REFERENCES users(id),
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    seo_score INTEGER,
    accessibility_score INTEGER,
    content_version INTEGER DEFAULT 1,
    parent_content_id UUID REFERENCES content_management(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Localization Data
CREATE TABLE IF NOT EXISTS localization_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    locale_code VARCHAR(10) NOT NULL, -- en, ar, fr, etc.
    message_key VARCHAR(255) NOT NULL,
    message_value TEXT NOT NULL,
    message_context VARCHAR(255),
    message_category VARCHAR(100), -- ui, email, sms, notification
    is_rtl BOOLEAN DEFAULT false,
    character_encoding VARCHAR(50) DEFAULT 'UTF-8',
    translation_status VARCHAR(50) DEFAULT 'pending', -- pending, translated, reviewed, approved
    translator_notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(locale_code, message_key)
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name VARCHAR(255) UNIQUE NOT NULL,
    flag_description TEXT,
    flag_type VARCHAR(100) DEFAULT 'boolean', -- boolean, string, number, json
    default_value TEXT,
    is_enabled BOOLEAN DEFAULT false,
    target_audience JSONB DEFAULT '[]'::jsonb, -- user_ids, roles, percentages
    rollout_percentage DECIMAL(5,2) DEFAULT 0.00,
    environment VARCHAR(50) DEFAULT 'production', -- development, staging, production
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Success message
SELECT 'Assessor persona and system tables database schema created successfully!' as status;
