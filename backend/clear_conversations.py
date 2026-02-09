
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_pathways_db'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'postgres'),
            port=os.getenv('DB_PORT', '5432')
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def clear_conversations():
    conn = get_db_connection()
    if not conn:
        return

    try:
        cur = conn.cursor()
        print("Clearing all conversations and messages...")
        
        # Cascade delete will handle messages and participants if FKs are set up correctly.
        # But to be safe and explicit:
        cur.execute("TRUNCATE TABLE conversations CASCADE;")
        
        conn.commit()
        print("Successfully cleared all conversations.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error clearing conversations: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    clear_conversations()
