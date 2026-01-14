
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

def test_fetch(user_id='47'): # 47 is the ID seen in user logs
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    print(f"Testing fetch for user_id={user_id}...")

    # The AI Video Query (Modified)
    query_ai = """
        SELECT vis.id as session_id, ja.job_id, j.title as job_title,
               u1.first_name as candidate_first_name,
               'ai_video' as source
        FROM video_interview_sessions vis
        JOIN job_applications ja ON vis.application_id::text = ja.id::text
        JOIN job_postings j ON ja.job_id::text = j.jd_id::text
        JOIN users u1 ON vis.candidate_id = u1.id
        JOIN users u2 ON vis.interviewer_id = u2.id
        WHERE (vis.interviewer_id = %s OR vis.candidate_id = %s OR j.recruiter_id = %s)
    """
    
    try:
        cur.execute(query_ai, (user_id, user_id, user_id))
        rows = cur.fetchall()
        print(f"\nAI Sessions found: {len(rows)}")
        if rows:
            print(tabulate(rows, headers="keys"))
    except Exception as e:
        print(f"AI Query Failed: {e}")
        conn.rollback()

    # The SQL Recruiter Query (Existing logic)
    query_sql = """
        SELECT i.interview_id, i.scheduled_date, i.scheduled_time,
               j.title as job_title,
        'recruiter_sql' as source
        FROM interview_schedules i
        LEFT JOIN job_postings j ON i.jd_id::text = j.jd_id::text
        WHERE i.status != 'cancelled'
        AND (i.recruiter_id = %s OR i.candidate_id = %s OR j.recruiter_id = %s)
    """
    
    try:
        cur.execute(query_sql, (user_id, user_id, user_id))
        rows = cur.fetchall()
        print(f"\nSQL Sessions found: {len(rows)}")
        if rows:
            print(tabulate(rows, headers="keys"))
    except Exception as e:
        print(f"SQL Query Failed: {e}")

    conn.close()

if __name__ == "__main__":
    test_fetch()
