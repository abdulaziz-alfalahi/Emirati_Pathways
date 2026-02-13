#!/usr/bin/env python3
"""
Audit script: Discover ALL user-related tables in the database.
Writes results to audit_output_utf8.txt
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'audit_output_utf8.txt')

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    lines = []

    def p(msg=""):
        lines.append(msg)

    p("=" * 80)
    p("SECTION 1: ALL TABLES WITH 'user' IN THE NAME")
    p("=" * 80)
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name ILIKE '%user%'
        ORDER BY table_name
    """)
    user_tables = [r['table_name'] for r in cur.fetchall()]
    for t in user_tables:
        p(f"  - {t}")
    p(f"\nTotal: {len(user_tables)} tables\n")

    p("=" * 80)
    p("SECTION 2: ALL TABLES WITH 'candidate' IN THE NAME")
    p("=" * 80)
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name ILIKE '%candidate%'
        ORDER BY table_name
    """)
    candidate_tables = [r['table_name'] for r in cur.fetchall()]
    for t in candidate_tables:
        p(f"  - {t}")
    p(f"\nTotal: {len(candidate_tables)} tables\n")

    p("=" * 80)
    p("SECTION 3: ALL TABLES WITH 'recruiter' or 'hr' IN THE NAME")
    p("=" * 80)
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND (table_name ILIKE '%recruiter%' OR table_name ILIKE '%hr_%')
        ORDER BY table_name
    """)
    recruiter_tables = [r['table_name'] for r in cur.fetchall()]
    for t in recruiter_tables:
        p(f"  - {t}")
    p(f"\nTotal: {len(recruiter_tables)} tables\n")

    p("=" * 80)
    p("SECTION 4: ALL TABLES WITH 'profile' IN THE NAME")
    p("=" * 80)
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name ILIKE '%profile%'
        ORDER BY table_name
    """)
    profile_tables = [r['table_name'] for r in cur.fetchall()]
    for t in profile_tables:
        p(f"  - {t}")
    p(f"\nTotal: {len(profile_tables)} tables\n")

    # Detailed inspection of all discovered tables
    all_tables = sorted(set(user_tables + candidate_tables + recruiter_tables + profile_tables))

    p("=" * 80)
    p("SECTION 5: SCHEMA + ROW COUNTS FOR EACH DISCOVERED TABLE")
    p("=" * 80)
    for table in all_tables:
        p(f"\n--- TABLE: {table} ---")
        try:
            cur.execute(f'SELECT COUNT(*) as cnt FROM "{table}"')
            cnt = cur.fetchone()['cnt']
            p(f"  Row count: {cnt}")
        except Exception as e:
            p(f"  Row count ERROR: {e}")
            conn.rollback()

        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table,))
        cols = cur.fetchall()
        p(f"  Columns ({len(cols)}):")
        for c in cols:
            nullable = "NULL" if c['is_nullable'] == 'YES' else "NOT NULL"
            default = f" DEFAULT={c['column_default']}" if c['column_default'] else ""
            p(f"    {c['column_name']:35s} {c['data_type']:25s} {nullable}{default}")

    p("\n" + "=" * 80)
    p("SECTION 6: COLUMNS NAMED 'user_id' ACROSS ALL TABLES")
    p("=" * 80)
    cur.execute("""
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'user_id'
        ORDER BY table_name
    """)
    uid_cols = cur.fetchall()
    for r in uid_cols:
        p(f"  {r['table_name']:40s} user_id ({r['data_type']})")
    p(f"\nTotal tables with user_id column: {len(uid_cols)}")

    p("\n" + "=" * 80)
    p("SECTION 7: SAMPLE DATA FROM MAIN 'users' TABLE (first 15 rows)")
    p("=" * 80)
    try:
        cur.execute("SELECT id, email, role, first_name, last_name, is_active, created_at FROM users ORDER BY id LIMIT 15")
        rows = cur.fetchall()
        for r in rows:
            ca = str(r.get('created_at', ''))[:19]
            p(f"  ID={r['id']:<5} role={str(r.get('role','')):20s} active={str(r.get('is_active','')):5s} email={r.get('email',''):<40s} name={r.get('first_name','')} {r.get('last_name',''):<15s} created={ca}")
    except Exception as e:
        p(f"  ERROR: {e}")
        conn.rollback()

    p("\n" + "=" * 80)
    p("SECTION 8: ROLE DISTRIBUTION IN 'users' TABLE")
    p("=" * 80)
    try:
        cur.execute("SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY cnt DESC")
        rows = cur.fetchall()
        for r in rows:
            p(f"  {str(r['role']):25s} {r['cnt']} users")
    except Exception as e:
        p(f"  ERROR: {e}")
        conn.rollback()

    p("\n" + "=" * 80)
    p("SECTION 9: FK CONSTRAINTS REFERENCING 'users' TABLE")
    p("=" * 80)
    cur.execute("""
        SELECT
            tc.table_name AS source_table,
            kcu.column_name AS source_column,
            ccu.table_name AS target_table,
            ccu.column_name AS target_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users'
        ORDER BY tc.table_name
    """)
    fks = cur.fetchall()
    for r in fks:
        p(f"  {r['source_table']}.{r['source_column']} -> {r['target_table']}.{r['target_column']}")
    p(f"\nTotal FK refs to users: {len(fks)}")

    p("\n" + "=" * 80)
    p("SECTION 10: CHECK FOR DUPLICATE/OVERLAPPING TABLES")
    p("=" * 80)
    # Check if there's a 'candidates' table separate from 'users'
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('candidates', 'users', 'user_accounts', 'user_profiles', 'recruiters', 'hr_users')")
    core_tables = [r['table_name'] for r in cur.fetchall()]
    p(f"  Core identity tables found: {core_tables}")
    
    for ct in core_tables:
        if ct != 'users':
            try:
                cur.execute(f'SELECT COUNT(*) as cnt FROM "{ct}"')
                cnt = cur.fetchone()['cnt']
                p(f"    {ct}: {cnt} rows")
                cur.execute(f'SELECT * FROM "{ct}" LIMIT 3')
                sample = cur.fetchall()
                for s in sample:
                    p(f"      Sample: {dict(s)}")
            except Exception as e:
                p(f"    {ct}: ERROR - {e}")
                conn.rollback()

    cur.close()
    conn.close()
    p("\n\nAUDIT COMPLETE.")

    # Write to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Output written to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
