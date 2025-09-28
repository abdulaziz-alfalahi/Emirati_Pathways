-- School Programs Sample Data for PostgreSQL (Final Correct Version)
-- Compatible with existing database structure using correct primary key references
-- Uses schools(id) and users(id) references
-- Created: 2025-09-27

-- Insert sample school programs
INSERT INTO school_programs (
    school_id, title_en, title_ar, description_en, description_ar, category, subcategory,
    target_age_min, target_age_max, duration_value, duration_unit, capacity_total, capacity_available,
    fees_currency, fees_amount, fees_frequency, start_date, end_date, application_deadline,
    requirements, learning_outcomes, assessment_methods, certification_offered,
    language_of_instruction, schedule_days, schedule_time_start, schedule_time_end,
    location_on_campus, equipment_provided, prerequisites, contact_person, contact_email,
    featured, status, workflow_stage
) VALUES
-- STEM Programs
(
    (SELECT id FROM schools WHERE code = 'DIA001'),
    'Advanced STEM Innovation Program',
    'Advanced STEM Innovation Program (Arabic)',
    'A comprehensive STEM program focusing on robotics, AI, and sustainable technology solutions. Students engage in hands-on projects, research, and innovation challenges.',
    'A comprehensive STEM program focusing on robotics, AI, and sustainable technology solutions (Arabic description)',
    'STEM', 'Robotics & AI',
    14, 18, 2, 'years', 150, 120, 'AED', 25000.00, 'annual',
    '2024-09-01', '2026-06-30', '2024-07-15',
    ARRAY['Strong mathematics background', 'Interest in technology', 'Problem-solving skills'],
    ARRAY['Programming proficiency', 'Robotics design', 'AI fundamentals', 'Project management', 'Innovation thinking'],
    ARRAY['Project portfolios', 'Peer assessments', 'Innovation challenges', 'Research presentations'],
    'STEM Innovation Certificate',
    ARRAY['English', 'Arabic'],
    ARRAY['Monday', 'Wednesday', 'Friday'],
    '14:00', '16:30',
    TRUE,
    ARRAY['3D printers', 'Arduino kits', 'Sensors', 'Laptops', 'Lab equipment'],
    ARRAY['Grade 9 completion', 'Mathematics grade B or above'],
    'Dr. Ahmed Al Mansouri',
    'stem@dia.ae',
    TRUE, 'published', 'publication'
),
(
    (SELECT id FROM schools WHERE code = 'GWA002'),
    'Sustainable Engineering Challenge',
    'Sustainable Engineering Challenge (Arabic)',
    'Students work on real-world engineering challenges focused on sustainability and environmental solutions.',
    'Students work on real-world engineering challenges focused on sustainability (Arabic description)',
    'STEM', 'Engineering',
    13, 17, 1, 'years', 80, 65, 'AED', 18000.00, 'annual',
    '2024-09-01', '2025-06-30', '2024-08-01',
    ARRAY['Science background', 'Environmental awareness', 'Team collaboration skills'],
    ARRAY['Engineering design process', 'Sustainability principles', 'Environmental impact assessment'],
    ARRAY['Design challenges', 'Group projects', 'Sustainability reports'],
    'Sustainable Engineering Certificate',
    ARRAY['English'],
    ARRAY['Tuesday', 'Thursday'],
    '15:00', '17:00',
    TRUE,
    ARRAY['CAD software', 'Prototyping materials', 'Testing equipment'],
    ARRAY['Grade 8 completion', 'Science grade B or above'],
    'Ms. Sarah Johnson',
    'engineering@wellington.ae',
    TRUE, 'published', 'publication'
),

