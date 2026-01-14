
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection details
DB_NAME = os.getenv("DB_NAME", "emirati_pathways_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cursor = conn.cursor()

    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users';
    """)
    columns = cursor.fetchall()

    print("Columns in 'users' table:")
    for col in columns:
        print(f"- {col[0]} ({col[1]})")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
