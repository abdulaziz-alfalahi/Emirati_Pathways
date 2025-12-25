import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from backend.auth.auth_manager import AuthenticationManager

def fix_schema():
    try:
        auth_mgr = AuthenticationManager()
        # Use superuser if possible? No, we use standard user. 
        # Hopefully standard user can ALTER table if they own it (setup script created it).
        conn = auth_mgr._get_db_connection()
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Checking/Adding missing user columns...")
        
        # Add last_login
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP")
            print("Added last_login column.")
        except Exception as e:
            print(f"last_login might exist or error: {e}")

        # Add username
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN username VARCHAR(255) UNIQUE")
            # Populate username with email prefix? Or full email?
            # Let's populate with email to be safe
            cursor.execute("UPDATE users SET username = email WHERE username IS NULL")
            print("Added username column and populated from email.")
        except Exception as e:
            print(f"username might exist or error: {e}")

        print("Schema fix complete.")
        
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    fix_schema()
