import psycopg2
from psycopg2.extras import RealDictCursor
import os

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

print("Investigating CFO Application - User 62")
print("=" * 70)

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# 1. Find CFO job
print("\n[1] Finding CFO job in database...")
cur.execute("""
    SELECT id, title, recruiter_id, company_id, status, created_at
    FROM job_postings
    WHERE title ILIKE '%Chief Financial Officer%' OR title ILIKE '%CFO%'
    ORDER BY created_at DESC
""")
cfo_jobs = cur.fetchall()

if cfo_jobs:
    print(f"Found {len(cfo_jobs)} CFO-related jobs:")
    for job in cfo_jobs:
        print(f"\n  Job ID: {job['id']}")
        print(f"  Title: {job['title']}")
        print(f"  Recruiter ID: {job['recruiter_id']}")
        print(f"  Status: {job['status']}")
else:
    print("No CFO jobs found!")

# 2. Find User 62's recent applications
print("\n[2] Finding User 62's recent applications...")
cur.execute("""
    SELECT id, job_id, candidate_id, status, submitted_at
    FROM job_applications
    WHERE candidate_id = '62' OR candidate_id::text = '62'
    ORDER BY submitted_at DESC
    LIMIT 5
""")
apps = cur.fetchall()

if apps:
    print(f"Found {len(apps)} recent applications from User 62:")
    for app in apps:
        print(f"\n  Application ID: {app['id']}")
        print(f"  Job ID: {app['job_id']}")
        print(f"  Status: {app['status']}")
        print(f"  Submitted: {app['submitted_at']}")
        
        # Get job title for this application
        cur.execute("SELECT title FROM job_postings WHERE id::text = %s", (str(app['job_id']),))
        job_title = cur.fetchone()
        if job_title:
            print(f"  Job Title: {job_title['title']}")
        else:
            print(f"  Job Title: [NOT FOUND in job_postings]")
else:
    print("No applications found for User 62!")

# 3. Check if User 108 (recruiter) owns any CFO jobs
print("\n[3] Checking User 108's jobs...")
cur.execute("""
    SELECT id, title, recruiter_id, status
    FROM job_postings
    WHERE recruiter_id::text = '108'
    ORDER BY created_at DESC
""")
recruiter_jobs = cur.fetchall()

if recruiter_jobs:
    print(f"User 108 owns {len(recruiter_jobs)} jobs:")
    for job in recruiter_jobs:
        print(f"  - Job {job['id']}: {job['title']} ({job['status']})")
else:
    print("User 108 owns NO jobs!")

# 4. Check what applications User 108 should see
print("\n[4] Checking applications visible to User 108...")
cur.execute("""
    SELECT 
        ja.id as app_id,
        ja.job_id,
        ja.candidate_id,
        ja.status,
        jp.title,
        jp.recruiter_id
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_id::text = jp.id::text
    WHERE jp.recruiter_id::text = '108'
    ORDER BY ja.submitted_at DESC
""")
visible_apps = cur.fetchall()

if visible_apps:
    print(f"User 108 should see {len(visible_apps)} applications:")
    for app in visible_apps:
        print(f"\n  Application: {app['app_id']}")
        print(f"  Job: {app['title']} (ID: {app['job_id']})")
        print(f"  Candidate: {app['candidate_id']}")
        print(f"  Status: {app['status']}")
else:
    print("User 108 should see NO applications (no jobs owned by them)")

conn.close()
print("\n" + "=" * 70)
