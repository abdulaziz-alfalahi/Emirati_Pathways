import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    cur = conn.cursor()
    
    # Update the job with ID 8 to have the correct company_id and recruiter_id
    sql = """
        UPDATE job_postings 
        SET company_id = '7e5edea0-ea73-436c-b7ed-f47cfe57423a', 
            recruiter_id = '1' 
        WHERE id = 8
    """
    cur.execute(sql)
    conn.commit()
    print(f"Updated {cur.rowcount} rows.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
