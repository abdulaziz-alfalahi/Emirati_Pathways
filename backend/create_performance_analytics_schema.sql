-- Performance Analytics and Assessment Management Database Schema
-- Emirati Journey Platform - Educator Persona
-- Comprehensive assessment and analytics system
-- Created: September 20, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Student Assessment Results
CREATE TABLE IF NOT EXISTS student_assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessment_plans(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    educator_id UUID NOT NULL REFERENCES users(id),
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('not_started', 'in_progress', 'submitted', 'graded', 'returned')),
    raw_score DECIMAL(6,2),
    percentage_score DECIMAL(5,2),
    letter_grade VARCHAR(5),
    points_earned DECIMAL(6,2),
    total_points DECIMAL(6,2),
    time_taken_minutes INTEGER,
    attempt_number INTEGER DEFAULT 1,
    feedback TEXT,
    rubric_scores JSONB, -- Detailed rubric scoring
    question_responses JSONB, -- Individual question responses and scores
    strengths TEXT[],
    areas_for_improvement TEXT[],
    next_steps TEXT,
    is_excused BOOLEAN DEFAULT false,
    excuse_reason TEXT,
    late_submission BOOLEAN DEFAULT false,
    late_penalty_applied DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, student_id, attempt_number)
);

-- Assessment Question Bank
CREATE TABLE IF NOT EXISTS assessment_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering')),
    subject VARCHAR(100) NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    topic VARCHAR(200),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'advanced')),
    cognitive_level VARCHAR(50), -- Bloom's taxonomy level
    points_value DECIMAL(5,2) DEFAULT 1.00,
    time_limit_minutes INTEGER,
    question_options JSONB, -- For multiple choice, matching, etc.
    correct_answer JSONB,
    explanation TEXT,
    hints TEXT[],
    standards_alignment TEXT[], -- UAE standards codes
    language VARCHAR(20) DEFAULT 'English',
    arabic_version TEXT,
    media_attachments TEXT[], -- URLs to images, audio, video
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2), -- Percentage of students who answer correctly
    discrimination_index DECIMAL(5,4), -- Item discrimination measure
    created_by UUID REFERENCES users(id),
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Question Usage in Assessments
CREATE TABLE IF NOT EXISTS assessment_question_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessment_plans(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    points_allocated DECIMAL(5,2) NOT NULL,
    is_bonus BOOLEAN DEFAULT false,
    custom_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, question_id),
    UNIQUE(assessment_id, question_order)
);

-- Student Performance Analytics
CREATE TABLE IF NOT EXISTS student_performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    analysis_date DATE DEFAULT CURRENT_DATE,
    
    -- Overall Performance Metrics
    overall_average DECIMAL(5,2),
    overall_grade VARCHAR(5),
    class_rank INTEGER,
    class_percentile DECIMAL(5,2),
    
    -- Assessment Type Performance
    formative_average DECIMAL(5,2),
    summative_average DECIMAL(5,2),
    project_average DECIMAL(5,2),
    participation_score DECIMAL(5,2),
    
    -- Skill Area Performance
    skill_scores JSONB, -- Detailed skill-by-skill performance
    strength_areas TEXT[],
    improvement_areas TEXT[],
    
    -- Engagement Metrics
    attendance_percentage DECIMAL(5,2),
    assignment_completion_rate DECIMAL(5,2),
    participation_level INTEGER CHECK (participation_level BETWEEN 1 AND 5),
    engagement_trend VARCHAR(20) CHECK (engagement_trend IN ('improving', 'stable', 'declining')),
    
    -- Learning Progress
    learning_objectives_met INTEGER,
    learning_objectives_total INTEGER,
    standards_mastered INTEGER,
    standards_developing INTEGER,
    standards_beginning INTEGER,
    
    -- Behavioral Indicators
    homework_completion_rate DECIMAL(5,2),
    on_time_submission_rate DECIMAL(5,2),
    help_seeking_frequency INTEGER,
    peer_collaboration_rating INTEGER CHECK (peer_collaboration_rating BETWEEN 1 AND 5),
    
    -- Predictive Analytics
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    predicted_final_grade VARCHAR(5),
    intervention_recommended BOOLEAN DEFAULT false,
    intervention_type TEXT[],
    
    -- Cultural and Language Factors
    arabic_proficiency_level VARCHAR(20),
    english_proficiency_level VARCHAR(20),
    cultural_engagement_score INTEGER CHECK (cultural_engagement_score BETWEEN 1 AND 5),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, subject, analysis_date)
);

