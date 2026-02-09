import psycopg2
from psycopg2.extras import RealDictCursor
import os
import json

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Query 1: Find CFO jobs
cur.execute("""
    SELECT id, title, recruiter_id, status
    FROM job_postings
    WHERE title ILIKE '%CFO%' OR title ILIKE '%Chief Financial Officer%'
""")
cfo_jobs = cur.fetchall()
with open('result_1_cfo_jobs.txt', 'w') as f:
    f.write(f"CFO Jobs Found: {len(cfo_jobs)}\n\n")
    for job in cfo_jobs:
        f.write(f"Job ID: {job['id']}\n")
        f.write(f"Title: {job['title']}\n")
        f.write(f"Recruiter: {job['recruiter_id']}\n")
        f.write(f"Status: {job['status']}\n\n")

# Query 2: User 62's recent applications
cur.execute("""
    SELECT ja.id, ja.job_id, ja.status, ja.submitted_at, jp.title
    FROM job_applications ja
    LEFT JOIN job_postings jp ON ja.job_id::text = jp.id::text
    WHERE ja.candidate_id = '62'
    ORDER BY ja.submitted_at DESC
    LIMIT 5
""")
apps = cur.fetchall()
with open('result_2_user62_apps.txt', 'w') as f:
    f.write(f"User 62 Applications: {len(apps)}\n\n")
    for app in apps:
        f.write(f"App ID: {app['id']}\n")
        f.write(f"Job ID: {app['job_id']}\n")
        f.write(f"Job Title: {app.get('title', 'NOT FOUND')}\n")
        f.write(f"Status: {app['status']}\n")
        f.write(f"Submitted: {app['submitted_at']}\n\n")

# Query 3: User 108's jobs
cur.execute("""
    SELECT id, title, status
    FROM job_postings
    WHERE recruiter_id::text = '108'
""")
recruiter_jobs = cur.fetchall()
with open('result_3_user108_jobs.txt', 'w') as f:
    f.write(f"User 108 (Recruiter) Jobs: {len(recruiter_jobs)}\n\n")
    for job in recruiter_jobs:
        f.write(f"Job ID: {job['id']}\n")
        f.write(f"Title: {job['title']}\n")
        f.write(f"Status: {job['status']}\n\n")

# Query 4: Applications User 108 should see
cur.execute("""
    SELECT ja.id, ja.candidate_id, ja.status, jp.title, jp.id as job_id
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_id::text = jp.id::text
    WHERE jp.recruiter_id::text = '108'
""")
visible = cur.fetchall()
with open('result_4_user108_dashboard.txt', 'w') as f:
    f.write(f"Applications User 108 Should See: {len(visible)}\n\n")
    for app in visible:
        f.write(f"Candidate: {app['candidate_id']}\n")
        f.write(f"Job: {app['title']} (ID: {app['job_id']})\n")
        f.write(f"Status: {app['status']}\n\n")

conn.close()
print("Results written to 4 separate files:")
print("  result_1_cfo_jobs.txt")
print("  result_2_user62_apps.txt")
print("  result_3_user108_jobs.txt")
print("  result_4_user108_dashboard.txt")
