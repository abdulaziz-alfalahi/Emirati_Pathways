-- Resource Management System Database Schema
-- Emirati Journey Platform - Educator Persona
-- Comprehensive digital library and resource management
-- Created: September 20, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Educational Resources Library
CREATE TABLE IF NOT EXISTS educational_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_title VARCHAR(500) NOT NULL,
    resource_description TEXT,
    resource_type VARCHAR(100) CHECK (resource_type IN (
        'lesson_plan', 'worksheet', 'presentation', 'video', 'audio', 'interactive_tool',
        'assessment', 'rubric', 'game', 'simulation', 'ebook', 'article', 'infographic',
        'template', 'guide', 'reference_material', 'multimedia_package'
    )),
    subject VARCHAR(100) NOT NULL,
    grade_levels INTEGER[] NOT NULL, -- Array of grade levels (1-12)
    topics TEXT[] NOT NULL, -- Array of topic tags
    
    -- Content and Access
    content_url TEXT,
    preview_url TEXT,
    thumbnail_url TEXT,
    file_size_mb DECIMAL(8,2),
    file_format VARCHAR(50),
    download_url TEXT,
    streaming_url TEXT,
    
    -- Educational Metadata
    learning_objectives TEXT[],
    standards_alignment TEXT[], -- UAE curriculum standards
    cognitive_levels TEXT[], -- Bloom's taxonomy levels
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    estimated_duration_minutes INTEGER,
    prerequisite_knowledge TEXT[],
    
    -- Language and Cultural
    primary_language VARCHAR(50) DEFAULT 'English',
    arabic_version_available BOOLEAN DEFAULT false,
    arabic_content_url TEXT,
    cultural_relevance VARCHAR(100), -- UAE, GCC, Arab World, International
    islamic_values_integration BOOLEAN DEFAULT false,
    emiratization_focus BOOLEAN DEFAULT false,
    
    -- Quality and Usage
    quality_rating DECIMAL(3,2) CHECK (quality_rating BETWEEN 1.0 AND 5.0),
    usage_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    average_user_rating DECIMAL(3,2) CHECK (average_user_rating BETWEEN 1.0 AND 5.0),
    
    -- Access and Licensing
    access_level VARCHAR(50) CHECK (access_level IN ('public', 'registered', 'premium', 'institutional')),
    license_type VARCHAR(100),
    cost_aed DECIMAL(8,2) DEFAULT 0.00,
    is_free BOOLEAN DEFAULT true,
    subscription_required BOOLEAN DEFAULT false,
    
    -- Technical Requirements
    technical_requirements TEXT,
    supported_devices TEXT[], -- tablet, desktop, mobile, smartboard
    internet_required BOOLEAN DEFAULT false,
    offline_available BOOLEAN DEFAULT true,
    
    -- Creator and Source
    created_by UUID REFERENCES users(id),
    author_name VARCHAR(200),
    publisher VARCHAR(200),
    source_institution VARCHAR(200),
    publication_date DATE,
    last_updated DATE,
    version VARCHAR(20),
    
    -- Approval and Moderation
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'under_review')),
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    moderation_notes TEXT,
    
    -- SEO and Discovery
    keywords TEXT[],
    search_tags TEXT[],
    featured BOOLEAN DEFAULT false,
    trending BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Full-text search
    search_vector tsvector
);

-- Resource Collections (Curated Sets)
CREATE TABLE IF NOT EXISTS resource_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_name VARCHAR(300) NOT NULL,
    collection_description TEXT,
    collection_type VARCHAR(50) CHECK (collection_type IN (
        'curriculum_unit', 'lesson_series', 'assessment_package', 'project_bundle',
        'subject_library', 'grade_level_set', 'themed_collection', 'seasonal_resources'
    )),
    
    -- Educational Context
    subject VARCHAR(100),
    grade_levels INTEGER[],
    academic_year VARCHAR(20),
    curriculum_alignment TEXT[],
    
    -- Collection Metadata
    total_resources INTEGER DEFAULT 0,
    estimated_total_duration INTEGER, -- in minutes
    difficulty_level VARCHAR(20),
    
    -- Access and Sharing
    visibility VARCHAR(50) DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public', 'institutional')),
    is_official BOOLEAN DEFAULT false, -- Official MOE or institutional collection
    
    -- Creator Information
    created_by UUID NOT NULL REFERENCES users(id),
    collaborators UUID[],
    
    -- Usage Statistics
    view_count INTEGER DEFAULT 0,
    copy_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Collection Items (Many-to-Many)
