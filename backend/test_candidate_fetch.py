
import psycopg2
import psycopg2.extras
import os
from tabulate import tabulate

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def test_fetch_candidate(user_id='21'): # 21 is the candidate_id seen in previous logs
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    print(f"Testing fetch for CANDIDATE user_id={user_id}...")

    # The SQL Recruiter Query (Simulating get_interview_sessions logic query_sql)
    # We'll construct it exactly as the code does for role='candidate'
    
    query_sql = """
        SELECT i.interview_id, i.scheduled_date, i.scheduled_time, i.status,
               i.candidate_id, i.recruiter_id,
               j.title as job_title,
               'recruiter_sql' as source
        FROM interview_schedules i
        LEFT JOIN job_postings j ON i.jd_id::text = j.jd_id::text
        LEFT JOIN users u1 ON i.candidate_id::text = u1.id::text
        LEFT JOIN users u2 ON i.recruiter_id::text = u2.id::text
        WHERE i.status != 'cancelled'
    """
    
    params_sql = []
    # Simulating role="candidate"
    query_sql += " AND i.candidate_id = %s"
    params_sql.append(user_id) # In code it is str(user_id)
    
    print(f"Query: {query_sql}")
    print(f"Params: {params_sql}")

    try:
        cur.execute(query_sql, params_sql)
        rows = cur.fetchall()
        print(f"\nSQL Sessions found: {len(rows)}")
        if rows:
            print(tabulate(rows, headers="keys"))
    except Exception as e:
        print(f"SQL Query Failed: {e}")

    conn.close()

if __name__ == "__main__":
    test_fetch_candidate()
