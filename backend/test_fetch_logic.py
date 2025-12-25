import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.communication_service import communication_service
from psycopg2.extras import RealDictCursor

def test_fetch_logic():
    print("--- Testing Fetch Logic ---")
    user_id = '3'
    print(f"Target User ID: {user_id}")
    
    conn = communication_service._get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Reproduce query exactly
            query = "SELECT conversation_id FROM conversation_participants WHERE user_id = %s"
            print(f"Executing Query: {query} with param {(user_id,)}")
            cur.execute(query, (user_id,))
            rows = cur.fetchall()
            print(f"Raw Rows: {rows}")
            
            conv_ids = [r['conversation_id'] for r in rows]
            print(f"Found IDs: {conv_ids}")
            
            conversations = []
            for cid in conv_ids:
                print(f"Fetching Details for: {cid}")
                conv = communication_service._get_conversation_by_id(cur, cid)
                if conv:
                    print(f"  - Found: {conv.title}")
                    conversations.append(conv)
                else:
                    print(f"  - Not Found via ID")
            
            print(f"Final Count: {len(conversations)}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_fetch_logic()
