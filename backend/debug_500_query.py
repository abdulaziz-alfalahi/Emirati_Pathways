
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

def debug_query():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Hardcoded for Zara Saeed (ID 47) and her company
        current_user_id = 47
        cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (current_user_id,))
        hr_profile = cursor.fetchone()
        company_id = hr_profile['company_id'] if hr_profile else None
        
        print(f"User: {current_user_id}, Company: {company_id}")
        
        where_conditions = []
        params = []
        
        where_conditions.append("(jp.company_id = %s OR jp.created_by = %s)")
        params.extend([company_id, current_user_id])
        
        where_clause = " AND ".join(where_conditions)
        
        query = f"""
            SELECT 
                jp.*,
                c.name as company_name,
                u.first_name || ' ' || u.last_name as created_by_name,
                COUNT(ja.id) as application_count,
                COUNT(CASE WHEN ja.application_status = 'submitted' THEN 1 END) as new_applications
            FROM job_postings jp
            LEFT JOIN companies c ON jp.company_id::text = c.id::text
            LEFT JOIN users u ON jp.created_by = u.id
            LEFT JOIN job_applications ja ON jp.id::text = ja.job_id::text
            WHERE {where_clause}
            GROUP BY jp.id, c.name, u.first_name, u.last_name
            ORDER BY jp.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        final_params = params + [20, 0]
        
        print("Executing Query...")
        cursor.execute(query, final_params)
        results = cursor.fetchall()
        print(f"✅ Success! Retrieved {len(results)} rows.")
        for r in results:
            print(f" - Job: {r['title']} (Company: {r['company_name']})")

    except Exception as e:
        print(f"❌ SQL Execution Error: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    debug_query()
