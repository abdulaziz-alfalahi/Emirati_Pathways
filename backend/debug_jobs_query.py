
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
import json
from datetime import date, datetime

script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, '.env'))

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

class UAEComplianceChecker: # Mock class if needed or ignore
    pass

def test_full_logic():
    print("Starting full logic test...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Mock inputs
        current_user_id = "mock_user" # We need a real user ID or just skip the ACL check part of query
        company_id = "7e5edea0-ea73-436c-b7ed-f47cfe57423a"
        status = 'all'
        limit = 5
        offset = 0
        search = ''
        
        # Build query (simplified for debug)
        where_conditions = ["(jp.company_id = %s)"] # Simplifying the user/company check
        params = [company_id]
        
        where_clause = " AND ".join(where_conditions)
        
        print("Executing Main Query...")
        cursor.execute(f"""
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
        """, params + [limit, offset])
        
        job_postings = cursor.fetchall()
        print(f"Main query returned {len(job_postings)} rows.")

        print("Executing Count Query...")
        # Get total count
        cursor.execute(f"""
            SELECT COUNT(DISTINCT jp.id)
            FROM job_postings jp
            WHERE {where_clause}
        """, params)
        
        total_count = cursor.fetchone()['count']
        print(f"Total count: {total_count}")
        
        # Process Data
        jobs_data = []
        for job in job_postings:
            job_data = dict(job)
            
            # Parse JSONB fields
            jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
            for field in jsonb_fields:
                if job_data.get(field):
                    try:
                        if isinstance(job_data[field], str):
                            job_data[field] = json.loads(job_data[field])
                    except (json.JSONDecodeError, TypeError):
                        job_data[field] = {}
            
            jobs_data.append(job_data)
        
        # Inspect types
        print("Inspecting types in first row:")
        if len(jobs_data) > 0:
            for k, v in jobs_data[0].items():
                print(f"  {k}: {type(v)}")

        # THE FIX: Convert datetime/date, Decimal, UUID objects to strings
        print("Applying comprehensive fix...")
        from decimal import Decimal
        from uuid import UUID
        
        for job in jobs_data:
            for key, value in job.items():
                if isinstance(value, (datetime, date, Decimal, UUID)):
                    job[key] = str(value)
                    if isinstance(value, (datetime, date)):
                        job[key] = value.isoformat()
        
        # Final Serialization Test
        response_data = {
            'success': True,
            'data': {
                'job_postings': jobs_data,
                'total_count': total_count,
                'current_page': 1,
                'total_pages': 1
            }
        }
        
        print("Attempting final JSON dump...")
        json_str = json.dumps(response_data)
        print("✅ JSON dump SUCCESS!")
        print(f"Sample data: {json_str[:100]}...")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_full_logic()
