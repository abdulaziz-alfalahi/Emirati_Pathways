import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from backend.auth.auth_manager import AuthenticationManager

def setup_admin_db():
    try:
        auth_mgr = AuthenticationManager()
        conn = auth_mgr._get_db_connection()
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Connected to database using AuthenticationManager.")

        # Read SQL file
        sql_path = os.path.join(os.path.dirname(__file__), 'backend', 'create_administrator_cms_schema.sql')
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        print("Executing schema creation...")
        # Split statements (naive split, works for this file structure)
        statements = sql_content.split(';')
        
        for statement in statements:
            if not statement.strip():
                continue
            try:
                cursor.execute(statement)
            except Exception as e:
                # Ignore "must be owner" errors for functions/extensions
                err_str = str(e)
                if "must be owner" in err_str or "already exists" in err_str:
                    print(f"Skipping statement due to permission/existence (safe): {err_str.splitlines()[0]}")
                else:
                    print(f"Error executing statement: {err_str}")

        print("Schema creation attempt finished.")
        
        # Grant Super Admin Role to 'admin@emiratijourney.ae'
        email = 'admin@emiratijourney.ae'
        print(f"Assigning super_admin role to {email}...")
        
        # Get User ID
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        row = cursor.fetchone()
        if not row:
            print(f"User {email} not found! Please run create_admin_user.py first.")
            return
        
        user_id = row[0]
        
        # Get Role ID for super_admin
        cursor.execute("SELECT id FROM admin_roles WHERE name = 'super_admin'")
        role_row = cursor.fetchone()
        if not role_row:
            print("Role 'super_admin' not found! Schema creation might have failed.")
            print("Role 'super_admin' not found! Schema creation might have failed.")
            return
            
        role_id = role_row[0]
        
        # Ensure additional roles exist
        additional_roles = [
            ('hr_recruiter', 'HR Recruiter', 'Recruitment and candidate management'),
            ('job_seeker', 'Job Seeker', 'Standard user role for candidates'),
            ('mentor', 'Mentor', 'Mentorship program participant'),
            ('educator', 'Educator', 'Educational content provider'),
            ('assessor', 'Assessor', 'Assessment and verification role')
        ]
        
        for r_name, r_disp, r_desc in additional_roles:
            try:
                cursor.execute("""
                    INSERT INTO admin_roles (name, display_name, description, permissions, created_at)
                    VALUES (%s, %s, %s, '[]'::jsonb, NOW())
                    ON CONFLICT (name) DO NOTHING
                """, (r_name, r_disp, r_desc))
            except Exception as e:
                print(f"Error creating role {r_name}: {e}")
                
        # Assign Role
        try:
            cursor.execute("""
                INSERT INTO admin_user_roles (user_id, role_id)
                VALUES (%s, %s)
                ON CONFLICT (user_id, role_id) DO NOTHING
            """, (user_id, role_id))
            print("Role assigned successfully.")
        except Exception as e:
            print(f"Error assigning role: {e}")
            
        cursor.close()
        conn.close()
        print("Done.")

    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    setup_admin_db()
