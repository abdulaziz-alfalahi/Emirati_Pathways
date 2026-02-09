import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(
    dbname='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    host='localhost',
    port='5432'
)

cur = conn.cursor(cursor_factory=RealDictCursor)

# Find the Fashion Designer job
cur.execute("""
    SELECT id, title, description, requirements, 
           experience_level, salary_range_min, salary_range_max, 
           location, status
    FROM job_postings 
    WHERE title ILIKE '%fashion%designer%'
    ORDER BY created_at DESC
    LIMIT 1
""")

job = cur.fetchone()
if job:
    print("\n=== Fashion Designer Job Details ===")
    for key, value in job.items():
        if key not in ['description', 'requirements']:
            print(f"{key}: {value}")
    
    print(f"\nDescription (first 200 chars): {job['description'][:200] if job['description'] else 'N/A'}...")
    print(f"\nRequirements (first 200 chars): {job['requirements'][:200] if job['requirements'] else 'N/A'}...")
else:
    print("\nNo Fashion Designer job found")

# Get user info based on the screenshot (Abdulaziz)
cur.execute("""
    SELECT id, email, full_name 
    FROM users 
    WHERE full_name ILIKE '%abdulaziz%'
    LIMIT 5
""")

users = cur.fetchall()
print(f"\n=== Users matching 'Abdulaziz' ({len(users)}) ===")
for user in users:
    print(f"ID: {user['id']}, Name: {user['full_name']}, Email: {user['email']}")

conn.close()
