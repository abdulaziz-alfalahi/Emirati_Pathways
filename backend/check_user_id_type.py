
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME', 'emirati_journey'),
    user=os.getenv('DB_USER', 'emirati_user'),
    password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=int(os.getenv('DB_PORT', 5432))
)

cur = conn.cursor()
cur.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'")
type_info = cur.fetchone()
print(f"Users ID type: {type_info[0]}")
cur.close()
conn.close()
