
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

from backend.db import get_db_connection

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
