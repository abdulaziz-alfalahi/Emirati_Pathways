#!/usr/bin/env python3
"""Check every directory link, and record what happened.

    .venv/bin/python backend/scripts/verify_links.py           # check and write
    .venv/bin/python backend/scripts/verify_links.py --dry-run # check, write nothing
    .venv/bin/python backend/scripts/verify_links.py --json

Phase 1 of docs/scope_scholarship_scouting.md. The directory points at
programmes run by KHDA, MoHESR, universities and foundations, and its whole
value is that the links work — an entry nobody has checked sends a candidate to
a closed application, which is worse than not listing it.

WHAT THIS WILL NOT DO

It will not unpublish anything. It records a state and leaves the decision to
the operator, for a reason the very first test run demonstrated: KHDA, which
runs the AED 1.1bn Hamdan bin Mohammed programme, fails verification from inside
our container because their web host serves an incomplete certificate chain. A
job that acted on its own findings would have quietly removed the most important
programme in the directory.

So: `changed` and `gone` go to the operator's queue. `unreachable` does not —
it is a statement about us, not about the programme, and a proxy outage would
otherwise present as every scholarship dying at once.

NON-WEB LINKS ARE NOT JUDGED. The Hamdan bin Mohammed application happens inside
the Dubai Now app; no server can follow that link. Those rows get a checked-at
timestamp and a note saying a person has to confirm them, and their status is
left alone rather than being marked good or bad by something that cannot see it.
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

from link_verification import (  # noqa: E402
    check_link, LINK_WEB, OPERATOR_ACTIONABLE, UNREACHABLE, VERIFIED_OK,
)

# Politeness. These are other people's government sites and we read them daily;
# a short pause between requests costs us nothing and keeps us a good citizen.
_PAUSE_SECONDS = 1.5


def connect():
    # In the container there is no .env — secrets are injected as environment
    # variables, which is why the scheduled job passes DB_* in. load_dotenv does
    # not overwrite what is already set, so the file is a convenience for
    # running this by hand and the environment always wins.
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    load_dotenv(os.path.join(here, '.env'))
    if not os.getenv('DB_HOST'):
        raise SystemExit('DB_HOST is not set and backend/.env was not found — '
                         'the checker cannot reach the database.')
    return psycopg2.connect(
        host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
        dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'), connect_timeout=10)


#: Every directory whose rows carry a link the platform published and therefore
#: has to keep honest. They share the same six columns — application_link,
#: link_type, link_status, link_status_detail, link_checked_at, link_fingerprint
#: — so one checker covers them all.
#:
#: academic_programs joined on 2026-08-30. Its previous six rows attributed
#: invented tuition to named real universities with no source at all; the
#: replacement cannot be published without a link, which is only worth
#: something if somebody keeps checking the link still resolves.
CHECKED_TABLES = ('scholarships', 'academic_programs')


def run(dry_run=False, tables=CHECKED_TABLES):
    conn = connect()
    results = []
    try:
        rows = []
        for table in tables:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f"""SELECT id, title, application_link, link_type,
                                       link_status, link_fingerprint
                                  FROM {table}
                                 WHERE application_link IS NOT NULL
                                 ORDER BY is_active DESC, id""")
                rows += [{**r, '_table': table} for r in cur.fetchall()]

        # Shared across the whole run so each site's homepage is fetched once,
        # not once per link. The soft-404 check needs it to tell a live deep
        # link from one that quietly lands on the front door.
        front_door_cache = {}

        for i, row in enumerate(rows):
            if i:
                time.sleep(_PAUSE_SECONDS)

            outcome = check_link(row['application_link'],
                                 link_type=row.get('link_type') or LINK_WEB,
                                 previous_fingerprint=row.get('link_fingerprint'),
                                 front_door_cache=front_door_cache)
            results.append({'id': row['id'], 'title': row['title'],
                            'table': row['_table'], **outcome})

            if dry_run:
                continue

            with conn.cursor() as cur:
                if (row.get('link_type') or LINK_WEB) != LINK_WEB:
                    # Record that we looked and could not judge. The status is
                    # left untouched so a human's verdict is never overwritten
                    # by a machine that cannot follow the link.
                    cur.execute(f"""UPDATE {row['_table']}
                                      SET link_status_detail = %s, link_checked_at = NOW()
                                    WHERE id = %s""", (outcome['detail'], row['id']))
                else:
                    # The fingerprint is only advanced on a clean check. If we
                    # moved it on a `changed` result, the operator would open the
                    # queue item and find nothing to compare against — and the
                    # next run would call the new content unchanged.
                    if outcome['state'] == VERIFIED_OK and outcome['fingerprint']:
                        cur.execute(f"""UPDATE {row['_table']}
                                          SET link_status = %s, link_status_detail = %s,
                                              link_fingerprint = %s, link_checked_at = NOW()
                                        WHERE id = %s""",
                                    (outcome['state'], outcome['detail'],
                                     outcome['fingerprint'], row['id']))
                    else:
                        cur.execute(f"""UPDATE {row['_table']}
                                          SET link_status = %s, link_status_detail = %s,
                                              link_checked_at = NOW()
                                        WHERE id = %s""",
                                    (outcome['state'], outcome['detail'], row['id']))
            conn.commit()
    finally:
        conn.close()
    return results


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dry-run', action='store_true', help='check but write nothing')
    ap.add_argument('--json', action='store_true')
    args = ap.parse_args()

    results = run(dry_run=args.dry_run)
    actionable = [r for r in results if r['state'] in OPERATOR_ACTIONABLE]
    unreachable = [r for r in results if r['state'] == UNREACHABLE]

    if args.json:
        print(json.dumps({'checked': len(results),
                          'actionable': len(actionable),
                          'unreachable': len(unreachable),
                          'results': results}, indent=2, default=str))
        return 0

    print(f"checked {len(results)} entr{'y' if len(results) == 1 else 'ies'}"
          f"{' (dry run — nothing written)' if args.dry_run else ''}")
    for r in results:
        print(f"  {r['state']:12} {str(r['title'])[:44]:46} {r['detail'] or ''}")

    if actionable:
        print(f"\n  {len(actionable)} for the operator to look at "
              f"(changed or gone).")
    if unreachable:
        # Said separately and deliberately: this is OUR problem. Presenting it
        # as directory work would have an operator unpublishing live programmes
        # during a proxy outage.
        print(f"\n  {len(unreachable)} could not be reached. That is not evidence "
              f"any programme ended —\n  it means we could not fetch the page. "
              f"If a whole domain is unreachable, that is\n  an infrastructure "
              f"problem, not a directory one.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
