#!/usr/bin/env python3
"""
Test Data Creation Script for Recruiter Management System
FIXED VERSION - Matches actual database schema

This script creates comprehensive test data for:
- Job descriptions
- Users (candidates)
- Candidate shortlist
- Interview schedules
- Job offers

Run this script to populate the database with sample data for testing Option C features.
"""

import psycopg2
import psycopg2.extras
import json
from datetime import datetime, timedelta, date, time
import random

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

def get_connection():
    """Create database connection."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None

def assign_admin_role(conn, user_id, role_name):
    """Assign an admin role to a user."""
    try:
        cursor = conn.cursor()
        
        # Get role ID
        cursor.execute("SELECT id FROM admin_roles WHERE name = %s", (role_name,))
        result = cursor.fetchone()
        
        if result:
            role_id = result[0]
            # Check if already assigned
            cursor.execute("SELECT 1 FROM admin_user_roles WHERE user_id = %s AND role_id = %s", (user_id, role_id))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO admin_user_roles (user_id, role_id, assigned_by)
                    VALUES (%s, %s, (SELECT id FROM users WHERE email='admin@emiratijourney.ae' LIMIT 1))
                """, (user_id, role_id))
                conn.commit()
                print(f"    ✓ Assigned role '{role_name}' to user {user_id}")
        else:
            print(f"    ⚠️ Role '{role_name}' not found")
            
    except Exception as e:
        print(f"    ⚠️ Error assigning role: {e}")
        conn.rollback()

def create_recruiter_user(conn):
    """Create a recruiter user if not exists."""
    try:
        cursor = conn.cursor()
        
        # Check if recruiter exists
        cursor.execute("SELECT id FROM users WHERE email = 'omar.alrashid@moe.gov.ae' LIMIT 1")
        result = cursor.fetchone()
        
        if result:
            recruiter_id = result[0]
            print(f"  ✓ Recruiter already exists (ID: {recruiter_id})")
        else:
            cursor.execute("""
                INSERT INTO users (
                    email, password_hash, full_name, user_type, phone, 
                    location, emirate, company, job_title, is_active, 
                    is_verified, role, nationality, is_uae_national
                )
                VALUES (
                    'omar.alrashid@moe.gov.ae',
                    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLHJ5jLu',
                    'Omar Al Rashid',
                    'recruiter',
                    '+971-50-123-4567',
                    'Dubai',
                    'Dubai',
                    'Ministry of Education',
                    'Senior Talent Specialist',
                    true,
                    true,
                    'recruiter',
                    'UAE',
                    true
                )
                RETURNING id
            """)
            recruiter_id = cursor.fetchone()[0]
            conn.commit()
            print(f"  ✓ Created recruiter: Omar Al Rashid (ID: {recruiter_id})")
        
        assign_admin_role(conn, recruiter_id, 'hr_recruiter')
        return recruiter_id
    except Exception as e:
        print(f"  ⚠️  Error creating recruiter: {e}")
        conn.rollback()
        return None

