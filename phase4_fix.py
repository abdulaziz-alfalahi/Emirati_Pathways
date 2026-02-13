"""Fix remaining Phase 4 issues."""
import psycopg2, psycopg2.extras, sys, io

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
        msg = f"  OK: {desc} -- {cur.statusmessage}"
        conn.commit()
        log(msg)
        return True
    except Exception as e:
        conn.rollback()
        msg = f"  FAIL: {desc} -- {e}"
        log(msg)
        return False

# ---- Fix 1: Update CHECK constraint to include 'operator' ----
log("=== Fix 1: Update role CHECK constraint ===")

# First, find the constraint name
cur = conn.cursor()
cur.execute("""
    SELECT conname, pg_get_constraintdef(oid) 
    FROM pg_constraint 
    WHERE conrelid = 'users'::regclass 
    AND contype = 'c' 
    AND conname LIKE '%role%'
""")
constraints = cur.fetchall()
log(f"  Current role constraints: {constraints}")
conn.commit()

for conname, condef in constraints:
    log(f"  Dropping constraint: {conname}")
    try_sql(f"Drop {conname}", f'ALTER TABLE users DROP CONSTRAINT "{conname}"')

# Add updated constraint with canonical role names
try_sql("Add updated role constraint", """
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN (
        'job_seeker', 'student', 'guardian', 'educator', 'assessor',
        'mentor', 'recruiter', 'hr_manager', 'retiree', 'operator', 'administrator'
    ))
""")

# Now migrate the growth_operator
try_sql("Migrate growth_operator to operator", 
        "UPDATE users SET role = 'operator' WHERE role = 'growth_operator'")
try_sql("Sync user_type for operator",
        "UPDATE users SET user_type = role WHERE user_type != role")

# Verify
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
cur.execute("SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY cnt DESC")
log(f"  Final roles: {[dict(r) for r in cur.fetchall()]}")
conn.commit()

# ---- Fix 2: Drop FK constraints from deprecated tables, then deprecate remaining empties ----
log("\n=== Fix 2: Deprecate remaining empty tables ===")

# Get all remaining empty tables
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

log(f"  {len(empty_tables)} empty tables remaining")

# For each empty table with FK references FROM deprecated tables, drop those FKs first
for t in empty_tables:
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT conname, conrelid::regclass as referencing_table
            FROM pg_constraint
            WHERE confrelid = %s::regclass AND contype = 'f'
        """, (t,))
        fks = cur.fetchall()
        conn.commit()
        
        for conname, ref_table in fks:
            ref_table_str = str(ref_table)
            if ref_table_str.startswith('_deprecated_'):
                # Safe to drop FK from deprecated table
                try_sql(f"Drop FK {conname} from {ref_table_str}",
                       f'ALTER TABLE "{ref_table_str}" DROP CONSTRAINT "{conname}"')
            else:
                # FK from an active table - keep the constraint, skip deprecation
                log(f"  KEEP {t}: active FK from {ref_table_str}.{conname}")
    except Exception as e:
        conn.rollback()
        log(f"  Error checking FKs for {t}: {e}")

# Now try to deprecate again
deprecated_count = 0
kept = []
for t in empty_tables:
    cur = conn.cursor()
    try:
        # Check remaining FK refs
        cur.execute("""
            SELECT conname, conrelid::regclass
            FROM pg_constraint
            WHERE confrelid = %s::regclass AND contype = 'f'
        """, (t,))
        fks = cur.fetchall()
        conn.commit()
        
        if fks:
            kept.append((t, [str(f[1]) for f in fks]))
            continue
        
        cur.execute(f'ALTER TABLE "{t}" RENAME TO "_deprecated_{t}"')
        conn.commit()
        deprecated_count += 1
    except Exception as e:
        conn.rollback()
        log(f"  FAIL deprecating {t}: {e}")
        kept.append((t, [str(e)]))

log(f"\n  Deprecated: {deprecated_count}")
log(f"  Kept (active FK refs or permission issues): {len(kept)}")
for t, refs in kept:
    log(f"    {t}: {refs}")

# ---- Summary ----
log("\n=== FINAL STATE ===")
cur = conn.cursor()
cur.execute("""SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_deprecated_%%' AND tablename NOT LIKE '_backup_%%'""")
log(f"  Active tables: {cur.fetchone()[0]}")
cur.execute("""SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '_deprecated_%%'""")
log(f"  Deprecated tables: {cur.fetchone()[0]}")
cur.execute("""SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '_backup_%%'""")
log(f"  Backup tables: {cur.fetchone()[0]}")
conn.commit()

conn.close()

with open('phase4_fix_result.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(output))
