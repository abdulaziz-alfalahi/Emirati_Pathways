-- Curriculum Planning Tools Database Schema
-- Emirati Journey Platform - Educator Persona
-- UAE Educational Standards Integration
-- Created: September 20, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- UAE Educational Standards and Frameworks
CREATE TABLE IF NOT EXISTS uae_curriculum_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "UAE-MATH-G5-1.1"
    subject VARCHAR(100) NOT NULL, -- Mathematics, Science, English, Arabic, Islamic Studies, etc.
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    strand VARCHAR(200), -- Major topic area within subject
    learning_outcome TEXT NOT NULL, -- Specific learning outcome
    description TEXT,
    skills_developed TEXT[], -- Array of skills this standard develops
    assessment_criteria TEXT,
    ministry_reference VARCHAR(200), -- Official MoE reference
    is_core_standard BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum Templates and Frameworks
CREATE TABLE IF NOT EXISTS curriculum_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    academic_year VARCHAR(20) NOT NULL,
    template_type VARCHAR(50) CHECK (template_type IN ('annual', 'semester', 'term', 'unit', 'weekly')),
    duration_weeks INTEGER,
    total_lessons INTEGER,
    description TEXT,
    learning_objectives TEXT[],
    key_concepts TEXT[],
    essential_questions TEXT[],
    assessment_methods TEXT[],
    resources_required TEXT[],
    differentiation_strategies TEXT[],
    cross_curricular_links TEXT[],
    cultural_connections TEXT, -- UAE cultural integration
    islamic_values_integration TEXT, -- Islamic values integration
    emiratization_focus TEXT, -- Career connections to UAE priorities
    created_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual Curricula based on templates
CREATE TABLE IF NOT EXISTS curricula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curriculum_name VARCHAR(200) NOT NULL,
    template_id UUID REFERENCES curriculum_templates(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    educator_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(100) NOT NULL,
    grade_level INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_weeks INTEGER,
    lessons_per_week INTEGER DEFAULT 1,
    total_planned_lessons INTEGER,
    completed_lessons INTEGER DEFAULT 0,
    curriculum_status VARCHAR(20) DEFAULT 'draft' CHECK (curriculum_status IN ('draft', 'active', 'completed', 'archived')),
    learning_objectives TEXT[],
    assessment_plan TEXT,
    resources_list TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum Standards Mapping
CREATE TABLE IF NOT EXISTS curriculum_standards_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES uae_curriculum_standards(id),
    coverage_level VARCHAR(20) CHECK (coverage_level IN ('introduced', 'developing', 'mastered', 'extended')),
    planned_lessons INTEGER DEFAULT 1,
    actual_lessons INTEGER DEFAULT 0,
    assessment_weight DECIMAL(5,2) DEFAULT 0.00, -- Percentage weight in overall assessment
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(curriculum_id, standard_id)
);

-- Lesson Plans
CREATE TABLE IF NOT EXISTS lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    lesson_number INTEGER NOT NULL,
    lesson_title VARCHAR(300) NOT NULL,
    lesson_type VARCHAR(50) CHECK (lesson_type IN ('introduction', 'development', 'practice', 'assessment', 'review', 'project')),
    planned_date DATE,
    actual_date DATE,
    duration_minutes INTEGER DEFAULT 45,
    learning_objectives TEXT[] NOT NULL,
    success_criteria TEXT[],
    key_vocabulary TEXT[],
    prior_knowledge TEXT,
    lesson_structure JSONB, -- Detailed lesson structure with timings
    teaching_strategies TEXT[],
    differentiation TEXT,
    assessment_methods TEXT[],
    resources_needed TEXT[],
    homework_assignment TEXT,
    reflection_notes TEXT,
    student_engagement_level INTEGER CHECK (student_engagement_level BETWEEN 1 AND 5),
    learning_outcomes_achieved BOOLEAN,
    areas_for_improvement TEXT,
    next_lesson_adjustments TEXT,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'postponed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson Standards Alignment
CREATE TABLE IF NOT EXISTS lesson_standards_alignment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES uae_curriculum_standards(id),
    alignment_level VARCHAR(20) CHECK (alignment_level IN ('primary', 'secondary', 'reinforcement')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lesson_id, standard_id)
);

-- Assessment Plans and Rubrics
CREATE TABLE IF NOT EXISTS assessment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    assessment_name VARCHAR(200) NOT NULL,
    assessment_type VARCHAR(50) CHECK (assessment_type IN ('formative', 'summative', 'diagnostic', 'peer', 'self', 'portfolio')),
    assessment_method VARCHAR(100), -- quiz, test, project, presentation, etc.
    planned_date DATE,
    actual_date DATE,
    duration_minutes INTEGER,
    total_marks INTEGER,
    passing_marks INTEGER,
    weight_percentage DECIMAL(5,2), -- Weight in overall grade
    learning_objectives TEXT[],
    assessment_criteria TEXT[],
    rubric_data JSONB, -- Detailed rubric information
    instructions TEXT,
    resources_allowed TEXT[],
    special_accommodations TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Standards Alignment