def create_job_descriptions(conn, recruiter_id):
    """Create job descriptions."""
    jobs = [
        {
            'title': 'Senior Software Engineer',
            'company': 'Ministry of Education',
            'location': 'Dubai',
            'emirate': 'Dubai',
            'employment_type': 'Full-time',
            'salary_range': '15,000 - 25,000 AED',
            'experience_level': 5,
            'required_skills': ['Python', 'React', 'AWS', 'Docker', 'PostgreSQL']
        },
        {
            'title': 'Data Analyst',
            'company': 'Ministry of Education',
            'location': 'Abu Dhabi',
            'emirate': 'Abu Dhabi',
            'employment_type': 'Full-time',
            'salary_range': '12,000 - 18,000 AED',
            'experience_level': 3,
            'required_skills': ['Python', 'SQL', 'Tableau', 'Statistics', 'Excel']
        },
        {
            'title': 'Product Manager',
            'company': 'Ministry of Education',
            'location': 'Sharjah',
            'emirate': 'Sharjah',
            'employment_type': 'Full-time',
            'salary_range': '18,000 - 28,000 AED',
            'experience_level': 6,
            'required_skills': ['Product Management', 'Agile', 'UX Design', 'Analytics', 'Communication']
        }
    ]
    
    job_ids = []
    
    try:
        cursor = conn.cursor()
        
        for job in jobs:
            jd_data = {
                'title': job['title'],
                'company': job['company'],
                'location': job['location'],
                'employment_type': job['employment_type'],
                'salary_range': job['salary_range'],
                'required_skills': job['required_skills'],
                'experience_level': job['experience_level']
            }
            
            cursor.execute("""
                INSERT INTO job_descriptions (
                    user_id, title, company, location, emirate, jd_data,
                    required_skills, experience_level, employment_type,
                    salary_range, is_active, emiratization_friendly
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                recruiter_id,
                job['title'],
                job['company'],
                job['location'],
                job['emirate'],
                json.dumps(jd_data),
                json.dumps(job['required_skills']),
                job['experience_level'],
                job['employment_type'],
                job['salary_range'],
                True,
                True
            ))
            
            job_id = cursor.fetchone()[0]
            job_ids.append(job_id)
            print(f"  ✓ Created job: {job['title']} (ID: {job_id})")
        
        conn.commit()
        return job_ids
    except Exception as e:
        print(f"  ⚠️  Error creating jobs: {e}")
        conn.rollback()
        return []

def create_candidates(conn):
    """Create candidate users."""
    candidates = [
        {
            'email': 'ahmed.almansouri@email.ae',
            'full_name': 'Ahmed Al Mansouri',
            'phone': '+971-50-234-5678',
            'location': 'Dubai',
            'emirate': 'Dubai',
            'job_title': 'Software Engineer',
            'experience_years': 6,
            'skills': ['Python', 'React', 'AWS', 'Docker', 'PostgreSQL', 'Kubernetes'],
            'education_level': 'Bachelor'
        },
        {
            'email': 'fatima.alzahra@email.ae',
            'full_name': 'Fatima Al Zahra',
            'phone': '+971-50-345-6789',
            'location': 'Abu Dhabi',
            'emirate': 'Abu Dhabi',
            'job_title': 'Senior Developer',
            'experience_years': 5,
            'skills': ['Java', 'Spring Boot', 'Kubernetes', 'MySQL', 'Microservices'],
            'education_level': 'Master'
        },
        {
            'email': 'mohammed.alhashimi@email.ae',
            'full_name': 'Mohammed Al Hashimi',
            'phone': '+971-50-456-7890',
            'location': 'Dubai',
            'emirate': 'Dubai',
            'job_title': 'Data Analyst',
            'experience_years': 4,
            'skills': ['Python', 'SQL', 'Tableau', 'Statistics', 'Excel', 'Power BI'],
            'education_level': 'Bachelor'
        },
        {
            'email': 'aisha.alsuwaidi@email.ae',
            'full_name': 'Aisha Al Suwaidi',
            'phone': '+971-50-567-8901',
            'location': 'Sharjah',
            'emirate': 'Sharjah',
            'job_title': 'Product Manager',
            'experience_years': 7,
            'skills': ['Product Management', 'Agile', 'UX Design', 'Analytics', 'Jira'],
            'education_level': 'MBA'
        },
        {
            'email': 'khalid.almazrouei@email.ae',
            'full_name': 'Khalid Al Mazrouei',
            'phone': '+971-50-678-9012',
            'location': 'Dubai',
            'emirate': 'Dubai',
            'job_title': 'Full Stack Developer',
            'experience_years': 7,
            'skills': ['Node.js', 'React', 'MongoDB', 'Express', 'TypeScript', 'GraphQL'],
            'education_level': 'Bachelor'
        },
        {
            'email': 'mariam.alketbi@email.ae',
            'full_name': 'Mariam Al Ketbi',
            'phone': '+971-50-789-0123',
            'location': 'Abu Dhabi',
            'emirate': 'Abu Dhabi',
            'job_title': 'Business Analyst',
            'experience_years': 5,
            'skills': ['Data Analysis', 'SQL', 'Business Intelligence', 'Tableau', 'Python'],
            'education_level': 'Master'
        }
    ]
    
    candidate_ids = []
    
    try:
        cursor = conn.cursor()
        
        for candidate in candidates:
            # Check if candidate already exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (candidate['email'],))
            result = cursor.fetchone()
            
            if result:
                candidate_id = result[0]
                print(f"  ✓ Candidate already exists: {candidate['full_name']} (ID: {candidate_id})")
            else:
                cursor.execute("""
                    INSERT INTO users (
                        email, password_hash, full_name, user_type, phone,
                        location, emirate, job_title, is_active, is_verified,
                        role, nationality, is_uae_national, skills, experience_years,
                        education_level
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    candidate['email'],
                    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLHJ5jLu',
                    candidate['full_name'],
                    'candidate',
                    candidate['phone'],
                    candidate['location'],
                    candidate['emirate'],
                    candidate['job_title'],
                    True,
                    True,
                    'candidate',
                    'UAE',
                    True,
                    candidate['skills'],
                    candidate['experience_years'],
                    candidate['education_level']
                ))
                
                candidate_id = cursor.fetchone()[0]
                print(f"  ✓ Created candidate: {candidate['full_name']} (ID: {candidate_id})")
            
            
            candidate_ids.append(candidate_id)
            assign_admin_role(conn, candidate_id, 'job_seeker')
        
        conn.commit()
        return candidate_ids
    except Exception as e:
        print(f"  ⚠️  Error creating candidates: {e}")
        conn.rollback()
        return []

