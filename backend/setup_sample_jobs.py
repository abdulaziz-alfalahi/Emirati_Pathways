
import psycopg2
import psycopg2.extras
import os
import uuid
from datetime import datetime, timedelta

# DB Config
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def setup_sample_data():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 1. Get User ID (Zara)
        cursor.execute("SELECT id FROM users WHERE email LIKE '%zara%'")
        user = cursor.fetchone()
        if not user:
            print("❌ User Zara Not Found")
            return
        user_id = user['id']
        print(f"✅ Found User: {user_id}")
        
        # 2. Check/Create Company
        cursor.execute("SELECT id FROM companies LIMIT 1")
        company = cursor.fetchone()
        
        if not company:
            company_id = str(uuid.uuid4())
            print(f"Creating Company: {company_id}")
            cursor.execute("""
                INSERT INTO companies (id, name_en, industry, status)
                VALUES (%s, 'Emirates Tech Solutions', 'Technology', 'active')
            """, (company_id,))
        else:
            company_id = company['id']
            print(f"✅ Found Company: {company_id}")
            
        # 3. Link User to Company
        # Check if profile exists
        cursor.execute("SELECT id FROM hr_profiles WHERE user_id = %s", (user_id,))
        if cursor.fetchone():
            cursor.execute("UPDATE hr_profiles SET company_id = %s WHERE user_id = %s", (company_id, user_id))
        else:
            cursor.execute("""
                INSERT INTO hr_profiles (user_id, company_id, department, position_title)
                VALUES (%s, %s, 'HR', 'Manager')
            """, (user_id, company_id))
        print("✅ Linked User to Company")
            
        # 4. Create Sample Jobs
        sample_jobs = [
            ("Senior Python Developer", "Engineering"),
            ("HR Coordinator", "Human Resources"),
            ("Marketing Specialist", "Marketing")
        ]
        
        for title, dept in sample_jobs:
            job_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO job_postings (
                    company_id, created_by, title, department, 
                    description, emirate, status, employment_type, 
                    requirements, benefits, compensation, created_at, jd_id, recruiter_id
                ) VALUES (
                    %s, %s, %s, %s,
                    'Sample description for verification.', 'Dubai', 'active', 'Full-time',
                    '{"skills": ["Communication", "Teamwork"]}', '{"health": true}', '{"min": 10000, "max": 15000}', NOW(), %s, %s
                )
            """, (company_id, user_id, title, dept, str(uuid.uuid4()), str(uuid.uuid4())))
            print(f"✅ Created Job: {title}")
            
        conn.commit()
        print("🎉 Sample Data Setup Complete!")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    setup_sample_data()
