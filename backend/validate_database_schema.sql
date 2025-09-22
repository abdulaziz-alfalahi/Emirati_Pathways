-- =====================================================
-- DATABASE SCHEMA VALIDATION AND INTEGRITY TESTING
-- Emirati Journey Platform - Comprehensive Schema Validation
-- =====================================================

-- =====================================================
-- SCHEMA VALIDATION QUERIES
-- =====================================================

-- Check all tables exist
SELECT 'TABLE EXISTENCE CHECK' as validation_type;
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'users', 'candidate_profiles', 'hr_profiles', 'companies', 
            'jobs', 'job_postings', 'applications', 'job_applications',
            'educator_profiles', 'educational_institutions', 'courses', 
            'course_enrollments', 'course_modules', 'student_progress',
            'mentor_profiles', 'mentorship_sessions', 'mentorship_matching',
            'mentorship_goals', 'career_development_plans',
            'assessor_profiles', 'assessments', 'assessment_responses',
            'assessment_questions', 'assessment_results', 'assessment_certifications'
        ) THEN '✅ CORE TABLE'
        ELSE '📋 ADDITIONAL TABLE'
    END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check foreign key constraints
SELECT 'FOREIGN KEY CONSTRAINTS CHECK' as validation_type;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Check indexes
SELECT 'INDEX VALIDATION CHECK' as validation_type;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check unique constraints
SELECT 'UNIQUE CONSTRAINTS CHECK' as validation_type;
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Check check constraints
SELECT 'CHECK CONSTRAINTS VALIDATION' as validation_type;
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints AS tc 
JOIN information_schema.check_constraints AS cc
    ON tc.constraint_name = cc.constraint_name
    AND tc.table_schema = cc.constraint_schema
WHERE tc.constraint_type = 'CHECK' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- DATA INTEGRITY TESTS
-- =====================================================

-- Test 1: User role validation
SELECT 'USER ROLE VALIDATION TEST' as test_name;
SELECT 
    role,
    COUNT(*) as user_count,
    CASE 
        WHEN role IN ('candidate', 'recruiter', 'educator', 'mentor', 'assessor', 'admin') 
        THEN '✅ VALID'
        ELSE '❌ INVALID'
    END as validation_status
FROM users 
GROUP BY role
ORDER BY role;

-- Test 2: Profile completeness check
SELECT 'PROFILE COMPLETENESS TEST' as test_name;
SELECT 
    'Candidate Profiles' as profile_type,
    COUNT(u.id) as total_users,
    COUNT(cp.id) as profiles_created,
    ROUND((COUNT(cp.id)::decimal / NULLIF(COUNT(u.id), 0)) * 100, 2) as completion_percentage
FROM users u
LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
WHERE u.role = 'candidate'
UNION ALL
SELECT 
    'HR Profiles' as profile_type,
    COUNT(u.id) as total_users,
    COUNT(hp.id) as profiles_created,
    ROUND((COUNT(hp.id)::decimal / NULLIF(COUNT(u.id), 0)) * 100, 2) as completion_percentage
FROM users u
LEFT JOIN hr_profiles hp ON u.id = hp.user_id
WHERE u.role = 'recruiter'
UNION ALL
SELECT 
    'Educator Profiles' as profile_type,
    COUNT(u.id) as total_users,
    COUNT(ep.id) as profiles_created,
    ROUND((COUNT(ep.id)::decimal / NULLIF(COUNT(u.id), 0)) * 100, 2) as completion_percentage
FROM users u
LEFT JOIN educator_profiles ep ON u.id = ep.user_id
WHERE u.role = 'educator'
UNION ALL
SELECT 
    'Mentor Profiles' as profile_type,
    COUNT(u.id) as total_users,
    COUNT(mp.id) as profiles_created,
    ROUND((COUNT(mp.id)::decimal / NULLIF(COUNT(u.id), 0)) * 100, 2) as completion_percentage
FROM users u
LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
WHERE u.role = 'mentor'
UNION ALL
SELECT 
    'Assessor Profiles' as profile_type,
    COUNT(u.id) as total_users,
    COUNT(ap.id) as profiles_created,
    ROUND((COUNT(ap.id)::decimal / NULLIF(COUNT(u.id), 0)) * 100, 2) as completion_percentage
FROM users u
LEFT JOIN assessor_profiles ap ON u.id = ap.user_id
WHERE u.role = 'assessor';

-- Test 3: Referential integrity check
SELECT 'REFERENTIAL INTEGRITY TEST' as test_name;
SELECT 
    'Job Applications without Users' as integrity_check,
    COUNT(*) as violation_count
FROM job_applications ja
LEFT JOIN users u ON ja.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'HR Profiles without Users' as integrity_check,
    COUNT(*) as violation_count
FROM hr_profiles hp
LEFT JOIN users u ON hp.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Courses without Institutions' as integrity_check,
    COUNT(*) as violation_count
FROM courses c
LEFT JOIN educational_institutions ei ON c.institution_id = ei.id
WHERE ei.id IS NULL
UNION ALL
SELECT 
    'Mentorship Sessions without Mentors' as integrity_check,
    COUNT(*) as violation_count