CREATE TABLE IF NOT EXISTS assessment_standards_alignment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessment_plans(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES uae_curriculum_standards(id),
    marks_allocated INTEGER NOT NULL,
    cognitive_level VARCHAR(50), -- Bloom's taxonomy level
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum Resources Library
CREATE TABLE IF NOT EXISTS curriculum_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_name VARCHAR(300) NOT NULL,
    resource_type VARCHAR(50) CHECK (resource_type IN ('textbook', 'worksheet', 'video', 'audio', 'interactive', 'game', 'simulation', 'document', 'image', 'website')),
    subject VARCHAR(100) NOT NULL,
    grade_levels INTEGER[], -- Array of applicable grade levels
    topics TEXT[], -- Array of topics this resource covers
    description TEXT,
    file_url VARCHAR(500),
    external_url VARCHAR(500),
    file_size_mb DECIMAL(10,2),
    file_format VARCHAR(20),
    language VARCHAR(20) DEFAULT 'English',
    arabic_available BOOLEAN DEFAULT false,
    cultural_relevance VARCHAR(100), -- UAE cultural relevance
    islamic_content BOOLEAN DEFAULT false,
    usage_instructions TEXT,
    copyright_info TEXT,
    cost_aed DECIMAL(10,2) DEFAULT 0.00,
    is_free BOOLEAN DEFAULT true,
    quality_rating DECIMAL(3,2) CHECK (quality_rating BETWEEN 1.0 AND 5.0),
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    is_approved BOOLEAN DEFAULT false,
    approval_date TIMESTAMP,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum Resource Usage Tracking
CREATE TABLE IF NOT EXISTS curriculum_resource_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES curriculum_resources(id) ON DELETE CASCADE,
    curriculum_id UUID REFERENCES curricula(id),
    lesson_id UUID REFERENCES lesson_plans(id),
    educator_id UUID NOT NULL REFERENCES users(id),
    usage_date DATE DEFAULT CURRENT_DATE,
    usage_context VARCHAR(100), -- lesson, homework, assessment, etc.
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    student_engagement_rating INTEGER CHECK (student_engagement_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pacing Guides and Calendars
CREATE TABLE IF NOT EXISTS pacing_guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    planned_topics TEXT[],
    planned_standards TEXT[], -- Standard codes to be covered
    planned_assessments TEXT[],
    actual_topics_covered TEXT[],
    actual_standards_covered TEXT[],
    actual_assessments_completed TEXT[],
    pacing_status VARCHAR(20) DEFAULT 'on_track' CHECK (pacing_status IN ('ahead', 'on_track', 'behind', 'significantly_behind')),
    adjustments_needed TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(curriculum_id, week_number)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_uae_standards_subject_grade ON uae_curriculum_standards(subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_uae_standards_code ON uae_curriculum_standards(standard_code);
CREATE INDEX IF NOT EXISTS idx_curriculum_templates_subject_grade ON curriculum_templates(subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_curriculum_templates_type ON curriculum_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_curricula_educator_id ON curricula(educator_id);
CREATE INDEX IF NOT EXISTS idx_curricula_class_id ON curricula(class_id);
CREATE INDEX IF NOT EXISTS idx_curricula_academic_year ON curricula(academic_year);
CREATE INDEX IF NOT EXISTS idx_curricula_status ON curricula(curriculum_status);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_curriculum_id ON lesson_plans(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_planned_date ON lesson_plans(planned_date);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_status ON lesson_plans(status);
CREATE INDEX IF NOT EXISTS idx_assessment_plans_curriculum_id ON assessment_plans(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_assessment_plans_planned_date ON assessment_plans(planned_date);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_subject ON curriculum_resources(subject);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_type ON curriculum_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_grade_levels ON curriculum_resources USING GIN(grade_levels);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_topics ON curriculum_resources USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_curriculum_resources_tags ON curriculum_resources USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_pacing_guides_curriculum_id ON pacing_guides(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_pacing_guides_week_dates ON pacing_guides(start_date, end_date);

-- Create triggers for updating timestamps
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Create triggers only if the function exists
        DROP TRIGGER IF EXISTS update_uae_standards_updated_at ON uae_curriculum_standards;
        CREATE TRIGGER update_uae_standards_updated_at BEFORE UPDATE ON uae_curriculum_standards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_curriculum_templates_updated_at ON curriculum_templates;
        CREATE TRIGGER update_curriculum_templates_updated_at BEFORE UPDATE ON curriculum_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_curricula_updated_at ON curricula;
        CREATE TRIGGER update_curricula_updated_at BEFORE UPDATE ON curricula FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_lesson_plans_updated_at ON lesson_plans;
        CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON lesson_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_assessment_plans_updated_at ON assessment_plans;
        CREATE TRIGGER update_assessment_plans_updated_at BEFORE UPDATE ON assessment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_curriculum_resources_updated_at ON curriculum_resources;
        CREATE TRIGGER update_curriculum_resources_updated_at BEFORE UPDATE ON curriculum_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_pacing_guides_updated_at ON pacing_guides;
        CREATE TRIGGER update_pacing_guides_updated_at BEFORE UPDATE ON pacing_guides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample UAE curriculum standards
INSERT INTO uae_curriculum_standards (standard_code, subject, grade_level, strand, learning_outcome, description, skills_developed, ministry_reference) VALUES
('UAE-MATH-G5-1.1', 'Mathematics', 5, 'Number and Operations', 'Students will understand place value in whole numbers and decimals', 'Develop understanding of place value system up to millions and decimal places', ARRAY['number sense', 'place value', 'decimal understanding'], 'MoE Math Curriculum Grade 5'),
('UAE-SCI-G5-2.1', 'Science', 5, 'Life Science', 'Students will identify characteristics of living and non-living things', 'Explore the basic characteristics that distinguish living from non-living things', ARRAY['observation', 'classification', 'scientific thinking'], 'MoE Science Curriculum Grade 5'),
('UAE-ENG-G5-3.1', 'English', 5, 'Reading Comprehension', 'Students will demonstrate reading comprehension of grade-level texts', 'Read and understand various text types with appropriate fluency and comprehension', ARRAY['reading fluency', 'comprehension', 'vocabulary'], 'MoE English Curriculum Grade 5'),
('UAE-AR-G5-4.1', 'Arabic', 5, 'القراءة والفهم', 'سيتمكن الطلاب من قراءة وفهم النصوص المناسبة لمستواهم', 'تطوير مهارات القراءة والفهم باللغة العربية', ARRAY['القراءة', 'الفهم', 'المفردات'], 'منهج اللغة العربية الصف الخامس'),
('UAE-IS-G5-5.1', 'Islamic Studies', 5, 'العقيدة', 'سيتعلم الطلاب أركان الإيمان الستة', 'فهم وحفظ أركان الإيمان الستة وتطبيقها في الحياة اليومية', ARRAY['العقيدة', 'الحفظ', 'التطبيق'], 'منهج التربية الإسلامية الصف الخامس')
ON CONFLICT (standard_code) DO NOTHING;

-- Insert sample curriculum templates
DO $$
DECLARE
    educator_uuid UUID;
BEGIN
    -- Get a sample educator ID
    SELECT id INTO educator_uuid FROM users LIMIT 1;
    
    -- Insert sample templates if educator exists
    IF educator_uuid IS NOT NULL THEN
        INSERT INTO curriculum_templates (
            template_name, subject, grade_level, academic_year, template_type,
            duration_weeks, total_lessons, description, learning_objectives,
            cultural_connections, islamic_values_integration, created_by
        ) VALUES
        (
            'Grade 5 Mathematics - Annual Plan',
            'Mathematics',
            5,
            '2024-2025',
            'annual',
            36,
            180,
            'Comprehensive annual mathematics curriculum for Grade 5 aligned with UAE standards',
            ARRAY['Develop number sense and place value understanding', 'Master basic operations with whole numbers and decimals', 'Understand geometric shapes and measurements'],
            'Integration of UAE cultural elements through real-world problem solving using local contexts',
            'Emphasis on Islamic values of precision, honesty, and perseverance in mathematical thinking',
            educator_uuid
        ),
        (
            'Grade 5 Science - Semester 1',
            'Science',
            5,
            '2024-2025',
            'semester',
            18,
            72,
            'First semester science curriculum focusing on life science and physical science basics',
            ARRAY['Identify characteristics of living things', 'Understand basic properties of matter', 'Develop scientific inquiry skills'],
            'Exploration of UAE biodiversity and environmental conservation',
            'Appreciation of Allah''s creation through scientific observation and study',
            educator_uuid
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

COMMENT ON TABLE uae_curriculum_standards IS 'Official UAE Ministry of Education curriculum standards and learning outcomes';
COMMENT ON TABLE curriculum_templates IS 'Reusable curriculum templates aligned with UAE educational standards';
COMMENT ON TABLE curricula IS 'Individual curriculum implementations for specific classes';
COMMENT ON TABLE lesson_plans IS 'Detailed lesson plans with UAE standards alignment';
COMMENT ON TABLE assessment_plans IS 'Assessment planning and rubric management';
COMMENT ON TABLE curriculum_resources IS 'Digital resource library for curriculum support';
COMMENT ON TABLE pacing_guides IS 'Curriculum pacing and timeline management';
