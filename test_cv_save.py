#!/usr/bin/env python3
"""
Test CV save functionality
"""
import psycopg2
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

try:
    # Database connection
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password'),
        port=os.getenv('DB_PORT', '5432')
    )
    
    print("📊 Connected to database")
    cursor = conn.cursor()
    
    # Test 1: Check if templates exist
    cursor.execute("SELECT name, display_name FROM cv_templates;")
    templates = cursor.fetchall()
    print(f"✅ Found {len(templates)} templates:")
    for template in templates:
        print(f"   - {template[0]}: {template[1]}")
    
    # Test 2: Try to insert a test CV
    user_uuid = '550e8400-e29b-41d4-a716-446655440000'
    test_cv_data = {
        'personalInfo': {
            'firstName': 'Test',
            'lastName': 'User',
            'email': 'test@example.com'
        },
        'professionalSummary': 'Test summary',
        'technicalSkills': ['Python', 'JavaScript'],
        'softSkills': ['Communication'],
        'experience': [],
        'education': []
    }
    
    insert_query = """
        INSERT INTO user_cvs (
            user_id, title, template_id, personal_info, professional_summary,
            technical_skills, soft_skills, work_experience, education,
            cv_score, ats_score, last_analyzed_at, status
        ) VALUES (
            %s::uuid, %s, (SELECT id FROM cv_templates WHERE name = %s LIMIT 1),
            %s::jsonb, %s, %s, %s, %s::jsonb, %s::jsonb,
            %s, %s, CURRENT_TIMESTAMP, 'draft'
        ) RETURNING id, created_at
    """
    
    params = (
        user_uuid,
        'Test CV',
        'government-executive',
        json.dumps(test_cv_data['personalInfo']),
        test_cv_data['professionalSummary'],
        test_cv_data['technicalSkills'],
        test_cv_data['softSkills'],
        json.dumps(test_cv_data['experience']),
        json.dumps(test_cv_data['education']),
        85,
        75
    )
    
    cursor.execute(insert_query, params)
    result = cursor.fetchone()
    
    if result:
        cv_id, created_at = result
        print(f"✅ Test CV saved successfully: {cv_id}")
        print(f"   Created at: {created_at}")
        
        # Test 3: Try to retrieve the CV
        cursor.execute("""
            SELECT title, cv_score, ats_score FROM user_cvs 
            WHERE id = %s::uuid
        """, (cv_id,))
        
        retrieved = cursor.fetchone()
        if retrieved:
            print(f"✅ Test CV retrieved: {retrieved[0]} (Score: {retrieved[1]}%)")
        
        # Clean up - delete test CV
        cursor.execute("DELETE FROM user_cvs WHERE id = %s::uuid", (cv_id,))
        print("🧹 Test CV cleaned up")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("🎉 Database CV operations working correctly!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()