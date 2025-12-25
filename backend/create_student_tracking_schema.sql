-- Student Tracking System Database Schema
-- Emirati Journey Platform - Educator Persona
-- Created: September 20, 2025

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students table - Core student information
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE NOT NULL, -- School-assigned student ID
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    arabic_name VARCHAR(200), -- Arabic name for UAE context
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    nationality VARCHAR(100) DEFAULT 'UAE',
    emirate VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    medical_conditions TEXT,
    special_needs TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    graduation_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent/Guardian information
CREATE TABLE IF NOT EXISTS student_guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_type VARCHAR(20) CHECK (guardian_type IN ('father', 'mother', 'guardian', 'sponsor')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    arabic_name VARCHAR(200),
    relationship VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    work_phone VARCHAR(20),
    occupation VARCHAR(100),
    employer VARCHAR(200),
    is_primary_contact BOOLEAN DEFAULT false,
    can_pickup BOOLEAN DEFAULT true,
    emergency_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes/Sections management
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL, -- e.g., "Grade 5A", "Year 10 Science"
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
    section VARCHAR(10), -- A, B, C, etc.
    subject VARCHAR(100), -- For subject-specific classes
    academic_year VARCHAR(20) NOT NULL, -- e.g., "2024-2025"
    educator_id INTEGER NOT NULL REFERENCES users(id),
    institution_id UUID REFERENCES educational_institutions(id),
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
    marked_by INTEGER REFERENCES users(id),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, attendance_date)
);

-- Student progress tracking
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    skill_area VARCHAR(100), -- e.g., "Reading", "Mathematics", "Science"
    current_level VARCHAR(50), -- e.g., "Beginner", "Intermediate", "Advanced"
    target_level VARCHAR(50),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_assessment_date DATE,
    next_assessment_date DATE,
    strengths TEXT,
    areas_for_improvement TEXT,
    intervention_needed BOOLEAN DEFAULT false,
    intervention_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    reported_by INTEGER NOT NULL REFERENCES users(id),
    parent_notified BOOLEAN DEFAULT false,
    parent_notification_date DATE,
    resolution_status VARCHAR(20) DEFAULT 'open' CHECK (resolution_status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Communication logs with parents/guardians
CREATE TABLE IF NOT EXISTS parent_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES student_guardians(id),
    educator_id INTEGER NOT NULL REFERENCES users(id),
    communication_type VARCHAR(50) CHECK (communication_type IN ('email', 'phone', 'meeting', 'message', 'report')),
    subject VARCHAR(200),
    content TEXT NOT NULL,
    communication_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_received BOOLEAN DEFAULT false,
    response_content TEXT,
    response_date TIMESTAMP,
    priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'responded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student achievements and awards
CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL, -- e.g., "Academic Excellence", "Sports", "Arts"
    title VARCHAR(200) NOT NULL,
    description TEXT,
    achievement_date DATE NOT NULL,
    level VARCHAR(50), -- e.g., "School", "District", "National", "International"
    awarded_by VARCHAR(200),
    certificate_url VARCHAR(500),
    points_awarded INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id ON student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_primary_contact ON student_guardians(is_primary_contact);
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
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_class_id ON student_progress(class_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_subject ON student_progress(subject);
CREATE INDEX IF NOT EXISTS idx_student_behavior_student_id ON student_behavior(student_id);
CREATE INDEX IF NOT EXISTS idx_student_behavior_incident_date ON student_behavior(incident_date);
CREATE INDEX IF NOT EXISTS idx_student_behavior_type ON student_behavior(incident_type);
CREATE INDEX IF NOT EXISTS idx_parent_communications_student_id ON parent_communications(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_communications_educator_id ON parent_communications(educator_id);
CREATE INDEX IF NOT EXISTS idx_parent_communications_date ON parent_communications(communication_date);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student_id ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_date ON student_achievements(achievement_date);
CREATE INDEX IF NOT EXISTS idx_student_achievements_type ON student_achievements(achievement_type);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_guardians_updated_at BEFORE UPDATE ON student_guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_behavior_updated_at BEFORE UPDATE ON student_behavior FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parent_communications_updated_at BEFORE UPDATE ON parent_communications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_achievements_updated_at BEFORE UPDATE ON student_achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO students (student_id, first_name, last_name, arabic_name, date_of_birth, gender, nationality, emirate, email) VALUES
('STU001', 'Ahmed', 'Al-Mansouri', 'أحمد المنصوري', '2010-03-15', 'male', 'UAE', 'Dubai', 'ahmed.almansouri@student.edu.ae'),
('STU002', 'Fatima', 'Al-Zahra', 'فاطمة الزهراء', '2010-07-22', 'female', 'UAE', 'Abu Dhabi', 'fatima.alzahra@student.edu.ae'),
('STU003', 'Omar', 'Al-Rashid', 'عمر الراشد', '2009-11-08', 'male', 'UAE', 'Sharjah', 'omar.alrashid@student.edu.ae');

COMMENT ON TABLE students IS 'Core student information and enrollment data';
COMMENT ON TABLE student_guardians IS 'Parent and guardian contact information';
COMMENT ON TABLE classes IS 'Class and section management for educators';
COMMENT ON TABLE enrollments IS 'Student enrollment in specific classes';
COMMENT ON TABLE attendance IS 'Daily attendance tracking for students';
COMMENT ON TABLE student_progress IS 'Academic progress tracking by subject and skill area';
COMMENT ON TABLE student_behavior IS 'Behavioral incidents and positive recognition tracking';
COMMENT ON TABLE parent_communications IS 'Communication logs between educators and parents';
COMMENT ON TABLE student_achievements IS 'Student achievements, awards, and recognition';
