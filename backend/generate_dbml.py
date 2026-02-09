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

OUTPUT_FILE = 'schema.dbml'

def get_tables(cursor):
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    return [row[0] for row in cursor.fetchall()]

def get_columns(cursor, table_name):
    # Retrieve column info matching DBML needs
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

def map_postgres_to_dbml_type(pg_type):
    # Normalize
    pg_type = pg_type.lower()
    
    # Map to simple DBML types (single word preferred)
    if 'character' in pg_type or 'text' in pg_type or 'char' in pg_type: return 'varchar'
    if 'int' in pg_type or 'serial' in pg_type: return 'int'
    if 'timestamp' in pg_type: return 'timestamp'
    if 'date' in pg_type: return 'date'
    if 'time' in pg_type: return 'time' # Matches time without time zone
    if 'bool' in pg_type: return 'boolean'
    if 'json' in pg_type: return 'json'
    if 'uuid' in pg_type: return 'uuid'
    if 'double' in pg_type or 'float' in pg_type or 'real' in pg_type: return 'double'
    if 'numeric' in pg_type or 'decimal' in pg_type: return 'decimal'
    if 'array' in pg_type: return 'array'
    
    # Fallback: if it contains spaces, wrap in quotes, otherwise return as is
    if ' ' in pg_type:
        return f'"{pg_type}"'
    return pg_type

def generate_dbml():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        tables = get_tables(cur)
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write("// Database Schema for Emirati Journey\n")
            f.write("// Generated automatically\n\n")
            
            # Write Tables
            for table in tables:
                f.write(f"Table {table} {{\n")
                columns = get_columns(cur, table)
                
                for col in columns:
                    name, dtype, nullable, default = col
                    dbml_type = map_postgres_to_dbml_type(dtype)
                    
                    line = f"  {name} {dbml_type}"
                    
                    settings = []
                    if name == 'id':
                        settings.append("pk") # Primary Key assumption
                    
                    # Note: DBML doesn't strictly need 'not null' for vis, but we can add it
                    if nullable == 'NO':
                        settings.append("not null")
                        
                    if default:
                        # Clean up default value string a bit
                        clean_default = str(default).replace('::character varying', '').replace('::jsonb', '')
                        if 'nextval' in clean_default or 'uuid_generate' in clean_default:
                            settings.append("increment") # Symbolizes auto-gen
                        else:
                            pass 

                    if settings:
                        line += f" [{', '.join(settings)}]"
                    
                    f.write(line + "\n")
                f.write("}\n\n")
            
            # Write Relationships (Foreign Keys)
            f.write("// Relationships\n")
            for table in tables:
                fks = get_foreign_keys(cur, table)
                for fk in fks:
                    col, ref_table, ref_col = fk
                    # formatting: Ref: table.col > ref_table.ref_col
                    f.write(f"Ref: {table}.{col} > {ref_table}.{ref_col}\n")
        
        conn.close()
        print(f"✅ DBML file generated at {os.path.abspath(OUTPUT_FILE)}")
        
    except Exception as e:
        print(f"Error generating DBML: {e}")

if __name__ == "__main__":
    generate_dbml()
