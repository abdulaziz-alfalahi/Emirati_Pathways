import psycopg2, psycopg2.extras
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='emirati_journey', user='emirati_user', password='emirati_secure_password')
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# Check what job posting d2fc3fbd corresponds to
jd_id = 'd2fc3fbd-1ba8-40cc-9a93-24674d1347bc'
print(f"=== Job posting for jd_id={jd_id} ===")
cur.execute("SELECT id, jd_id, title FROM job_postings WHERE jd_id = %s", (jd_id,))
jp = cur.fetchone()
if jp:
    print(f"  id={jp['id']}, title={jp['title']}")
    
    # Check if there are any shortlisted_candidates for this job
    print(f"\n=== shortlisted_candidates for job_id={jp['id']} ===")
    cur.execute("SELECT * FROM shortlisted_candidates WHERE job_id = %s", (jp['id'],))
    rows = cur.fetchall()
    print(f"  Found {len(rows)} rows")
    for r in rows:
        print(f"  id={r['id']}, cand={r['candidate_id']}, status={r['status']}")
else:
    print("  NOT FOUND!")

# Also check: what job_id does job 761 map to?
print(f"\n=== Job posting id=761 ===")
cur.execute("SELECT id, jd_id, title FROM job_postings WHERE id = 761")
jp761 = cur.fetchone()
if jp761:
    print(f"  id={jp761['id']}, jd_id={jp761['jd_id']}, title={jp761['title']}")
else:
    print("  NOT FOUND!")

# Show ALL shortlisted_candidates with their job jd_ids
print(f"\n=== ALL shortlisted_candidates with job details ===")
cur.execute("""
    SELECT sc.id, sc.job_id, sc.candidate_id, sc.status, jp.jd_id, jp.title as job_title
    FROM shortlisted_candidates sc
    JOIN job_postings jp ON sc.job_id = jp.id
    ORDER BY sc.created_at DESC
""")
rows = cur.fetchall()
print(f"  Found {len(rows)} total shortlisted candidates")
for r in rows:
    print(f"  id={r['id']}, job_id={r['job_id']}, jd_id={r['jd_id']}, cand={r['candidate_id']}, status={r['status']}, job={r['job_title']}")

conn.close()
