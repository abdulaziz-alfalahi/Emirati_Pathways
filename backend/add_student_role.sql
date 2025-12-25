-- 1. Add "Student" System Role
INSERT INTO admin_roles (name, display_name, description, permissions, is_system_role) VALUES
('student', 'Student', 'Student access for educational tracking', 
 '["student.view_self", "attendance.view_self", "grades.view_self", "resources.view"]', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. Link Students Table to Users Table
-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'user_id') THEN
        ALTER TABLE students ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        -- Create index for performance
        CREATE INDEX idx_students_user_id ON students(user_id);
    END IF;
END $$;
