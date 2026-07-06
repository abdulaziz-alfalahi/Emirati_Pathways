import os
import psycopg2

def create_dev_user():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    # 784000000000250
    user_id = '784000000000250'
    try:
        cur.execute("""
            INSERT INTO users (id, first_name, last_name, full_name, email, phone, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role
        """, (
            user_id,
            'Test Career',
            'Services',
            'Test Career Services',
            'career_services@test.ehrdc.ae',
            '+971510000250',
            'career_services_operator',
            True
        ))
        conn.commit()
        print("✅ User inserted/updated")
    except Exception as e:
        conn.rollback()
        print(f"❌ User error: {e}")

    try:
        cur.execute("""
            INSERT INTO candidate_profiles (user_id)
            VALUES (%s)
        """, (user_id,))
        conn.commit()
        print("✅ Candidate profile inserted")
    except Exception as e:
        conn.rollback()
        print(f"⚠️ Candidate profile error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    create_dev_user()
