
from backend.app import app
from backend.extensions import db
from sqlalchemy import text
import json

def diagnose():
    print("=== DIAGNOSING JOB APPLICANT COUNTS ===")
    
    # Target Recruiter ID (from logs it's 108)
    RECRUITER_ID = 108
    
    with app.app_context():
        try:
            # 1. Check Jobs visible to this recruiter
            print(f"\n[1] Checking Jobs visible to Recruiter {RECRUITER_ID}...")
            # Logic from get_jd_list_enhanced: finds jobs by recruiter_id OR created_by
            jobs_query = text("""
                SELECT id, jd_id, title, recruiter_id, created_by, status, applications_count 
                FROM job_postings 
                WHERE status != 'deleted' 
                AND (recruiter_id = :rid OR created_by = :rid)
                LIMIT 5
            """)
            jobs = db.session.execute(jobs_query, {'rid': str(RECRUITER_ID)}).fetchall()
            
            if not jobs:
                print("!! CRITICAL !! No jobs found for this recruiter in job_postings table.")
                # Fallback check: maybe they are in job_descriptions (legacy)?
                legacy_jobs = db.session.execute(text("SELECT id, title, recruiter_id FROM job_descriptions WHERE recruiter_id = :rid"), {'rid': RECRUITER_ID}).fetchall()
                print(f"Legacy table check: Found {len(legacy_jobs)} jobs.")
            else:
                for j in jobs:
                    print(f" - Job ID: {j.id} | JD_ID: {j.jd_id} | Title: {j.title} | Owner: {j.recruiter_id} | App Count (Col): {j.applications_count}")

            # 2. Check Actual Applications for these jobs
            print(f"\n[2] Checking Actual Applications in DB...")
            if jobs:
                for j in jobs:
                    # Check by ID
                    count_id = db.session.execute(text("SELECT COUNT(*) FROM job_applications WHERE job_id = :jid"), {'jid': str(j.id)}).scalar()
                    # Check by JD_ID
                    count_jd = 0
                    if j.jd_id:
                        count_jd = db.session.execute(text("SELECT COUNT(*) FROM job_applications WHERE job_id = :jid"), {'jid': str(j.jd_id)}).scalar()
                    
                    print(f" - Job {j.id} ({j.title}): ID-linked={count_id}, JD-linked={count_jd}")

            # 3. Simulate the Count API Query (The one I 'fixed')
            print(f"\n[3] Simulating API Query output...")
            api_query = text("""
                SELECT 
                    COALESCE(jp.jd_id, jp.id::text) as job_id_key,
                    jp.title,
                    COUNT(ja.id) as total_applicants
                FROM job_postings jp
                LEFT JOIN job_applications ja ON (ja.job_id::text = jp.id::text OR ja.job_id = jp.jd_id)
                WHERE jp.recruiter_id::text = :rid
                GROUP BY jp.id, jp.title
            """)
            results = db.session.execute(api_query, {'rid': str(RECRUITER_ID)}).fetchall()
            for r in results:
                print(f" - API Returns Key: '{r.job_id_key}' -> Total: {r.total_applicants}")

        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    diagnose()
