-- 📊 Emirati Journey Platform - Sample Data for Demonstration
-- This script inserts sample data for testing and demonstration purposes

-- Insert sample companies
INSERT INTO companies (id, name, description, industry, size, website, emirate, phone, email, is_verified, emiratization_percentage, total_employees, uae_national_employees) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Emirates National Oil Company (ENOC)', 'Leading integrated oil and gas company in the UAE', 'Oil & Gas', 'Large (1000+)', 'https://www.enoc.com', 'Dubai', '+971-4-337-1111', 'careers@enoc.com', true, 15.5, 2500, 388),
('550e8400-e29b-41d4-a716-446655440002', 'Dubai Islamic Bank', 'Premier Islamic financial institution', 'Banking & Finance', 'Large (1000+)', 'https://www.dib.ae', 'Dubai', '+971-4-609-2222', 'hr@dib.ae', true, 22.3, 1800, 401),
('550e8400-e29b-41d4-a716-446655440003', 'Etisalat Group', 'Leading telecommunications company', 'Telecommunications', 'Large (1000+)', 'https://www.etisalat.com', 'Abu Dhabi', '+971-2-691-7000', 'careers@etisalat.ae', true, 18.7, 3200, 598),
('550e8400-e29b-41d4-a716-446655440004', 'Dubai Health Authority', 'Government healthcare organization', 'Healthcare', 'Large (1000+)', 'https://www.dha.gov.ae', 'Dubai', '+971-4-606-6262', 'careers@dha.gov.ae', true, 45.2, 5000, 2260),
('550e8400-e29b-41d4-a716-446655440005', 'Careem Technologies', 'Leading ride-hailing and delivery platform', 'Technology', 'Medium (100-999)', 'https://www.careem.com', 'Dubai', '+971-4-878-8888', 'careers@careem.com', true, 12.8, 450, 58),
('550e8400-e29b-41d4-a716-446655440006', 'Abu Dhabi National Oil Company (ADNOC)', 'National oil company of the UAE', 'Oil & Gas', 'Large (1000+)', 'https://www.adnoc.ae', 'Abu Dhabi', '+971-2-607-4000', 'careers@adnoc.ae', true, 28.5, 4500, 1283),
('550e8400-e29b-41d4-a716-446655440007', 'Jumeirah Group', 'Luxury hospitality company', 'Hospitality', 'Large (1000+)', 'https://www.jumeirah.com', 'Dubai', '+971-4-366-8888', 'careers@jumeirah.com', true, 16.9, 2200, 372),
('550e8400-e29b-41d4-a716-446655440008', 'Mubadala Investment Company', 'Strategic investment and development company', 'Investment', 'Medium (100-999)', 'https://www.mubadala.com', 'Abu Dhabi', '+971-2-413-3333', 'careers@mubadala.com', true, 35.4, 800, 283);

-- Insert sample users (candidates)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, emirate, nationality, is_uae_national, skills, experience_years, education_level, preferred_salary_min, preferred_salary_max, is_verified, email_verified, phone_verified) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'ahmed.almansouri@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Ahmed', 'Al Mansouri', '+971501234567', 'candidate', 'Dubai', 'UAE', true, ARRAY['Python', 'Data Analysis', 'Machine Learning'], 5, 'Bachelor''s Degree', 15000, 25000, true, true, true),
('660e8400-e29b-41d4-a716-446655440002', 'fatima.alzahra@outlook.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Fatima', 'Al Zahra', '+971502345678', 'candidate', 'Abu Dhabi', 'UAE', true, ARRAY['Marketing', 'Digital Marketing', 'Social Media'], 3, 'Bachelor''s Degree', 12000, 18000, true, true, true),
('660e8400-e29b-41d4-a716-446655440003', 'omar.alkaabi@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Omar', 'Al Kaabi', '+971503456789', 'candidate', 'Sharjah', 'UAE', true, ARRAY['Project Management', 'Team Leadership', 'Strategic Planning'], 8, 'Master''s Degree', 20000, 30000, true, true, true),
('660e8400-e29b-41d4-a716-446655440004', 'aisha.alnuaimi@hotmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Aisha', 'Al Nuaimi', '+971504567890', 'candidate', 'Dubai', 'UAE', true, ARRAY['Nursing', 'Healthcare', 'Patient Care'], 4, 'Bachelor''s Degree', 10000, 15000, true, true, true),
('660e8400-e29b-41d4-a716-446655440005', 'mohammed.alshehhi@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Mohammed', 'Al Shehhi', '+971505678901', 'candidate', 'Abu Dhabi', 'UAE', true, ARRAY['Software Engineering', 'React', 'Node.js'], 6, 'Bachelor''s Degree', 18000, 28000, true, true, true),
('660e8400-e29b-41d4-a716-446655440006', 'sara.almarzooqi@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Sara', 'Al Marzooqi', '+971506789012', 'candidate', 'Dubai', 'UAE', true, ARRAY['Finance', 'Financial Analysis', 'Islamic Banking'], 7, 'Master''s Degree', 22000, 32000, true, true, true),
('660e8400-e29b-41d4-a716-446655440007', 'khalid.alblooshi@outlook.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Khalid', 'Al Blooshi', '+971507890123', 'candidate', 'Ajman', 'UAE', true, ARRAY['Mechanical Engineering', 'Oil & Gas', 'Project Management'], 9, 'Bachelor''s Degree', 25000, 35000, true, true, true),
('660e8400-e29b-41d4-a716-446655440008', 'maryam.alqasimi@gmail.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Maryam', 'Al Qasimi', '+971508901234', 'candidate', 'Ras Al Khaimah', 'UAE', true, ARRAY['Education', 'Teaching', 'Curriculum Development'], 5, 'Master''s Degree', 14000, 20000, true, true, true);

