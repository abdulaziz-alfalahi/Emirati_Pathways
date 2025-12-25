
import psycopg2
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def check_cv_counts():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        uuids = [
            '00000000-0000-0000-0000-000000000001', # Correct Mock UUID (from save_cv)
            '550e8400-e29b-41d4-a716-446655440000', # Legacy CV List UUID
            '1' # Raw string (unlikely to work in UUID column but checking)
        ]
        
        print("Checking CV counts:")
        for uid in uuids:
            try:
                cur.execute("SELECT COUNT(*) FROM user_cvs WHERE user_id = %s", (uid,))
                count = cur.fetchone()[0]
                print(f"UUID {uid}: {count} CVs")
            except Exception as e:
                print(f"UUID {uid}: Error ({e})")
                conn.rollback()

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    check_cv_counts()
