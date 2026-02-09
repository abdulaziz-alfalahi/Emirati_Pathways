import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

# Create output file
output_file = open('app_investigation_results.txt', 'w', encoding='utf-8')

def log(msg):
    print(msg)
    output_file.write(msg + '\n')
    output_file.flush()

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

def investigate_application():
    log("=" * 80)
    log("INVESTIGATING: User 62 -> Senior Python Developer Application")
    log("=" * 80)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Step 1: Find applications from User 62
        log("\n[1] Finding applications from User 62...")
        cur.execute("""
            SELECT 
                id, 
                job_id, 
                candidate_id,
                status,
                submitted_at,
                cover_letter
            FROM job_applications 
            WHERE candidate_id = '62' OR candidate_id = '62'::text
            ORDER BY submitted_at DESC
        """)
        apps = cur.fetchall()
        
        if not apps:
            log("❌ NO APPLICATIONS FOUND for User 62")
            return
            
        log(f"✅ Found {len(apps)} applications from User 62:")
        for app in apps:
            log(f"\n  Application ID: {app['id']}")
            log(f"  Job ID: {app['job_id']}")
            log(f"  Status: {app['status']}")
            log(f"  Submitted: {app['submitted_at']}")
        
        # Step 2: Find "Senior Python Developer" job
        log("\n[2] Searching for 'Senior Python Developer' job...")
        cur.execute("""
            SELECT 
                id,
                title,
                recruiter_id,
                company_id,
                status,
                created_at
            FROM job_postings
            WHERE title ILIKE '%Senior Python Developer%'
            OR title ILIKE '%Python%'
            ORDER BY created_at DESC
        """)
        jobs = cur.fetchall()
        
        if not jobs:
            log("❌ NO 'Senior Python Developer' job found in job_postings")
        else:
            log(f"✅ Found {len(jobs)} Python-related jobs:")
            for job in jobs:
                log(f"\n  Job ID: {job['id']}")
                log(f"  Title: {job['title']}")
                log(f"  Recruiter ID: {job['recruiter_id']}")
                log(f"  Company ID: {job['company_id']}")
                log(f"  Status: {job['status']}")
                
                # Check if User 62 applied to this job
                matching_app = [a for a in apps if str(a['job_id']) == str(job['id'])]
                if matching_app:
                    log(f"  ✅ User 62 HAS APPLIED to this job")
                    log(f"     Application ID: {matching_app[0]['id']}")
                    log(f"     Application Status: {matching_app[0]['status']}")
                else:
                    log(f"  ⚠️ User 62 has NOT applied to this job")
        
        # Step 3: Check recruiter dashboard access
        log("\n[3] Checking recruiter access...")
        for job in jobs:
            if job['recruiter_id']:
                recruiter_id = job['recruiter_id']
                log(f"\n  Job '{job['title']}' belongs to Recruiter ID: {recruiter_id}")
                
                # Get recruiter details
                cur.execute("""
                    SELECT id, email, role FROM users WHERE id = %s OR id::text = %s
                """, (recruiter_id, str(recruiter_id)))
                recruiter = cur.fetchone()
                
                if recruiter:
                    log(f"  ✅ Recruiter exists: {recruiter['email']} (Role: {recruiter['role']})")
                else:
                    log(f"  ❌ Recruiter ID {recruiter_id} NOT FOUND in users table")
                
                # Check what applications this recruiter can see
                cur.execute("""
                    SELECT COUNT(*) as count
                    FROM job_applications ja
                    JOIN job_postings jp ON ja.job_id::text = jp.id::text
                    WHERE jp.recruiter_id = %s OR jp.recruiter_id::text = %s
                """, (recruiter_id, str(recruiter_id)))
                app_count = cur.fetchone()['count']
                log(f"  Applications visible to this recruiter: {app_count}")
        
        
        conn.close()
        output_file.close()
        log("\n" + "=" * 80)
        log("Results saved to app_investigation_results.txt")
        
    except Exception as e:
        log(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        output_file.close()

if __name__ == "__main__":
    investigate_application()
