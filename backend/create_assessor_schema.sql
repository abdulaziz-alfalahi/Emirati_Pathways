-- Assessor Persona Database Schema
-- Comprehensive schema for assessment planning, competency validation, and quality assurance

-- Assessment Templates Table
CREATE TABLE IF NOT EXISTS assessment_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL, -- 'technical', 'soft_skills', 'industry_specific', 'nqf_validation'
    competency_framework JSONB NOT NULL, -- Structured competency definitions
    assessment_criteria JSONB NOT NULL, -- Scoring criteria and rubrics
    duration_minutes INTEGER DEFAULT 60,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    nqf_level INTEGER CHECK (nqf_level BETWEEN 1 AND 10),
    industry_sector VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competency Models Table
CREATE TABLE IF NOT EXISTS competency_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    competency_type VARCHAR(50) NOT NULL, -- 'technical', 'behavioral', 'cognitive', 'leadership'
    competency_definition JSONB NOT NULL, -- Detailed competency structure
    assessment_methods JSONB, -- Available assessment methods for this competency
    proficiency_levels JSONB NOT NULL, -- Beginner, Intermediate, Advanced, Expert
    industry_relevance TEXT[],
    nqf_alignment JSONB, -- Mapping to UAE NQF levels
    validation_criteria JSONB,
    is_core_competency BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Banks Table
