"""
COMPREHENSIVE ROOT CAUSE INVESTIGATION
This script traces the ENTIRE data flow to find the common issue.
"""

import psycopg2
import os
from psycopg2.extras import RealDictCursor

DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

conn = psycopg2.connect(**DATABASE_CONFIG)
cursor = conn.cursor(cursor_factory=RealDictCursor)

print("=" * 60)
print("PHASE 1: DATABASE VERIFICATION")
print("=" * 60)

cursor.execute("SELECT current_database() as db_name")
db = cursor.fetchone()
print(f"Connected to database: {db['db_name']}")

print("\n" + "=" * 60)
print("PHASE 2: JOB_APPLICATIONS STRUCTURE (ACTUAL COLUMNS)")
print("=" * 60)

cursor.execute("""
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns 
    WHERE table_name = 'job_applications'
    ORDER BY ordinal_position
""")
cols = cursor.fetchall()
print("job_applications columns:")
for c in cols:
    print(f"  {c['column_name']}: {c['data_type']} ({c['udt_name']})")

print("\n" + "=" * 60)
print("PHASE 3: SAMPLE JOB_APPLICATIONS DATA")
print("=" * 60)

cursor.execute("""
    SELECT id, job_id, pg_typeof(job_id) as job_id_type, candidate_id, status
    FROM job_applications
    LIMIT 5
""")
apps = cursor.fetchall()
print("Sample job_applications rows:")
for a in apps:
    print(f"  id={a['id']}, job_id={a['job_id']} (type: {a['job_id_type']}), candidate={a['candidate_id']}, status={a['status']}")

print("\n" + "=" * 60)
print("PHASE 4: TRACE JOB_ID LINKAGE")
print("=" * 60)

# Get a specific job_id from applications
cursor.execute("SELECT DISTINCT job_id FROM job_applications LIMIT 3")
app_job_ids = [r['job_id'] for r in cursor.fetchall()]
print(f"Distinct job_ids in job_applications: {app_job_ids}")

# Try to find these in job_postings
for jid in app_job_ids:
    print(f"\nSearching for job_id={jid}:")
    
    # Check job_postings by id
    cursor.execute("SELECT id, jd_id, title FROM job_postings WHERE id::text = %s OR jd_id = %s LIMIT 1", [str(jid), str(jid)])
    jp = cursor.fetchone()
    if jp:
        print(f"  ✅ FOUND in job_postings: id={jp['id']}, jd_id={jp.get('jd_id')}, title={jp['title']}")
    else:
        print(f"  ❌ NOT FOUND in job_postings")
    
    # Check job_descriptions by id
    cursor.execute("SELECT id, title FROM job_descriptions WHERE id::text = %s LIMIT 1", [str(jid)])
    jd = cursor.fetchone()
    if jd:
        print(f"  ✅ FOUND in job_descriptions: id={jd['id']}, title={jd['title']}")
    else:
        print(f"  ❌ NOT FOUND in job_descriptions")

print("\n" + "=" * 60)
print("PHASE 5: CHIEF FINANCIAL OFFICER JOB TRACE")
print("=" * 60)

# Find the CFO job
cursor.execute("SELECT id, jd_id, recruiter_id, title FROM job_postings WHERE title = 'Chief Financial Officer'")
cfo = cursor.fetchone()
if cfo:
    print(f"CFO Job: id={cfo['id']}, jd_id='{cfo['jd_id']}', recruiter_id='{cfo['recruiter_id']}'")
    
    # Find applications for this job - try multiple ID formats
    cursor.execute("SELECT count(*) as cnt FROM job_applications WHERE job_id = %s", [cfo['id']])
    cnt_by_id = cursor.fetchone()['cnt']
    print(f"  Applications by job_id = {cfo['id']} (int): {cnt_by_id}")
    
    if cfo['jd_id']:
        cursor.execute("SELECT count(*) as cnt FROM job_applications WHERE job_id::text = %s", [cfo['jd_id']])
        cnt_by_jdid = cursor.fetchone()['cnt']
        print(f"  Applications by job_id = {cfo['jd_id']} (jd_id text): {cnt_by_jdid}")
else:
    print("CFO job not found!")

print("\n" + "=" * 60)
print("PHASE 6: WHAT DOES /jd/list RETURN FOR CFO?")
print("=" * 60)

# Simulate what the jd/list endpoint returns
cursor.execute("""
    SELECT 
        jd_id,
        id::text as pk,
        title
    FROM job_postings
    WHERE title = 'Chief Financial Officer'
""")
jd_list_row = cursor.fetchone()
if jd_list_row:
    print(f"/jd/list returns: jd_id='{jd_list_row['jd_id']}', id='{jd_list_row['pk']}'")
    print(f"Frontend will use: job.jd_id || job.id = '{jd_list_row['jd_id'] or jd_list_row['pk']}'")

print("\n" + "=" * 60)
print("PHASE 7: WHAT DOES /job-applicants-count RETURN?")
print("=" * 60)

# Simulate the count query with recruiter filter
cursor.execute("""
    WITH all_jobs AS (
        SELECT 
            COALESCE(jd_id, id::text) as public_id,
            id::text as internal_id,
            title,
            'new' as source
        FROM job_postings jp
        WHERE jp.recruiter_id::text = '108'
    )
    SELECT 
        j.public_id as job_id,
        j.internal_id as alt_job_id,
        j.title as job_title,
        COUNT(ja.id) as total_applicants
    FROM all_jobs j
    LEFT JOIN job_applications ja ON (ja.job_id::text = j.public_id OR ja.job_id::text = j.internal_id)
    GROUP BY j.public_id, j.internal_id, j.title
    ORDER BY total_applicants DESC
    LIMIT 5
""")
counts = cursor.fetchall()
print("Applicant count API would return (simulated):")
for c in counts:
    print(f"  job_id='{c['job_id']}', alt='{c['alt_job_id']}', total={c['total_applicants']}")

print("\n" + "=" * 60)
print("PHASE 8: MATCH VERIFICATION")
print("=" * 60)

frontend_key = jd_list_row['jd_id'] or jd_list_row['pk'] if jd_list_row else None
api_keys = [c['job_id'] for c in counts]

print(f"Frontend looks for key: '{frontend_key}'")
print(f"API returns keys: {api_keys}")

if frontend_key in api_keys:
    print("✅ MATCH FOUND - Frontend should display the count correctly")
else:
    print("❌ NO MATCH - Frontend cannot find the count!")
    print(f"   Frontend key '{frontend_key}' is not in API keys {api_keys}")

conn.close()