FROM mentorship_sessions ms
LEFT JOIN mentor_profiles mp ON ms.mentor_id = mp.id
WHERE mp.id IS NULL;

-- Test 4: Data consistency checks
SELECT 'DATA CONSISTENCY TEST' as test_name;
SELECT 
    'Companies with negative employees' as consistency_check,
    COUNT(*) as violation_count
FROM companies 
WHERE total_employees < 0 OR uae_national_employees < 0
UNION ALL
SELECT 
    'Courses with invalid enrollment' as consistency_check,
    COUNT(*) as violation_count
FROM courses 
WHERE current_enrollment > max_students OR current_enrollment < 0
UNION ALL
SELECT 
    'Mentors exceeding mentee capacity' as consistency_check,
    COUNT(*) as violation_count
FROM mentor_profiles 
WHERE current_mentees > max_mentees
UNION ALL
SELECT 
    'Invalid rating values' as consistency_check,
    COUNT(*) as violation_count
FROM mentor_profiles 
WHERE rating < 0 OR rating > 5;

-- =====================================================
-- PERFORMANCE VALIDATION TESTS
-- =====================================================

-- Test 5: Index usage analysis
SELECT 'INDEX USAGE ANALYSIS' as test_name;
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'job_postings', 'applications', 'courses', 'mentorship_sessions')
ORDER BY tablename, attname;

-- Test 6: Table size analysis
SELECT 'TABLE SIZE ANALYSIS' as test_name;
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- =====================================================
-- FUNCTIONAL RELATIONSHIP TESTS
-- =====================================================

-- Test 7: Cross-persona relationship validation
SELECT 'CROSS-PERSONA RELATIONSHIPS TEST' as test_name;

-- Job applications by candidates to HR job postings
SELECT 
    'Job Applications Flow' as relationship_type,
    COUNT(DISTINCT ja.user_id) as candidates_applied,
    COUNT(DISTINCT jp.company_id) as companies_receiving_applications,
    COUNT(ja.id) as total_applications
FROM job_applications ja
JOIN job_postings jp ON ja.job_posting_id = jp.id
JOIN companies c ON jp.company_id = c.id;

-- Mentorship relationships
SELECT 
    'Mentorship Relationships' as relationship_type,
    COUNT(DISTINCT mm.mentor_id) as active_mentors,
    COUNT(DISTINCT mm.mentee_user_id) as active_mentees,
    COUNT(mm.id) as total_matches
FROM mentorship_matching mm
WHERE mm.match_status = 'active';

-- Course enrollments
SELECT 
    'Course Enrollments' as relationship_type,
    COUNT(DISTINCT ce.course_id) as courses_with_enrollments,
    COUNT(DISTINCT ce.student_user_id) as students_enrolled,
    COUNT(ce.id) as total_enrollments
FROM course_enrollments ce
WHERE ce.enrollment_status = 'active';

-- Assessment participation
SELECT 
    'Assessment Participation' as relationship_type,
    COUNT(DISTINCT ar.assessment_id) as assessments_taken,
    COUNT(DISTINCT ar.candidate_user_id) as candidates_assessed,
    COUNT(ar.id) as total_responses
FROM assessment_responses ar
WHERE ar.completion_status = 'completed';

-- =====================================================
-- SCHEMA COMPLETENESS VALIDATION
-- =====================================================

-- Test 8: Required columns validation
SELECT 'REQUIRED COLUMNS VALIDATION' as test_name;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'candidate_profiles', 'hr_profiles', 'mentor_profiles', 'educator_profiles', 'assessor_profiles')
    AND column_name IN ('id', 'user_id', 'created_at', 'updated_at')
ORDER BY table_name, column_name;

-- Test 9: JSONB columns validation
SELECT 'JSONB COLUMNS VALIDATION' as test_name;
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND data_type = 'jsonb'
ORDER BY table_name, column_name;

-- Test 10: Trigger validation
SELECT 'TRIGGERS VALIDATION' as test_name;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- SECURITY AND PERMISSIONS VALIDATION
-- =====================================================

-- Test 11: Table permissions check
SELECT 'TABLE PERMISSIONS CHECK' as test_name;
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee = 'emirati_user'
ORDER BY table_name, privilege_type;

-- =====================================================
-- FINAL VALIDATION SUMMARY
-- =====================================================

-- Generate overall schema health report
SELECT 'SCHEMA HEALTH SUMMARY' as report_type;

-- Count total tables
SELECT 
    'Total Tables' as metric,
    COUNT(*) as value
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL

-- Count total indexes
SELECT 
    'Total Indexes' as metric,
    COUNT(*) as value
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL

-- Count foreign key constraints
SELECT 
    'Foreign Key Constraints' as metric,
    COUNT(*) as value
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND constraint_type = 'FOREIGN KEY'
UNION ALL

-- Count unique constraints
SELECT 
    'Unique Constraints' as metric,
    COUNT(*) as value
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND constraint_type = 'UNIQUE'
UNION ALL

-- Count check constraints
SELECT 
    'Check Constraints' as metric,
    COUNT(*) as value
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND constraint_type = 'CHECK'
UNION ALL

-- Count triggers
SELECT 
    'Triggers' as metric,
    COUNT(*) as value
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Success message
SELECT 'Database schema validation completed successfully!' as status;
