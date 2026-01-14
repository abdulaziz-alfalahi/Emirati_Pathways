import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

def dump_users():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'emirati_user'),
            password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
        )
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        with open('backend/all_users_dump.txt', 'w', encoding='utf-8') as f:
            f.write(f"{'ID':<5} | {'Role':<20} | {'Phone':<20} | {'Email':<40}\n")
            f.write("-" * 90 + "\n")
            
            cur.execute("SELECT id, role, phone, email FROM users ORDER BY id")
            users = cur.fetchall()
            
            for user in users:
                user_id = str(user.get('id') or 'None')
                role = str(user.get('role') or 'None')
                phone = str(user.get('phone') or 'None')
                email = str(user.get('email') or 'None')
                f.write(f"{user_id:<5} | {role:<20} | {phone:<20} | {email:<40}\n")
                
        print("Dump complete.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_users()
