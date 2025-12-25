
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
load_dotenv(env_path)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': os.getenv('DB_PORT', 5432)
}

def fix_duplicates():
    print("🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 1. Identify IDs
        print("🔍 Identifying Role IDs...")
        cursor.execute("SELECT id FROM admin_roles WHERE name = 'hr_recruiter'")
        old_role = cursor.fetchone()
        
        cursor.execute("SELECT id FROM admin_roles WHERE name = 'recruiter'")
        new_role = cursor.fetchone()
        
        if not old_role:
            print("⚠️ Old role 'hr_recruiter' not found. Nothing to migrate.")
        elif not new_role:
            print("⚠️ New role 'recruiter' not found. Cannot migrate.")
        else:
            old_id = old_role[0]
            new_id = new_role[0]
            print(f"🔄 Migrating users from Role ID {old_id} (hr_recruiter) to {new_id} (recruiter)...")
            
            # 2. Migrate Users
            # Find assignments to old role
            cursor.execute("SELECT user_id FROM admin_user_roles WHERE role_id = %s", (old_id,))
            assignments = cursor.fetchall()
            
            for (user_id,) in assignments:
                # Check if user already has new role
                cursor.execute("SELECT 1 FROM admin_user_roles WHERE user_id = %s AND role_id = %s", (user_id, new_id))
                exists = cursor.fetchone()
                
                if exists:
                    # User has both, just delete the old one
                    print(f"   - User {user_id}: Has new role. Deleting old assignment.")
                    cursor.execute("DELETE FROM admin_user_roles WHERE user_id = %s AND role_id = %s", (user_id, old_id))
                else:
                    # Upgrade old assignment to new role
                    print(f"   - User {user_id}: Migrating to new role.")
                    cursor.execute("UPDATE admin_user_roles SET role_id = %s WHERE user_id = %s AND role_id = %s", (new_id, user_id, old_id))
            
            # 3. Delete Old Role
            print(f"🗑️ Deleting old role ID {old_id}...")
            cursor.execute("DELETE FROM admin_roles WHERE id = %s", (old_id,))
            print("✅ Old role deleted.")

        # 4. Harden other roles
        print("🛡️  Hardening System Roles (job_seeker, mentor, educator, assessor)...")
        roles_to_harden = ['job_seeker', 'mentor', 'educator', 'assessor']
        cursor.execute("UPDATE admin_roles SET is_system_role = TRUE WHERE name = ANY(%s)", (roles_to_harden,))
        print(f"✅ Updated {cursor.rowcount} roles to system roles.")

        conn.commit()
        print("🎉 Fix validation complete.")

    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    fix_duplicates()
