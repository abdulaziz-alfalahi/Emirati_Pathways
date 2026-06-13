"""
Phase 4 Database Cleanup Migration Script
==========================================
Steps:
  1. Migrate role names (candidate→job_seeker, admin→administrator, sync user_type)
  2. Consolidate shortlist tables (3→1 into candidate_shortlist)
  3. Consolidate offer tables (2→1 into job_offers)
  4. Deprecate 85 empty tables (rename with _deprecated_ prefix)
  
All steps create backups before modifying data.
"""
import psycopg2, psycopg2.extras
import sys

DB_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def run_step(conn, step_name, queries):
    """Execute a list of SQL queries as a single transaction."""
    print(f"\n{'='*60}")
    print(f"  STEP: {step_name}")
    print(f"{'='*60}")
    cur = conn.cursor()
    try:
        for desc, sql in queries:
            print(f"  → {desc}")
            cur.execute(sql)
            if cur.rowcount >= 0 and cur.statusmessage and ('UPDATE' in cur.statusmessage or 'INSERT' in cur.statusmessage or 'DELETE' in cur.statusmessage):
                print(f"    ✓ {cur.rowcount} rows affected")
            else:
                print(f"    ✓ Done")
        conn.commit()
        print(f"  ✅ {step_name} COMMITTED successfully")
        return True
    except Exception as e:
        conn.rollback()
        print(f"  ❌ {step_name} FAILED: {e}")
        return False

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    results = []
    
    # =========================================================================
    # STEP 1: Migrate Role Names
    # =========================================================================
    ok = run_step(conn, "1. Migrate Role Names", [
        ("Backup users role data",
         "CREATE TABLE IF NOT EXISTS _backup_users_roles AS SELECT id, email, role, user_type FROM users"),
        
        ("Migrate 'candidate' → 'candidate' in role column",
         "UPDATE users SET role = 'candidate' WHERE role = 'candidate'"),
        
        ("Migrate 'admin' → 'admin' in role column",
         "UPDATE users SET role = 'admin' WHERE role = 'admin'"),
         
        ("Migrate 'growth_operator' → 'operator' in role column",
         "UPDATE users SET role = 'operator' WHERE role = 'growth_operator'"),
        
        ("Sync user_type to match role",
         "UPDATE users SET user_type = role WHERE user_type != role"),
        
        ("Remove default on role column (users must select role)",
         "ALTER TABLE users ALTER COLUMN role DROP DEFAULT"),
        
        ("Remove default on user_type column",
         "ALTER TABLE users ALTER COLUMN user_type DROP DEFAULT"),
    ])
    results.append(("Step 1: Role Migration", ok))
    
    # =========================================================================
    # STEP 2: Consolidate Shortlist Tables (3→1 into candidate_shortlist)
    # =========================================================================
    ok = run_step(conn, "2. Consolidate Shortlist Tables", [
        ("Backup shortlisted_candidates",
         "CREATE TABLE IF NOT EXISTS _backup_shortlisted_candidates AS SELECT * FROM shortlisted_candidates"),
        
        ("Backup job_shortlists",
         "CREATE TABLE IF NOT EXISTS _backup_job_shortlists AS SELECT * FROM job_shortlists"),
        
        ("Generate shortlist_id for insertion",
         """INSERT INTO candidate_shortlist (shortlist_id, jd_id, candidate_id, recruiter_id, status, notes, created_at, updated_at)
            SELECT 
                'sl_migrated_sc_' || id::text,
                job_id::text,
                candidate_id::text,
                hr_user_id::text,
                status,
                notes,
                created_at,
                updated_at
            FROM shortlisted_candidates
            WHERE NOT EXISTS (
                SELECT 1 FROM candidate_shortlist cs 
                WHERE cs.jd_id = job_id::text 
                AND cs.candidate_id = candidate_id::text
            )"""),
        
        ("Merge job_shortlists into candidate_shortlist",
         """INSERT INTO candidate_shortlist (shortlist_id, jd_id, candidate_id, recruiter_id, status, notes, created_at)
            SELECT 
                'sl_migrated_js_' || job_posting_id::text || '_' || candidate_id::text,
                job_posting_id::text,
                candidate_id::text,
                added_by::text,
                'shortlisted',
                notes,
                created_at
            FROM job_shortlists
            WHERE NOT EXISTS (
                SELECT 1 FROM candidate_shortlist cs 
                WHERE cs.jd_id = job_posting_id::text 
                AND cs.candidate_id = candidate_id::text
            )"""),
        
        ("Deprecate shortlisted_candidates",
         "ALTER TABLE shortlisted_candidates RENAME TO _deprecated_shortlisted_candidates"),
        
        ("Deprecate job_shortlists",
         "ALTER TABLE job_shortlists RENAME TO _deprecated_job_shortlists"),
    ])
    results.append(("Step 2: Shortlist Consolidation", ok))
    
    # =========================================================================
    # STEP 3: Consolidate Offer Tables (2→1 into job_offers)
    # =========================================================================
    ok = run_step(conn, "3. Consolidate Offer Tables", [
        ("Backup offers table",
         "CREATE TABLE IF NOT EXISTS _backup_offers AS SELECT * FROM offers"),
        
        ("Merge offers into job_offers",
         """INSERT INTO job_offers (
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
                created_at, updated_at
            FROM offers
            WHERE NOT EXISTS (
                SELECT 1 FROM job_offers jo 
                WHERE jo.offer_id = id::text
            )"""),
        
        ("Deprecate offers table",
         "ALTER TABLE offers RENAME TO _deprecated_offers"),
    ])
    results.append(("Step 3: Offer Consolidation", ok))
    
    # =========================================================================
    # STEP 4: Deprecate 85 Empty Tables
    # =========================================================================
    # Get the list of empty tables dynamically
    cur = conn.cursor()
    cur.execute("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_deprecated_%'
        AND tablename NOT LIKE '_backup_%'
        ORDER BY tablename
    """)
    all_tables = [r[0] for r in cur.fetchall()]
    
    # Tables to keep (non-empty or essential)
    keep_tables = set()
    for t in all_tables:
        try:
            cur.execute(f'SELECT COUNT(*) FROM "{t}"')
            cnt = cur.fetchone()[0]
            if cnt > 0:
                keep_tables.add(t)
        except:
            conn.rollback()
            keep_tables.add(t)  # Keep if we can't count
    
    # Also keep essential infrastructure tables even if empty
    essential_empty = {
        'recruiter_vacancies',  # User wants to keep for CV matching
        # The following were already deprecated in steps 2-3:
        # shortlisted_candidates, job_shortlists, offers
    }
    keep_tables.update(essential_empty)
    
    empty_to_deprecate = [t for t in all_tables if t not in keep_tables and not t.startswith('_')]
    
    print(f"\n{'='*60}")
    print(f"  STEP: 4. Deprecate {len(empty_to_deprecate)} Empty Tables")
    print(f"{'='*60}")
    
    deprecate_queries = []
    for t in empty_to_deprecate:
        deprecate_queries.append(
            (f"Deprecate {t}",
             f'ALTER TABLE "{t}" RENAME TO "_deprecated_{t}"')
        )
    
    ok = run_step(conn, f"4. Deprecate {len(empty_to_deprecate)} Empty Tables", deprecate_queries)
    results.append((f"Step 4: Deprecate {len(empty_to_deprecate)} Empty Tables", ok))
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print(f"\n{'='*60}")
    print(f"  MIGRATION SUMMARY")
    print(f"{'='*60}")
    for name, ok in results:
        status = "✅ PASS" if ok else "❌ FAIL"
        print(f"  {status} — {name}")
    
    # Post-migration validation
    print(f"\n  Post-migration checks:")
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cur.execute("SELECT role, COUNT(*) as cnt FROM users GROUP BY role ORDER BY cnt DESC")
    print(f"  Roles: {[dict(r) for r in cur.fetchall()]}")
    
    cur.execute("SELECT COUNT(*) as cnt FROM candidate_shortlist")
    print(f"  candidate_shortlist: {cur.fetchone()['cnt']} rows")
    
    cur.execute("SELECT COUNT(*) as cnt FROM job_offers")
    print(f"  job_offers: {cur.fetchone()['cnt']} rows")
    
    cur.execute("""SELECT COUNT(*) as cnt FROM pg_tables 
                   WHERE schemaname = 'public' AND tablename LIKE '_deprecated_%'""")
    print(f"  Deprecated tables: {cur.fetchone()['cnt']}")
    
    cur.execute("""SELECT COUNT(*) as cnt FROM pg_tables 
                   WHERE schemaname = 'public' AND tablename NOT LIKE '_deprecated_%' AND tablename NOT LIKE '_backup_%'""")
    print(f"  Active tables: {cur.fetchone()['cnt']}")
    
    cur.close()
    conn.close()
    
    # Write results to file
    all_ok = all(ok for _, ok in results)
    with open('phase4_result.txt', 'w') as f:
        f.write("PASS\n" if all_ok else "FAIL\n")
        for name, ok in results:
            f.write(f"{'PASS' if ok else 'FAIL'} {name}\n")
    
    return 0 if all_ok else 1

if __name__ == '__main__':
    sys.exit(main())
