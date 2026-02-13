"""Phase 4 — Audit current database state for migration planning."""
import psycopg2, psycopg2.extras, json

DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

output = []

# 1. Role distribution
output.append("=== ROLE DISTRIBUTION ===")
cur.execute("SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY cnt DESC")
for row in cur.fetchall():
    output.append(f"  {row['role']}: {row['cnt']}")

# 2. user_type distribution
output.append("\n=== USER_TYPE DISTRIBUTION ===")
cur.execute("SELECT user_type, COUNT(*) as cnt FROM users GROUP BY user_type ORDER BY cnt DESC")
for row in cur.fetchall():
    output.append(f"  {row['user_type']}: {row['cnt']}")

# 3. role vs user_type mismatches
output.append("\n=== ROLE vs USER_TYPE MISMATCHES ===")
cur.execute("SELECT id, email, role, user_type FROM users WHERE role != user_type ORDER BY id")
for row in cur.fetchall():
    output.append(f"  id={row['id']} email={row['email']} role={row['role']} user_type={row['user_type']}")

# 4. Shortlist tables
output.append("\n=== SHORTLIST TABLES ===")
for table in ['candidate_shortlist', 'shortlisted_candidates', 'job_shortlists']:
    try:
        cur.execute(f"SELECT COUNT(*) as cnt FROM {table}")
        cnt = cur.fetchone()['cnt']
        output.append(f"  {table}: {cnt} rows")
        if cnt > 0 and cnt <= 25:
            cur.execute(f"SELECT * FROM {table} LIMIT 5")
            rows = cur.fetchall()
            for r in rows:
                output.append(f"    {dict(r)}")
    except Exception as e:
        output.append(f"  {table}: ERROR: {e}")
        conn.rollback()

# 5. Offer tables
output.append("\n=== OFFER TABLES ===")
for table in ['job_offers', 'offers', 'recruiter_offers', 'offer_approval_requests']:
    try:
        cur.execute(f"SELECT COUNT(*) as cnt FROM {table}")
        cnt = cur.fetchone()['cnt']
        output.append(f"  {table}: {cnt} rows")
        if cnt > 0 and cnt <= 10:
            cur.execute(f"SELECT * FROM {table} LIMIT 3")
            rows = cur.fetchall()
            for r in rows:
                d = dict(r)
                # truncate large fields
                for k,v in d.items():
                    if isinstance(v, str) and len(v) > 100:
                        d[k] = v[:100] + "..."
                output.append(f"    {d}")
    except Exception as e:
        output.append(f"  {table}: ERROR: {e}")
        conn.rollback()

# 6. Empty tables  
output.append("\n=== EMPTY TABLES ===")
cur.execute("""
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
""")
tables = [r['tablename'] for r in cur.fetchall()]
empty_tables = []
for t in tables:
    try:
        cur.execute(f"SELECT COUNT(*) as cnt FROM \"{t}\"")
        cnt = cur.fetchone()['cnt']
        if cnt == 0:
            empty_tables.append(t)
    except:
        conn.rollback()
output.append(f"  Total empty tables: {len(empty_tables)}")
for t in empty_tables:
    output.append(f"    {t}")

# 7. recruiter_vacancies (orphaned uuid table)
output.append("\n=== RECRUITER_VACANCIES ===")
try:
    cur.execute("SELECT COUNT(*) as cnt FROM recruiter_vacancies")
    cnt = cur.fetchone()['cnt']
    output.append(f"  recruiter_vacancies: {cnt} rows")
    cur.execute("SELECT id, title, posted_by FROM recruiter_vacancies LIMIT 3")
    for r in cur.fetchall():
        output.append(f"    {dict(r)}")
except Exception as e:
    output.append(f"  ERROR: {e}")
    conn.rollback()

cur.close()
conn.close()

result = "\n".join(output)
with open('phase4_audit.txt', 'w') as f:
    f.write(result)
print(result)
