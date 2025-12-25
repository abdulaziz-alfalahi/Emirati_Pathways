import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from backend.auth.auth_manager import AuthenticationManager

def find_inactive_users():
    try:
        auth_mgr = AuthenticationManager()
        query = "SELECT id, email, full_name, is_active FROM users WHERE is_active = FALSE"
        conn = auth_mgr._get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        
        if rows:
            print(f"Found {len(rows)} inactive users:")
            for r in rows:
                print(f"ID: {r[0]}, Email: {r[1]}, Name: {r[2]}, Active: {r[3]}")
        else:
            print("No inactive users found. They might have been hard-deleted.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    find_inactive_users()
