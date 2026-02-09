"""
Create a job position in job_postings table (the correct table for job matching)
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
from datetime import datetime
import json

# Database connection settings
DB_CONFIG = {
    'host': '127.0.0.1',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password'
}

# Test Recruiter 1 phone
RECRUITER_PHONE = '+971500001002'

def create_job_posting():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Find Test Recruiter 1
        cur.execute("""
            SELECT id, full_name, user_type, role
            FROM users 
            WHERE phone LIKE %s
        """, (f'%{RECRUITER_PHONE[-10:]}%',))
        recruiter = cur.fetchone()
        
        if not recruiter:
            print(f"❌ Recruiter not found: {RECRUITER_PHONE}")
            return False
            
        print(f"✅ Found recruiter: ID={recruiter['id']}, Name={recruiter['full_name']}")
        
        # 2. Get recruiter's company
        cur.execute("""
            SELECT hp.company_id
            FROM hr_profiles hp
            WHERE hp.user_id = %s
        """, (recruiter['id'],))
        hr_profile = cur.fetchone()
        
        if hr_profile and hr_profile['company_id']:
            company_id = str(hr_profile['company_id'])
            print(f"✅ Found recruiter's company: {company_id}")
        else:
            print("❌ No company found for recruiter")
            return False
        
        # 3. Create job posting
        job_title = "Software Developer"
        
        cur.execute("""
            INSERT INTO job_postings (
                jd_id, recruiter_id, company_id, title, department,
                job_type, job_level, emirate, city, remote_option,
                description, requirements, responsibilities, benefits,
                status, views_count, applications_count,
                created_at, updated_at, published_at,
                employment_type, experience_level,
                salary_range_min, salary_range_max, currency,
                location, number_of_vacancies
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s
            )
            RETURNING id
        """, (
            str(uuid.uuid4()),  # jd_id
            str(recruiter['id']),  # recruiter_id
            company_id,  # company_id
            job_title,  # title
            'Technology',  # department
            'full-time',  # job_type
            'Mid Level',  # job_level
            'Dubai',  # emirate
            'Dubai',  # city
            True,  # remote_option
            """We are looking for a talented Software Developer to join our growing team in Dubai.

Responsibilities:
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Write clean, maintainable code
- Participate in code reviews

Requirements:
- UAE National (Emirati)
- Bachelor's degree in Computer Science or related field
- Strong programming skills
- Excellent communication skills

Benefits:
- Competitive salary (15,000 - 25,000 AED)
- Health insurance
- Professional development opportunities
- Work-life balance""",  # description
            json.dumps(["Python", "JavaScript", "React", "Node.js", "SQL", "3+ years experience"]),  # requirements
            json.dumps(["Develop web applications", "Write clean code", "Collaborate with team"]),  # responsibilities
            json.dumps(["Health insurance", "Professional development", "Remote work options"]),  # benefits
            'published',  # status - CRITICAL: must be 'published' or 'active'
            0,  # views_count
            0,  # applications_count
            datetime.now(),  # created_at
            datetime.now(),  # updated_at
            datetime.now(),  # published_at
            'Full-time',  # employment_type
            'Mid Level',  # experience_level
            15000,  # salary_range_min
            25000,  # salary_range_max
            'AED',  # currency
            'Dubai, UAE',  # location
            1  # number_of_vacancies
        ))
        
        result = cur.fetchone()
        job_id = result['id']
        conn.commit()
        
        print(f"\n✅ Created job posting in job_postings table:")
        print(f"   Job ID: {job_id}")
        print(f"   Title: {job_title}")
        print(f"   Company ID: {company_id}")
        print(f"   Recruiter: {recruiter['full_name']} (ID: {recruiter['id']})")
        print(f"   Status: published")
        print(f"\n🎯 Job seeker can now see this job in Job Matches!")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    create_job_posting()
