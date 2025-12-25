
import psycopg2
import psycopg2.extras
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def debug_ownership():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Zara Saeed (ID 47) and job 29
        current_user_id = 47
        job_id = 29
        
        print(f"Checking ownership for User {current_user_id} and Job {job_id}...")
        
        query = """
                SELECT 1
                FROM job_postings jp
                LEFT JOIN hr_profiles hp ON jp.company_id::text = hp.company_id::text AND hp.user_id = %s
                WHERE jp.id = %s AND (hp.user_id IS NOT NULL OR jp.created_by = %s)
        """
        
        cursor.execute(query, (current_user_id, job_id, current_user_id))
        result = cursor.fetchone()
        
        if result:
            print("✅ Ownership check passed!")
        else:
            print("❌ Ownership check FAILED (returned None)")

    except Exception as e:
        print(f"❌ SQL Execution Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    debug_ownership()
