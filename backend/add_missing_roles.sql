-- Add missing roles for HR Manager and Parent (Guardian)

INSERT INTO admin_roles (name, display_name, description, permissions, is_system_role) VALUES
('hr_manager', 'HR Manager', 'Company administration and team management', 
 '["company.manage", "company.edit", "team.manage", "jobs.*", "candidates.view", "interviews.*"]', TRUE),
('guardian', 'Parent', 'Guardian access for student tracking', 
 '["student.view", "attendance.view", "grades.view", "communications.view"]', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Ensure HR Recruiter exists if it was missing (based on user query, though it was in screenshot)
INSERT INTO admin_roles (name, display_name, description, permissions, is_system_role) VALUES
('recruiter', 'HR Recruiter', 'Recruitment and candidate management', 
 '["jobs.create", "jobs.edit", "candidates.view", "interviews.schedule"]', TRUE)
ON CONFLICT (name) DO NOTHING;
