-- Create Schools table first
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    code VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(255),
    district VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website_url VARCHAR(500),
    khda_rating VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Program Categories table
CREATE TABLE IF NOT EXISTS program_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create School Programs table
CREATE TABLE IF NOT EXISTS school_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500),
    school_id UUID NOT NULL REFERENCES schools(id),
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    description_en TEXT,
    description_ar TEXT,
    target_age_min INTEGER,
    target_age_max INTEGER,
    capacity_total INTEGER,
    capacity_available INTEGER,
    fees_amount DECIMAL(10,2),
    fees_currency VARCHAR(10) DEFAULT 'AED',
    start_date DATE,
    end_date DATE,
    application_deadline DATE,
    requirements TEXT[],
    learning_outcomes TEXT[],
    assessment_methods TEXT[],
    language_of_instruction VARCHAR[],
    schedule_days VARCHAR[],
    schedule_time_start TIME,
    schedule_time_end TIME,
    location_details TEXT,
    equipment_provided TEXT[],
    prerequisites TEXT[],
    featured BOOLEAN DEFAULT false,
    image_urls TEXT[],
    video_urls TEXT[],
    created_by UUID,
    last_modified_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Program Tags table
CREATE TABLE IF NOT EXISTS program_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Program Success Metrics table
CREATE TABLE IF NOT EXISTS program_success_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES school_programs(id) ON DELETE CASCADE,
    completion_rate DECIMAL(5,2),
    satisfaction_rating DECIMAL(3,2),
    employment_rate DECIMAL(5,2),
    certification_rate DECIMAL(5,2),
    total_graduates INTEGER DEFAULT 0,
    year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample schools
INSERT INTO schools (id, name_en, name_ar, code, location, district, contact_email, contact_phone, website_url, khda_rating, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Dubai International Academy', 'أكاديمية دبي الدولية', 'DIA001', 'Dubai', 'Dubai', 'info@dia.ae', '+971-4-123-4567', 'https://dia.ae', 'Outstanding', true),
('550e8400-e29b-41d4-a716-446655440002', 'GEMS Wellington Academy', 'أكاديمية جيمس ويلينغتون', 'GWA002', 'Dubai', 'Dubai', 'info@gems-wellington.com', '+971-4-234-5678', 'https://gems-wellington.com', 'Very Good', true),
('550e8400-e29b-41d4-a716-446655440003', 'American School of Dubai', 'المدرسة الأمريكية في دبي', 'ASD003', 'Dubai', 'Dubai', 'info@asdubai.org', '+971-4-345-6789', 'https://asdubai.org', 'Good', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample program categories
INSERT INTO program_categories (name_en, name_ar, description_en, description_ar, is_active) VALUES
('STEM', 'العلوم والتكنولوجيا والهندسة والرياضيات', 'Science, Technology, Engineering, and Mathematics programs', 'برامج العلوم والتكنولوجيا والهندسة والرياضيات', true),
('Arts', 'الفنون', 'Creative and performing arts programs', 'برامج الفنون الإبداعية والأدائية', true),
('Sports', 'الرياضة', 'Physical education and sports programs', 'برامج التربية البدنية والرياضة', true),
('Languages', 'اللغات', 'Language learning and communication programs', 'برامج تعلم اللغات والتواصل', true),
('Business', 'الأعمال', 'Business and entrepreneurship programs', 'برامج الأعمال وريادة الأعمال', true)
ON CONFLICT DO NOTHING;
