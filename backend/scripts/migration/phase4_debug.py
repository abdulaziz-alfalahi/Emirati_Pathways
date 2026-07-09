"""Debug the failed migration steps with encoding fix."""
import psycopg2, psycopg2.extras, sys, io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

conn = psycopg2.connect(**DB_CONFIG)
output = []

def log(msg):
    output.append(msg)
    print(msg)

def try_sql(desc, sql, params=None):
    cur = conn.cursor()
    try:
        cur.execute(sql, params)
        msg = f"  OK: {desc} -- {cur.rowcount} rows, status: {cur.statusmessage}"
        conn.commit()
        log(msg)
        return True
    except Exception as e:
        conn.rollback()
        msg = f"  FAIL: {desc}\n    ERROR: {e}"
        log(msg)
        return False

# ---- Step 1: Role Migration ----
log("=== STEP 1: Role Migration ===")

cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
cur.execute("SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY cnt DESC")
log(f"  Current roles: {[dict(r) for r in cur.fetchall()]}")
conn.commit()

try_sql("Backup users role data", 
        "CREATE TABLE IF NOT EXISTS _backup_users_roles AS SELECT id, email, role, user_type FROM users")
try_sql("Migrate candidate to job_seeker", 
        "UPDATE users SET role = 'candidate' WHERE role = 'candidate'")
try_sql("Migrate admin to administrator", 
        "UPDATE users SET role = 'admin' WHERE role = 'admin'")
try_sql("Migrate growth_operator to operator", 
        "UPDATE users SET role = 'operator' WHERE role = 'growth_operator'")
try_sql("Sync user_type to match role", 
        "UPDATE users SET user_type = role WHERE user_type != role")
try_sql("Drop role default", 
        "ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
try_sql("Drop user_type default", 
        "ALTER TABLE users ALTER COLUMN user_type DROP DEFAULT")

cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
cur.execute("SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY cnt DESC")
log(f"  Final roles: {[dict(r) for r in cur.fetchall()]}")
conn.commit()

# ---- Step 3: Offer Consolidation ----
log("\n=== STEP 3: Offer Consolidation ===")

# Check if offers table exists
cur = conn.cursor()
try:
    cur.execute("SELECT COUNT(*) FROM offers")
    cnt = cur.fetchone()[0]
    log(f"  offers table: {cnt} rows")
    conn.commit()
except:
    log("  offers table does not exist or already deprecated")
    conn.rollback()
    
    # Check if it was already deprecated
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM _deprecated_offers")
        cnt = cur.fetchone()[0]
        log(f"  _deprecated_offers exists: {cnt} rows")
        conn.commit()
    except:
        log("  _deprecated_offers also not found")
        conn.rollback()

# Try merge if offers still exists
cur = conn.cursor()
offers_exist = False
try:
    cur.execute("SELECT 1 FROM information_schema.tables WHERE table_name = 'offers' AND table_schema = 'public'")
    offers_exist = cur.fetchone() is not None
    conn.commit()
except:
    conn.rollback()

if offers_exist:
    try_sql("Backup offers", "CREATE TABLE IF NOT EXISTS _backup_offers AS SELECT * FROM offers")
    
    # Check the created_at column type
    cur = conn.cursor()
    cur.execute("""SELECT column_name, data_type 
                   FROM information_schema.columns 
                   WHERE table_name = 'offers' AND column_name IN ('created_at', 'updated_at')""")
    cols = cur.fetchall()
    log(f"  Timestamp columns: {cols}")
    conn.commit()
    
    # Check job_offers created_at type
    cur = conn.cursor()
    cur.execute("""SELECT column_name, data_type 
                   FROM information_schema.columns 
                   WHERE table_name = 'job_offers' AND column_name IN ('created_at', 'updated_at')""")
    cols = cur.fetchall()
    log(f"  job_offers timestamp columns: {cols}")
    conn.commit()
    
    try_sql("Merge offers into job_offers", """
        INSERT INTO job_offers (
            offer_id, jd_id, candidate_id, recruiter_id, position_title,
            salary_amount, salary_currency, salary_period, benefits,
            start_date, employment_type, probation_period_months, work_location,
            status, created_at, updated_at
        )
        SELECT 
            id::text,
            job_posting_id,
            candidate_id::text,
            recruiter_id::text,
            offer_data->>'position_title',
            (offer_data->>'salary_amount')::decimal,
            COALESCE(offer_data->>'salary_currency', 'AED'),
            COALESCE(offer_data->>'salary_period', 'monthly'),
            offer_data->'benefits',
            CASE WHEN offer_data->>'start_date' IS NOT NULL AND offer_data->>'start_date' != '' 
                 THEN (offer_data->>'start_date')::date ELSE NULL END,
            COALESCE(offer_data->>'employment_type', 'full-time'),
            CASE WHEN offer_data->>'probation_period_months' IS NOT NULL 
                 THEN (offer_data->>'probation_period_months')::integer ELSE 3 END,
            offer_data->>'work_location',
            status,
            created_at::timestamp without time zone,
            updated_at::timestamp without time zone
        FROM offers
        WHERE NOT EXISTS (
            SELECT 1 FROM job_offers jo 
            WHERE jo.offer_id = id::text
        )
    """)
    
    # Check FK deps before rename
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT conname, conrelid::regclass
            FROM pg_constraint
            WHERE confrelid = 'offers'::regclass AND contype = 'f'
        """)
        fks = cur.fetchall()
        log(f"  FK references TO offers: {fks}")
        conn.commit()
    except:
        log("  Could not check FK references")
        conn.rollback()
    
    try_sql("Deprecate offers table", "ALTER TABLE offers RENAME TO _deprecated_offers")
else:
    log("  Offers table already gone/deprecated, skipping")

# ---- Step 4: Empty Table Deprecation ----
log("\n=== STEP 4: Empty Table Deprecation ===")

cur = conn.cursor()
cur.execute("""SELECT tablename FROM pg_tables 
               WHERE schemaname = 'public' 
               AND tablename NOT LIKE '_deprecated_%%'
               AND tablename NOT LIKE '_backup_%%'
               ORDER BY tablename""")
all_tables = [r[0] for r in cur.fetchall()]
conn.commit()

empty_tables = []
for t in all_tables:
    try:
        cur = conn.cursor()
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        cnt = cur.fetchone()[0]
        conn.commit()
        if cnt == 0:
            empty_tables.append(t)
    except:
        conn.rollback()

log(f"  Found {len(empty_tables)} empty tables to deprecate")

success_count = 0
fail_count = 0
skipped = []
for t in empty_tables:
    cur = conn.cursor()
    try:
        # Check for FK REFERENCES to this table
        cur.execute("""
            SELECT conname, conrelid::regclass
            FROM pg_constraint
            WHERE confrelid = %s::regclass AND contype = 'f'
        """, (t,))
        fks = cur.fetchall()
        conn.commit()
        
        if fks:
            skipped.append((t, fks))
            fail_count += 1
            continue
        
        cur.execute(f'ALTER TABLE "{t}" RENAME TO "_deprecated_{t}"')
        conn.commit()
        success_count += 1
    except Exception as e:
        conn.rollback()
        log(f"  FAIL {t}: {e}")
        fail_count += 1

log(f"  Deprecated: {success_count}")
log(f"  Skipped (has FK refs): {fail_count}")
for t, fks in skipped:
    log(f"    {t}: referenced by {[f[1] for f in fks]}")

conn.close()

result = "\n".join(output)
with open('phase4_debug.txt', 'w', encoding='utf-8') as f:
    f.write(result)
