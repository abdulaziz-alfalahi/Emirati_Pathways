"""
Simulate the job matching API call for user 62 to see what they get.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import json

conn = psycopg2.connect(
    dbname='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    host='localhost',
    port='5432'
)

cur = conn.cursor(cursor_factory=RealDictCursor)

# Check user 62
cur.execute("SELECT id, email FROM users WHERE id = 62")
user = cur.fetchone()
print(f"Testing job matches for: {user['email']} (ID: {user['id']})")

# Get their CV
user_id_str = str(user['id'])
cur.execute("SELECT * FROM user_cvs WHERE user_id::text = %s ORDER BY created_at DESC LIMIT 1", (user_id_str,))
cv = cur.fetchone()

if cv:
    print(f"\n✅ User has CV")
    print(f"   Title: {cv.get('title', 'N/A')}")
    print(f"   Status: {cv.get('status', 'N/A')}")
else:
    print(f"\n❌ User has NO CV - this is the problem!")

# Get all published jobs
cur.execute("""
    SELECT id, title, experience_level, location, salary_range_min, salary_range_max
    FROM job_postings 
    WHERE status = 'published'
    ORDER BY id
""")
jobs = cur.fetchall()

print(f"\n📊 Total published jobs: {len(jobs)}")
print("\nAll published jobs:")
for job in jobs:
    print(f"  [{job['id']}] {job['title']} ({job['experience_level']}) - {job['location']} - AED {job['salary_range_min']}-{job['salary_range_max']}")

# Check if there are old jobs too
cur.execute("""
    SELECT COUNT(*) as count
    FROM job_postings 
    WHERE status = 'published' AND recruiter_id != '108'
""")
old_jobs = cur.fetchone()['count']
print(f"\n📋 Jobs from other recruiters: {old_jobs}")

conn.close()
