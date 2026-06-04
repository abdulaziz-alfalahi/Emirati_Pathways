-- Create feature_flags table for Platform Modules "Coming Soon" system
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on key_name for fast lookups during routing
CREATE INDEX IF NOT EXISTS idx_feature_flags_key_name ON feature_flags(key_name);

-- Seed some default platform modules
INSERT INTO feature_flags (key_name, name, description, is_enabled) VALUES
('ai_career_simulator', 'AI Career Simulator', 'AI-driven career simulation and coaching module.', true),
('assessment_center', 'Assessment Center', 'Proctored skills assessment and certification module.', true),
('job_board', 'Job Board', 'General job listings and applications module.', true),
('talent_matching', 'Talent Matching API', 'AI engine for matching candidates to jobs.', true),
('government_dashboard', 'EHDC Board Portal', 'Strategic intelligence portal for EHDC board members.', true),
('operations_center', 'Operations Center', 'Platform telemetry and operations monitoring dashboard.', true),
('nav_education_pathway', 'Education Pathway', 'Main navigation group for education modules.', true),
('page_school_programs', 'School Programs Page', 'Discover innovative educational programs across Dubai schools.', true),
('page_knowledge_camps', 'Knowledge Camps Page', 'Knowledge programs for youth development.', true),
('page_scholarships', 'Scholarships Page', 'Educational funding opportunities.', true),
('page_university_programs', 'University Programs Page', 'Higher education pathways.', true),
('page_graduate_programs', 'Graduate Programs Page', 'Master''s, PhD, and advanced degree programs.', true),
('page_lms', 'Learning Management System Page', 'Online learning platform.', true),
('page_youth_development', 'Youth Development Page', 'Programs for youth empowerment and early career exposure.', true),
('nav_career_entry', 'Career Entry', 'Main navigation group for career entry tools.', true),
('page_career_hub', 'Career Hub Page', 'Plan your career path and get advisory guidance.', true),
('page_cv_builder', 'CV Builder Page', 'Create professional CVs tailored for the Dubai job market.', true),
('page_portfolio', 'Portfolio Page', 'Create digital portfolios to showcase work.', true),
('page_job_matching', 'Job Matching Page', 'Find opportunities that match your skills.', true),
('page_interview_preparation', 'Interview Preparation Page', 'Prepare for job interviews with AI coaching.', true),
('page_internships', 'Internships Page', 'Professional internship opportunities.', true),
('page_gig_marketplace', 'Gig Marketplace Page', 'Freelance opportunities and project-based work.', true),
('page_startup_launchpad', 'Startup Launchpad Page', 'Launch your startup with Dubai government programs.', true),
('nav_professional_growth', 'Professional Growth', 'Main navigation group for professional growth.', true),
('page_training', 'Training & Digital Skills Page', 'Professional training programs and digital literacy courses.', true),
('page_assessments', 'Assessments Page', 'Skill assessment and evaluation.', true),
('page_credentials', 'Credentials Page', 'Professional certifications and career passport.', true),
('page_mentorship', 'Mentorship Page', 'Connect with experienced mentors.', true),
('page_communities', 'Communities Page', 'Join professional communities and read thought leadership.', true),
('page_analytics', 'Analytics Page', 'View personal career insights and analytics.', true),
('page_financial_planning', 'Financial Planning Page', 'Comprehensive financial wellness and planning tools.', true),
('nav_lifelong_engagement', 'Lifelong Engagement', 'Main navigation group for lifelong engagement.', true),
('page_national_service', 'National Service Page', 'National service opportunities and civic engagement.', true),
('page_retiree', 'Retiree Services Page', 'Post-career opportunities and retirement benefits.', true),
('page_interactive_map', 'Interactive Map Page', 'Explore jobs, training, and services across all Dubai districts.', true)
ON CONFLICT (key_name) DO NOTHING;
