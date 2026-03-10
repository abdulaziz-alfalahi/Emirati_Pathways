import psycopg2

def check_db():
    try:
        conn = psycopg2.connect(
            host='127.0.0.1', 
            port='5432', 
            dbname='emirati_journey', 
            user='emirati_user', 
            password='emirati_secure_password'
        )
        cur = conn.cursor()
        
        # Get all tables
        cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
        tables = [r[0] for r in cur.fetchall()]
        print(f"Found {len(tables)} tables:")
        
        # Get row counts
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"- {table}: {count} rows")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
