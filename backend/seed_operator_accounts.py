"""
Seed Operator Test Accounts — v5
1. Drops the users_role_check constraint
2. Recreates it with the new operator roles included
3. Inserts operator user accounts with growth_operator_* roles
4. Creates domain assignments in growth_operator_assignments table
"""
import os, bcrypt, secrets, psycopg2, psycopg2.extras
from dotenv import load_dotenv
load_dotenv()

DB = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

# Format: (phone, role, name, email, domain)
OPS = [
    ('+971509998889', 'growth_operator_candidate',   'Ahmad Al Mansoori',   'candidate.operator@emirati-pathway.test',   'candidate'),
    ('+971509998890', 'growth_operator_company',     'Fatima Al Hashimi',   'company.operator@emirati-pathway.test',     'company'),
    ('+971509998891', 'growth_operator_education',   'Khalid Al Nuaimi',    'education.operator@emirati-pathway.test',   'education'),
    ('+971509998892', 'growth_operator_assessment',  'Mariam Al Shamsi',    'assessment.operator@emirati-pathway.test',  'assessment'),
    ('+971509998893', 'growth_operator_mentorship',  'Rashid Al Ketbi',     'mentorship.operator@emirati-pathway.test',  'mentorship'),
    ('+971509998894', 'growth_operator_community',   'Noura Al Dhaheri',    'community.operator@emirati-pathway.test',   'community'),
]

conn = psycopg2.connect(**DB)
conn.autocommit = True
cur = conn.cursor()

# Step 1: Get current allowed roles from the CHECK constraint
cur.execute("""
    SELECT pg_get_constraintdef(con.oid) as def
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'users' AND con.conname = 'users_role_check'
""")
row = cur.fetchone()
if row:
    print(f"Current constraint: {row[0][:100]}...")

# Step 2: Drop the old constraint
print("\nDropping old users_role_check constraint...")
cur.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check")
print("  Done.")

# Step 3: Recreate with all roles including new operators
print("Creating new users_role_check constraint with operator roles...")
cur.execute("""
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
        role IS NULL OR role::text = ANY(ARRAY[
            'administrator', 'admin', 'candidate', 'job_seeker', 'jobseeker',
            'hr_manager', 'hr', 'hr_recruiter', 'recruiter', 'employer',
            'educator', 'student', 'guardian', 'parent', 'mentor',
            'growth_operator', 'growth_operator_candidate', 'growth_operator_company',
            'growth_operator_education', 'growth_operator_assessment',
            'growth_operator_mentorship', 'growth_operator_community',
            'growth_operator_monitoring',
            'operator', 'retiree',
            'nafis_talent_operator', 'education_operator', 'professional_dev_operator',
            'community_operator', 'operations_monitor'
        ]::text[])
    )
""")
print("  Done.")

# Step 4: Ensure growth_operator_assignments table exists
cur.execute("""
    CREATE TABLE IF NOT EXISTS growth_operator_assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        domain VARCHAR(50) NOT NULL,
        assigned_by INTEGER,
        is_primary BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, domain)
    )
""")

# Step 5: Clean up old operator entries (both old and new naming)
print("\nCleaning up old operator accounts...")
old_emails = [
    'nafis.operator@emirati-pathway.test',
    'education.operator@emirati-pathway.test',
    'profdev.operator@emirati-pathway.test',
    'community.operator@emirati-pathway.test',
    'operations.monitor@emirati-pathway.test',
]
for email in old_emails:
    cur.execute("DELETE FROM users WHERE email = %s", (email,))

# Also clean up old generic growth operator on +971509998888
cur.execute("DELETE FROM growth_operator_assignments WHERE user_id IN (SELECT id FROM users WHERE phone = '+971509998888')")
cur.execute("DELETE FROM users WHERE phone = '+971509998888'")

for phone, role, name, email, domain in OPS:
    cur.execute("DELETE FROM growth_operator_assignments WHERE user_id IN (SELECT id FROM users WHERE email = %s)", (email,))
    cur.execute("DELETE FROM users WHERE email = %s", (email,))
    cur.execute("DELETE FROM users WHERE phone = %s", (phone,))

# Step 6: Insert operator accounts and domain assignments
print("\nSeeding operator accounts...")
for phone, role, name, email, domain in OPS:
    ph = bcrypt.hashpw(secrets.token_urlsafe(16).encode(), bcrypt.gensalt()).decode()
    parts = name.split(' ', 1)
    fname, lname = parts[0], (parts[1] if len(parts) > 1 else '')

    cur.execute("""
        INSERT INTO users (email, password_hash, full_name, first_name, last_name, user_type, role, phone, nationality, is_active, is_verified, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'UAE', true, true, NOW(), NOW())
        RETURNING id
    """, (email, ph, name, fname, lname, role, role, phone))
    user_id = cur.fetchone()[0]

    # Create domain assignment
    cur.execute("""
        INSERT INTO growth_operator_assignments (user_id, domain, assigned_by, is_primary, is_active, notes)
        VALUES (%s, %s, 1, true, true, 'Seeded operator')
        ON CONFLICT (user_id, domain) DO UPDATE SET is_active = true, is_primary = true
    """, (user_id, domain))

    print(f"  CREATED  id={user_id}  {phone}  ->  {role}  [domain: {domain}]")

cur.close()
conn.close()

print("\nAll operator accounts seeded!")
print("\nSign-in credentials (use OTP: 123456):")
for phone, role, name, email, domain in OPS:
    print(f"  {phone}  ->  {role}  ({name})")
