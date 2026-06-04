from dotenv import load_dotenv
load_dotenv()
from db import get_db_connection

with open('create_board_directives.sql', 'r') as f:
    sql = f.read()

conn = get_db_connection()
cur = conn.cursor()
try:
    cur.execute(sql)
    conn.commit()
    print("Migration successful.")
except Exception as e:
    conn.rollback()
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
