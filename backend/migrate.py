#!/usr/bin/env python3
"""
Database Migration Script for Emirati Pathways Platform
========================================================

Reads DATABASE_SCHEMA.md (the source of truth generated from the localhost
development database) and ensures every table and column exists in the
target database.

This solves the "CREATE TABLE IF NOT EXISTS" trap where tables created
early with fewer columns are never updated when the codebase evolves.

Usage:
    # Dry-run (show what would change, don't execute)
    python migrate.py --dry-run

    # Apply migrations
    python migrate.py

    # Apply to a specific schema
    python migrate.py --schema qa

    # Verbose output
    python migrate.py --verbose
"""

import os
import re
import sys
import argparse
import logging
from pathlib import Path
from datetime import datetime

# Ensure we can find .env
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(script_dir, '.env'))
except ImportError:
    pass

# psycopg2 is imported lazily in get_connection() so the parser
# can be used standalone (e.g. for testing) without a DB driver.
psycopg2 = None

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('migrate')

# ---------------------------------------------------------------------------
# Schema doc parser
# ---------------------------------------------------------------------------

# Map DATABASE_SCHEMA.md type names → valid PostgreSQL DDL types.
# information_schema reports types without length qualifiers, so we
# use unlimited VARCHAR (≡ TEXT in PostgreSQL) for `character varying`.
TYPE_MAP = {
    'integer':                          'INTEGER',
    'bigint':                           'BIGINT',
    'smallint':                         'SMALLINT',
    'numeric':                          'NUMERIC',
    'double precision':                 'DOUBLE PRECISION',
    'real':                             'REAL',
    'boolean':                          'BOOLEAN',
    'text':                             'TEXT',
    'character varying':                'VARCHAR',
    'character':                        'CHAR',
    'uuid':                             'UUID',
    'jsonb':                            'JSONB',
    'json':                             'JSON',
    'date':                             'DATE',
    'time without time zone':           'TIME',
    'time with time zone':              'TIMETZ',
    'timestamp without time zone':      'TIMESTAMP',
    'timestamp with time zone':         'TIMESTAMPTZ',
    'inet':                             'INET',
    'bytea':                            'BYTEA',
    'ARRAY':                            'TEXT[]',
}


def parse_schema_doc(filepath: str) -> dict:
    """
    Parse DATABASE_SCHEMA.md and return a dict of:
        { table_name: [ { name, pg_type, nullable, default, is_pk }, ... ] }
    """
    tables = {}
    current_table = None
    in_table_block = False
    header_seen = False

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\r\n')

            # Detect table heading:  ## table_name
            m = re.match(r'^## (\w+)\s*$', line)
            if m:
                name = m.group(1)
                if name == 'Table':  # skip "## Table of Contents"
                    current_table = None
                    continue
                current_table = name
                tables[current_table] = []
                in_table_block = False
                header_seen = False
                continue

            if current_table is None:
                continue

            # Detect markdown table rows  | **col** | `type` | ... |
            if line.startswith('|'):
                # Skip separator rows like | :--- | :--- |
                if ':---' in line:
                    in_table_block = True
                    continue
                # Skip header row
                if not header_seen and ('Column' in line or 'Type' in line):
                    header_seen = True
                    continue
                if not in_table_block:
                    continue

                cells = [c.strip() for c in line.split('|')]
                # Remove empty leading/trailing cells from split
                cells = [c for c in cells if c]

                if len(cells) < 4:
                    continue

                col_name = cells[0].replace('**', '').strip()
                col_type_raw = cells[1].replace('`', '').strip()
                nullable = cells[2].strip()
                default_raw = cells[3].strip()

                # Map to PostgreSQL type
                pg_type = TYPE_MAP.get(col_type_raw, col_type_raw.upper())

                # Detect primary key
                is_pk = False
                is_serial = False
                if default_raw.startswith('nextval('):
                    is_serial = True
                    is_pk = (col_name == 'id')
                elif col_type_raw == 'uuid' and 'uuid_generate_v4' in default_raw:
                    is_pk = (col_name == 'id')

                # Build default clause
                default_clause = None
                if default_raw and default_raw != '-':
                    if is_serial:
                        default_clause = None  # handled by SERIAL
                    elif 'uuid_generate_v4' in default_raw:
                        default_clause = 'DEFAULT uuid_generate_v4()'
                    elif 'CURRENT_TIMESTAMP' in default_raw:
                        default_clause = 'DEFAULT CURRENT_TIMESTAMP'
                    elif 'now()' in default_raw:
                        default_clause = 'DEFAULT now()'
                    elif default_raw.startswith("'") or '::' in default_raw:
                        default_clause = f'DEFAULT {default_raw}'
                    else:
                        try:
                            # Numeric defaults
                            float(default_raw)
                            default_clause = f'DEFAULT {default_raw}'
                        except ValueError:
                            default_clause = f"DEFAULT '{default_raw}'"

                tables[current_table].append({
                    'name': col_name,
                    'pg_type': pg_type,
                    'nullable': nullable.upper() != 'NO',
                    'default': default_clause,
                    'is_pk': is_pk,
                    'is_serial': is_serial,
                })

    return tables


