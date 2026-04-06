import psycopg2, psycopg2.extras
conn = psycopg2.connect(dbname='emirati_journey', user='emirati_user', password='emirati_secure_password', host='127.0.0.1')
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# Check user_cvs table
try:
    cur.execute("SELECT COUNT(*) as cnt FROM user_cvs WHERE user_id = '21' AND status = 'active'")
    r = cur.fetchone()
    print(f"Active CVs for user 21: {r['cnt']}")
    
    cur.execute("SELECT id, filename, status, upload_timestamp FROM user_cvs WHERE user_id = '21' ORDER BY upload_timestamp DESC")
    for row in cur.fetchall():
        print(f"  id={row['id']}, file={row['filename']}, status={row['status']}, uploaded={row['upload_timestamp']}")
except Exception as e:
    print(f"Error: {e}")

conn.close()
