"""Quick script to seed the skill taxonomy into the database."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv('.env')

import psycopg2

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

conn = psycopg2.connect(**DB_CONFIG)
from skill_graph_engine import SkillGraphEngine
engine = SkillGraphEngine(db_connection=conn)
count = engine.seed_taxonomy()
print(f"✅ Seeded {count} skills into taxonomy")
conn.close()
