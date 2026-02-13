#!/usr/bin/env python3
"""
Audit script: Discover ALL job-related tables in the database.
Covers: job postings, job descriptions, vacancies, applications, shortlists, offers, templates, etc.
Also audits which route handlers serve job data endpoints.
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

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'audit_jobs_output.txt')

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    lines = []

    def p(msg=""):
        lines.append(msg)

    # ---- SECTION 1: Discover all job-related tables ----
    search_terms = ['job', 'jd', 'vacanc', 'posting', 'application', 'shortlist', 'offer', 'interview', 'recruit']
    
    p("=" * 80)
    p("SECTION 1: ALL TABLES MATCHING JOB-RELATED KEYWORDS")
    p("=" * 80)
    
    all_job_tables = set()
    for term in search_terms:
        cur.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name ILIKE %s
            ORDER BY table_name
        """, (f'%{term}%',))
        tables = [r['table_name'] for r in cur.fetchall()]
        if tables:
            p(f"\n  Matches for '%{term}%':")
            for t in tables:
                p(f"    - {t}")
                all_job_tables.add(t)
    
    all_job_tables = sorted(all_job_tables)
    p(f"\n  TOTAL UNIQUE JOB-RELATED TABLES: {len(all_job_tables)}")

    # ---- SECTION 2: Schema + Row counts for each table ----
    p("\n" + "=" * 80)
    p("SECTION 2: SCHEMA + ROW COUNTS FOR EACH JOB-RELATED TABLE")
    p("=" * 80)
    
    for table in all_job_tables:
        p(f"\n{'─' * 70}")
        p(f"TABLE: {table}")
        p(f"{'─' * 70}")
        
        # Row count
        try:
            cur.execute(f'SELECT COUNT(*) as cnt FROM "{table}"')
            cnt = cur.fetchone()['cnt']
            p(f"  Row count: {cnt}")
        except Exception as e:
            p(f"  Row count ERROR: {e}")
            conn.rollback()
            continue

        # Columns
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

        # Sample data (first 3 rows, key columns only)
        if cnt > 0:
            try:
                # Get primary key or first few columns
                col_names = [c['column_name'] for c in cols[:8]]
                col_list = ', '.join(f'"{c}"' for c in col_names)
                cur.execute(f'SELECT {col_list} FROM "{table}" LIMIT 3')
                samples = cur.fetchall()
                p(f"  Sample data ({min(cnt, 3)} of {cnt} rows):")
                for s in samples:
                    # Truncate long values
                    parts = []
                    for k, v in dict(s).items():
                        sv = str(v)
                        if len(sv) > 60:
                            sv = sv[:57] + "..."
                        parts.append(f"{k}={sv}")
                    p(f"    {', '.join(parts)}")
            except Exception as e:
                p(f"  Sample data ERROR: {e}")
                conn.rollback()

    # ---- SECTION 3: Foreign keys between job tables ----
    p("\n" + "=" * 80)
    p("SECTION 3: FOREIGN KEY CONSTRAINTS BETWEEN JOB TABLES")
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
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND (tc.table_name = ANY(%s) OR ccu.table_name = ANY(%s))
        ORDER BY tc.table_name, kcu.column_name
    """, (all_job_tables, all_job_tables))
    fks = cur.fetchall()
    
    for r in fks:
        p(f"  {r['source_table']}.{r['source_column']} -> {r['target_table']}.{r['target_column']}")
    p(f"\n  Total FK constraints: {len(fks)}")

    # ---- SECTION 4: Identify potential duplicate/overlapping tables ----
    p("\n" + "=" * 80)
    p("SECTION 4: POTENTIAL DUPLICATE/OVERLAPPING TABLES")
    p("=" * 80)
    
    # Group tables by likely function
    groups = {
        'Job Definitions': [t for t in all_job_tables if any(x in t for x in ['job_description', 'job_posting', 'vacanc', 'job_template'])],
        'Applications': [t for t in all_job_tables if 'application' in t],
        'Shortlists': [t for t in all_job_tables if 'shortlist' in t],
        'Offers': [t for t in all_job_tables if 'offer' in t],
        'Interviews': [t for t in all_job_tables if 'interview' in t],
    }
    
    for group_name, tables in groups.items():
        if tables:
            p(f"\n  {group_name}:")
            for t in tables:
                try:
                    cur.execute(f'SELECT COUNT(*) as cnt FROM "{t}"')
                    cnt = cur.fetchone()['cnt']
                except:
                    cnt = "ERROR"
                    conn.rollback()
                
                # Get PK type
                cur.execute("""
                    SELECT column_name, data_type FROM information_schema.columns
                    WHERE table_schema='public' AND table_name=%s AND ordinal_position=1
                """, (t,))
                pk = cur.fetchone()
                pk_info = f"{pk['column_name']}({pk['data_type']})" if pk else "unknown"
                
                p(f"    {t:40s} {cnt:>6} rows  PK: {pk_info}")

    # ---- SECTION 5: Cross-check ID types for join compatibility ----
    p("\n" + "=" * 80)
    p("SECTION 5: ID TYPE COMPATIBILITY CHECK")
    p("=" * 80)
    p("  Checking if job-related tables use consistent ID types for joins...")
    
    id_columns = ['id', 'jd_id', 'job_id', 'posting_id', 'vacancy_id', 'recruiter_id', 'candidate_id', 'user_id']
    for table in all_job_tables:
        cur.execute("""
            SELECT column_name, data_type FROM information_schema.columns
            WHERE table_schema='public' AND table_name=%s AND column_name = ANY(%s)
            ORDER BY ordinal_position
        """, (table, id_columns))
        id_cols = cur.fetchall()
        if id_cols:
            id_info = ", ".join(f"{c['column_name']}({c['data_type']})" for c in id_cols)
            p(f"  {table:40s} {id_info}")

    cur.close()
    conn.close()
    p("\n\nAUDIT COMPLETE.")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Output written to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