-- Insert sample users (recruiters and employers)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, emirate, nationality, is_uae_national, experience_years, education_level, is_verified, email_verified, phone_verified) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'hr.manager@enoc.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Layla', 'Al Rashid', '+971509012345', 'recruiter', 'Dubai', 'UAE', true, 10, 'Master''s Degree', true, true, true),
('770e8400-e29b-41d4-a716-446655440002', 'talent.acquisition@dib.ae', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Hassan', 'Al Mahmoud', '+971510123456', 'recruiter', 'Dubai', 'UAE', true, 8, 'Bachelor''s Degree', true, true, true),
('770e8400-e29b-41d4-a716-446655440003', 'recruitment@etisalat.ae', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Noura', 'Al Suwaidi', '+971511234567', 'recruiter', 'Abu Dhabi', 'UAE', true, 12, 'Master''s Degree', true, true, true),
('770e8400-e29b-41d4-a716-446655440004', 'hr.director@dha.gov.ae', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Abdullah', 'Al Falasi', '+971512345678', 'employer', 'Dubai', 'UAE', true, 15, 'Master''s Degree', true, true, true),
('770e8400-e29b-41d4-a716-446655440005', 'people.ops@careem.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'Amna', 'Al Ketbi', '+971513456789', 'recruiter', 'Dubai', 'UAE', true, 6, 'Bachelor''s Degree', true, true, true);

-- Insert sample admin user
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, emirate, nationality, is_uae_national, experience_years, education_level, is_verified, email_verified, phone_verified) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'admin@emiratijourney.ae', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QV9VqiW', 'System', 'Administrator', '+971514567890', 'admin', 'Dubai', 'UAE', true, 10, 'Master''s Degree', true, true, true);

-- Insert sample jobs
INSERT INTO jobs (id, title, description, requirements, responsibilities, benefits, company_id, posted_by, job_type, experience_level, salary_min, salary_max, location, emirate, skills_required, education_required, emiratization_priority, uae_nationals_only, status, application_deadline, positions_available, published_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'Senior Data Scientist', 'Join our data science team to drive insights and innovation using advanced analytics and machine learning techniques.', 'Master''s degree in Data Science, Statistics, or related field. 5+ years of experience in data science and machine learning. Proficiency in Python, R, and SQL.', 'Develop and implement machine learning models, analyze large datasets, collaborate with cross-functional teams, present findings to stakeholders.', 'Competitive salary, health insurance, annual bonus, professional development opportunities, flexible working hours.', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'full-time', 'senior', 25000, 35000, 'Dubai, UAE', 'Dubai', ARRAY['Python', 'Machine Learning', 'Data Analysis', 'SQL'], 'Master''s Degree', true, false, 'active', '2024-10-15', 2, CURRENT_TIMESTAMP),

('990e8400-e29b-41d4-a716-446655440002', 'Digital Marketing Manager', 'Lead our digital marketing initiatives to enhance brand presence and drive customer engagement across multiple channels.', 'Bachelor''s degree in Marketing or related field. 3+ years of digital marketing experience. Strong knowledge of SEO, SEM, and social media marketing.', 'Develop digital marketing strategies, manage social media campaigns, analyze marketing metrics, coordinate with creative teams.', 'Competitive package, health benefits, performance bonuses, training opportunities, modern office environment.', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'full-time', 'mid', 15000, 22000, 'Dubai, UAE', 'Dubai', ARRAY['Digital Marketing', 'SEO', 'Social Media', 'Analytics'], 'Bachelor''s Degree', true, false, 'active', '2024-10-20', 1, CURRENT_TIMESTAMP),

('990e8400-e29b-41d4-a716-446655440003', 'Software Engineer - Frontend', 'Develop cutting-edge web applications using modern frontend technologies in our innovative tech environment.', 'Bachelor''s degree in Computer Science or related field. 3+ years of frontend development experience. Expertise in React, JavaScript, and modern web technologies.', 'Build responsive web applications, collaborate with UX/UI designers, optimize application performance, participate in code reviews.', 'Excellent salary, comprehensive health coverage, stock options, learning budget, flexible work arrangements.', '550e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', 'full-time', 'mid', 18000, 26000, 'Dubai, UAE', 'Dubai', ARRAY['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'], 'Bachelor''s Degree', false, false, 'active', '2024-10-25', 3, CURRENT_TIMESTAMP),

('990e8400-e29b-41d4-a716-446655440004', 'Registered Nurse - ICU', 'Provide exceptional patient care in our state-of-the-art intensive care unit with opportunities for professional growth.', 'Bachelor''s degree in Nursing. Valid UAE nursing license. Minimum 2 years ICU experience. BLS and ACLS certification required.', 'Provide direct patient care, monitor patient conditions, administer medications, collaborate with medical team, maintain patient records.', 'Competitive salary, comprehensive benefits, continuing education support, career advancement opportunities, international work environment.', '550e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', 'full-time', 'mid', 12000, 18000, 'Dubai, UAE', 'Dubai', ARRAY['Nursing', 'ICU Care', 'Patient Monitoring', 'Medical Equipment'], 'Bachelor''s Degree', true, true, 'active', '2024-11-01', 5, CURRENT_TIMESTAMP),

('990e8400-e29b-41d4-a716-446655440005', 'Project Manager - Oil & Gas', 'Lead complex oil and gas projects from initiation to completion, ensuring delivery within scope, time, and budget.', 'Bachelor''s degree in Engineering. PMP certification preferred. 7+ years of project management experience in oil & gas industry.', 'Manage project lifecycle, coordinate with stakeholders, monitor project progress, ensure compliance with safety standards, prepare project reports.', 'Attractive package, family benefits, annual leave, training programs, career progression opportunities, international assignments.', '550e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', 'full-time', 'senior', 28000, 38000, 'Abu Dhabi, UAE', 'Abu Dhabi', ARRAY['Project Management', 'Oil & Gas', 'Risk Management', 'Stakeholder Management'], 'Bachelor''s Degree', true, false, 'active', '2024-10-30', 2, CURRENT_TIMESTAMP),

('990e8400-e29b-41d4-a716-446655440006', 'Guest Relations Manager', 'Deliver exceptional guest experiences and manage guest relations operations in our luxury hospitality environment.', 'Bachelor''s degree in Hospitality Management or related field. 5+ years of guest relations experience in luxury hotels. Fluency in Arabic and English.', 'Oversee guest services, handle VIP guests, resolve guest complaints, train guest relations staff, maintain service standards.', 'Competitive salary, service charge, health insurance, staff accommodation, meals, training opportunities, career development.', '550e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440001', 'full-time', 'senior', 20000, 28000, 'Dubai, UAE', 'Dubai', ARRAY['Hospitality', 'Customer Service', 'Team Management', 'Arabic Language'], 'Bachelor''s Degree', true, false, 'active', '2024-11-05', 1, CURRENT_TIMESTAMP),

('990e8400-e29b-41d4-a716-446655440007', 'Investment Analyst', 'Analyze investment opportunities and support strategic investment decisions in our dynamic investment environment.', 'Master''s degree in Finance, Economics, or related field. CFA certification preferred. 3+ years of investment analysis experience.', 'Conduct financial analysis, prepare investment reports, monitor portfolio performance, support due diligence processes, present to investment committee.', 'Excellent compensation, performance bonuses, health benefits, professional development, networking opportunities, international exposure.', '550e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440003', 'full-time', 'mid', 22000, 30000, 'Abu Dhabi, UAE', 'Abu Dhabi', ARRAY['Financial Analysis', 'Investment Analysis', 'Financial Modeling', 'Risk Assessment'], 'Master''s Degree', true, false, 'active', '2024-10-28', 2, CURRENT_TIMESTAMP),

('990e8400-e29b-41d4-a716-446655440008', 'Telecommunications Engineer', 'Design and implement telecommunications solutions to support our network infrastructure and expansion plans.', 'Bachelor''s degree in Telecommunications or Electrical Engineering. 4+ years of telecom experience. Knowledge of 5G and fiber optic technologies.', 'Design network solutions, implement telecom systems, troubleshoot network issues, optimize network performance, prepare technical documentation.', 'Competitive package, technical training, certification support, health benefits, annual bonus, career advancement opportunities.', '550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'full-time', 'mid', 20000, 28000, 'Abu Dhabi, UAE', 'Abu Dhabi', ARRAY['Telecommunications', 'Network Engineering', '5G Technology', 'Fiber Optics'], 'Bachelor''s Degree', true, false, 'active', '2024-11-10', 3, CURRENT_TIMESTAMP);

-- Insert sample applications
INSERT INTO applications (id, job_id, user_id, status, cover_letter, expected_salary, available_from, skills_match_score, experience_match_score, overall_match_score, created_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'pending', 'I am excited to apply for the Senior Data Scientist position. With my 5 years of experience in data science and strong background in machine learning, I believe I would be a valuable addition to your team.', 30000, '2024-11-01', 92.5, 88.0, 90.3, CURRENT_TIMESTAMP - INTERVAL '2 days'),

('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'reviewed', 'I am passionate about digital marketing and would love to contribute to your marketing initiatives. My experience in social media marketing and digital campaigns aligns well with your requirements.', 18000, '2024-10-20', 95.0, 75.0, 85.0, CURRENT_TIMESTAMP - INTERVAL '3 days'),

('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 'interview', 'As a software engineer with 6 years of experience, I am excited about the opportunity to work with modern frontend technologies at Careem. My expertise in React and Node.js makes me a perfect fit for this role.', 24000, '2024-10-15', 88.0, 92.0, 90.0, CURRENT_TIMESTAMP - INTERVAL '5 days'),

('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'offer', 'I am a dedicated registered nurse with 4 years of experience, including 2 years in ICU. I am committed to providing exceptional patient care and would be honored to join your healthcare team.', 15000, '2024-10-25', 90.0, 85.0, 87.5, CURRENT_TIMESTAMP - INTERVAL '7 days'),

('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', 'pending', 'With 8 years of project management experience and strong leadership skills, I am confident in my ability to successfully manage complex oil & gas projects at ADNOC.', 32000, '2024-11-15', 85.0, 95.0, 90.0, CURRENT_TIMESTAMP - INTERVAL '1 day'),

('aa0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440008', 'reviewed', 'As an educator with experience in curriculum development, I believe my skills in communication and teaching would translate well to guest relations in the hospitality industry.', 22000, '2024-11-01', 70.0, 60.0, 65.0, CURRENT_TIMESTAMP - INTERVAL '4 days'),

('aa0e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440006', 'pending', 'My 7 years of experience in finance and financial analysis, combined with my knowledge of Islamic banking, makes me an ideal candidate for the Investment Analyst position.', 28000, '2024-10-30', 92.0, 88.0, 90.0, CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Insert sample messages
INSERT INTO messages (id, conversation_id, sender_id, recipient_id, subject, content, related_job_id, related_application_id, created_at) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'conv-001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Application Update - Senior Data Scientist', 'Thank you for your application for the Senior Data Scientist position. We have reviewed your profile and would like to schedule an initial interview. Please let us know your availability for next week.', '990e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '1 day'),

('bb0e8400-e29b-41d4-a716-446655440002', 'conv-001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Re: Application Update - Senior Data Scientist', 'Thank you for considering my application. I am available for an interview on Tuesday, Wednesday, or Thursday next week, preferably in the afternoon. Looking forward to hearing from you.', '990e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '12 hours'),

('bb0e8400-e29b-41d4-a716-446655440003', 'conv-002', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'Job Offer - Registered Nurse ICU', 'Congratulations! We are pleased to offer you the position of Registered Nurse in our ICU department. Please find the offer details attached. We look forward to welcoming you to our team.', '990e8400-e29b-41d4-a716-446655440004', 'aa0e8400-e29b-41d4-a716-446655440004', CURRENT_TIMESTAMP - INTERVAL '6 hours'),

('bb0e8400-e29b-41d4-a716-446655440004', 'conv-003', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'Interview Invitation - Frontend Developer', 'Hi Mohammed, thank you for your interest in the Frontend Developer position at Careem. We would like to invite you for a technical interview. The interview will include a coding challenge and discussion about your experience with React.', '990e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440003', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Insert sample saved jobs
INSERT INTO saved_jobs (user_id, job_id, notes, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440007', 'Interesting investment analyst role, good for career growth', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('660e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440006', 'Luxury hospitality experience would be valuable', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('660e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440008', 'Telecommunications role aligns with my technical background', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Insert sample job views
INSERT INTO job_views (job_id, user_id, view_duration, created_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 180, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 120, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 240, CURRENT_TIMESTAMP - INTERVAL '4 days'),
('990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 300, CURRENT_TIMESTAMP - INTERVAL '6 days'),
('990e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 200, CURRENT_TIMESTAMP - INTERVAL '8 days'),
('990e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', 150, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('990e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440008', 180, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('990e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440006', 220, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('990e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440005', 160, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Insert sample analytics events
INSERT INTO analytics_events (user_id, event_type, event_category, event_data, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'job_view', 'engagement', '{"job_id": "990e8400-e29b-41d4-a716-446655440001", "duration": 180}', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('660e8400-e29b-41d4-a716-446655440001', 'application_submit', 'conversion', '{"job_id": "990e8400-e29b-41d4-a716-446655440001", "application_id": "aa0e8400-e29b-41d4-a716-446655440001"}', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('660e8400-e29b-41d4-a716-446655440002', 'job_search', 'engagement', '{"query": "marketing", "results_count": 5}', CURRENT_TIMESTAMP - INTERVAL '4 days'),
('660e8400-e29b-41d4-a716-446655440002', 'application_submit', 'conversion', '{"job_id": "990e8400-e29b-41d4-a716-446655440002", "application_id": "aa0e8400-e29b-41d4-a716-446655440002"}', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('660e8400-e29b-41d4-a716-446655440005', 'profile_update', 'engagement', '{"section": "skills", "changes": ["React", "Node.js"]}', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('770e8400-e29b-41d4-a716-446655440001', 'job_post', 'content_creation', '{"job_id": "990e8400-e29b-41d4-a716-446655440001", "title": "Senior Data Scientist"}', CURRENT_TIMESTAMP - INTERVAL '7 days'),
('770e8400-e29b-41d4-a716-446655440002', 'application_review', 'recruitment', '{"application_id": "aa0e8400-e29b-41d4-a716-446655440002", "status": "reviewed"}', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, notification_type, related_id, action_url, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Application Status Update', 'Your application for Senior Data Scientist position has been reviewed', 'application', 'aa0e8400-e29b-41d4-a716-446655440001', '/applications/aa0e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440004', 'Job Offer Received', 'Congratulations! You have received a job offer for Registered Nurse ICU position', 'application', 'aa0e8400-e29b-41d4-a716-446655440004', '/applications/aa0e8400-e29b-41d4-a716-446655440004', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
('660e8400-e29b-41d4-a716-446655440005', 'Interview Scheduled', 'Your interview for Frontend Developer position has been scheduled', 'application', 'aa0e8400-e29b-41d4-a716-446655440003', '/applications/aa0e8400-e29b-41d4-a716-446655440003', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('770e8400-e29b-41d4-a716-446655440001', 'New Application Received', 'You have received a new application for Senior Data Scientist position', 'application', 'aa0e8400-e29b-41d4-a716-446655440001', '/recruiter/applications/aa0e8400-e29b-41d4-a716-446655440001', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('770e8400-e29b-41d4-a716-446655440005', 'Application Update', 'Application status updated for Frontend Developer position', 'application', 'aa0e8400-e29b-41d4-a716-446655440003', '/recruiter/applications/aa0e8400-e29b-41d4-a716-446655440003', CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Update job application counts
UPDATE jobs SET applications_count = (
    SELECT COUNT(*) FROM applications WHERE applications.job_id = jobs.id
);

-- Update job views count
UPDATE jobs SET views_count = (
    SELECT COUNT(*) FROM job_views WHERE job_views.job_id = jobs.id
);

-- Success message
SELECT 'Sample data inserted successfully!' as status,
       (SELECT COUNT(*) FROM users) as total_users,
       (SELECT COUNT(*) FROM companies) as total_companies,
       (SELECT COUNT(*) FROM jobs) as total_jobs,
       (SELECT COUNT(*) FROM applications) as total_applications,
       (SELECT COUNT(*) FROM messages) as total_messages;

