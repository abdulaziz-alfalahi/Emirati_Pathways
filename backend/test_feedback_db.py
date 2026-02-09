import psycopg2
import json
import uuid
import time
from datetime import datetime

DATABASE_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def test_feedback_persistence():
    print("Testing Feedback Persistence...")
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cur = conn.cursor()
        
        # 1. Check if table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'feedback'
            );
        """)
        exists = cur.fetchone()[0]
        if not exists:
            print("❌ FAILURE: Feedback table does not exist.")
            return
        print("✅ Feedback table exists.")
        
        # 2. Check for seed data
        cur.execute("SELECT COUNT(*) FROM feedback")
        count = cur.fetchone()[0]
        print(f"✅ Found {count} items in feedback table.")
        
        if count < 8:
            print("⚠️ WARNING: Seed data might be missing (expected at least 8).")
        else:
            print("✅ Seed data appears present.")
            
        # 3. Test Insert
        test_id = f"test_{int(time.time())}"
        print(f"Testing insert with ID: {test_id}...")
        
        cur.execute(
            """
            INSERT INTO feedback (id, user_id, role, type, status, message, metadata, console_logs, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, CURRENT_TIMESTAMP)
            """,
            (
                test_id, 'test_user', 'tester', 'test', 'open', 'This is a persistence test', 
                json.dumps({'test': True}), '[]'
            )
        )
        conn.commit()
        print("✅ Insert successful.")
        
        # 4. Read back
        cur.execute("SELECT message FROM feedback WHERE id = %s", (test_id,))
        row = cur.fetchone()
        if row and row[0] == 'This is a persistence test':
            print("✅ Read back successful.")
        else:
            print("❌ FAILURE: Could not read back test item.")
            
        # 5. Clean up
        cur.execute("DELETE FROM feedback WHERE id = %s", (test_id,))
        conn.commit()
        print("✅ Cleanup successful.")
        
        conn.close()
        print("\n🎉 PERSISTENCE VERIFIED!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

if __name__ == "__main__":
    test_feedback_persistence()