# ---------------------------------------------------------------------------
# SQL generation
# ---------------------------------------------------------------------------

def generate_create_table(table_name: str, columns: list, schema: str = 'public') -> str:
    """Generate CREATE TABLE IF NOT EXISTS with just the primary key column."""
    pk_col = None
    for col in columns:
        if col['is_pk']:
            pk_col = col
            break

    if not pk_col:
        # No explicit PK found, use first column
        pk_col = columns[0]

    qualified = f'{schema}.{table_name}' if schema != 'public' else table_name

    if pk_col['is_serial']:
        return f'CREATE TABLE IF NOT EXISTS {qualified} ({pk_col["name"]} SERIAL PRIMARY KEY);'
    elif pk_col['pg_type'] == 'UUID':
        return (
            f'CREATE TABLE IF NOT EXISTS {qualified} '
            f'({pk_col["name"]} UUID DEFAULT uuid_generate_v4() PRIMARY KEY);'
        )
    elif pk_col['pg_type'] == 'VARCHAR':
        return (
            f'CREATE TABLE IF NOT EXISTS {qualified} '
            f'({pk_col["name"]} VARCHAR NOT NULL PRIMARY KEY);'
        )
    elif pk_col['pg_type'] == 'TEXT':
        return (
            f'CREATE TABLE IF NOT EXISTS {qualified} '
            f'({pk_col["name"]} TEXT NOT NULL PRIMARY KEY);'
        )
    elif pk_col['pg_type'] == 'BIGINT':
        return (
            f'CREATE TABLE IF NOT EXISTS {qualified} '
            f'({pk_col["name"]} BIGSERIAL PRIMARY KEY);'
        )
    else:
        return (
            f'CREATE TABLE IF NOT EXISTS {qualified} '
            f'({pk_col["name"]} {pk_col["pg_type"]} PRIMARY KEY);'
        )


def generate_alter_statements(table_name: str, columns: list, schema: str = 'public') -> list:
    """Generate ALTER TABLE ADD COLUMN IF NOT EXISTS for each non-PK column."""
    stmts = []
    qualified = f'{schema}.{table_name}' if schema != 'public' else table_name

    for col in columns:
        if col['is_pk']:
            continue  # PK already in CREATE TABLE

        parts = [f'ALTER TABLE {qualified} ADD COLUMN IF NOT EXISTS']
        parts.append(f'"{col["name"]}" {col["pg_type"]}')

        if col['default']:
            parts.append(col['default'])

        if not col['nullable'] and not col['default']:
            # Can't add NOT NULL without a default on existing rows
            # Skip NOT NULL constraint for safety during migration
            pass

        stmts.append(' '.join(parts) + ';')

    return stmts


# ---------------------------------------------------------------------------
# Database operations
# ---------------------------------------------------------------------------

def get_connection(schema: str = 'public'):
    """Create a database connection."""
    global psycopg2
    if psycopg2 is None:
        import psycopg2 as _pg2
        import psycopg2.extras
        psycopg2 = _pg2
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    )
    conn.autocommit = False

    if schema and schema != 'public':
        with conn.cursor() as cur:
            # Ensure schema exists
            cur.execute(f'CREATE SCHEMA IF NOT EXISTS {schema}')
            cur.execute(f'SET search_path TO {schema}, public')
        conn.commit()

    return conn


def get_existing_tables(conn, schema: str = 'public') -> set:
    """Get set of table names that already exist in the schema."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = %s AND table_type = 'BASE TABLE'",
            (schema,)
        )
        return {row[0] for row in cur.fetchall()}


def get_existing_columns(conn, table_name: str, schema: str = 'public') -> set:
    """Get set of column names for an existing table."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = %s AND table_name = %s",
            (schema, table_name)
        )
        return {row[0] for row in cur.fetchall()}