CREATE TABLE IF NOT EXISTS resource_collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES resource_collections(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
    item_order INTEGER NOT NULL,
    section_name VARCHAR(200),
    notes TEXT,
    is_required BOOLEAN DEFAULT true,
    estimated_time_minutes INTEGER,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(id),
    UNIQUE(collection_id, resource_id),
    UNIQUE(collection_id, item_order)
);

-- User Resource Library (Personal Collections)
CREATE TABLE IF NOT EXISTS user_resource_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
    
    -- Organization
    folder_name VARCHAR(200),
    tags TEXT[],
    personal_notes TEXT,
    
    -- Usage Tracking
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT false,
    
    -- Personal Rating and Review
    personal_rating INTEGER CHECK (personal_rating BETWEEN 1 AND 5),
    personal_review TEXT,
    would_recommend BOOLEAN,
    
    -- Usage Context
    used_in_classes UUID[], -- Array of class IDs where used
    usage_notes TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
    
    UNIQUE(user_id, resource_id)
);

-- Resource Reviews and Ratings
CREATE TABLE IF NOT EXISTS resource_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_title VARCHAR(200),
    review_text TEXT,
    
    -- Review Categories
    content_quality_rating INTEGER CHECK (content_quality_rating BETWEEN 1 AND 5),
    educational_value_rating INTEGER CHECK (educational_value_rating BETWEEN 1 AND 5),
    ease_of_use_rating INTEGER CHECK (ease_of_use_rating BETWEEN 1 AND 5),
    cultural_relevance_rating INTEGER CHECK (cultural_relevance_rating BETWEEN 1 AND 5),
    
    -- Usage Context
    used_with_grade_level INTEGER,
    used_in_subject VARCHAR(100),
    classroom_context TEXT,
    student_response TEXT,
    
    -- Review Metadata
    is_verified_educator BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    moderation_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(resource_id, reviewer_id)
);

-- Resource Usage Analytics
CREATE TABLE IF NOT EXISTS resource_usage_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Usage Details
    usage_date DATE DEFAULT CURRENT_DATE,
    usage_type VARCHAR(50) CHECK (usage_type IN ('view', 'download', 'stream', 'share', 'favorite', 'review')),
    class_id UUID REFERENCES classes(id),
    subject VARCHAR(100),
    grade_level INTEGER,
    
    -- Session Information
    session_duration_minutes INTEGER,
    device_type VARCHAR(50),
    access_method VARCHAR(50), -- web, mobile_app, tablet_app
    
    -- Geographic and Institutional
    emirate VARCHAR(50),
    institution_type VARCHAR(100),
    
    -- Effectiveness Tracking
    lesson_effectiveness_rating INTEGER CHECK (lesson_effectiveness_rating BETWEEN 1 AND 5),
    student_engagement_level INTEGER CHECK (student_engagement_level BETWEEN 1 AND 5),
    would_use_again BOOLEAN,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Categories and Taxonomy
CREATE TABLE IF NOT EXISTS resource_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(200) NOT NULL,
    category_description TEXT,
    parent_category_id UUID REFERENCES resource_categories(id),
    category_level INTEGER DEFAULT 1,
    category_path TEXT, -- Hierarchical path like "Mathematics/Algebra/Linear Equations"
    
    -- Educational Context
    applicable_subjects TEXT[],
    applicable_grade_levels INTEGER[],
    
    -- Display and Organization
    display_order INTEGER,
    icon_url TEXT,
    color_code VARCHAR(7), -- Hex color code
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Category Assignments
CREATE TABLE IF NOT EXISTS resource_category_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES resource_categories(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_id, category_id)
);

-- Digital Library Settings
CREATE TABLE IF NOT EXISTS digital_library_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Display Preferences
    default_view VARCHAR(50) DEFAULT 'grid' CHECK (default_view IN ('grid', 'list', 'detailed')),
    items_per_page INTEGER DEFAULT 20,
    sort_preference VARCHAR(50) DEFAULT 'relevance',
    
    -- Filter Preferences
    preferred_subjects TEXT[],
    preferred_grade_levels INTEGER[],
    preferred_resource_types TEXT[],
    language_preference VARCHAR(50) DEFAULT 'English',
    
    -- Notification Settings
    new_resource_notifications BOOLEAN DEFAULT true,
    collection_update_notifications BOOLEAN DEFAULT true,
    review_notifications BOOLEAN DEFAULT false,
    
    -- Privacy Settings
    share_usage_analytics BOOLEAN DEFAULT true,
    public_profile BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Resource Sharing and Collaboration
