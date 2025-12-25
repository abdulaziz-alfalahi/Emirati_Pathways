
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import json

def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', 5432)
    )

def debug_messages():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. Get a conversation with messages
            print("--- Checking Conversations with Messages ---")
            cur.execute("SELECT DISTINCT conversation_id FROM messages LIMIT 1;")
            row = cur.fetchone()
            if not row:
                print("No messages found in DB at all.")
                return
            
            conv_id = row['conversation_id']
            print(f"Checking Conversation ID: {conv_id}")

            # 2. Get Raw Messages (No Join)
            cur.execute("SELECT id, sender_id, content FROM messages WHERE conversation_id = %s", (conv_id,))
            messages = cur.fetchall()
            print(f"Raw Messages Count: {len(messages)}")
            for m in messages:
                print(f"message_id={m['id']}, sender_id={m['sender_id']} (Type: {type(m['sender_id'])})")

            # 3. Check Users
            sender_id = messages[0]['sender_id']
            print(f"\n--- Checking User {sender_id} ---")
            cur.execute("SELECT id, first_name FROM users WHERE id = %s", (sender_id,)) 
            # Note: Postgres driver usually handles string/int auto-casting for WHERE = %s but let's see.
            user = cur.fetchone()
            if user:
                print(f"User FOUND: {user}")
            else:
                print("User NOT_FOUND in 'users' table!")

            # 4. Try the exact query that is failing
            print("\n--- Testing the Service Query ---")
            cur.execute("""
                SELECT m.*, u.first_name, u.last_name
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = %s
            """, (conv_id,))
            joined_rows = cur.fetchall()
            print(f"Joined Query Result Count: {len(joined_rows)}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    debug_messages()
