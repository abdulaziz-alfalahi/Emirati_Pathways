"""
Create backward-compatible views for deprecated tables that are still referenced by active code.
This avoids bulk code changes while maintaining data integrity.
"""
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
        print(f"  OK: {desc}")
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"  FAIL: {desc} -- {e}")
        return False

# 1. Create a view 'offers' that points to _deprecated_offers
# The offers table has a DIFFERENT SCHEMA than job_offers, so we can't redirect.
# Instead, restore it as 'offers' by renaming back.
print("=== Restoring offers table (heavily used by 7+ files, 36+ references) ===")
try_sql("Rename _deprecated_offers back to offers",
        "ALTER TABLE _deprecated_offers RENAME TO offers")

# 2. Create views for shortlisted_candidates and job_shortlists pointing to the deprecated tables
# These are also heavily referenced by active code.
print("\n=== Restoring shortlist tables (referenced by 5+ files) ===")
try_sql("Rename _deprecated_shortlisted_candidates back to shortlisted_candidates",
        "ALTER TABLE _deprecated_shortlisted_candidates RENAME TO shortlisted_candidates")
try_sql("Rename _deprecated_job_shortlists back to job_shortlists",
        "ALTER TABLE _deprecated_job_shortlists RENAME TO job_shortlists")

# 3. Verify all are accessible
print("\n=== Verification ===")
for table in ['offers', 'shortlisted_candidates', 'job_shortlists', 'candidate_shortlist', 'job_offers']:
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        cnt = cur.fetchone()[0]
        print(f"  {table}: {cnt} rows -- OK")
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"  {table}: FAIL -- {e}")

# 4. Final count
print("\n=== Final State ===")
cur = conn.cursor()
cur.execute("""SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_deprecated_%%' AND tablename NOT LIKE '_backup_%%'""")
print(f"  Active tables: {cur.fetchone()[0]}")
cur.execute("""SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '_deprecated_%%'""")
print(f"  Deprecated tables: {cur.fetchone()[0]}")
conn.commit()

conn.close()
print("\nDone!")