-- Arts Programs
(
    (SELECT id FROM schools WHERE code = 'GWA002'),
    'Creative Arts Excellence Program',
    'Creative Arts Excellence Program (Arabic)',
    'Develop artistic talents through comprehensive visual and performing arts education, including digital art, traditional painting, sculpture, and multimedia projects.',
    'Develop artistic talents through comprehensive visual and performing arts education (Arabic description)',
    'Arts', 'Visual Arts',
    12, 17, 3, 'years', 100, 85, 'AED', 22000.00, 'annual',
    '2024-09-01', '2027-06-30', '2024-07-20',
    ARRAY['Creative portfolio', 'Artistic interest', 'Commitment to practice'],
    ARRAY['Artistic techniques', 'Creative expression', 'Art history knowledge', 'Digital art skills', 'Portfolio development'],
    ARRAY['Portfolio reviews', 'Art exhibitions', 'Peer critiques', 'Final projects'],
    'Creative Arts Diploma',
    ARRAY['English', 'Arabic'],
    ARRAY['Monday', 'Tuesday', 'Thursday'],
    '13:30', '16:00',
    TRUE,
    ARRAY['Art supplies', 'Digital tablets', 'Cameras', 'Studio space', 'Kiln access'],
    ARRAY['Grade 7 completion', 'Art portfolio submission'],
    'Ms. Fatima Al Zahra',
    'arts@wellington.ae',
    TRUE, 'published', 'publication'
),
(
    (SELECT id FROM schools WHERE code = 'ASD003'),
    'Performing Arts Academy',
    'Performing Arts Academy (Arabic)',
    'A comprehensive performing arts program covering drama, music, and dance with professional-level training.',
    'A comprehensive performing arts program covering drama, music, and dance (Arabic description)',
    'Arts', 'Performing Arts',
    11, 18, 4, 'years', 120, 95, 'AED', 28000.00, 'annual',
    '2024-09-01', '2028-06-30', '2024-07-10',
    ARRAY['Audition required', 'Performance experience', 'Dedication to practice'],
    ARRAY['Performance skills', 'Stage presence', 'Musical proficiency', 'Dance techniques', 'Drama skills'],
    ARRAY['Live performances', 'Auditions', 'Skill assessments', 'Final showcases'],
    'Performing Arts Certificate',
    ARRAY['English'],
    ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday'],
    '14:00', '17:30',
    TRUE,
    ARRAY['Musical instruments', 'Sound system', 'Stage lighting', 'Costumes', 'Recording equipment'],
    ARRAY['Grade 6 completion', 'Successful audition'],
    'Mr. David Thompson',
    'performing@asdubai.org',
    FALSE, 'published', 'publication'
),

-- Sports Programs
(
    (SELECT id FROM schools WHERE code = 'ASD003'),
    'Sports Leadership Academy',
    'Sports Leadership Academy (Arabic)',
    'Combine athletic excellence with leadership development and academic achievement. Focus on team sports, individual performance, and sports management.',
    'Combine athletic excellence with leadership development and academic achievement (Arabic description)',
    'Sports', 'Leadership',
    13, 18, 4, 'years', 120, 95, 'AED', 28000.00, 'annual',
    '2024-09-01', '2028-06-30', '2024-08-15',
    ARRAY['Physical fitness assessment', 'Leadership potential', 'Team player mentality'],
    ARRAY['Athletic skills', 'Leadership abilities', 'Sports psychology', 'Team management', 'Coaching fundamentals'],
    ARRAY['Athletic performance', 'Leadership projects', 'Team evaluations', 'Coaching practicum'],
    'Sports Leadership Certificate',
    ARRAY['English', 'Arabic'],
    ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    '15:30', '18:00',
    TRUE,
    ARRAY['Sports equipment', 'Fitness facilities', 'Video analysis tools', 'First aid kits'],
    ARRAY['Grade 8 completion', 'Physical fitness test', 'Medical clearance'],
    'Coach Omar Al Rashid',
    'sports@asdubai.org',
    FALSE, 'published', 'publication'
),

-- Language Programs
(
    (SELECT id FROM schools WHERE code = 'DIA001'),
    'Multilingual Communication Excellence',
    'Multilingual Communication Excellence (Arabic)',
    'Advanced language program focusing on Arabic, English, French, and Mandarin with cultural immersion and international communication skills.',
    'Advanced language program focusing on Arabic, English, French, and Mandarin (Arabic description)',
    'Languages', 'Multilingual',
    10, 16, 3, 'years', 90, 75, 'AED', 20000.00, 'annual',
    '2024-09-01', '2027-06-30', '2024-07-25',
    ARRAY['Language aptitude', 'Cultural interest', 'Communication skills'],
    ARRAY['Multilingual proficiency', 'Cultural awareness', 'International communication', 'Translation skills'],
    ARRAY['Language proficiency tests', 'Cultural presentations', 'Translation projects', 'Oral examinations'],
    'Multilingual Communication Certificate',
    ARRAY['Arabic', 'English', 'French', 'Mandarin'],
    ARRAY['Monday', 'Wednesday', 'Friday'],
    '13:00', '15:30',
    TRUE,
    ARRAY['Language lab', 'Audio equipment', 'Cultural resources', 'Online platforms'],
    ARRAY['Grade 5 completion', 'Language assessment'],
    'Ms. Aisha Al Mahmoud',
    'languages@dia.ae',
    FALSE, 'under_review', 'educational_review'
),

