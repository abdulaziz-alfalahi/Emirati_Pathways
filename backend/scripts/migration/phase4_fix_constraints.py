"""Fix the remaining CHECK constraints."""
import psycopg2, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

conn = psycopg2.connect(**DB_CONFIG)

def try_sql(desc, sql):
    cur = conn.cursor()
    try:
        cur.execute(sql)
        print(f"  OK: {desc} -- {cur.statusmessage}")
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"  FAIL: {desc} -- {e}")
        return False

# 1. Check ALL constraints on users table
print("=== All CHECK constraints on users ===")
cur = conn.cursor()
cur.execute("""
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'users'::regclass AND contype = 'c'
""")
for name, defn in cur.fetchall():
    print(f"  {name}: {defn}")
conn.commit()

# 2. Drop user_type check constraint
try_sql("Drop users_user_type_check", 
        "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check")

# 3. Add updated user_type constraint with canonical roles
try_sql("Add updated user_type constraint", """
    ALTER TABLE users ADD CONSTRAINT users_user_type_check 
    CHECK (user_type IN (
        'candidate', 'candidate', 'parent', 'training_provider', 'assessor',
        'mentor', 'recruiter', 'employer_admin', 'candidate', 'operator', 'admin'
    ))
""")

# 4. Now sync user_type to role
try_sql("Sync user_type to role", 
        "UPDATE users SET user_type = role WHERE user_type != role")

# 5. Re-add role check constraint (was dropped earlier, needs to be re-added)
cur = conn.cursor()
cur.execute("""
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'users'::regclass AND contype = 'c' AND conname LIKE '%role%'
""")
existing = cur.fetchall()
conn.commit()
print(f"  Existing role constraints: {existing}")

if not existing:
    try_sql("Add updated role constraint", """
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN (
            'candidate', 'candidate', 'parent', 'training_provider', 'assessor',
            'mentor', 'recruiter', 'employer_admin', 'candidate', 'operator', 'admin'
        ))
    """)

# 6. Verify final state
print("\n=== Final verification ===")
cur = conn.cursor()
cur.execute("SELECT role, user_type, COUNT(*) FROM users GROUP BY role, user_type ORDER BY role")
for row in cur.fetchall():
    match = "OK" if row[0] == row[1] else "MISMATCH"
    print(f"  role={row[0]}, user_type={row[1]}, count={row[2]} [{match}]")
conn.commit()

cur.execute("""
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'users'::regclass AND contype = 'c'
""")
print("\n  Active CHECK constraints:")
for name, defn in cur.fetchall():
    print(f"    {name}: {defn}")
conn.commit()

conn.close()
print("\nDone!")
