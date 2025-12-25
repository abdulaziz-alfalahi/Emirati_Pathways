from dotenv import load_dotenv
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Load env from backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME', 'emirati_pathways_db'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password'),
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', 5432)
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def create_operator_user():
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user exists
        email = 'ops@emiratijourney.ae'
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing = cur.fetchone()
        
        if existing:
            print(f"User {email} already exists. ID: {existing['id']}")
            # Ensure role is admin
            cur.execute("UPDATE users SET role = 'admin' WHERE id = %s", (existing['id'],))
            print("Role updated to 'admin'")
        else:
            # Create user
            # Using plain password 'TestPassword123!' as implied by MockAuthService default
            # In a real app, hash this!
            cur.execute("""
                INSERT INTO users (email, password_hash, role, full_name, created_at)
                VALUES (%s, %s, 'admin', 'Growth Operator', NOW())
                RETURNING id
            """, (email, 'TestPassword123!'))
            new_id = cur.fetchone()['id']
            print(f"Created new operator user. ID: {new_id}")

        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error creating user: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_operator_user()
