import psycopg2
import psycopg2.extras
import os
import json

# Database connection
conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'emirati_user'),
    password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=os.getenv('DB_PORT', 5432)
)

cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

target_uuid = '18c2f394-3c7e-519c-9232-7a4470c7868f'

print(f"=== Full investigation of candidate_id: {target_uuid} ===\n")

# 1. Check user_cvs schema first
print("1. Checking user_cvs table schema:")
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_cvs'
    ORDER BY ordinal_position
""")
columns = cur.fetchall()
print("   Columns:")
for col in columns:
    print(f"   - {col['column_name']}: {col['data_type']}")

# 2. Check if this UUID exists AS user_id in user_cvs
print(f"\n2. Checking if UUID exists as user_id in user_cvs:")
cur.execute("SELECT * FROM user_cvs WHERE user_id::text = %s LIMIT 1", (target_uuid,))
result = cur.fetchone()
if result:
    print(f"   ✓ Found CV with user_id={target_uuid}")
    print(f"   - Personal Info: {json.dumps(result['personal_info'], indent=6) if result.get('personal_info') else 'NULL'}")
    real_user_id = result['user_id']
else:
    print(f"   ✗ No CV found with user_id={target_uuid}")
    real_user_id = target_uuid

# 3. Check if this user_id exists in users table
print(f"\n3. Checking if user exists in users table:")
# Try as integer first
try:
    cur.execute("SELECT id, email, first_name, last_name, phone FROM users WHERE id::text = %s", (real_user_id,))
    user = cur.fetchone()
    if user:
        print(f"   ✓ Found user: {dict(user)}")
    else:
        print(f"   ✗ No user found with id={real_user_id}")
except Exception as e:
    print(f"   ✗ Error: {e}")

# 4. Check the job application
print(f"\n4. Checking job_applications:")
cur.execute("SELECT job_id, status, submitted_at FROM job_applications WHERE candidate_id = %s", (target_uuid,))
apps = cur.fetchall()
print(f"   Found {len(apps)} application(s)")
for app in apps:
    print(f"   - Job: {app['job_id']}, Status: {app['status']}")

# 5. SOLUTION
print(f"\n=== DIAGNOSIS ===")
print(f"The candidate_id '{target_uuid}' is stored in job_applications")
print(f"But this ID doesn't correspond to any user in the users table!")
print(f"")
print(f"Possible causes:")
print(f"1. Application was created with wrong ID (CV UUID instead of user ID)")
print(f"2. User was deleted but applications remain")
print(f"3. Data corruption during application submission")

cur.close()
conn.close()
