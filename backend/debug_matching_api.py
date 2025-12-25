
import os
import psycopg2
import json
import logging
from dotenv import load_dotenv

load_dotenv('.env')

# Setup basic logging to stdout
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def debug_matching():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        print("✅ DB Connected")

        # 1. Find the HR Coordinator Job
        cur.execute("SELECT jd_id, title FROM job_postings WHERE title ILIKE '%HR Coordinator%' LIMIT 1")
        job = cur.fetchone()
        if not job:
            print("❌ Could not find 'HR Coordinator' job in job_postings.")
            return
        
        jd_id = job['jd_id']
        print(f"✅ Found Job: {job['title']} (ID: {jd_id})")

        # 2. Mimic the APPLICANT Fetch Logic causing the issue
        print("Running Application Query...")
        try:
             cur.execute("""
                SELECT 
                    u.id as candidate_id,
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.emirate,
                    u.nationality,
                    u.is_uae_national,
                    u.education_level,
                    u.experience_years,
                    u.job_title as current_position,
                    u.company as current_company,
                    'applicant' as employment_status, 
                    u.skills,
                    u.preferred_salary_min,
                    u.preferred_salary_max,
                    NULL as cv_url,
                    NULL as linkedin_url,
                    a.status as application_status,
                    a.submitted_at
                FROM job_applications a
                JOIN users u ON a.candidate_id = u.id::text
                WHERE a.job_id = %s
            """, (jd_id,))
             applicants = [dict(c) for c in cur.fetchall()]
             print(f"✅ Fetched {len(applicants)} applicants.")
             print("Sample Applicant:", applicants[0] if applicants else "None")
        except Exception as e:
            print(f"❌ Application Query Failed: {e}")
            conn.rollback()

        conn.close()

    except Exception as e:
        print(f"❌ Script Failed: {e}")

def custom_json_serializer(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def debug_api_call():
    """Call the actual API endpoint"""
    import requests
    import json
    
    try:
        print("\n--- Testing API Endpoint ---")
        job_id = "e8209c95-3c10-416a-afc9-15a38c374d33" # HR Coordinator from previous run
        url = f"http://localhost:5003/api/recruiter/jd/{job_id}/match-candidates"
        print(f"Calling: {url}")
        
        response = requests.post(url, json={"top_n": 5})
        
        print(f"Status Code: {response.status_code}")
        try:
            data = response.json()
            print("Response Success:", data.get('success'))
            print("Top Matches Count:", len(data.get('top_matches', [])))
            if data.get('top_matches'):
                print("First Match:", data['top_matches'][0]['candidate']['first_name'])
                print("First Match Is Applicant:", data['top_matches'][0]['candidate'].get('is_applicant', False))
        except:
            print("Response Text:", response.text)
            
    except Exception as e:
        print(f"❌ API Call Failed: {e}")

if __name__ == "__main__":
    import psycopg2.extras
    import datetime
    # debug_matching() # Skip DB check, do API check
    debug_api_call()
