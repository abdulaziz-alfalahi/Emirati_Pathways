
import psycopg2
import os
from dotenv import load_dotenv

# Use absolute path for .env loading (Robust Method)
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
print(f"Loading .env from: {env_path}")
load_dotenv(env_path)

def migrate():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Checking if 'is_visible' column exists in 'user_cvs'...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='user_cvs' AND column_name='is_visible';
        """)
        
        if not cur.fetchone():
            print("Column 'is_visible' NOT found. Adding it...")
            cur.execute("ALTER TABLE user_cvs ADD COLUMN is_visible BOOLEAN DEFAULT FALSE;")
            print("Column 'is_visible' added successfully!")
        else:
            print("Column 'is_visible' already exists.")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Migration Error: {e}")

if __name__ == "__main__":
    migrate()
