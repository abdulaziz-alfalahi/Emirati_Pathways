
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

def debug_endpoint_logic():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Zara Saeed ID 47
        current_user_id = 47
        print(f"Testing logic for User {current_user_id}...")

        # Get company ID first
        cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (current_user_id,))
        hr_profile = cursor.fetchone()
        print(f"HR Profile: {hr_profile}")
        
        query = """
            SELECT 
                js.candidate_id,
                js.job_posting_id,
                js.notes,
                js.created_at,
                u.first_name,
                u.last_name,
                u.email,
                u.job_title as current_title,
                jp.title as job_title,
                js.added_by
            FROM job_shortlists js
            JOIN job_postings jp ON js.job_posting_id = jp.id
            JOIN users u ON js.candidate_id = u.id
            WHERE 1=1
        """
        params = []

        if hr_profile and hr_profile['company_id']:
            print(f"Filtering by Company ID: {hr_profile['company_id']}")
            query += " AND jp.company_id::text = %s"
            params.append(str(hr_profile['company_id']))
        else:
            print("Filtering by Created By (No Company)")
            query += " AND jp.created_by = %s"
            params.append(current_user_id)
        
        query += " ORDER BY js.created_at DESC LIMIT 50"
        
        print("Executing query...")
        cursor.execute(query, tuple(params))
        rows = [dict(r) for r in cursor.fetchall()]
        print(f"Result count: {len(rows)}")
        for r in rows:
            print(r)

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    debug_endpoint_logic()