def ensure_uuid_extension(conn):
    """Ensure the uuid-ossp extension is available."""
    try:
        with conn.cursor() as cur:
            cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.warning(f'Could not create uuid-ossp extension: {e}')


def create_migration_history_table(conn, schema: str = 'public'):
    """Create a table to track migration runs."""
    qualified = f'{schema}.migration_history' if schema != 'public' else 'migration_history'
    with conn.cursor() as cur:
        cur.execute(f'''
            CREATE TABLE IF NOT EXISTS {qualified} (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL,
                tables_created INTEGER DEFAULT 0,
                columns_added INTEGER DEFAULT 0,
                errors INTEGER DEFAULT 0,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details JSONB
            )
        ''')
    conn.commit()


def record_migration(conn, schema: str, name: str, tables_created: int,
                     columns_added: int, errors: int, details: dict):
    """Record a migration run in the history table."""
    import json
    qualified = f'{schema}.migration_history' if schema != 'public' else 'migration_history'
    with conn.cursor() as cur:
        cur.execute(
            f'INSERT INTO {qualified} (migration_name, tables_created, columns_added, errors, details) '
            f'VALUES (%s, %s, %s, %s, %s)',
            (name, tables_created, columns_added, errors, json.dumps(details))
        )
    conn.commit()


# ---------------------------------------------------------------------------
# Main migration logic
# ---------------------------------------------------------------------------

