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

user_id = '62'
uuid_user_id = '18c2f394-3c7e-519c-9232-7a4470c7868f'

print(f"\n=== Checking ALL CV-related tables for user {user_id} ===")

# Table 1: user_cvs (new CV builder)
cur.execute("""
    SELECT id, title, created_at
    FROM user_cvs 
    WHERE user_id::text = %s
    ORDER BY created_at DESC
""", (user_id,))
user_cvs = cur.fetchall()
print(f"\n1. user_cvs table: {len(user_cvs)} CVs")
for cv in user_cvs:
    print(f"   - ID {cv['id']}: {cv['title']}, created {cv['created_at']}")

# Table 2: cv_storage (enhanced CV routes)
try:
    cur.execute("""
        SELECT id, file_name, uploaded_at
        FROM cv_storage 
        WHERE user_id::text = %s OR user_id::text = %s
        ORDER BY uploaded_at DESC
    """, (user_id, uuid_user_id))
    cv_storage = cur.fetchall()
    print(f"\n2. cv_storage table: {len(cv_storage)} CVs")
    for cv in cv_storage:
        print(f"   - ID {cv['id']}: {cv['file_name']}, uploaded {cv['uploaded_at']}")
except Exception as e:
    print(f"\n2. cv_storage table: {e}")

# Table 3: cv_data (legacy)
try:
    cur.execute("""
        SELECT id, created_at
        FROM cv_data 
        WHERE user_id::text = %s OR user_id::text = %s
        ORDER BY created_at DESC
    """, (user_id, uuid_user_id))
    cv_data = cur.fetchall()
    print(f"\n3. cv_data table: {len(cv_data)} CVs")
    for cv in cv_data:
        print(f"   - ID {cv['id']}, created {cv['created_at']}")
except Exception as e:
    print(f"\n3. cv_data table: {e}")

# Table 4: cv_profiles (legacy)
try:
    cur.execute("""
        SELECT user_id, created_at
        FROM cv_profiles 
        WHERE user_id::text = %s OR user_id::text = %s
        ORDER BY created_at DESC
    """, (user_id, uuid_user_id))
    cv_profiles = cur.fetchall()
    print(f"\n4. cv_profiles table: {len(cv_profiles)} CVs")
    for cv in cv_profiles:
        print(f"   - User {cv['user_id']}, created {cv['created_at']}")
except Exception as e:
    print(f"\n4. cv_profiles table: {e}")

conn.close()
