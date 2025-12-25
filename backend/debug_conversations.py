import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.communication_service import communication_service
from psycopg2.extras import RealDictCursor

def debug_conversations():
    print("--- Debugging Conversations ---")
    conn = communication_service._get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Check Conversations
            cur.execute("SELECT * FROM conversations")
            convs = cur.fetchall()
            print(f"Total Conversations: {len(convs)}")
            for c in convs:
                print(f"ID: {c['id']}, Title: {c['title']}")
            
            # 2. Check Participants
            cur.execute("SELECT * FROM conversation_participants")
            parts = cur.fetchall()
            print(f"Total Participants Entries: {len(parts)}")
            for p in parts:
                print(f"ConfID: {p['conversation_id']}, UserID: {p['user_id']}")

            # 3. Check for User '3' (Recruiter Omar)
            user_id = '3'
            print(f"\nChecking for User ID: {user_id}")
            cur.execute("SELECT conversation_id FROM conversation_participants WHERE user_id = %s", (user_id,)) # Try string
            rows_str = cur.fetchall()
            print(f"Found (as string query): {len(rows_str)}")
            
            try:
                cur.execute("SELECT conversation_id FROM conversation_participants WHERE user_id = %s", (int(user_id),)) # Try int
                rows_int = cur.fetchall()
                print(f"Found (as int query): {len(rows_int)}")
            except Exception as e:
                print(f"Int query failed: {e}")
                conn.rollback()

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    debug_conversations()
