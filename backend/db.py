"""Centralized database connection for the Emirati Pathways platform."""
import os
import psycopg2
import psycopg2.extras

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432)),
}

# Schema separation: set DB_SCHEMA=dev or DB_SCHEMA=qa to isolate environments
DB_SCHEMA = os.getenv('DB_SCHEMA', 'public')

def get_db_connection():
    """Return a new psycopg2 connection to the platform database."""
    conn = psycopg2.connect(**DB_CONFIG)
    if DB_SCHEMA and DB_SCHEMA != 'public':
        with conn.cursor() as cur:
            cur.execute(f"SET search_path TO {DB_SCHEMA}, public")
        conn.commit()
    return conn