CREATE TABLE IF NOT EXISTS question_banks (
    id SERIAL PRIMARY KEY,
    competency_id INTEGER REFERENCES competency_models(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'essay', 'practical', 'scenario', 'portfolio'
    difficulty_level VARCHAR(20) NOT NULL, -- 'basic', 'intermediate', 'advanced', 'expert'
    answer_options JSONB, -- For multiple choice questions
    correct_answer JSONB, -- Correct answers or scoring rubric
    scoring_rubric JSONB NOT NULL, -- Detailed scoring criteria
    time_allocation INTEGER DEFAULT 5, -- Minutes allocated for this question
    tags TEXT[], -- Keywords for question categorization
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    assessment_code VARCHAR(50) UNIQUE NOT NULL, -- Unique identifier for tracking
    template_id INTEGER REFERENCES assessment_templates(id),
    candidate_id INTEGER REFERENCES users(id),
    assessor_id INTEGER REFERENCES users(id),
    assessment_title VARCHAR(255) NOT NULL,
    assessment_purpose TEXT,
    scheduled_date TIMESTAMP,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'under_review'
    assessment_mode VARCHAR(50) DEFAULT 'online', -- 'online', 'in_person', 'hybrid'
    location VARCHAR(255),
    special_requirements TEXT,
    total_score DECIMAL(5,2),
    percentage_score DECIMAL(5,2),
    pass_fail_status VARCHAR(20), -- 'pass', 'fail', 'pending'
    feedback TEXT,
    recommendations TEXT,
    next_steps TEXT,
    quality_score DECIMAL(5,2), -- Internal quality assessment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Sessions Table (for detailed session tracking)
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    session_type VARCHAR(50) NOT NULL, -- 'theoretical', 'practical', 'interview', 'portfolio_review'
    session_order INTEGER NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    session_data JSONB, -- Detailed session information and responses
    session_score DECIMAL(5,2),
    assessor_notes TEXT,
    technical_issues TEXT,
    session_recording_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Results Table
CREATE TABLE IF NOT EXISTS assessment_results (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    competency_id INTEGER REFERENCES competency_models(id),
    question_id INTEGER REFERENCES question_banks(id),
    candidate_response JSONB, -- Candidate's answer/response
    assessor_score DECIMAL(5,2),
    max_possible_score DECIMAL(5,2),
    scoring_rationale TEXT,
    time_taken INTEGER, -- Seconds taken to answer
    attempt_number INTEGER DEFAULT 1,
    is_flagged BOOLEAN DEFAULT false, -- For quality review
    flag_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Evidence Table (for portfolio and practical assessments)
CREATE TABLE IF NOT EXISTS assessment_evidence (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    evidence_type VARCHAR(50) NOT NULL, -- 'document', 'video', 'audio', 'image', 'code', 'project'
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    competency_demonstrated TEXT[],
    assessor_evaluation TEXT,
    evidence_score DECIMAL(5,2),
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Scheduling Table
CREATE TABLE IF NOT EXISTS assessment_scheduling (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    assessor_id INTEGER REFERENCES users(id),
    candidate_id INTEGER REFERENCES users(id),
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
    location VARCHAR(255),
    room_or_platform VARCHAR(100),
    preparation_time INTEGER DEFAULT 15, -- Minutes before assessment
    buffer_time INTEGER DEFAULT 15, -- Minutes after assessment
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'rescheduled', 'cancelled'
    reminder_sent BOOLEAN DEFAULT false,
    confirmation_received BOOLEAN DEFAULT false,
    rescheduling_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessor Profiles Table
CREATE TABLE IF NOT EXISTS assessor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    assessor_code VARCHAR(50) UNIQUE NOT NULL,
    specialization TEXT[] NOT NULL, -- Areas of expertise
    certification_level VARCHAR(50), -- 'junior', 'senior', 'lead', 'master'
    years_experience INTEGER,
    assessment_types TEXT[], -- Types of assessments qualified to conduct
    industry_expertise TEXT[],
    languages_spoken TEXT[],
    nqf_authorization_level INTEGER CHECK (nqf_authorization_level BETWEEN 1 AND 10),
    quality_rating DECIMAL(3,2) DEFAULT 5.00,
    total_assessments_conducted INTEGER DEFAULT 0,
    average_assessment_score DECIMAL(5,2),
    reliability_score DECIMAL(5,2) DEFAULT 5.00,
    last_calibration_date DATE,
    certification_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    availability_schedule JSONB, -- Weekly availability
    preferred_assessment_modes TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quality Assurance Metrics Table
CREATE TABLE IF NOT EXISTS quality_assurance_metrics (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    assessor_id INTEGER REFERENCES users(id),
    metric_type VARCHAR(50) NOT NULL, -- 'inter_rater_reliability', 'bias_detection', 'consistency', 'fairness'
    metric_value DECIMAL(5,2) NOT NULL,
    benchmark_value DECIMAL(5,2),
    variance_from_benchmark DECIMAL(5,2),
    quality_flag VARCHAR(20), -- 'excellent', 'good', 'acceptable', 'needs_improvement', 'critical'
    improvement_recommendations TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    review_notes TEXT,
    action_taken TEXT
);

-- Assessment Audit Trail Table
CREATE TABLE IF NOT EXISTS assessment_audit_trail (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    user_id INTEGER REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL, -- 'created', 'modified', 'scored', 'reviewed', 'approved', 'rejected'
    action_description TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Feedback Table
CREATE TABLE IF NOT EXISTS assessment_feedback (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    feedback_type VARCHAR(50) NOT NULL, -- 'candidate_feedback', 'assessor_feedback', 'system_feedback'
    feedback_provider INTEGER REFERENCES users(id),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    process_clarity_rating INTEGER CHECK (process_clarity_rating BETWEEN 1 AND 5),
    fairness_rating INTEGER CHECK (fairness_rating BETWEEN 1 AND 5),
    technical_quality_rating INTEGER CHECK (technical_quality_rating BETWEEN 1 AND 5),
    detailed_feedback TEXT,
    suggestions_for_improvement TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Calibration Table (for assessor standardization)
CREATE TABLE IF NOT EXISTS assessment_calibration (
    id SERIAL PRIMARY KEY,
    calibration_session_id VARCHAR(100) NOT NULL,
    assessor_id INTEGER REFERENCES users(id),
    reference_assessment_id INTEGER REFERENCES assessments(id),
    assessor_score DECIMAL(5,2),
    expert_score DECIMAL(5,2),
    score_difference DECIMAL(5,2),
    calibration_status VARCHAR(50), -- 'excellent', 'good', 'needs_improvement', 'requires_retraining'
    feedback_provided TEXT,
    improvement_plan TEXT,
    next_calibration_date DATE,
    conducted_by INTEGER REFERENCES users(id),
    conducted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_assessments_candidate_id ON assessments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assessor_id ON assessments(assessor_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_scheduled_date ON assessments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_competency_id ON assessment_results(competency_id);
CREATE INDEX IF NOT EXISTS idx_question_banks_competency_id ON question_banks(competency_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_assessor_id ON quality_assurance_metrics(assessor_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_assessment_id ON assessment_audit_trail(assessment_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_assessor_date ON assessment_scheduling(assessor_id, scheduled_date);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessment_templates_updated_at BEFORE UPDATE ON assessment_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competency_models_updated_at BEFORE UPDATE ON competency_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessor_profiles_updated_at BEFORE UPDATE ON assessor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessment_scheduling_updated_at BEFORE UPDATE ON assessment_scheduling FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
