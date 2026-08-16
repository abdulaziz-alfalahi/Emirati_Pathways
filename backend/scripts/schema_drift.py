#!/usr/bin/env python3
"""Compare DATABASE_SCHEMA.md against a real database — and regenerate it.

WHY THIS EXISTS (issue #418)

`backend/migrations/README.md` calls DATABASE_SCHEMA.md "the single source of
truth for the database schema", and `migrate.py` converges a database toward it.
But migrate.py's own docstring says the document was "generated from the
localhost development database", while CLAUDE.md states the live
`information_schema` is the only authority. Those cannot both be right, and
measurement settles it: as of 2026-08-16 the document described 130 tables
against 295 live, with 330 type mismatches — 83 of them on `id`/`*_id` columns.

WHY IT MATTERS, precisely

migrate.py is ADDITIVE ONLY (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT
EXISTS — it never alters a column type). So:

  * run against the LIVE database it is harmless; it cannot corrupt a type;
  * run against a FRESH database — the production reset — it produces the
    pre-EID schema, in which `application_status_history.application_id` is
    uuid while `job_applications.id` is text, and the two CANNOT BE JOINED.
    Application history would be unreachable from applications.

The danger is therefore not that something breaks today. It is that a document
labelled "source of truth" is not, and someone following the README at reset
time would get a database that looks provisioned and is quietly wrong.

USAGE

    # What has drifted? Exit 1 if anything has.
    python backend/scripts/schema_drift.py

    # Only the class that breaks joins.
    python backend/scripts/schema_drift.py --joins-only

    # Rewrite the document from the database, which is the authority.
    python backend/scripts/schema_drift.py --regenerate

Regeneration is deliberately a separate, explicit act: it produces a very large
diff and changes what CI provisions, so it wants its own review and its own CI
run rather than happening as a side effect of a check.
"""

import argparse
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SCHEMA_DOC = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'DATABASE_SCHEMA.md')

# information_schema and the document spell the same type differently. These are
# genuine synonyms, not drift — reporting them would bury the real findings.
_SYNONYMS = {
    'char': 'character',
    'bpchar': 'character',
    'varchar': 'character varying',
    'timestamptz': 'timestamp with time zone',
    'timestamp': 'timestamp without time zone',
    'int': 'integer',
    'int4': 'integer',
    'int2': 'smallint',
    'int8': 'bigint',
    'serial': 'integer',
    'bigserial': 'bigint',
    'bool': 'boolean',
    'float8': 'double precision',
    'float4': 'real',
    'decimal': 'numeric',
    'json': 'json',
}


def normalise(pg_type: str) -> str:
    """Compare types by meaning, ignoring length qualifiers and spelling."""
    t = (pg_type or '').lower().strip()
    t = t.split('(')[0].strip()          # character varying(255) -> character varying
    t = t.replace('[]', '')
    return _SYNONYMS.get(t, t)


def live_schema(conn) -> dict:
    """{table: {column: data_type}} for the public schema.

    Filtered to table_schema='public' deliberately: a shadow `qa` schema exists
    and reports different types for the same names, which has misled a schema
    check here before.
    """
    out = defaultdict(dict)
    with conn.cursor() as cur:
        cur.execute("""
            SELECT c.table_name, c.column_name, c.data_type
              FROM information_schema.columns c
              JOIN information_schema.tables t
                ON t.table_schema = c.table_schema AND t.table_name = c.table_name
             WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
             ORDER BY c.table_name, c.ordinal_position
        """)
        for table, column, dtype in cur.fetchall():
            out[table][column] = dtype
    return dict(out)


def documented_schema(path: str = SCHEMA_DOC) -> dict:
    """{table: {column: pg_type}} as the document declares it.

    Parsed with migrate.py's own parser so this reports what migrate.py would
    actually do, not what a second reading of the file suggests.
    """
    from migrate import parse_schema_doc
    return {
        table: {col['name']: col['pg_type'] for col in cols}
        for table, cols in parse_schema_doc(path).items()
    }


def compare(doc: dict, live: dict) -> dict:
    doc_t, live_t = set(doc), set(live)
    mismatches, missing_in_live, missing_in_doc = [], [], []

    for table in sorted(doc_t & live_t):
        for col, dtype in doc[table].items():
            if col not in live[table]:
                missing_in_live.append((table, col, dtype))
            elif normalise(dtype) != normalise(live[table][col]):
                mismatches.append((table, col, dtype, live[table][col]))
        for col in live[table]:
            if col not in doc[table]:
                missing_in_doc.append((table, col, live[table][col]))

    return {
        'tables_only_in_doc': sorted(doc_t - live_t),
        'tables_only_in_live': sorted(live_t - doc_t),
        'type_mismatches': mismatches,
        # A column the document declares but the database lacks is the one class
        # migrate.py would actually WRITE — it adds columns.
        'columns_doc_would_add': missing_in_live,
        'columns_undocumented': missing_in_doc,
    }


