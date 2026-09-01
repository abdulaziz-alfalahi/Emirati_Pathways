#!/usr/bin/env python3
"""Which accounts would NOT survive the switch to production UAE Pass?

WHY THIS EXISTS

Every user on this platform is keyed on `users.id`, a CHAR(15) Emirates ID. Until
UAE Pass supplies a real one, accounts carry a synthetic `7840000…` id. At
cutover, a person signs in against the PRODUCTION UAE Pass and arrives with
their real Emirates ID; the callback then has to recognise them as the account
that already exists, or it creates a new one and everything they had — roles,
board membership, authored content — stays behind on the abandoned row.

The callback already handles this well: `_migrate_user_id` copies the row onto
the real Emirates ID, walks every foreign key referencing `users(id)` and
repoints it. What it will not do is link on an UNVERIFIED contact point into a
privileged account (issue #95) — because an email match is only a claim, and
honouring it would let anyone whose UAE Pass profile carried a shared address
inherit admin or operator rights.

That guard is correct, and it means a specific, knowable set of accounts cannot
rebind automatically. This script names them BEFORE cutover, while the fix is
cheap, instead of after, when it is a person locked out of their own board seat.

THE STAGING-UUID TRAP, which is what makes this non-obvious

`uaepass_uuid` being populated looks like proof the account is already linked.
It is not. Those UUIDs were issued by the UAE Pass STAGING IdP; production
issues its own subject identifiers. Measured on the live database 2026-09-01:
20 of the 21 accounts holding a UUID were still on a synthetic id — had a real
sign-in happened, the migration would already have moved them. So the default
here assumes the UUID does NOT carry across. Pass --assume-uuid-carries to model
the optimistic case if UAE Pass ever confirms otherwise.

USAGE

    .venv/bin/python backend/scripts/cutover_identity_check.py
    .venv/bin/python backend/scripts/cutover_identity_check.py --all
    .venv/bin/python backend/scripts/cutover_identity_check.py --json

Read-only: it issues SELECTs and nothing else. Exit status 1 if any account
would strand, so it can gate the cutover runbook rather than be read by hand.
"""
import argparse
import json
import os
import re
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(BACKEND)
# Both roots: the route module below reaches its dependencies as `backend.X`,
# while this script's own imports resolve top-level from inside backend/.
sys.path.insert(0, BACKEND)
sys.path.insert(0, REPO)

import psycopg2                       # noqa: E402
import psycopg2.extras                # noqa: E402
from dotenv import load_dotenv        # noqa: E402

# Imported from the route module ON PURPOSE rather than re-derived: if the
# refusal rule changes, this check must change with it. A local copy of the
# role set would drift silently and report a reassuring answer.
from routes.uaepass_routes import PRIVILEGED_LINK_ROLES  # noqa: E402

#: The band the platform mints placeholder ids in (workspace_phase2_routes:
#: f"7840000{seq:07d}0").
SYNTHETIC_PREFIX = '7840000'

#: An Emirates ID is 784 + a 4-digit birth year + 7 digits + a check digit. That
#: birth year is what makes a fake id detectable WITHOUT a list of known bands.
#:
#: Keying only on SYNTHETIC_PREFIX missed two real cases on 2026-09-01: a July
#: test fixture minted at 784111100000030, which this check cheerfully reported
#: as "already keyed on a real Emirates ID", and — more importantly — genuine
#: people whose imported id cannot be an Emirates ID at all. A prefix list would
#: have had to be extended every time somebody invented a new band; a
#: plausibility test does not.
EID_SHAPE = r'^784[0-9]{12}$'
EARLIEST_PLAUSIBLE_BIRTH_YEAR = 1900


def id_problem(user_id, this_year):
    """Why can this id not be a real Emirates ID? None if it looks real.

    The reason is reported to the operator, because "synthetic" and "mistyped
    on import" are the same problem for cutover and completely different
    problems to fix.
    """
    uid = (user_id or '').strip()
    if not re.match(EID_SHAPE, uid):
        return 'not the shape of an Emirates ID (784 + 12 digits)'
    if uid.startswith(SYNTHETIC_PREFIX):
        return 'placeholder id minted by the platform'
    year = int(uid[3:7])
    if year < EARLIEST_PLAUSIBLE_BIRTH_YEAR or year > this_year:
        return f'impossible birth year in the id ({year})'
    return None


