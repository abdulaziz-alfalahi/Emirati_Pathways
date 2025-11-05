#!/usr/bin/env python3
"""
Test Data Creation Script for Recruiter Management System

This script creates comprehensive test data for:
- Job descriptions
- Candidates
- Shortlist entries
- Interview schedules
- Job offers

Run this script to populate the database with sample data for testing Option C features.
"""

import psycopg2
from datetime import datetime, timedelta
import random

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'emirati_journey',
    'user': 'postgres',
    'password': 'postgres'
}

def get_connection():
    """Create database connection."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Database connection successful!")
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\n💡 Make sure PostgreSQL is running:")
        print('   pg_ctl start -D "C:\\Program Files\\PostgreSQL\\14\\data"')
        return None

def create_job_descriptions(conn):
    """Create sample job descriptions."""
    print("\n📋 Creating job descriptions...")
    
    cursor = conn.cursor()
    
    jobs = [
        {
            'jd_id': 'jd_001',
            'title': 'Senior Software Engineer',
            'company': 'Emirates Digital Solutions',
            'location': 'Dubai',
            'department': 'Engineering',
            'status': 'active',
            'description': 'Looking for an experienced software engineer to join our team.',
            'requirements': 'Bachelor degree in Computer Science, 5+ years experience',
            'salary_range': '15000-25000 AED',
            'created_at': datetime.now() - timedelta(days=30)
        },
        {
            'jd_id': 'jd_002',
            'title': 'Data Analyst',
            'company': 'Abu Dhabi Analytics',
            'location': 'Abu Dhabi',
            'department': 'Data Science',
            'status': 'active',
            'description': 'Seeking a data analyst to drive insights from complex datasets.',
            'requirements': 'Strong SQL and Python skills, 3+ years experience',
            'salary_range': '12000-18000 AED',
            'created_at': datetime.now() - timedelta(days=20)
        },
        {
            'jd_id': 'jd_003',
            'title': 'Product Manager',
            'company': 'Dubai Innovation Hub',
            'location': 'Dubai',
            'department': 'Product',
            'status': 'active',
            'description': 'Lead product strategy and development for our flagship platform.',
            'requirements': 'MBA preferred, 7+ years product management experience',
            'salary_range': '20000-30000 AED',
            'created_at': datetime.now() - timedelta(days=15)
        }
    ]
    
    for job in jobs:
        try:
            cursor.execute("""
                INSERT INTO job_descriptions 
                (jd_id, title, company, location, department, status, description, requirements, salary_range, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (jd_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    company = EXCLUDED.company,
                    status = EXCLUDED.status
            """, (
                job['jd_id'], job['title'], job['company'], job['location'],
                job['department'], job['status'], job['description'],
                job['requirements'], job['salary_range'], job['created_at']
            ))
            print(f"  ✓ Created job: {job['title']} ({job['jd_id']})")
        except Exception as e:
            print(f"  ⚠️  Error creating job {job['jd_id']}: {e}")
    
    conn.commit()
    print(f"✅ Created {len(jobs)} job descriptions")

def create_candidates(conn):
    """Create sample candidates."""
    print("\n👥 Creating candidates...")
    
    cursor = conn.cursor()
    
    candidates = [
        {
            'candidate_id': 'cand_001',
            'name': 'Ahmed Al Mansouri',
            'email': 'ahmed.almansouri@email.ae',
            'phone': '+971501234567',
            'location': 'Dubai',
            'experience_years': 6,
            'current_position': 'Software Engineer',
            'education': 'Bachelor in Computer Science',
            'skills': 'Python, React, AWS, Docker',
            'nationality': 'UAE',
            'created_at': datetime.now() - timedelta(days=25)
        },
        {
            'candidate_id': 'cand_002',
            'name': 'Fatima Al Zahra',
            'email': 'fatima.alzahra@email.ae',
            'phone': '+971502345678',
            'location': 'Dubai',
            'experience_years': 5,
            'current_position': 'Senior Developer',
            'education': 'Master in Software Engineering',
            'skills': 'Java, Spring Boot, Kubernetes, CI/CD',
            'nationality': 'UAE',
            'created_at': datetime.now() - timedelta(days=23)
        },
        {
            'candidate_id': 'cand_003',
            'name': 'Mohammed Al Hashimi',
            'email': 'mohammed.alhashimi@email.ae',
            'phone': '+971503456789',
            'location': 'Abu Dhabi',
            'experience_years': 4,
            'current_position': 'Data Analyst',
            'education': 'Bachelor in Statistics',
            'skills': 'SQL, Python, Tableau, Power BI',
            'nationality': 'UAE',
            'created_at': datetime.now() - timedelta(days=18)
        },
        {
            'candidate_id': 'cand_004',
            'name': 'Aisha Al Suwaidi',
            'email': 'aisha.alsuwaidi@email.ae',
            'phone': '+971504567890',
            'location': 'Dubai',
            'experience_years': 8,
            'current_position': 'Product Lead',
            'education': 'MBA from INSEAD',
            'skills': 'Product Strategy, Agile, Stakeholder Management',
            'nationality': 'UAE',
            'created_at': datetime.now() - timedelta(days=12)
        },
        {
            'candidate_id': 'cand_005',
            'name': 'Khalid Al Mazrouei',
            'email': 'khalid.almazrouei@email.ae',
            'phone': '+971505678901',
            'location': 'Dubai',
            'experience_years': 7,
            'current_position': 'Full Stack Developer',
            'education': 'Bachelor in Information Technology',
            'skills': 'Node.js, React, MongoDB, GraphQL',
            'nationality': 'UAE',
            'created_at': datetime.now() - timedelta(days=20)
        },
        {
            'candidate_id': 'cand_006',
            'name': 'Mariam Al Ketbi',
            'email': 'mariam.alketbi@email.ae',
            'phone': '+971506789012',
            'location': 'Abu Dhabi',
            'experience_years': 3,
            'current_position': 'Junior Data Scientist',
            'education': 'Master in Data Science',
            'skills': 'Python, Machine Learning, TensorFlow, R',
            'nationality': 'UAE',
            'created_at': datetime.now() - timedelta(days=16)
        }
    ]
    
    for candidate in candidates:
        try:
            cursor.execute("""
                INSERT INTO candidates 
                (candidate_id, name, email, phone, location, experience_years, 
                 current_position, education, skills, nationality, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (candidate_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone
            """, (
                candidate['candidate_id'], candidate['name'], candidate['email'],
                candidate['phone'], candidate['location'], candidate['experience_years'],
                candidate['current_position'], candidate['education'], candidate['skills'],
                candidate['nationality'], candidate['created_at']
            ))
            print(f"  ✓ Created candidate: {candidate['name']} ({candidate['candidate_id']})")
        except Exception as e:
            print(f"  ⚠️  Error creating candidate {candidate['candidate_id']}: {e}")
    
    conn.commit()
    print(f"✅ Created {len(candidates)} candidates")

def create_shortlist(conn):
    """Create shortlist entries."""
    print("\n📝 Creating shortlist entries...")
    
    cursor = conn.cursor()
    
    shortlist_entries = [
        # For jd_001 (Senior Software Engineer)
        {
            'shortlist_id': 'sl_001',
            'jd_id': 'jd_001',
            'candidate_id': 'cand_001',
            'recruiter_id': 'recruiter_001',
            'status': 'shortlisted',
            'match_score': 92.5,
            'notes': 'Excellent technical skills, strong cultural fit',
            'created_at': datetime.now() - timedelta(days=20)
        },
        {
            'shortlist_id': 'sl_002',
            'jd_id': 'jd_001',
            'candidate_id': 'cand_002',
            'recruiter_id': 'recruiter_001',
            'status': 'contacted',
            'match_score': 88.0,
            'notes': 'Great experience with Spring Boot, contacted for interview',
            'created_at': datetime.now() - timedelta(days=18)
        },
        {
            'shortlist_id': 'sl_003',
            'jd_id': 'jd_001',
            'candidate_id': 'cand_005',
            'recruiter_id': 'recruiter_001',
            'status': 'interviewed',
            'match_score': 85.5,
            'notes': 'Interview completed, awaiting feedback',
            'created_at': datetime.now() - timedelta(days=15)
        },
        # For jd_002 (Data Analyst)
        {
            'shortlist_id': 'sl_004',
            'jd_id': 'jd_002',
            'candidate_id': 'cand_003',
            'recruiter_id': 'recruiter_001',
            'status': 'shortlisted',
            'match_score': 90.0,
            'notes': 'Perfect match for data analyst role',
            'created_at': datetime.now() - timedelta(days=14)
        },
        {
            'shortlist_id': 'sl_005',
            'jd_id': 'jd_002',
            'candidate_id': 'cand_006',
            'recruiter_id': 'recruiter_001',
            'status': 'contacted',
            'match_score': 82.0,
            'notes': 'Strong ML background, good fit',
            'created_at': datetime.now() - timedelta(days=12)
        },
        # For jd_003 (Product Manager)
        {
            'shortlist_id': 'sl_006',
            'jd_id': 'jd_003',
            'candidate_id': 'cand_004',
            'recruiter_id': 'recruiter_001',
            'status': 'interviewed',
            'match_score': 95.0,
            'notes': 'Excellent product leadership experience',
            'created_at': datetime.now() - timedelta(days=10)
        }
    ]
    
    for entry in shortlist_entries:
        try:
            cursor.execute("""
                INSERT INTO shortlist 
                (shortlist_id, jd_id, candidate_id, recruiter_id, status, match_score, notes, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (shortlist_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    match_score = EXCLUDED.match_score,
                    notes = EXCLUDED.notes
            """, (
                entry['shortlist_id'], entry['jd_id'], entry['candidate_id'],
                entry['recruiter_id'], entry['status'], entry['match_score'],
                entry['notes'], entry['created_at']
            ))
            print(f"  ✓ Created shortlist entry: {entry['shortlist_id']} (JD: {entry['jd_id']}, Candidate: {entry['candidate_id']})")
        except Exception as e:
            print(f"  ⚠️  Error creating shortlist {entry['shortlist_id']}: {e}")
    
    conn.commit()
    print(f"✅ Created {len(shortlist_entries)} shortlist entries")

def create_interviews(conn):
    """Create interview schedules."""
    print("\n📅 Creating interview schedules...")
    
    cursor = conn.cursor()
    
    interviews = [
        {
            'interview_id': 'int_001',
            'jd_id': 'jd_001',
            'shortlist_id': 'sl_003',
            'recruiter_id': 'recruiter_001',
            'scheduled_at': datetime.now() - timedelta(days=5),
            'duration': 60,
            'location': 'Dubai Office - Meeting Room 3',
            'meeting_link': 'https://zoom.us/j/123456789',
            'status': 'completed',
            'rating': 4,
            'recommendation': 'hire',
            'feedback': 'Excellent technical skills demonstrated. Strong problem-solving abilities and good cultural fit. Recommended for hire.'
        },
        {
            'interview_id': 'int_002',
            'jd_id': 'jd_002',
            'shortlist_id': 'sl_004',
            'recruiter_id': 'recruiter_001',
            'scheduled_at': datetime.now() + timedelta(days=3),
            'duration': 45,
            'location': 'Abu Dhabi Office',
            'meeting_link': 'https://teams.microsoft.com/meet/abc123',
            'status': 'scheduled',
            'rating': None,
            'recommendation': None,
            'feedback': None
        },
        {
            'interview_id': 'int_003',
            'jd_id': 'jd_003',
            'shortlist_id': 'sl_006',
            'recruiter_id': 'recruiter_001',
            'scheduled_at': datetime.now() - timedelta(days=3),
            'duration': 90,
            'location': 'Dubai Innovation Hub',
            'meeting_link': 'https://zoom.us/j/987654321',
            'status': 'completed',
            'rating': 5,
            'recommendation': 'hire',
            'feedback': 'Outstanding candidate with exceptional product leadership experience. Clear strategic thinking and excellent stakeholder management skills. Highly recommended.'
        }
    ]
    
    for interview in interviews:
        try:
            cursor.execute("""
                INSERT INTO interview_schedules 
                (interview_id, jd_id, shortlist_id, recruiter_id, scheduled_at, 
                 duration, location, meeting_link, status, rating, recommendation, feedback)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (interview_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    rating = EXCLUDED.rating,
                    recommendation = EXCLUDED.recommendation,
                    feedback = EXCLUDED.feedback
            """, (
                interview['interview_id'], interview['jd_id'], interview['shortlist_id'],
                interview['recruiter_id'], interview['scheduled_at'], interview['duration'],
                interview['location'], interview['meeting_link'], interview['status'],
                interview['rating'], interview['recommendation'], interview['feedback']
            ))
            print(f"  ✓ Created interview: {interview['interview_id']} (Status: {interview['status']})")
        except Exception as e:
            print(f"  ⚠️  Error creating interview {interview['interview_id']}: {e}")
    
    conn.commit()
    print(f"✅ Created {len(interviews)} interview schedules")

def verify_data(conn):
    """Verify the created data."""
    print("\n🔍 Verifying created data...")
    
    cursor = conn.cursor()
    
    # Check job descriptions
    cursor.execute("SELECT COUNT(*) FROM job_descriptions WHERE status = 'active'")
    job_count = cursor.fetchone()[0]
    print(f"  ✓ Active job descriptions: {job_count}")
    
    # Check candidates
    cursor.execute("SELECT COUNT(*) FROM candidates")
    candidate_count = cursor.fetchone()[0]
    print(f"  ✓ Total candidates: {candidate_count}")
    
    # Check shortlist for jd_001
    cursor.execute("SELECT COUNT(*) FROM shortlist WHERE jd_id = 'jd_001'")
    shortlist_count = cursor.fetchone()[0]
    print(f"  ✓ Shortlist entries for jd_001: {shortlist_count}")
    
    # Check interviews
    cursor.execute("SELECT COUNT(*) FROM interview_schedules")
    interview_count = cursor.fetchone()[0]
    print(f"  ✓ Total interviews: {interview_count}")
    
    # Check interviews with feedback
    cursor.execute("SELECT COUNT(*) FROM interview_schedules WHERE feedback IS NOT NULL")
    feedback_count = cursor.fetchone()[0]
    print(f"  ✓ Interviews with feedback: {feedback_count}")
    
    print("\n✅ Data verification complete!")
    
    return shortlist_count > 0

def main():
    """Main function to create all test data."""
    print("="*60)
    print("  TEST DATA CREATION SCRIPT")
    print("  Emirati Pathways - Recruiter Management System")
    print("="*60)
    
    # Connect to database
    conn = get_connection()
    if not conn:
        print("\n❌ Cannot proceed without database connection")
        print("\n📝 Steps to fix:")
        print("1. Start PostgreSQL:")
        print('   pg_ctl start -D "C:\\Program Files\\PostgreSQL\\14\\data"')
        print("2. Verify connection:")
        print("   psql -U postgres -d emirati_journey -c 'SELECT 1;'")
        print("3. Run this script again")
        return False
    
    try:
        # Create all test data
        create_job_descriptions(conn)
        create_candidates(conn)
        create_shortlist(conn)
        create_interviews(conn)
        
        # Verify data
        success = verify_data(conn)
        
        if success:
            print("\n" + "="*60)
            print("  ✅ SUCCESS! Test data created successfully")
            print("="*60)
            print("\n📊 Summary:")
            print("  • 3 job descriptions created")
            print("  • 6 candidates created")
            print("  • 6 shortlist entries created")
            print("  • 3 interview schedules created")
            print("\n🎯 Next steps:")
            print("  1. Refresh your browser")
            print("  2. Navigate to: http://localhost:8080/recruiter-dashboard")
            print("  3. Click 'Manage Shortlist' button")
            print("  4. You should now see candidates!")
            print("\n🧪 Test Option C features:")
            print("  • Select candidates → 'Create Offer' button appears")
            print("  • Click 📝 icon → Add interview feedback")
            return True
        else:
            print("\n⚠️  Data created but verification failed")
            return False
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()
        print("\n🔒 Database connection closed")

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