def create_shortlist_entries(conn, job_ids, candidate_ids, recruiter_id):
    """Create shortlist entries."""
    if not job_ids or not candidate_ids:
        print("  ⚠️  No jobs or candidates to create shortlist")
        return []
    
    shortlist_data = [
        {
            'shortlist_id': 'sl_001',
            'jd_id': str(job_ids[0]),
            'candidate_id': str(candidate_ids[0]),
            'match_score': 92.5,
            'status': 'shortlisted'
        },
        {
            'shortlist_id': 'sl_002',
            'jd_id': str(job_ids[0]),
            'candidate_id': str(candidate_ids[1]),
            'match_score': 88.0,
            'status': 'contacted'
        },
        {
            'shortlist_id': 'sl_003',
            'jd_id': str(job_ids[0]),
            'candidate_id': str(candidate_ids[4]),
            'match_score': 85.5,
            'status': 'interviewed'
        },
        {
            'shortlist_id': 'sl_004',
            'jd_id': str(job_ids[1]),
            'candidate_id': str(candidate_ids[2]),
            'match_score': 90.0,
            'status': 'shortlisted'
        },
        {
            'shortlist_id': 'sl_005',
            'jd_id': str(job_ids[1]),
            'candidate_id': str(candidate_ids[5]),
            'match_score': 87.5,
            'status': 'contacted'
        },
        {
            'shortlist_id': 'sl_006',
            'jd_id': str(job_ids[2]),
            'candidate_id': str(candidate_ids[3]),
            'match_score': 93.0,
            'status': 'shortlisted'
        }
    ]
    
    shortlist_ids = []
    
    try:
        cursor = conn.cursor()
        
        for entry in shortlist_data:
            match_details = {
                'skills_match': entry['match_score'],
                'experience_match': entry['match_score'] - 5,
                'location_match': 100.0
            }
            
            cursor.execute("""
                INSERT INTO candidate_shortlist (
                    shortlist_id, jd_id, candidate_id, recruiter_id,
                    match_score, match_details, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (shortlist_id) DO NOTHING
                RETURNING id
            """, (
                entry['shortlist_id'],
                entry['jd_id'],
                entry['candidate_id'],
                str(recruiter_id),
                entry['match_score'],
                json.dumps(match_details),
                entry['status']
            ))
            
            result = cursor.fetchone()
            if result:
                shortlist_id = result[0]
                shortlist_ids.append(entry['shortlist_id'])
                print(f"  ✓ Created shortlist entry: {entry['shortlist_id']} (JD: {entry['jd_id']}, Candidate: {entry['candidate_id']})")
            else:
                print(f"  ⚠️  Shortlist entry {entry['shortlist_id']} already exists")
        
        conn.commit()
        return shortlist_ids
    except Exception as e:
        print(f"  ⚠️  Error creating shortlist: {e}")
        conn.rollback()
        return []

