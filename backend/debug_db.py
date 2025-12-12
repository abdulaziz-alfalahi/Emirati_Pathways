
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def check_db():
    print(f"DB_NAME: {os.getenv('DB_NAME')}")
    print(f"DB_USER: {os.getenv('DB_USER')}")
    print(f"DB_PASS: {'*' * len(os.getenv('DB_PASS') or '') if os.getenv('DB_PASS') else 'None'}")
    print(f"DB_HOST: {os.getenv('DB_HOST')}")
    print(f"DB_PORT: {os.getenv('DB_PORT')}")

    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )
        print("Database connected successfully.")
        
        cur = conn.cursor()
        
        # Check columns in user_cvs
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_cvs';
        """)
        columns = cur.fetchall()
        print("\nColumns in user_cvs:")
        for col in columns:
            print(f"- {col[0]} ({col[1]})")
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
