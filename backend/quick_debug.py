
import psycopg2, os
try:
    conn=psycopg2.connect(host='localhost',database='emirati_journey',user='emirati_user',password='emirati_secure_password')
    cur=conn.cursor()
    
    print("--- Searching in JD ---")
    cur.execute("SELECT id, user_id, title FROM job_descriptions WHERE title ILIKE '%Chief%'")
    rows = cur.fetchall()
    for r in rows: print(f"JD: {r}")

    print("--- Searching in JP ---")
    cur.execute("SELECT id, recruiter_id, title FROM job_postings WHERE title ILIKE '%Chief%'")
    rows = cur.fetchall()
    for r in rows: print(f"JP: {r}")
    
except Exception as e:
    print(e)
