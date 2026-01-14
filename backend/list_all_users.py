import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

def list_users():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'emirati_user'),
            password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        print("\nList of all Users:")
        print("-" * 100)
        print(f"{'ID':<5} | {'Name':<20} | {'Email':<30} | {'Phone':<15} | {'Role':<15} | {'User Type':<15}")
        print("-" * 100)
        
        cur.execute("""
            SELECT id, first_name, last_name, email, phone, role, user_type 
            FROM users 
            WHERE 
                role ILIKE '%admin%' OR 
                role ILIKE '%manager%' OR 
                role ILIKE '%operator%' OR
                role ILIKE '%human%' OR
                email ILIKE '%admin%' OR
                email ILIKE '%manager%' OR
                email ILIKE '%operator%'
            ORDER BY id
        """)
        users = cur.fetchall()
        
        for user in users:
            user_id = str(user.get('id', ''))
            full_name = f"{user.get('first_name') or ''} {user.get('last_name') or ''}".strip()
            email = str(user.get('email') or '')
            phone = str(user.get('phone') or '')
            role = str(user.get('role') or '')
            user_type = str(user.get('user_type') or '')
            
            print(f"{user_id:<5} | {full_name[:20]:<20} | {email[:30]:<30} | {phone:<15} | {role:<15} | {user_type:<15}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_users()