def run_migration(schema_doc_path: str, target_schema: str = 'public',
                  dry_run: bool = False, verbose: bool = False):
    """
    Main migration entry point.

    1. Parse DATABASE_SCHEMA.md
    2. Compare with actual database state
    3. Generate and execute CREATE TABLE + ALTER TABLE statements
    """
    if verbose:
        logger.setLevel(logging.DEBUG)

    # ------------------------------------------------------------------
    # Step 1: Parse the schema doc
    # ------------------------------------------------------------------
    logger.info(f'Parsing schema from: {schema_doc_path}')
    expected_schema = parse_schema_doc(schema_doc_path)
    logger.info(f'Found {len(expected_schema)} table definitions')

    if not expected_schema:
        logger.error('No tables found in schema doc. Aborting.')
        return False

    # ------------------------------------------------------------------
    # Step 2: Connect and inspect current state
    # ------------------------------------------------------------------
    if dry_run:
        logger.info('DRY RUN — no changes will be made')

    conn = get_connection(target_schema)
    ensure_uuid_extension(conn)

    existing_tables = get_existing_tables(conn, target_schema)
    logger.info(f'Found {len(existing_tables)} existing tables in "{target_schema}" schema')

    # ------------------------------------------------------------------
    # Step 3: Generate and execute migrations
    # ------------------------------------------------------------------
    tables_created = 0
    columns_added = 0
    errors = 0
    details = {'created_tables': [], 'added_columns': {}, 'errors': []}

    for table_name, columns in sorted(expected_schema.items()):
        # --- Create table if missing ---
        if table_name not in existing_tables:
            create_sql = generate_create_table(table_name, columns, target_schema)
            logger.info(f'  CREATE TABLE: {table_name}')
            if verbose:
                logger.debug(f'    {create_sql}')
            if not dry_run:
                try:
                    with conn.cursor() as cur:
                        cur.execute(create_sql)
                    conn.commit()
                    tables_created += 1
                    details['created_tables'].append(table_name)
                except Exception as e:
                    conn.rollback()
                    logger.error(f'    ERROR creating {table_name}: {e}')
                    errors += 1
                    details['errors'].append(f'CREATE {table_name}: {str(e)}')
                    continue
            else:
                tables_created += 1
                details['created_tables'].append(table_name)

        # --- Add missing columns ---
        if not dry_run:
            existing_columns = get_existing_columns(conn, table_name, target_schema)
        else:
            existing_columns = get_existing_columns(conn, table_name, target_schema) \
                if table_name in existing_tables else set()

        alter_stmts = generate_alter_statements(table_name, columns, target_schema)
        table_cols_added = 0

        for stmt in alter_stmts:
            # Extract column name from the ALTER statement to check if needed
            col_match = re.search(r'ADD COLUMN IF NOT EXISTS "(\w+)"', stmt)
            if col_match:
                col_name = col_match.group(1)
                if col_name in existing_columns:
                    if verbose:
                        logger.debug(f'    SKIP: {table_name}.{col_name} (exists)')
                    continue

            logger.info(f'  ADD COLUMN: {table_name}.{col_name if col_match else "?"}')
            if verbose:
                logger.debug(f'    {stmt}')

            if not dry_run:
                try:
                    with conn.cursor() as cur:
                        cur.execute(stmt)
                    conn.commit()
                    columns_added += 1
                    table_cols_added += 1
                except Exception as e:
                    conn.rollback()
                    col = col_match.group(1) if col_match else '?'
                    logger.error(f'    ERROR adding {table_name}.{col}: {e}')
                    errors += 1
                    details['errors'].append(f'ALTER {table_name}.{col}: {str(e)}')
            else:
                columns_added += 1
                table_cols_added += 1

        if table_cols_added > 0:
            if table_name not in details['added_columns']:
                details['added_columns'][table_name] = []
            details['added_columns'][table_name].append(f'{table_cols_added} columns')

    # ------------------------------------------------------------------
    # Step 4: Report results
    # ------------------------------------------------------------------
    logger.info('')
    logger.info('=' * 60)
    logger.info(f'Migration {"(DRY RUN) " if dry_run else ""}complete:')
    logger.info(f'  Tables checked:  {len(expected_schema)}')
    logger.info(f'  Tables created:  {tables_created}')
    logger.info(f'  Columns added:   {columns_added}')
    logger.info(f'  Errors:          {errors}')
    logger.info('=' * 60)

    if details['created_tables']:
        logger.info(f'  New tables: {", ".join(details["created_tables"])}')
    if details['added_columns']:
        for tbl, info in details['added_columns'].items():
            logger.info(f'  {tbl}: {", ".join(info)}')
    if details['errors']:
        logger.warning('  Errors:')
        for err in details['errors']:
            logger.warning(f'    - {err}')

    # Record migration in history (if not dry-run)
    if not dry_run and (tables_created > 0 or columns_added > 0):
        try:
            create_migration_history_table(conn, target_schema)
            record_migration(
                conn, target_schema,
                f'full_schema_migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                tables_created, columns_added, errors, details
            )
            logger.info('Migration recorded in migration_history table.')
        except Exception as e:
            logger.warning(f'Could not record migration history: {e}')

    conn.close()
    return errors == 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Emirati Pathways Database Migration Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
    python migrate.py --dry-run              # Preview changes
    python migrate.py                        # Apply to public schema
    python migrate.py --schema qa            # Apply to QA schema
    python migrate.py --schema qa --verbose  # Verbose QA migration
        '''
    )
    parser.add_argument(
        '--dry-run', action='store_true',
        help='Show what would change without making any modifications'
    )
    parser.add_argument(
        '--schema', default=os.getenv('DB_SCHEMA', 'public'),
        help='Target database schema (default: from DB_SCHEMA env var or "public")'
    )
    parser.add_argument(
        '--schema-doc', default=None,
        help='Path to DATABASE_SCHEMA.md (default: auto-detect)'
    )
    parser.add_argument(
        '--verbose', '-v', action='store_true',
        help='Show detailed SQL statements'
    )
    parser.add_argument(
        '--all-schemas', action='store_true',
        help='Apply migration to both public and qa schemas'
    )

    args = parser.parse_args()

    # Find DATABASE_SCHEMA.md
    schema_doc = args.schema_doc
    if not schema_doc:
        schema_doc = os.path.join(script_dir, 'DATABASE_SCHEMA.md')
    if not os.path.exists(schema_doc):
        logger.error(f'Schema doc not found: {schema_doc}')
        logger.error('Provide path with --schema-doc or ensure DATABASE_SCHEMA.md exists in backend/')
        sys.exit(1)

    schemas_to_migrate = []
    if args.all_schemas:
        schemas_to_migrate = ['public', 'qa']
    else:
        schemas_to_migrate = [args.schema]

    success = True
    for schema in schemas_to_migrate:
        logger.info(f'\n{"=" * 60}')
        logger.info(f'Migrating schema: {schema}')
        logger.info(f'{"=" * 60}')
        if not run_migration(schema_doc, schema, args.dry_run, args.verbose):
            success = False

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