-- Class Performance Analytics
CREATE TABLE IF NOT EXISTS class_performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    educator_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    analysis_date DATE DEFAULT CURRENT_DATE,
    
    -- Class Size and Demographics
    total_students INTEGER,
    active_students INTEGER,
    male_students INTEGER,
    female_students INTEGER,
    uae_nationals INTEGER,
    expatriate_students INTEGER,
    
    -- Overall Class Performance
    class_average DECIMAL(5,2),
    median_score DECIMAL(5,2),
    highest_score DECIMAL(5,2),
    lowest_score DECIMAL(5,2),
    standard_deviation DECIMAL(5,4),
    
    -- Grade Distribution
    grade_a_count INTEGER,
    grade_b_count INTEGER,
    grade_c_count INTEGER,
    grade_d_count INTEGER,
    grade_f_count INTEGER,
    
    -- Assessment Performance by Type
    formative_class_average DECIMAL(5,2),
    summative_class_average DECIMAL(5,2),
    project_class_average DECIMAL(5,2),
    
    -- Learning Standards Performance
    standards_performance JSONB, -- Performance by standard
    mastery_rate_by_standard JSONB,
    
    -- Engagement Metrics
    average_attendance DECIMAL(5,2),
    average_participation DECIMAL(5,2),
    assignment_completion_rate DECIMAL(5,2),
    
    -- Risk Analysis
    students_at_risk INTEGER,
    students_excelling INTEGER,
    intervention_needed_count INTEGER,
    
    -- Comparative Analysis
    grade_level_comparison DECIMAL(5,2), -- Compared to other classes in same grade
    school_comparison DECIMAL(5,2), -- Compared to school average
    national_comparison DECIMAL(5,2), -- Compared to UAE national average
    
    -- Teaching Effectiveness Indicators
    learning_objective_achievement_rate DECIMAL(5,2),
    curriculum_completion_rate DECIMAL(5,2),
    differentiation_effectiveness DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, subject, analysis_date)
);

-- Assessment Analytics
CREATE TABLE IF NOT EXISTS assessment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessment_plans(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id),
    educator_id UUID NOT NULL REFERENCES users(id),
    analysis_date DATE DEFAULT CURRENT_DATE,
    
    -- Participation Metrics
    total_students INTEGER,
    students_completed INTEGER,
    students_in_progress INTEGER,
    students_not_started INTEGER,
    completion_rate DECIMAL(5,2),
    
    -- Score Distribution
    mean_score DECIMAL(5,2),
    median_score DECIMAL(5,2),
    mode_score DECIMAL(5,2),
    highest_score DECIMAL(5,2),
    lowest_score DECIMAL(5,2),
    standard_deviation DECIMAL(5,4),
    
    -- Grade Distribution
    grade_distribution JSONB,
    pass_rate DECIMAL(5,2),
    excellence_rate DECIMAL(5,2), -- Percentage scoring 90% or above
    
    -- Question Analysis
    question_statistics JSONB, -- Per-question statistics
    most_difficult_questions TEXT[],
    easiest_questions TEXT[],
    
    -- Time Analysis
    average_completion_time INTEGER, -- in minutes
    median_completion_time INTEGER,
    fastest_completion INTEGER,
    slowest_completion INTEGER,
    
    -- Learning Objectives Assessment
    objectives_mastery_rate JSONB,
    standards_achievement_rate JSONB,
    
    -- Item Analysis
    reliability_coefficient DECIMAL(5,4), -- Cronbach's alpha
    item_discrimination_average DECIMAL(5,4),
    item_difficulty_average DECIMAL(5,4),
    
    -- Comparative Analysis
    previous_assessment_comparison DECIMAL(5,2),
    class_trend VARCHAR(20) CHECK (class_trend IN ('improving', 'stable', 'declining')),
    
    -- Recommendations
    curriculum_adjustments_needed TEXT[],
    reteaching_topics TEXT[],
    enrichment_opportunities TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, analysis_date)
);

-- Learning Progress Tracking
CREATE TABLE IF NOT EXISTS learning_progress_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    standard_id UUID REFERENCES uae_curriculum_standards(id),
    learning_objective TEXT NOT NULL,
    skill_area VARCHAR(200),
    
    -- Progress Levels
    initial_level VARCHAR(20) CHECK (initial_level IN ('not_introduced', 'beginning', 'developing', 'proficient', 'advanced')),
    current_level VARCHAR(20) CHECK (current_level IN ('not_introduced', 'beginning', 'developing', 'proficient', 'advanced')),
    target_level VARCHAR(20) CHECK (target_level IN ('beginning', 'developing', 'proficient', 'advanced')),
    
    -- Assessment Data
    assessment_date DATE DEFAULT CURRENT_DATE,
    assessment_method VARCHAR(100),
    evidence_collected TEXT,
    score_achieved DECIMAL(5,2),
    score_possible DECIMAL(5,2),
    
    -- Progress Indicators
    progress_rate VARCHAR(20) CHECK (progress_rate IN ('accelerated', 'on_track', 'slow', 'stagnant', 'regressing')),
    mastery_achieved BOOLEAN DEFAULT false,
    mastery_date DATE,
    
    -- Support and Intervention
    support_provided TEXT,
    intervention_applied TEXT,
    accommodations_used TEXT[],
    
    -- Next Steps
    next_learning_goals TEXT,
    recommended_activities TEXT[],
    target_mastery_date DATE,
    
    -- Educator Notes
    educator_observations TEXT,
    parent_communication TEXT,
    student_self_reflection TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Benchmarks and Standards
