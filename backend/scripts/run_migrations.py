#!/usr/bin/env python3
"""
Lightweight SQL migration runner for the backend.
Applies all .sql files in backend/migrations in name order.
"""
import os
import sys
import glob
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
}

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'migrations')


def apply_sql(cursor, sql_path: str):
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql = f.read()
    cursor.execute(sql)


def main():
    print(f"Applying migrations from: {MIGRATIONS_DIR}")
    files = sorted(glob.glob(os.path.join(MIGRATIONS_DIR, '*.sql')))
    if not files:
        print("No migration files found.")
        return 0

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            for path in files:
                name = os.path.basename(path)
                print(f" -> Applying {name} ...", end=' ')
                apply_sql(cur, path)
                conn.commit()
                print("done")
    except Exception as e:
        conn.rollback()
        print(f"\nMigration failed: {e}")
        return 1
    finally:
        conn.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
