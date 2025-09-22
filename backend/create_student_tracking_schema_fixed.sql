-- Student Tracking System Database Schema (Fixed)
-- Emirati Journey Platform - Educator Persona
-- Created: September 20, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create institutions table if it doesn't exist
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- e.g., "Public School", "Private School", "University"
    emirate VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes/Sections management (create before enrollments and attendance)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL, -- e.g., "Grade 5A", "Year 10 Science"
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    section VARCHAR(10), -- A, B, C, etc.
    subject VARCHAR(100), -- For subject-specific classes
    academic_year VARCHAR(20) NOT NULL, -- e.g., "2024-2025"
    educator_id UUID NOT NULL REFERENCES users(id),
    institution_id UUID REFERENCES institutions(id),
    classroom VARCHAR(50),
    max_capacity INTEGER DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    schedule_days VARCHAR(50), -- JSON array of days
    schedule_times VARCHAR(100), -- JSON object with time slots
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student enrollments in classes
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    completion_date DATE,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'transferred')),
    final_grade VARCHAR(10),
    final_percentage DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id)
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'sick')),
    arrival_time TIME,
    departure_time TIME,
    notes TEXT,
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, attendance_date)
);

-- Behavioral tracking
CREATE TABLE IF NOT EXISTS student_behavior (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    incident_date DATE NOT NULL,
    incident_type VARCHAR(50) CHECK (incident_type IN ('positive', 'negative', 'neutral')),
    behavior_category VARCHAR(100), -- e.g., "Participation", "Respect", "Responsibility"
    description TEXT NOT NULL,
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5), -- 1=minor, 5=severe
    action_taken TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    reported_by UUID NOT NULL REFERENCES users(id),
    parent_notified BOOLEAN DEFAULT false,
    parent_notification_date DATE,
    resolution_status VARCHAR(20) DEFAULT 'open' CHECK (resolution_status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_institutions_name ON institutions(name);
CREATE INDEX IF NOT EXISTS idx_institutions_emirate ON institutions(emirate);
CREATE INDEX IF NOT EXISTS idx_classes_educator_id ON classes(educator_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_student_behavior_student_id ON student_behavior(student_id);
CREATE INDEX IF NOT EXISTS idx_student_behavior_incident_date ON student_behavior(incident_date);
CREATE INDEX IF NOT EXISTS idx_student_behavior_type ON student_behavior(incident_type);

-- Create triggers for updating timestamps (only if function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Create triggers only if the function exists
        DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;
        CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
        CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
        CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        DROP TRIGGER IF EXISTS update_student_behavior_updated_at ON student_behavior;
        CREATE TRIGGER update_student_behavior_updated_at BEFORE UPDATE ON student_behavior FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample institutions
INSERT INTO institutions (name, type, emirate, address) VALUES
('Dubai International School', 'Private School', 'Dubai', 'Dubai Marina, Dubai, UAE'),
('Abu Dhabi Public School', 'Public School', 'Abu Dhabi', 'Al Khalidiyah, Abu Dhabi, UAE'),
('Sharjah Academy', 'Private School', 'Sharjah', 'Al Qasimia, Sharjah, UAE')
ON CONFLICT DO NOTHING;

-- Insert sample classes (using existing educator user IDs if available)
DO $$
DECLARE
    educator_uuid UUID;
    institution_uuid UUID;
BEGIN
    -- Get a sample educator ID (first user with role 'educator' or any user)
    SELECT id INTO educator_uuid FROM users WHERE role = 'educator' LIMIT 1;
    IF educator_uuid IS NULL THEN
        SELECT id INTO educator_uuid FROM users LIMIT 1;
    END IF;
    
    -- Get a sample institution ID
    SELECT id INTO institution_uuid FROM institutions LIMIT 1;
    
    -- Insert sample classes if educator exists
    IF educator_uuid IS NOT NULL THEN
        INSERT INTO classes (class_name, grade_level, section, subject, academic_year, educator_id, institution_id) VALUES
        ('Grade 5A Mathematics', 5, 'A', 'Mathematics', '2024-2025', educator_uuid, institution_uuid),
        ('Grade 6B Science', 6, 'B', 'Science', '2024-2025', educator_uuid, institution_uuid),
        ('Grade 7C English', 7, 'C', 'English', '2024-2025', educator_uuid, institution_uuid)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

COMMENT ON TABLE institutions IS 'Educational institutions and schools';
COMMENT ON TABLE classes IS 'Class and section management for educators';
COMMENT ON TABLE enrollments IS 'Student enrollment in specific classes';
COMMENT ON TABLE attendance IS 'Daily attendance tracking for students';
COMMENT ON TABLE student_behavior IS 'Behavioral incidents and positive recognition tracking';
