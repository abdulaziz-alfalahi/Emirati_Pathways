"""Drop all 72 _deprecated_* tables from the database."""
import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1', port='5432',
    dbname='emirati_journey', user='emirati_user',
    password='emirati_secure_password'
)
cur = conn.cursor()

# Get all deprecated tables
cur.execute("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%deprecated%' ORDER BY tablename")
tables = [r[0] for r in cur.fetchall()]
print(f"Found {len(tables)} deprecated tables to drop")

# Drop each one
dropped = 0
for table in tables:
    try:
        cur.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
        dropped += 1
    except Exception as e:
        print(f"  ERROR dropping {table}: {e}")
        conn.rollback()

conn.commit()
print(f"Dropped {dropped}/{len(tables)} deprecated tables")

# Verify
cur.execute("SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%deprecated%'")
remaining = cur.fetchone()[0]
print(f"Remaining deprecated tables: {remaining}")

cur.close()
conn.close()
print("Done!")
