from dotenv import load_dotenv
load_dotenv('backend/.env')
from backend.db import get_db_connection
with open('backend/migrations/create_feature_flags.sql', 'r') as f:
    sql = f.read()
conn = get_db_connection()
with conn.cursor() as cur:
    cur.execute(sql)
conn.commit()
conn.close()
print("Flags updated")