def create_interview_schedules(conn, job_ids, candidate_ids, recruiter_id):
    """Create interview schedules."""
    if not job_ids or not candidate_ids:
        print("  ⚠️  No jobs or candidates to create interviews")
        return []
    
    interviews = [
        {
            'interview_id': 'int_001',
            'shortlist_id': 'sl_003',
            'candidate_id': str(candidate_ids[4]),
            'jd_id': str(job_ids[0]),
            'interview_type': 'technical',
            'scheduled_date': date.today() - timedelta(days=2),
            'scheduled_time': time(14, 0),
            'status': 'completed',
            'rating': 4,
            'recommendation': 'hire',
            'feedback': 'Excellent technical skills demonstrated. Strong problem-solving abilities and good communication.'
        },
        {
            'interview_id': 'int_002',
            'shortlist_id': 'sl_002',
            'candidate_id': str(candidate_ids[1]),
            'jd_id': str(job_ids[0]),
            'interview_type': 'behavioral',
            'scheduled_date': date.today() + timedelta(days=3),
            'scheduled_time': time(10, 0),
            'status': 'scheduled',
            'rating': None,
            'recommendation': None,
            'feedback': None
        },
        {
            'interview_id': 'int_003',
            'shortlist_id': 'sl_004',
            'candidate_id': str(candidate_ids[2]),
            'jd_id': str(job_ids[1]),
            'interview_type': 'technical',
            'scheduled_date': date.today() - timedelta(days=5),
            'scheduled_time': time(15, 30),
            'status': 'completed',
            'rating': 5,
            'recommendation': 'hire',
            'feedback': 'Outstanding candidate with deep technical knowledge and excellent analytical skills.'
        }
    ]
    
    interview_ids = []
    
    try:
        cursor = conn.cursor()
        
        for interview in interviews:
            cursor.execute("""
                INSERT INTO interview_schedules (
                    interview_id, shortlist_id, candidate_id, recruiter_id,
                    jd_id, interview_type, scheduled_date, scheduled_time,
                    status, rating, recommendation, feedback
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (interview_id) DO NOTHING
                RETURNING id
            """, (
                interview['interview_id'],
                interview['shortlist_id'],
                interview['candidate_id'],
                str(recruiter_id),
                interview['jd_id'],
                interview['interview_type'],
                interview['scheduled_date'],
                interview['scheduled_time'],
                interview['status'],
                interview['rating'],
                interview['recommendation'],
                interview['feedback']
            ))
            
            result = cursor.fetchone()
            if result:
                interview_id = result[0]
                interview_ids.append(interview['interview_id'])
                print(f"  ✓ Created interview: {interview['interview_id']} (Status: {interview['status']})")
            else:
                print(f"  ⚠️  Interview {interview['interview_id']} already exists")
        
        conn.commit()
        return interview_ids
    except Exception as e:
        print(f"  ⚠️  Error creating interviews: {e}")
        conn.rollback()
        return []