-- Business Programs
(
    (SELECT id FROM schools WHERE code = 'DIA001'),
    'Young Entrepreneurs Program',
    'Young Entrepreneurs Program (Arabic)',
    'Develop entrepreneurial skills through real business projects, mentorship, and startup incubation.',
    'Develop entrepreneurial skills through real business projects, mentorship, and startup incubation (Arabic description)',
    'Business', 'Entrepreneurship',
    15, 18, 2, 'years', 60, 45, 'AED', 24000.00, 'annual',
    '2024-09-01', '2026-06-30', '2024-08-01',
    ARRAY['Business interest', 'Leadership potential', 'Innovation mindset'],
    ARRAY['Business planning', 'Financial literacy', 'Marketing skills', 'Leadership development', 'Startup management'],
    ARRAY['Business plan presentations', 'Startup pitches', 'Financial reports', 'Market research projects'],
    'Young Entrepreneur Certificate',
    ARRAY['English', 'Arabic'],
    ARRAY['Tuesday', 'Thursday', 'Saturday'],
    '14:30', '17:00',
    TRUE,
    ARRAY['Business simulation software', 'Presentation equipment', 'Meeting rooms', 'Mentorship network'],
    ARRAY['Grade 10 completion', 'Business aptitude test'],
    'Mr. Khalid Al Mansoori',
    'business@dia.ae',
    TRUE, 'draft', 'content_creation'
);

-- Insert success metrics for published programs (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'program_success_metrics') THEN
        INSERT INTO program_success_metrics (
            program_id, graduation_rate, employment_rate, satisfaction_score, industry_partnerships,
            awards_received, parent_feedback_score, student_retention_rate, university_acceptance_rate,
            scholarship_recipients
        ) VALUES
        (
            (SELECT id FROM school_programs WHERE title_en = 'Advanced STEM Innovation Program'),
            95.5, 88.2, 4.8, 12,
            ARRAY['Dubai Innovation Award 2023', 'KHDA Excellence in STEM 2024'],
            4.7, 92.3, 96.8, 15
        ),
        (
            (SELECT id FROM school_programs WHERE title_en = 'Sustainable Engineering Challenge'),
            91.2, 85.7, 4.6, 8,
            ARRAY['Green Schools Award 2023', 'Sustainability Excellence 2024'],
            4.5, 89.1, 94.2, 10
        ),
        (
            (SELECT id FROM school_programs WHERE title_en = 'Creative Arts Excellence Program'),
            93.8, 78.5, 4.7, 15,
            ARRAY['Arts Education Excellence 2023', 'Creative Innovation Award 2024'],
            4.6, 91.5, 89.3, 12
        ),
        (
            (SELECT id FROM school_programs WHERE title_en = 'Performing Arts Academy'),
            96.2, 82.1, 4.9, 18,
            ARRAY['Performing Arts Excellence 2023', 'Cultural Achievement Award 2024'],
            4.8, 94.7, 87.6, 20
        ),
        (
            (SELECT id FROM school_programs WHERE title_en = 'Sports Leadership Academy'),
            94.1, 91.3, 4.7, 10,
            ARRAY['Sports Excellence Award 2023', 'Leadership Development Recognition 2024'],
            4.6, 93.2, 92.8, 8
        );
    END IF;
END $$;

