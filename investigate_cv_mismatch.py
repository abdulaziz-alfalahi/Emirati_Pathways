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

# Find user by email
cur.execute("""
    SELECT id, email, phone, full_name 
    FROM users 
    WHERE email = %s
""", ('test_role_e92d28@example.com',))

user = cur.fetchone()
if not user:
    print("User not found!")
    conn.close()
    exit()

print(f"\n=== User Info ===")
print(f"ID: {user['id']}")
print(f"Email: {user['email']}")
print(f"Phone: {user['phone']}")
print(f"Full Name: {user['full_name']}")

user_id = user['id']

# Check all CVs for this user
cur.execute("""
    SELECT id, user_id, candidate_name, title, status, created_at, updated_at
    FROM user_cvs 
    WHERE user_id::text = %s
    ORDER BY created_at DESC
""", (str(user_id),))

cvs = cur.fetchall()
print(f"\n=== CVs for User {user_id} ({len(cvs)} total) ===")
for cv in cvs:
    print(f"\nCV ID: {cv['id']}")
    print(f"  Candidate Name: {cv['candidate_name']}")
    print(f"  Title: {cv['title']}")
    print(f"  Status: {cv['status']}")
    print(f"  Created: {cv['created_at']}")
    print(f"  Updated: {cv['updated_at']}")

# Check if there's a "Majid Al Sharif" CV
cur.execute("""
    SELECT id, user_id, candidate_name, title, created_at
    FROM user_cvs 
    WHERE candidate_name ILIKE %s
    ORDER BY created_at DESC
""", ('%majid%',))

majid_cvs = cur.fetchall()
if majid_cvs:
    print(f"\n=== CVs with 'Majid' in name ({len(majid_cvs)} total) ===")
    for cv in majid_cvs:
        print(f"\nCV ID: {cv['id']}, User: {cv['user_id']}")
        print(f"  Name: {cv['candidate_name']}")
        print(f"  Title: {cv['title']}")
        print(f"  Created: {cv['created_at']}")

# Check if there's a "Jassim" CV
cur.execute("""
    SELECT id, user_id, candidate_name, title, created_at
    FROM user_cvs 
    WHERE candidate_name ILIKE %s
    ORDER BY created_at DESC
""", ('%jassim%',))

jassim_cvs = cur.fetchall()
if jassim_cvs:
    print(f"\n=== CVs with 'Jassim' in name ({len(jassim_cvs)} total) ===")
    for cv in jassim_cvs:
        print(f"\nCV ID: {cv['id']}, User: {cv['user_id']}")
        print(f"  Name: {cv['candidate_name']}")
        print(f"  Title: {cv['title']}")
        print(f"  Created: {cv['created_at']}")

conn.close()