def connect():
    load_dotenv(os.path.join(BACKEND, '.env'))
    return psycopg2.connect(
        host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
        dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'), connect_timeout=10)


def roles_of(row):
    """Everything that counts as a role on this row.

    Mirrors _refuse_contact_link: primary role, the legacy user_type mirror and
    the additive secondary_roles, which arrive as jsonb or as text depending on
    how they were written.
    """
    secondary = row.get('secondary_roles') or []
    if isinstance(secondary, str):
        try:
            secondary = json.loads(secondary)
        except (ValueError, TypeError):
            secondary = [secondary]
    roles = {row.get('role'), row.get('user_type')} | set(secondary or [])
    roles.discard(None)
    return roles


def mask(value):
    if not value:
        return '—'
    value = value.strip()
    if '@' in value:
        user, domain = value.split('@', 1)
        return f'{user[:2]}***@{domain}'
    return f'{value[:5]}***'


def assess(cur, assume_uuid_carries=False):
    """Replay the callback's matching cascade for every synthetic-id account.

    Order matches routes/uaepass_routes.py: uaepass_uuid, then id, then email,
    then phone — and a contact match is only honoured if it is unambiguous and
    the account is not privileged.
    """
    cur.execute("""
        SELECT id, role, user_type, secondary_roles, uaepass_uuid,
               NULLIF(btrim(email), '') AS email,
               NULLIF(btrim(phone), '') AS phone,
               first_name, last_name, is_test_account, created_at,
               EXTRACT(year FROM now())::int AS this_year
          FROM users
         -- Anything whose id cannot be the Emirates ID the person will present.
         WHERE id !~ %s
            OR id LIKE %s
            OR (substring(id from 4 for 4) ~ '^[0-9]{4}$'
                AND (substring(id from 4 for 4)::int < %s
                     OR substring(id from 4 for 4)::int > EXTRACT(year FROM now())::int))
         ORDER BY created_at
    """, (EID_SHAPE, SYNTHETIC_PREFIX + '%', EARLIEST_PLAUSIBLE_BIRTH_YEAR))
    candidates = cur.fetchall()

    # Ambiguity is decided across the WHOLE table, not just these rows: two
    # accounts sharing an address makes the match ambiguous and it is refused.
    cur.execute("""
        SELECT lower(btrim(email)) AS v, count(*) AS n FROM users
         WHERE btrim(coalesce(email, '')) <> '' GROUP BY 1 HAVING count(*) > 1
    """)
    dup_emails = {r['v'] for r in cur.fetchall()}
    cur.execute("""
        SELECT btrim(phone) AS v, count(*) AS n FROM users
         WHERE btrim(coalesce(phone, '')) <> '' GROUP BY 1 HAVING count(*) > 1
    """)
    dup_phones = {r['v'] for r in cur.fetchall()}

    results = []
    for row in candidates:
        roles = roles_of(row)
        blocking = sorted(roles & PRIVILEGED_LINK_ROLES)

        cur.execute("""SELECT 1 FROM company_team_members
                        WHERE user_id = %s AND invitation_status = 'accepted'
                        LIMIT 1""", (row['id'],))
        holds_membership = cur.fetchone() is not None

        email = (row['email'] or '').lower()
        phone = (row['phone'] or '').strip()
        usable_email = bool(email) and email not in dup_emails
        usable_phone = bool(phone) and phone not in dup_phones

        problem = id_problem(row['id'], row['this_year'])

        if assume_uuid_carries and row['uaepass_uuid']:
            verdict, why = 'REBINDS', 'UAE Pass UUID assumed to carry across'
        elif blocking:
            verdict, why = 'STRANDED', (
                'contact-link refused — privileged roles: ' + ', '.join(blocking[:4]))
        elif holds_membership:
            verdict, why = 'STRANDED', (
                'contact-link refused — holds an accepted company membership')
        elif not (row['email'] or row['phone']):
            verdict, why = 'STRANDED', 'no email or phone to match on'
        elif not (usable_email or usable_phone):
            verdict, why = 'STRANDED', (
                'every contact point is shared with another account (ambiguous)')
        else:
            matched_on = 'email' if usable_email else 'phone'
            verdict, why = 'REBINDS', f'unambiguous {matched_on} match -> _migrate_user_id'

        results.append({
            'id': row['id'],
            'name': ' '.join(filter(None, [row['first_name'], row['last_name']])) or '—',
            'role': row['role'],
            'roles_blocking': blocking,
            'email': mask(row['email']),
            'phone': mask(row['phone']),
            'has_uaepass_uuid': bool(row['uaepass_uuid']),
            'is_test_account': bool(row['is_test_account']),
            'id_problem': problem,
            'verdict': verdict,
            'why': why,
        })
    return results, dup_emails, dup_phones


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--all', action='store_true',
                    help='list accounts that rebind cleanly as well')
    ap.add_argument('--json', action='store_true', help='machine-readable output')
    ap.add_argument('--assume-uuid-carries', action='store_true',
                    help='model UAE Pass keeping the same subject identifier '
                         'between staging and production (it is not known to)')
    ap.add_argument('--include-test-accounts', action='store_true',
                    help='test accounts are excluded by default — they are not '
                         'people who need their access back')
    args = ap.parse_args()

    conn = connect()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    results, dup_emails, dup_phones = assess(cur, args.assume_uuid_carries)
    conn.close()

    if not args.include_test_accounts:
        results = [r for r in results if not r['is_test_account']]

    stranded = [r for r in results if r['verdict'] == 'STRANDED']
    rebinds = [r for r in results if r['verdict'] == 'REBINDS']

    if args.json:
        print(json.dumps({'stranded': stranded, 'rebinds': rebinds,
                          'duplicate_emails': len(dup_emails),
                          'duplicate_phones': len(dup_phones)},
                         indent=2, default=str))
        return 1 if stranded else 0

    print('\n  PRE-CUTOVER IDENTITY CHECK')
    print('  Accounts whose stored id cannot be the Emirates ID its owner will')
    print('  present at sign-in — placeholder ids, malformed ids, and ids with')
    print('  an impossible birth year — and whether production UAE Pass would')
    print('  still recognise them.\n')

    if stranded:
        print(f'  STRANDED — {len(stranded)} account(s) would get a NEW account '
              f'and lose access to what they hold:\n')
        for r in stranded:
            print(f"    {r['id']}  {r['name']}")
            print(f"        role={r['role']}  email={r['email']}  phone={r['phone']}")
            print(f"        id: {r['id_problem']}")
            print(f"        {r['why']}\n")
    else:
        print('  STRANDED — none. Every synthetic account can rebind.\n')

    if args.all and rebinds:
        print(f'  REBINDS CLEANLY — {len(rebinds)} account(s):\n')
        for r in rebinds:
            print(f"    {r['id']}  {r['name']:28s} {r['why']}")
        print()

    print(f'  {len(rebinds)} would rebind, {len(stranded)} would strand.')
    if dup_emails or dup_phones:
        print(f'  Shared contact points that make a match ambiguous: '
              f'{len(dup_emails)} email(s), {len(dup_phones)} phone(s).')
    if stranded:
        print('\n  WHAT TO DO: collect the real Emirates ID for each account')
        print('  above and migrate it BEFORE cutover. The callback already has')
        print('  the machinery — routes/uaepass_routes.py::_migrate_user_id —')
        print('  which repoints every foreign key referencing users(id).')
        print('  Do NOT widen PRIVILEGED_LINK_ROLES to make these link on an')
        print('  email: that guard is what stops a shared address inheriting')
        print('  admin rights (issue #95).')
    return 1 if stranded else 0


if __name__ == '__main__':
    sys.exit(main())
