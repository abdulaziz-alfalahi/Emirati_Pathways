-- Additional Database Schema for NQF Integration and Quality Assurance
-- Extends the assessor schema with NQF and quality assurance tables

-- NQF Qualifications Table
CREATE TABLE IF NOT EXISTS nqf_qualifications (
    id SERIAL PRIMARY KEY,
    qualification_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    nqf_level INTEGER NOT NULL CHECK (nqf_level BETWEEN 1 AND 10),
    qualification_type VARCHAR(50) NOT NULL, -- 'academic', 'vocational', 'professional', 'skills_based'
    credit_points INTEGER NOT NULL,
    learning_outcomes JSONB NOT NULL,
    competency_requirements JSONB,
    industry_alignment TEXT[],
    progression_pathways JSONB,
    recognition_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'suspended', 'revoked'
    issuing_authority VARCHAR(255) NOT NULL,
    validity_period_months INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NQF Competency Mappings Table
CREATE TABLE IF NOT EXISTS nqf_competency_mappings (
    id SERIAL PRIMARY KEY,
    competency_id INTEGER REFERENCES competency_models(id),
    nqf_level INTEGER NOT NULL CHECK (nqf_level BETWEEN 1 AND 10),
    mapping_score DECIMAL(5,2) NOT NULL,
    evidence_quality DECIMAL(3,2) NOT NULL,
    mapping_confidence DECIMAL(3,2) NOT NULL,
    mapping_data JSONB NOT NULL,
    mapped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(competency_id)
);

-- Digital Credentials Table
CREATE TABLE IF NOT EXISTS digital_credentials (
    id SERIAL PRIMARY KEY,
    credential_id VARCHAR(100) UNIQUE NOT NULL,
    holder_id INTEGER REFERENCES users(id),
    qualification_id INTEGER REFERENCES nqf_qualifications(id),
    issued_date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    verification_hash VARCHAR(255) NOT NULL,
    blockchain_reference VARCHAR(255),
    issuer_signature VARCHAR(255) NOT NULL,
    credential_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'revoked', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credential Verification Log Table
CREATE TABLE IF NOT EXISTS credential_verification_log (
    id SERIAL PRIMARY KEY,
    credential_id VARCHAR(100) REFERENCES digital_credentials(credential_id),
    verifier_ip INET,
    verification_result BOOLEAN NOT NULL,
    verification_details JSONB,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessor Bias Analysis Table
CREATE TABLE IF NOT EXISTS assessor_bias_analysis (
    id SERIAL PRIMARY KEY,
    assessor_id INTEGER REFERENCES users(id),
    bias_type VARCHAR(50) NOT NULL, -- 'gender_bias', 'age_bias', 'nationality_bias', etc.
    detected BOOLEAN NOT NULL,
    severity_level VARCHAR(20) NOT NULL, -- 'none', 'low', 'medium', 'high'
    statistical_significance DECIMAL(5,4),
    affected_groups TEXT[],
    recommendations JSONB,
    analysis_data JSONB NOT NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessor_id, bias_type)
);

-- Assessor Quality Scores Table
CREATE TABLE IF NOT EXISTS assessor_quality_scores (
    id SERIAL PRIMARY KEY,
    assessor_id INTEGER REFERENCES users(id) UNIQUE,
    overall_bias_score DECIMAL(3,2) DEFAULT 0.00,
    reliability_score DECIMAL(3,2) DEFAULT 5.00,
    consistency_score DECIMAL(3,2) DEFAULT 5.00,
    fairness_score DECIMAL(3,2) DEFAULT 5.00,
    last_analyzed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Quality Reviews Table
CREATE TABLE IF NOT EXISTS assessment_quality_reviews (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    reviewer_id INTEGER REFERENCES users(id),
    review_type VARCHAR(50) NOT NULL, -- 'peer_review', 'quality_audit', 'bias_check'
    overall_quality_score DECIMAL(3,2) NOT NULL,
    quality_dimensions JSONB NOT NULL, -- Detailed scoring by dimension
    issues_identified JSONB,
    recommendations JSONB,
    review_status VARCHAR(50) DEFAULT 'completed', -- 'in_progress', 'completed', 'escalated'
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NQF Qualification Pathways Table
CREATE TABLE IF NOT EXISTS nqf_qualification_pathways (
    id SERIAL PRIMARY KEY,
    from_qualification_id INTEGER REFERENCES nqf_qualifications(id),
    to_qualification_id INTEGER REFERENCES nqf_qualifications(id),
    pathway_type VARCHAR(50) NOT NULL, -- 'vertical_progression', 'horizontal_specialization', 'lateral_transfer'
    prerequisites JSONB,
    credit_transfer_rules JSONB,
    estimated_duration_months INTEGER,
    pathway_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Calibration Sessions Table
CREATE TABLE IF NOT EXISTS assessment_calibration_sessions (
    id SERIAL PRIMARY KEY,
    session_code VARCHAR(50) UNIQUE NOT NULL,
    session_title VARCHAR(255) NOT NULL,
    competency_focus INTEGER REFERENCES competency_models(id),
    facilitator_id INTEGER REFERENCES users(id),
    session_date DATE NOT NULL,
    session_duration_minutes INTEGER DEFAULT 120,
    participant_count INTEGER DEFAULT 0,
    calibration_materials JSONB,
    session_outcomes JSONB,
    average_agreement_score DECIMAL(3,2),
    session_status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calibration Session Participants Table
CREATE TABLE IF NOT EXISTS calibration_session_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES assessment_calibration_sessions(id),
    assessor_id INTEGER REFERENCES users(id),
    pre_calibration_score DECIMAL(5,2),
    post_calibration_score DECIMAL(5,2),
    agreement_with_standard DECIMAL(3,2),
    improvement_areas TEXT[],
    participation_status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'completed', 'no_show'
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, assessor_id)
);

-- Quality Assurance Alerts Table
CREATE TABLE IF NOT EXISTS quality_assurance_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'bias_detected', 'low_reliability', 'inconsistent_scoring'
    severity_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    assessor_id INTEGER REFERENCES users(id),
    assessment_id INTEGER REFERENCES assessments(id),
    alert_description TEXT NOT NULL,
    alert_data JSONB,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

-- NQF Industry Standards Table
CREATE TABLE IF NOT EXISTS nqf_industry_standards (
    id SERIAL PRIMARY KEY,
    industry_sector VARCHAR(100) NOT NULL,
    nqf_level INTEGER NOT NULL CHECK (nqf_level BETWEEN 1 AND 10),
    role_category VARCHAR(100) NOT NULL, -- 'entry_level', 'technical', 'professional', 'leadership'
    competency_requirements JSONB NOT NULL,
    minimum_credit_points INTEGER NOT NULL,
    typical_job_titles TEXT[],
    salary_range_aed JSONB, -- {min: 50000, max: 80000}
    career_progression_paths JSONB,
    industry_certifications TEXT[],
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    UNIQUE(industry_sector, nqf_level, role_category)
);

-- Assessment Method Effectiveness Table
CREATE TABLE IF NOT EXISTS assessment_method_effectiveness (
    id SERIAL PRIMARY KEY,
    assessment_method VARCHAR(50) NOT NULL, -- 'multiple_choice', 'practical', 'portfolio', etc.
    competency_type VARCHAR(50) NOT NULL,
    effectiveness_score DECIMAL(3,2) NOT NULL,
    reliability_coefficient DECIMAL(3,2),
    validity_coefficient DECIMAL(3,2),
    candidate_satisfaction DECIMAL(3,2),
    assessor_confidence DECIMAL(3,2),
    time_efficiency DECIMAL(3,2),
    cost_effectiveness DECIMAL(3,2),
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    sample_size INTEGER NOT NULL,
    analysis_notes TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_nqf_qualifications_level ON nqf_qualifications(nqf_level);
CREATE INDEX IF NOT EXISTS idx_nqf_qualifications_type ON nqf_qualifications(qualification_type);
CREATE INDEX IF NOT EXISTS idx_nqf_qualifications_industry ON nqf_qualifications USING GIN(industry_alignment);
CREATE INDEX IF NOT EXISTS idx_digital_credentials_holder ON digital_credentials(holder_id);
CREATE INDEX IF NOT EXISTS idx_digital_credentials_status ON digital_credentials(status);
CREATE INDEX IF NOT EXISTS idx_digital_credentials_expiry ON digital_credentials(expiry_date);
CREATE INDEX IF NOT EXISTS idx_bias_analysis_assessor ON assessor_bias_analysis(assessor_id);
CREATE INDEX IF NOT EXISTS idx_bias_analysis_type ON assessor_bias_analysis(bias_type);
CREATE INDEX IF NOT EXISTS idx_quality_scores_assessor ON assessor_quality_scores(assessor_id);
CREATE INDEX IF NOT EXISTS idx_quality_reviews_assessment ON assessment_quality_reviews(assessment_id);
CREATE INDEX IF NOT EXISTS idx_quality_alerts_assessor ON quality_assurance_alerts(assessor_id);
CREATE INDEX IF NOT EXISTS idx_quality_alerts_status ON quality_assurance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_calibration_participants_assessor ON calibration_session_participants(assessor_id);
CREATE INDEX IF NOT EXISTS idx_nqf_mappings_competency ON nqf_competency_mappings(competency_id);
CREATE INDEX IF NOT EXISTS idx_nqf_mappings_level ON nqf_competency_mappings(nqf_level);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_nqf_qualifications_updated_at 
    BEFORE UPDATE ON nqf_qualifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_credentials_updated_at 
    BEFORE UPDATE ON digital_credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessor_quality_scores_updated_at 
    BEFORE UPDATE ON assessor_quality_scores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW assessor_quality_summary AS
SELECT 
    u.id as assessor_id,
    u.full_name as assessor_name,
    ap.specialization,
    ap.certification_level,
    aqs.overall_bias_score,
    aqs.reliability_score,
    aqs.consistency_score,
    aqs.fairness_score,
    COUNT(a.id) as total_assessments,
    AVG(a.total_score) as average_assessment_score,
    COUNT(CASE WHEN qam.quality_flag = 'excellent' THEN 1 END) as excellent_assessments,
    COUNT(CASE WHEN qam.quality_flag IN ('needs_improvement', 'critical') THEN 1 END) as flagged_assessments
FROM users u
JOIN assessor_profiles ap ON u.id = ap.user_id
LEFT JOIN assessor_quality_scores aqs ON u.id = aqs.assessor_id
LEFT JOIN assessments a ON u.id = a.assessor_id
LEFT JOIN quality_assurance_metrics qam ON a.id = qam.assessment_id
WHERE u.role = 'assessor'
GROUP BY u.id, u.full_name, ap.specialization, ap.certification_level, 
         aqs.overall_bias_score, aqs.reliability_score, aqs.consistency_score, aqs.fairness_score;

CREATE OR REPLACE VIEW nqf_qualification_overview AS
SELECT 
    nq.id,
    nq.qualification_code,
    nq.title,
    nq.nqf_level,
    nq.qualification_type,
    nq.credit_points,
    nq.industry_alignment,
    nq.recognition_status,
    COUNT(dc.id) as credentials_issued,
    COUNT(CASE WHEN dc.status = 'active' THEN 1 END) as active_credentials,
    AVG(CASE WHEN dc.expiry_date > CURRENT_DATE THEN 1.0 ELSE 0.0 END) as validity_rate
FROM nqf_qualifications nq
LEFT JOIN digital_credentials dc ON nq.id = dc.qualification_id
GROUP BY nq.id, nq.qualification_code, nq.title, nq.nqf_level, 
         nq.qualification_type, nq.credit_points, nq.industry_alignment, nq.recognition_status;

-- Insert sample NQF level data
INSERT INTO nqf_qualifications (qualification_code, title, nqf_level, qualification_type, credit_points, learning_outcomes, industry_alignment, issuing_authority) VALUES
('UAE-NQF-L6-TEC-202509', 'Bachelor of Engineering Technology', 6, 'academic', 180, '["Systematic knowledge of engineering principles", "Professional engineering skills", "Research and analysis capabilities"]', ARRAY['oil_and_gas', 'technology'], 'UAE Ministry of Education'),
('UAE-NQF-L5-VOC-202509', 'Advanced Diploma in Digital Marketing', 5, 'vocational', 120, '["Comprehensive digital marketing knowledge", "Advanced campaign management", "Strategic marketing planning"]', ARRAY['technology', 'finance'], 'UAE Vocational Education Authority'),
('UAE-NQF-L7-PRO-202509', 'Professional Certificate in Project Management', 7, 'professional', 60, '["Advanced project management expertise", "Leadership and team management", "Strategic project planning"]', ARRAY['oil_and_gas', 'finance', 'technology'], 'UAE Professional Development Institute'),
('UAE-NQF-L4-SKL-202509', 'Higher Diploma in Customer Service Excellence', 4, 'skills_based', 90, '["Customer service expertise", "Communication skills", "Problem-solving abilities"]', ARRAY['finance', 'healthcare'], 'UAE Skills Development Council');

-- Insert sample industry standards
INSERT INTO nqf_industry_standards (industry_sector, nqf_level, role_category, competency_requirements, minimum_credit_points, typical_job_titles, salary_range_aed) VALUES
('oil_and_gas', 6, 'professional', '{"technical_competencies": ["Process engineering", "Safety management", "Environmental compliance"], "soft_skills": ["Leadership", "Communication", "Problem solving"]}', 180, ARRAY['Process Engineer', 'Safety Engineer', 'Operations Supervisor'], '{"min": 120000, "max": 180000}'),
('finance', 7, 'professional', '{"technical_competencies": ["Financial analysis", "Risk management", "Regulatory compliance"], "soft_skills": ["Strategic thinking", "Client management", "Decision making"]}', 240, ARRAY['Financial Manager', 'Risk Analyst', 'Investment Advisor'], '{"min": 150000, "max": 250000}'),
('technology', 5, 'technical', '{"technical_competencies": ["Software development", "System analysis", "Database management"], "soft_skills": ["Teamwork", "Continuous learning", "Innovation"]}', 120, ARRAY['Software Developer', 'System Analyst', 'Database Administrator'], '{"min": 80000, "max": 140000}');

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO emirati_platform_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO emirati_platform_user;
