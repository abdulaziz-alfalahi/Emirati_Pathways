#!/usr/bin/env python3
"""Scout the allow-listed sources and file drafts for review.

    .venv/bin/python backend/scripts/scout_scholarships.py
    .venv/bin/python backend/scripts/scout_scholarships.py --dry-run
    .venv/bin/python backend/scripts/scout_scholarships.py --source 3

Phase 2 of docs/scope_scholarship_scouting.md. Nothing here reaches a candidate:
it writes DRAFTS, and the Education Operator approves them.

THE THREE THINGS THIS MUST GET RIGHT

1. A REJECTED ITEM DOES NOT COME BACK. The scout reads the same pages every day.
   Suppression is by (source_url, fingerprint) — same page, same content, same
   answer — so a materially changed page IS re-raised and an unchanged one is
   not. Without this the queue fills with yesterday's decisions and the operator
   stops opening it.

2. AN UNREADABLE SOURCE IS NOT AN EMPTY ONE. Recorded as an outcome on the
   source row, never as "no scholarships found". Silence is not success: a scout
   that cannot reach its sources produces nothing, and producing nothing looks
   exactly like a quiet day.

3. A DRAFT ALREADY PENDING IS NOT DUPLICATED. The unique index on
   (source_url, fingerprint) WHERE status='pending' enforces it in the database
   rather than trusting this script to be the only writer.
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402
import psycopg2  # noqa: E402
from psycopg2.extras import RealDictCursor  # noqa: E402

from scholarship_scout import scout_page, DRAFT_FIELDS  # noqa: E402

_PAUSE_SECONDS = 2.0


def connect():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(here, '.env'))
    if not os.getenv('DB_HOST'):
        raise SystemExit('DB_HOST is not set and backend/.env was not found.')
    return psycopg2.connect(
        host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
        dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'), connect_timeout=10)


def _already_rejected(cur, url, fingerprint):
    cur.execute("""SELECT reason, rejected_at FROM scholarship_rejections
                    WHERE source_url = %s AND fingerprint = %s""",
                (url, fingerprint))
    return cur.fetchone()


def _already_listed(cur, link):
    """Do not propose what the directory already carries.

    Matched on the application link rather than the title: two entries can share
    a title across cycles, but the link is what a candidate actually follows.
    """
    if not link:
        return None
    cur.execute("SELECT id, title FROM scholarships WHERE application_link = %s", (link,))
    return cur.fetchone()


def run(dry_run=False, only_source=None):
    conn = connect()
    report = []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            sql = "SELECT * FROM scholarship_sources WHERE is_active = TRUE"
            params = []
            if only_source:
                sql += " AND id = %s"
                params.append(only_source)
            cur.execute(sql + " ORDER BY id", params)
            sources = cur.fetchall()

        for i, src in enumerate(sources):
            if i:
                time.sleep(_PAUSE_SECONDS)

            entry = {'source': src['label'] or src['domain'], 'url': src['start_url'],
                     'proposed': 0, 'suppressed': 0, 'already_listed': 0, 'error': None}
            proposals, fingerprint, error = scout_page(src['start_url'])

            if error:
                # An unreadable source is OUR problem, and saying "0 found" here
                # would hide it behind a number that looks like a quiet day.
                entry['error'] = error
                if not dry_run:
                    with conn.cursor() as c2:
                        c2.execute("""UPDATE scholarship_sources
                                         SET last_scouted_at = NOW(), last_outcome = %s
                                       WHERE id = %s""", (f'error: {error}', src['id']))
                    conn.commit()
                report.append(entry)
                continue

            with conn.cursor(cursor_factory=RealDictCursor) as c2:
                for p in proposals:
                    rejected = _already_rejected(c2, src['start_url'], fingerprint)
                    if rejected:
                        entry['suppressed'] += 1
                        continue
                    listed = _already_listed(c2, p.get('application_link'))
                    if listed:
                        entry['already_listed'] += 1
                        continue

                    entry['proposed'] += 1
                    if dry_run:
                        continue

                    cols = list(DRAFT_FIELDS)
                    vals = [p.get(k) for k in cols]
                    c2.execute(f"""
                        INSERT INTO scholarship_drafts
                               (source_id, source_url, fingerprint, model,
                                extracted_raw, {', '.join(cols)})
                        VALUES (%s, %s, %s, %s, %s, {', '.join(['%s'] * len(cols))})
                        ON CONFLICT (source_url, fingerprint)
                          WHERE status = 'pending' DO NOTHING
                    """, [src['id'], src['start_url'], fingerprint, 'qwen',
                          json.dumps(p, default=str)] + vals)

                if not dry_run:
                    outcome = (f"{entry['proposed']} proposed, "
                               f"{entry['suppressed']} already rejected, "
                               f"{entry['already_listed']} already listed")
                    c2.execute("""UPDATE scholarship_sources
                                     SET last_scouted_at = NOW(), last_outcome = %s
                                   WHERE id = %s""", (outcome, src['id']))
            conn.commit()
            report.append(entry)
    finally:
        conn.close()
    return report


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dry-run', action='store_true', help='read and report, write nothing')
    ap.add_argument('--source', type=int, help='scout one source by id')
    ap.add_argument('--json', action='store_true')
    args = ap.parse_args()

    report = run(dry_run=args.dry_run, only_source=args.source)
    if args.json:
        print(json.dumps(report, indent=2, default=str))
        return 0

    if not report:
        print('no active sources — add one on the Education Operator dashboard')
        return 0

    print(f"scouted {len(report)} source(s)"
          f"{' (dry run — nothing written)' if args.dry_run else ''}")
    errors = 0
    for r in report:
        if r['error']:
            errors += 1
            print(f"  ERROR   {r['source'][:30]:32} {r['error']}")
        else:
            print(f"  ok      {r['source'][:30]:32} "
                  f"{r['proposed']} proposed, {r['suppressed']} already rejected, "
                  f"{r['already_listed']} already listed")
    if errors:
        print(f"\n  {errors} source(s) could not be read. That is not the same as "
              f"finding nothing —\n  a source we cannot reach produces silence, and "
              f"silence looks like a quiet day.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