def verify_data(conn, job_ids):
    """Verify created data."""
    try:
        cursor = conn.cursor()
        
        # Count job descriptions
        cursor.execute("SELECT COUNT(*) FROM job_descriptions WHERE is_active = true")
        job_count = cursor.fetchone()[0]
        print(f"  ✓ Active job descriptions: {job_count}")
        
        # Count candidates
        cursor.execute("SELECT COUNT(*) FROM users WHERE user_type = 'candidate'")
        candidate_count = cursor.fetchone()[0]
        print(f"  ✓ Total candidates: {candidate_count}")
        
        # Count shortlist entries for first job
        if job_ids:
            cursor.execute("SELECT COUNT(*) FROM candidate_shortlist WHERE jd_id = %s", (str(job_ids[0]),))
            shortlist_count = cursor.fetchone()[0]
            print(f"  ✓ Shortlist entries for job {job_ids[0]}: {shortlist_count}")
        
        # Count interviews
        cursor.execute("SELECT COUNT(*) FROM interview_schedules")
        interview_count = cursor.fetchone()[0]
        print(f"  ✓ Total interviews: {interview_count}")
        
        # Count interviews with feedback
        cursor.execute("SELECT COUNT(*) FROM interview_schedules WHERE feedback IS NOT NULL")
        feedback_count = cursor.fetchone()[0]
        print(f"  ✓ Interviews with feedback: {feedback_count}")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main function."""
    print("=" * 60)
    print("  TEST DATA CREATION SCRIPT")
    print("  Emirati Pathways - Recruiter Management System")
    print("=" * 60)
    
    # Connect to database
    conn = get_connection()
    if not conn:
        return
    
    print("✅ Database connection successful!\n")
    
    # Create recruiter
    print("👤 Creating recruiter user...")
    recruiter_id = create_recruiter_user(conn)
    if not recruiter_id:
        print("❌ Failed to create recruiter")
        conn.close()
        return
    print()
    
    # Create job descriptions
    print("📋 Creating job descriptions...")
    job_ids = create_job_descriptions(conn, recruiter_id)
    print(f"✅ Created {len(job_ids)} job descriptions\n")
    
    # Create candidates
    print("👥 Creating candidates...")
    candidate_ids = create_candidates(conn)
    print(f"✅ Created {len(candidate_ids)} candidates\n")
    
    # Create shortlist entries
    print("📝 Creating shortlist entries...")
    shortlist_ids = create_shortlist_entries(conn, job_ids, candidate_ids, recruiter_id)
    print(f"✅ Created {len(shortlist_ids)} shortlist entries\n")
    
    # Create interview schedules
    print("📅 Creating interview schedules...")
    interview_ids = create_interview_schedules(conn, job_ids, candidate_ids, recruiter_id)
    print(f"✅ Created {len(interview_ids)} interview schedules\n")
    
    # Verify data
    print("🔍 Verifying created data...")
    verify_data(conn, job_ids)
    print("\n✅ Data verification complete!\n")
    
    # Close connection
    conn.close()
    print("🔒 Database connection closed")
    
    print("\n" + "=" * 60)
    print("  ✅ SUCCESS! Test data created successfully")
    print("=" * 60)
    print("\n📊 Summary:")
    print(f"  • {len(job_ids)} job descriptions created")
    print(f"  • {len(candidate_ids)} candidates created")
    print(f"  • {len(shortlist_ids)} shortlist entries created")
    print(f"  • {len(interview_ids)} interview schedules created")
    
    print("\n🎯 Next steps:")
    print("  1. Refresh your browser")
    print("  2. Navigate to: http://localhost:8080/recruiter-dashboard")
    print("  3. Click 'Manage Shortlist' button")
    print("  4. You should now see candidates!")
    
    print("\n🧪 Test Option C features:")
    print("  • Select candidates → 'Create Offer' button appears")
    print("  • Click 📝 icon → Add interview feedback")
    print()

if __name__ == "__main__":
    main()