-- Insert program tags (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'program_tags') THEN
        INSERT INTO program_tags (program_id, tag_name, tag_type) VALUES
        -- STEM Program tags
        ((SELECT id FROM school_programs WHERE title_en = 'Advanced STEM Innovation Program'), 'Robotics', 'technology'),
        ((SELECT id FROM school_programs WHERE title_en = 'Advanced STEM Innovation Program'), 'Artificial Intelligence', 'technology'),
        ((SELECT id FROM school_programs WHERE title_en = 'Advanced STEM Innovation Program'), 'Innovation', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Advanced STEM Innovation Program'), 'Problem Solving', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Advanced STEM Innovation Program'), 'Programming', 'technology'),

        -- Engineering Program tags
        ((SELECT id FROM school_programs WHERE title_en = 'Sustainable Engineering Challenge'), 'Sustainability', 'methodology'),
        ((SELECT id FROM school_programs WHERE title_en = 'Sustainable Engineering Challenge'), 'Environmental Science', 'technology'),
        ((SELECT id FROM school_programs WHERE title_en = 'Sustainable Engineering Challenge'), 'Design Thinking', 'methodology'),
        ((SELECT id FROM school_programs WHERE title_en = 'Sustainable Engineering Challenge'), 'Green Technology', 'technology'),

        -- Arts Program tags
        ((SELECT id FROM school_programs WHERE title_en = 'Creative Arts Excellence Program'), 'Digital Art', 'technology'),
        ((SELECT id FROM school_programs WHERE title_en = 'Creative Arts Excellence Program'), 'Traditional Art', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Creative Arts Excellence Program'), 'Portfolio Development', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Creative Arts Excellence Program'), 'Creative Expression', 'skill'),

        -- Performing Arts tags
        ((SELECT id FROM school_programs WHERE title_en = 'Performing Arts Academy'), 'Drama', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Performing Arts Academy'), 'Music', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Performing Arts Academy'), 'Dance', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Performing Arts Academy'), 'Stage Performance', 'skill'),

        -- Sports Program tags
        ((SELECT id FROM school_programs WHERE title_en = 'Sports Leadership Academy'), 'Leadership', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Sports Leadership Academy'), 'Team Sports', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Sports Leadership Academy'), 'Athletic Performance', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Sports Leadership Academy'), 'Sports Management', 'skill'),

        -- Language Program tags
        ((SELECT id FROM school_programs WHERE title_en = 'Multilingual Communication Excellence'), 'Arabic', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Multilingual Communication Excellence'), 'English', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Multilingual Communication Excellence'), 'French', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Multilingual Communication Excellence'), 'Mandarin', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Multilingual Communication Excellence'), 'Cultural Awareness', 'skill'),

        -- Business Program tags
        ((SELECT id FROM school_programs WHERE title_en = 'Young Entrepreneurs Program'), 'Entrepreneurship', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Young Entrepreneurs Program'), 'Business Planning', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Young Entrepreneurs Program'), 'Financial Literacy', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Young Entrepreneurs Program'), 'Innovation', 'skill'),
        ((SELECT id FROM school_programs WHERE title_en = 'Young Entrepreneurs Program'), 'Leadership', 'skill');
    END IF;
END $$;

-- Check if users table exists and has data before inserting workflow history
DO $$
DECLARE
    sample_user_id UUID;
    stem_program_id UUID;
    user_count INTEGER;
BEGIN
    -- Check if users table exists and has data
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count > 0 THEN
        -- Try to get a sample user ID
        SELECT id INTO sample_user_id FROM users LIMIT 1;
        
        IF sample_user_id IS NOT NULL THEN
            SELECT id INTO stem_program_id FROM school_programs WHERE title_en = 'Advanced STEM Innovation Program';
            
            IF stem_program_id IS NOT NULL AND 
               EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'program_workflow_history') THEN
                INSERT INTO program_workflow_history (
                    program_id, stage_from, stage_to, action_type, actor_id, actor_role, 
                    comments, completed_at
                ) VALUES
                (
                    stem_program_id,
                    'content_creation', 'submission', 'submit',
                    sample_user_id, 'content_creator',
                    'Initial program submission with comprehensive curriculum and resource requirements.',
                    '2024-01-15 10:30:00+00'
                ),
                (
                    stem_program_id,
                    'submission', 'technical_review', 'approve',
                    sample_user_id, 'technical_reviewer',
                    'Technical requirements approved. Equipment list verified and budget confirmed.',
                    '2024-01-18 14:20:00+00'
                ),
                (
                    stem_program_id,
                    'technical_review', 'educational_review', 'approve',
                    sample_user_id, 'educational_reviewer',
                    'Educational content meets KHDA standards and aligns with Education 33 goals.',
                    '2024-01-22 09:15:00+00'
                ),
                (
                    stem_program_id,
                    'educational_review', 'policy_review', 'approve',
                    sample_user_id, 'policy_reviewer',
                    'Program complies with all educational policies and safety requirements.',
                    '2024-01-25 16:45:00+00'
                ),
                (
                    stem_program_id,
                    'policy_review', 'final_approval', 'approve',
                    sample_user_id, 'khda_director',
                    'Final approval granted. Program ready for staging and publication.',
                    '2024-01-28 11:30:00+00'
                ),
                (
                    stem_program_id,
                    'final_approval', 'publication', 'approve',
                    sample_user_id, 'khda_director',
                    'Program published and available for student enrollment.',
                    '2024-02-01 08:00:00+00'
                );
            END IF;
        END IF;
    END IF;
END $$;
