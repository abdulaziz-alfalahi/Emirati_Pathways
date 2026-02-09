import psycopg2
from psycopg2.extras import RealDictCursor
import os

DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

print("Cleaning Ghost Applications (Non-Numeric Job IDs)")
print("=" * 70)

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # 1. Identify Ghost Applications
    print("\n1. Finding applications with non-numeric job_id...")
    cur.execute("SELECT id, job_id, candidate_id FROM job_applications WHERE job_id::text !~ '^[0-9]+$'")
    ghosts = cur.fetchall()

    if ghosts:
        print(f"   ⚠️ Found {len(ghosts)} ghost applications:")
        print(f"   {'App ID':<20} | {'Job ID':<20} | {'Candidate ID':<20}")
        print("   " + "-"*66)
        ids_to_delete = []
        for ghost in ghosts:
            print(f"   {ghost['id']:<20} | {ghost['job_id']:<20} | {ghost['candidate_id']:<20}")
            ids_to_delete.append(ghost['id'])
        
        # 2. Delete them
        if ids_to_delete:
            print(f"\n2. Deleting {len(ids_to_delete)} ghost applications...")
            cur.execute("DELETE FROM job_applications WHERE id = ANY(%s)", (ids_to_delete,))
            conn.commit()
            print(f"   ✅ Successfully deleted {cur.rowcount} rows.")
    else:
        print("   ✅ No ghost applications found. Database is clean.")

    # 3. Verify Clean State for CFO Job (ID 756)
    print("\n3. Verifying state for CFO Job (ID 756)...")
    cur.execute("SELECT count(*) as count FROM job_applications WHERE job_id::text = '756'")
    count = cur.fetchone()['count']
    print(f"   Current valid applications for CFO Job (756): {count}")

except Exception as e:
    print(f"\n❌ Error: {e}")
finally:
    if 'conn' in locals() and conn:
        conn.close()