def is_join_key(column: str) -> bool:
    return column == 'id' or column.endswith('_id')


def report(result: dict, joins_only: bool = False) -> int:
    """Print the findings. Returns a process exit code."""
    mismatches = result['type_mismatches']
    join_mismatches = [m for m in mismatches if is_join_key(m[1])]

    print('DATABASE_SCHEMA.md vs the live database')
    print('=' * 62)
    print(f"tables documented but absent from the database : {len(result['tables_only_in_doc'])}")
    print(f"tables in the database but undocumented        : {len(result['tables_only_in_live'])}")
    print(f"type mismatches                                : {len(mismatches)}")
    print(f"  ...of those, on id / *_id columns            : {len(join_mismatches)}")
    print(f"columns migrate.py would ADD to the database   : {len(result['columns_doc_would_add'])}")
    print(f"columns present but undocumented               : {len(result['columns_undocumented'])}")
    print()

    if join_mismatches:
        print('JOIN-KEY MISMATCHES — the class that silently breaks queries')
        print('-' * 62)
        for table, col, doc_t, live_t in join_mismatches:
            print(f'  {table}.{col:<32} doc={doc_t:<18} live={live_t}')
        print()

    if not joins_only and result['columns_doc_would_add']:
        print('COLUMNS migrate.py WOULD ADD (the only writes it makes)')
        print('-' * 62)
        for table, col, dtype in result['columns_doc_would_add']:
            print(f'  {table}.{col:<32} {dtype}')
        print()

    drifted = bool(mismatches or result['columns_doc_would_add'] or
                   result['tables_only_in_doc'] or result['tables_only_in_live'])
    if drifted:
        print('RESULT: the document does not describe this database.')
        print('It is safe to run migrate.py against a POPULATED database — it only')
        print('adds, never alters a type. It is NOT safe to provision a FRESH')
        print('database from it and call the result production. See issue #418.')
    else:
        print('RESULT: the document matches this database.')
    return 1 if drifted else 0


def render_markdown(live: dict, conn) -> str:
    """Regenerate the document from the database, in the existing format."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_name, column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
             WHERE table_schema = 'public'
             ORDER BY table_name, ordinal_position
        """)
        rows = cur.fetchall()

    by_table = defaultdict(list)
    for t, c, dtype, nullable, default in rows:
        by_table[t].append((c, dtype, nullable, default))

    tables = sorted(by_table)
    out = ['# Database Schema Documentation', '']
    out += [
        '> [!IMPORTANT]',
        '> **Generated from the LIVE database** by '
        '`backend/scripts/schema_drift.py --regenerate`.',
        '> The live `information_schema` is the only authority (see CLAUDE.md). Do not',
        '> hand-edit this file: regenerate it, so it cannot drift back into fiction.',
        '',
        f'**Total Tables:** {len(tables)}',
        '',
        '## Table of Contents',
    ]
    out += [f'- [{t}](#{t})' for t in tables]
    out.append('')

    for t in tables:
        out += [f'## {t}', '', '| Column | Type | Nullable | Default |',
                '| :--- | :--- | :--- | :--- |']
        for c, dtype, nullable, default in by_table[t]:
            out.append(f'| **{c}** | `{dtype}` | {nullable} | {default or "-"} |')
        out += ['', '---']

    return '\n'.join(out) + '\n'


def connect():
    import psycopg2
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(os.path.dirname(os.path.dirname(
            os.path.abspath(__file__))), '.env'))
    except ImportError:
        pass
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', ''),
        connect_timeout=10,
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--joins-only', action='store_true',
                    help='report only id/*_id type mismatches')
    ap.add_argument('--regenerate', action='store_true',
                    help='rewrite DATABASE_SCHEMA.md from the database')
    ap.add_argument('--out', default=SCHEMA_DOC)
    args = ap.parse_args()

    conn = connect()
    try:
        live = live_schema(conn)
        if args.regenerate:
            markdown = render_markdown(live, conn)
            with open(args.out, 'w', encoding='utf-8') as fh:
                fh.write(markdown)
            print(f'wrote {args.out}: {len(live)} tables')
            print('Review the diff and run CI before merging — this changes what CI provisions.')
            return 0
        return report(compare(documented_schema(), live), joins_only=args.joins_only)
    finally:
        conn.close()


if __name__ == '__main__':
    sys.exit(main())
