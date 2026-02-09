"""
Quick fix: Delete the Fashion Designer job from database
"""
import psycopg2

conn = psycopg2.connect(
    dbname='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password',
    host='localhost',
    port='5432'
)

cur = conn.cursor()

# Delete Fashion Designer job
cur.execute("""
    DELETE FROM job_postings 
    WHERE title = 'Fashion Designer'
    RETURNING id, title
""")

deleted = cur.fetchone()
if deleted:
    print(f"✅ Deleted job: ID {deleted[0]} - {deleted[1]}")
    conn.commit()
else:
    print("❌ Fashion Designer job not found")

conn.close()
