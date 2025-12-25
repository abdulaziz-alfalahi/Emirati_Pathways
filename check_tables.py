import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from backend.auth.auth_manager import AuthenticationManager

def check_tables():
    try:
        auth_mgr = AuthenticationManager()
        conn = auth_mgr._get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'admin_%'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print("Existing Tables:")
        for t in tables:
            print(f"- {t[0]}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tables()
