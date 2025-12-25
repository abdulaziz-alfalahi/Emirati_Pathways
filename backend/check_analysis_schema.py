
import psycopg2
import os

def check_schema():
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=5432
    )
    cur = conn.cursor()
    try:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'interview_sessions'")
        cols = [r[0] for r in cur.fetchall()]
        print(f"Columns in interview_sessions: {cols}")
        
        if 'ai_analysis' not in cols:
            print("🚨 ai_analysis column MISSING. Adding it...")
            cur.execute("ALTER TABLE interview_sessions ADD COLUMN ai_analysis JSONB")
            conn.commit()
            print("✅ Column added.")
        else:
            print("✅ ai_analysis column exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_schema()
