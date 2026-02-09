import psycopg2
import os

# Database configuration
DB_CONFIG = {
    'dbname': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', 5432)
}

OUTPUT_FILE = 'DATABASE_SCHEMA.md'

def get_tables(cursor):
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    return [row[0] for row in cursor.fetchall()]

def get_columns(cursor, table_name):
    cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = %s AND table_schema = 'public'
        ORDER BY ordinal_position;
    """, (table_name,))
    return cursor.fetchall()

def get_foreign_keys(cursor, table_name):
    cursor.execute("""
        SELECT
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = %s;
    """, (table_name,))
    return cursor.fetchall()

def generate_schema_report():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        tables = get_tables(cur)
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write("# Database Schema Documentation\n\n")
            f.write(f"**Total Tables:** {len(tables)}\n\n")
            
            f.write("## Table of Contents\n")
            for table in tables:
                f.write(f"- [{table}](#{table})\n")
            f.write("\n---\n")
            
            for table in tables:
                f.write(f"## {table}\n\n")
                
                # Columns
                columns = get_columns(cur, table)
                if columns:
                    f.write("| Column | Type | Nullable | Default |\n")
                    f.write("| :--- | :--- | :--- | :--- |\n")
                    for col in columns:
                        name, dtype, nullable, default = col
                        default_val = str(default) if default else "-"
                        f.write(f"| **{name}** | `{dtype}` | {nullable} | {default_val} |\n")
                    f.write("\n")
                
                # Foreign Keys
                fks = get_foreign_keys(cur, table)
                if fks:
                    f.write("**Foreign Keys:**\n\n")
                    for fk in fks:
                        col, ref_table, ref_col = fk
                        f.write(f"- `{col}` → `{ref_table}.{ref_col}`\n")
                    f.write("\n")
                
                f.write("---\n")
        
        conn.close()
        print(f"✅ Schema documentation generated at {os.path.abspath(OUTPUT_FILE)}")
        
    except Exception as e:
        print(f"Error generating schema: {e}")

if __name__ == "__main__":
    generate_schema_report()
