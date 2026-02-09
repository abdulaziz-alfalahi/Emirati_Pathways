import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': os.getenv('DB_PORT', '5432')
}

TARGET_COMPANY_ID = 'fd096b45-45ba-4aea-a3a4-9adcad8a2679'

USERS_TO_REMOVE = [
    'sarasaeed@company.ae',
    'ahmed.candidate@example.com',
    'zara.saeed@demo.com',
    'omar.alrashidi@recruitment.ae'
]

def cleanup_team():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print(f"--- Cleaning up Company {TARGET_COMPANY_ID} ---")
        
        # 1. Get User IDs for the emails
        cur.execute("SELECT id, email FROM users WHERE email = ANY(%s)", (USERS_TO_REMOVE,))
        found_users = cur.fetchall()
        
        if not found_users:
            print("No target users found in database.")
            return

        user_ids = [u[0] for u in found_users]
        print(f"Found User IDs to remove: {user_ids}")

        # Diagnostic: List ALL members of this company
        cur.execute("SELECT user_id FROM company_team_members WHERE company_id = %s", (TARGET_COMPANY_ID,))
        all_members = [r[0] for r in cur.fetchall()]
        print(f"DEBUG: All User IDs in Company {TARGET_COMPANY_ID}: {all_members}")

        # Filter the ones we want to remove
        ids_to_remove = [uid for uid in user_ids if uid in all_members]
        print(f"DEBUG: IDs confirmed for removal: {ids_to_remove}")

        if ids_to_remove:
            # use tuple for IN clause
            cur.execute("""
                DELETE FROM company_team_members 
                WHERE company_id = %s AND user_id IN %s
            """, (TARGET_COMPANY_ID, tuple(ids_to_remove)))
            
            deleted_count = cur.rowcount
            print(f"Deleted {deleted_count} rows from company_team_members.")
        else:
            print("DEBUG: No overlap found between target users and company members.")
        
        conn.commit()
        print("✅ Cleanup successful.")
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    cleanup_team()