CREATE TABLE IF NOT EXISTS resource_sharing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES educational_resources(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_group VARCHAR(200), -- Institution, department, etc.
    
    -- Sharing Details
    sharing_type VARCHAR(50) CHECK (sharing_type IN ('view_only', 'download', 'edit', 'full_access')),
    sharing_message TEXT,
    expiry_date DATE,
    
    -- Usage Tracking
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_educational_resources_subject_grade ON educational_resources(subject, grade_levels);
CREATE INDEX IF NOT EXISTS idx_educational_resources_type ON educational_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_educational_resources_difficulty ON educational_resources(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_educational_resources_rating ON educational_resources(quality_rating);
CREATE INDEX IF NOT EXISTS idx_educational_resources_free ON educational_resources(is_free);
CREATE INDEX IF NOT EXISTS idx_educational_resources_approval ON educational_resources(approval_status);
CREATE INDEX IF NOT EXISTS idx_educational_resources_featured ON educational_resources(featured);
CREATE INDEX IF NOT EXISTS idx_educational_resources_topics ON educational_resources USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_educational_resources_standards ON educational_resources USING GIN(standards_alignment);
CREATE INDEX IF NOT EXISTS idx_educational_resources_keywords ON educational_resources USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_educational_resources_search ON educational_resources USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_resource_collections_creator ON resource_collections(created_by);
CREATE INDEX IF NOT EXISTS idx_resource_collections_subject_grade ON resource_collections(subject, grade_levels);
CREATE INDEX IF NOT EXISTS idx_resource_collections_visibility ON resource_collections(visibility);
CREATE INDEX IF NOT EXISTS idx_resource_collections_official ON resource_collections(is_official);

CREATE INDEX IF NOT EXISTS idx_resource_collection_items_collection ON resource_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_resource_collection_items_resource ON resource_collection_items(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_collection_items_order ON resource_collection_items(collection_id, item_order);

CREATE INDEX IF NOT EXISTS idx_user_resource_library_user ON user_resource_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_resource_library_resource ON user_resource_library(resource_id);
CREATE INDEX IF NOT EXISTS idx_user_resource_library_folder ON user_resource_library(user_id, folder_name);
CREATE INDEX IF NOT EXISTS idx_user_resource_library_favorite ON user_resource_library(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_user_resource_library_tags ON user_resource_library USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_resource_reviews_resource ON resource_reviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_reviewer ON resource_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_rating ON resource_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_resource_reviews_approved ON resource_reviews(is_approved);

CREATE INDEX IF NOT EXISTS idx_resource_usage_analytics_resource ON resource_usage_analytics(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_usage_analytics_user ON resource_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_usage_analytics_date ON resource_usage_analytics(usage_date);
CREATE INDEX IF NOT EXISTS idx_resource_usage_analytics_type ON resource_usage_analytics(usage_type);
CREATE INDEX IF NOT EXISTS idx_resource_usage_analytics_class ON resource_usage_analytics(class_id);

CREATE INDEX IF NOT EXISTS idx_resource_categories_parent ON resource_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_resource_categories_level ON resource_categories(category_level);
CREATE INDEX IF NOT EXISTS idx_resource_categories_active ON resource_categories(is_active);

CREATE INDEX IF NOT EXISTS idx_resource_category_assignments_resource ON resource_category_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_category_assignments_category ON resource_category_assignments(category_id);

CREATE INDEX IF NOT EXISTS idx_resource_sharing_resource ON resource_sharing(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_sharing_shared_by ON resource_sharing(shared_by);
CREATE INDEX IF NOT EXISTS idx_resource_sharing_shared_with ON resource_sharing(shared_with);

-- Create triggers for updating timestamps
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Create triggers only if the function exists
        DROP TRIGGER IF EXISTS update_educational_resources_updated_at ON educational_resources;
        CREATE TRIGGER update_educational_resources_updated_at BEFORE UPDATE ON educational_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_resource_collections_updated_at ON resource_collections;
        CREATE TRIGGER update_resource_collections_updated_at BEFORE UPDATE ON resource_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_resource_reviews_updated_at ON resource_reviews;
        CREATE TRIGGER update_resource_reviews_updated_at BEFORE UPDATE ON resource_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_resource_categories_updated_at ON resource_categories;
        CREATE TRIGGER update_resource_categories_updated_at BEFORE UPDATE ON resource_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_digital_library_settings_updated_at ON digital_library_settings;
        CREATE TRIGGER update_digital_library_settings_updated_at BEFORE UPDATE ON digital_library_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create function for updating search vector
CREATE OR REPLACE FUNCTION update_resource_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.resource_title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.resource_description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.topics, ' '), '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS update_resource_search_vector_trigger ON educational_resources;
CREATE TRIGGER update_resource_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON educational_resources 
    FOR EACH ROW EXECUTE FUNCTION update_resource_search_vector();

-- Insert sample resource categories
INSERT INTO resource_categories (category_name, category_description, category_level, category_path, applicable_subjects, applicable_grade_levels) VALUES
('Mathematics', 'Mathematical concepts and problem-solving resources', 1, 'Mathematics', ARRAY['Mathematics'], ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('Science', 'Scientific inquiry and discovery resources', 1, 'Science', ARRAY['Science', 'Physics', 'Chemistry', 'Biology'], ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('Language Arts', 'Reading, writing, and communication resources', 1, 'Language Arts', ARRAY['English', 'Arabic'], ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('Social Studies', 'History, geography, and cultural studies', 1, 'Social Studies', ARRAY['Social Studies', 'History', 'Geography'], ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('Islamic Studies', 'Islamic education and values', 1, 'Islamic Studies', ARRAY['Islamic Studies'], ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
('UAE Studies', 'UAE history, culture, and national identity', 1, 'UAE Studies', ARRAY['UAE Studies', 'Social Studies'], ARRAY[1,2,3,4,5,6,7,8,9,10,11,12])
ON CONFLICT DO NOTHING;

-- Insert sample educational resources
DO $$
DECLARE
    educator_uuid UUID;
    math_category_uuid UUID;
    science_category_uuid UUID;
BEGIN
    -- Get a sample educator ID and category IDs
    SELECT id INTO educator_uuid FROM users LIMIT 1;
    SELECT id INTO math_category_uuid FROM resource_categories WHERE category_name = 'Mathematics' LIMIT 1;
    SELECT id INTO science_category_uuid FROM resource_categories WHERE category_name = 'Science' LIMIT 1;
    
    -- Insert sample resources if educator exists
    IF educator_uuid IS NOT NULL THEN
        INSERT INTO educational_resources (
            resource_title, resource_description, resource_type, subject, grade_levels,
            topics, learning_objectives, standards_alignment, difficulty_level,
            estimated_duration_minutes, primary_language, cultural_relevance,
            quality_rating, access_level, is_free, created_by, approval_status
        ) VALUES
        (
            'Fractions and Decimals Interactive Worksheet',
            'Comprehensive worksheet covering conversion between fractions and decimals with UAE currency examples',
            'worksheet',
            'Mathematics',
            ARRAY[4, 5, 6],
            ARRAY['fractions', 'decimals', 'conversion', 'money'],
            ARRAY['Convert between fractions and decimals', 'Apply fraction concepts to real-world problems'],
            ARRAY['UAE-MATH-G5-3.1', 'UAE-MATH-G5-3.2'],
            'intermediate',
            45,
            'English',
            'UAE',
            4.5,
            'public',
            true,
            educator_uuid,
            'approved'
        ),
        (
            'UAE Wildlife and Ecosystems Video Series',
            'Educational video series exploring the unique wildlife and ecosystems of the UAE',
            'video',
            'Science',
            ARRAY[3, 4, 5],
            ARRAY['ecosystems', 'wildlife', 'UAE environment', 'conservation'],
            ARRAY['Identify UAE native species', 'Understand ecosystem relationships'],
            ARRAY['UAE-SCI-G4-1.1', 'UAE-SCI-G4-1.2'],
            'beginner',
            30,
            'English',
            'UAE',
            4.8,
            'public',
            true,
            educator_uuid,
            'approved'
        )
        ON CONFLICT DO NOTHING;
        
        -- Assign categories to resources
        IF math_category_uuid IS NOT NULL AND science_category_uuid IS NOT NULL THEN
            INSERT INTO resource_category_assignments (resource_id, category_id, assigned_by)
            SELECT er.id, math_category_uuid, educator_uuid
            FROM educational_resources er
            WHERE er.subject = 'Mathematics' AND er.created_by = educator_uuid
            ON CONFLICT DO NOTHING;
            
            INSERT INTO resource_category_assignments (resource_id, category_id, assigned_by)
            SELECT er.id, science_category_uuid, educator_uuid
            FROM educational_resources er
            WHERE er.subject = 'Science' AND er.created_by = educator_uuid
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

COMMENT ON TABLE educational_resources IS 'Comprehensive digital library of educational resources with UAE curriculum alignment';
COMMENT ON TABLE resource_collections IS 'Curated collections of educational resources organized by theme or curriculum unit';
COMMENT ON TABLE user_resource_library IS 'Personal resource libraries for educators with organization and usage tracking';
COMMENT ON TABLE resource_reviews IS 'User reviews and ratings for educational resources';
COMMENT ON TABLE resource_usage_analytics IS 'Detailed analytics on resource usage patterns and effectiveness';
COMMENT ON TABLE resource_categories IS 'Hierarchical categorization system for organizing educational resources';
COMMENT ON TABLE digital_library_settings IS 'User preferences and settings for the digital library interface';
