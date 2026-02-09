import os
import psycopg2
import psycopg2.extras

def reset_user(phone):
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'emirati_journey'),
            user=os.getenv('DB_USER', 'emirati_user'),
            password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
        )
        cursor = conn.cursor()
        
        print(f"Assigning to delete user with phone: {phone}")
        
        # Check if user exists first
        cursor.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        user = cursor.fetchone()
        
        if user:
            user_id = user[0]
            print(f"Found User ID: {user_id}. Deleting...")
            
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            
            if cursor.rowcount > 0:
                print("User successfully deleted.")
            else:
                print("Delete operation affected 0 rows (unexpected).")
        else:
            print("User not found via phone lookup.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_user("+971528983000")