CREATE TABLE IF NOT EXISTS performance_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    benchmark_name VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    benchmark_type VARCHAR(50) CHECK (benchmark_type IN ('national', 'emirate', 'school', 'international')),
    
    -- Benchmark Values
    excellent_threshold DECIMAL(5,2),
    proficient_threshold DECIMAL(5,2),
    developing_threshold DECIMAL(5,2),
    beginning_threshold DECIMAL(5,2),
    
    -- Statistical Data
    mean_score DECIMAL(5,2),
    standard_deviation DECIMAL(5,4),
    percentile_25 DECIMAL(5,2),
    percentile_50 DECIMAL(5,2),
    percentile_75 DECIMAL(5,2),
    percentile_90 DECIMAL(5,2),
    
    -- Metadata
    academic_year VARCHAR(20),
    sample_size INTEGER,
    data_source VARCHAR(200),
    collection_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_student_assessment_results_student_id ON student_assessment_results(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assessment_results_assessment_id ON student_assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_student_assessment_results_educator_id ON student_assessment_results(educator_id);
CREATE INDEX IF NOT EXISTS idx_student_assessment_results_submission_date ON student_assessment_results(submission_date);
CREATE INDEX IF NOT EXISTS idx_student_assessment_results_completion_status ON student_assessment_results(completion_status);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_subject_grade ON assessment_questions(subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_topic ON assessment_questions(topic);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_difficulty ON assessment_questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_type ON assessment_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_tags ON assessment_questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_standards ON assessment_questions USING GIN(standards_alignment);

CREATE INDEX IF NOT EXISTS idx_student_performance_analytics_student_id ON student_performance_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_student_performance_analytics_class_id ON student_performance_analytics(class_id);
CREATE INDEX IF NOT EXISTS idx_student_performance_analytics_subject ON student_performance_analytics(subject);
CREATE INDEX IF NOT EXISTS idx_student_performance_analytics_analysis_date ON student_performance_analytics(analysis_date);
CREATE INDEX IF NOT EXISTS idx_student_performance_analytics_risk_level ON student_performance_analytics(risk_level);

CREATE INDEX IF NOT EXISTS idx_class_performance_analytics_class_id ON class_performance_analytics(class_id);
CREATE INDEX IF NOT EXISTS idx_class_performance_analytics_educator_id ON class_performance_analytics(educator_id);
CREATE INDEX IF NOT EXISTS idx_class_performance_analytics_subject ON class_performance_analytics(subject);
CREATE INDEX IF NOT EXISTS idx_class_performance_analytics_analysis_date ON class_performance_analytics(analysis_date);

CREATE INDEX IF NOT EXISTS idx_assessment_analytics_assessment_id ON assessment_analytics(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_class_id ON assessment_analytics(class_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_educator_id ON assessment_analytics(educator_id);
CREATE INDEX IF NOT EXISTS idx_assessment_analytics_analysis_date ON assessment_analytics(analysis_date);

CREATE INDEX IF NOT EXISTS idx_learning_progress_tracking_student_id ON learning_progress_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_tracking_class_id ON learning_progress_tracking(class_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_tracking_standard_id ON learning_progress_tracking(standard_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_tracking_assessment_date ON learning_progress_tracking(assessment_date);
CREATE INDEX IF NOT EXISTS idx_learning_progress_tracking_current_level ON learning_progress_tracking(current_level);

CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_subject_grade ON performance_benchmarks(subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_type ON performance_benchmarks(benchmark_type);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_academic_year ON performance_benchmarks(academic_year);

-- Create triggers for updating timestamps
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Create triggers only if the function exists
        DROP TRIGGER IF EXISTS update_student_assessment_results_updated_at ON student_assessment_results;
        CREATE TRIGGER update_student_assessment_results_updated_at BEFORE UPDATE ON student_assessment_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_assessment_questions_updated_at ON assessment_questions;
        CREATE TRIGGER update_assessment_questions_updated_at BEFORE UPDATE ON assessment_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_student_performance_analytics_updated_at ON student_performance_analytics;
        CREATE TRIGGER update_student_performance_analytics_updated_at BEFORE UPDATE ON student_performance_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_class_performance_analytics_updated_at ON class_performance_analytics;
        CREATE TRIGGER update_class_performance_analytics_updated_at BEFORE UPDATE ON class_performance_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_assessment_analytics_updated_at ON assessment_analytics;
        CREATE TRIGGER update_assessment_analytics_updated_at BEFORE UPDATE ON assessment_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_learning_progress_tracking_updated_at ON learning_progress_tracking;
        CREATE TRIGGER update_learning_progress_tracking_updated_at BEFORE UPDATE ON learning_progress_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_performance_benchmarks_updated_at ON performance_benchmarks;
        CREATE TRIGGER update_performance_benchmarks_updated_at BEFORE UPDATE ON performance_benchmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample performance benchmarks for UAE
INSERT INTO performance_benchmarks (
    benchmark_name, subject, grade_level, benchmark_type,
    excellent_threshold, proficient_threshold, developing_threshold, beginning_threshold,
    mean_score, standard_deviation, academic_year, sample_size, data_source
) VALUES
('UAE National Mathematics Grade 5', 'Mathematics', 5, 'national', 90.0, 75.0, 60.0, 45.0, 72.5, 12.8, '2024-2025', 15000, 'UAE Ministry of Education'),
('UAE National Science Grade 5', 'Science', 5, 'national', 88.0, 73.0, 58.0, 43.0, 70.2, 13.5, '2024-2025', 15000, 'UAE Ministry of Education'),
('UAE National English Grade 5', 'English', 5, 'national', 85.0, 70.0, 55.0, 40.0, 68.8, 14.2, '2024-2025', 15000, 'UAE Ministry of Education'),
('UAE National Arabic Grade 5', 'Arabic', 5, 'national', 92.0, 78.0, 63.0, 48.0, 75.3, 11.9, '2024-2025', 15000, 'UAE Ministry of Education'),
('UAE National Islamic Studies Grade 5', 'Islamic Studies', 5, 'national', 95.0, 82.0, 67.0, 52.0, 78.6, 10.4, '2024-2025', 15000, 'UAE Ministry of Education')
ON CONFLICT DO NOTHING;

-- Insert sample assessment questions
DO $$
DECLARE
    educator_uuid UUID;
BEGIN
    -- Get a sample educator ID
    SELECT id INTO educator_uuid FROM users LIMIT 1;
    
    -- Insert sample questions if educator exists
    IF educator_uuid IS NOT NULL THEN
        INSERT INTO assessment_questions (
            question_text, question_type, subject, grade_level, topic,
            difficulty_level, cognitive_level, points_value,
            question_options, correct_answer, explanation,
            standards_alignment, created_by
        ) VALUES
        (
            'What is the place value of the digit 7 in the number 47,832?',
            'multiple_choice',
            'Mathematics',
            5,
            'Place Value',
            'medium',
            'Understanding',
            2.0,
            '{"options": ["7", "70", "700", "7000"]}',
            '{"correct": "7000", "explanation": "The digit 7 is in the thousands place"}',
            'The digit 7 is in the thousands place, so its place value is 7,000.',
            ARRAY['UAE-MATH-G5-1.1'],
            educator_uuid
        ),
        (
            'Which of the following is a characteristic of living things?',
            'multiple_choice',
            'Science',
            5,
            'Living Things',
            'easy',
            'Knowledge',
            1.0,
            '{"options": ["They grow and develop", "They are made of metal", "They never change", "They cannot move"]}',
            '{"correct": "They grow and develop"}',
            'Living things grow and develop throughout their life cycle.',
            ARRAY['UAE-SCI-G5-2.1'],
            educator_uuid
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

COMMENT ON TABLE student_assessment_results IS 'Individual student results for assessments with detailed scoring and feedback';
COMMENT ON TABLE assessment_questions IS 'Question bank for creating assessments with UAE standards alignment';
COMMENT ON TABLE student_performance_analytics IS 'Comprehensive analytics for individual student performance tracking';
COMMENT ON TABLE class_performance_analytics IS 'Class-level performance analytics and comparative analysis';
COMMENT ON TABLE assessment_analytics IS 'Assessment-specific analytics including item analysis and reliability measures';
COMMENT ON TABLE learning_progress_tracking IS 'Detailed tracking of student progress toward learning objectives';
COMMENT ON TABLE performance_benchmarks IS 'Performance benchmarks and standards for comparative analysis';
