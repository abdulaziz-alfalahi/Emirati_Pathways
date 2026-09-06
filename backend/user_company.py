"""Which company does this employer-side user belong to?

The ACL (`workspace_middleware.get_company_context`) answers that from
`company_team_members` with `invitation_status='accepted'` — and ONLY from
there. `hr_profiles` is legacy display data (CLAUDE.md, critical truth 4).

Until 2026-09-06 the user payload the frontend receives (`company_id`,
`company_name`) was read from `hr_profiles` alone. Two ways that goes wrong,
both seen on staging the same day:

  * hr_profiles points at a company that no longer exists (migration 108
    removed nine fabricated companies) while the person is an accepted admin
    of a real one — the HR Team tab asks the ACL about the dead company and
    is refused (403) for every request
  * a recruiter who joined through a team invitation has a membership row
    and no hr_profiles row at all — the payload carries no company and the
    Team tab never loads

So: membership first (admin before recruiter, newest first), hr_profiles as a
fallback only when it still names a company that exists.
"""

MEMBERSHIP_SQL = """
    SELECT tm.company_id, COALESCE(c.name, c.company_name) AS company_name
    FROM company_team_members tm
    JOIN companies c ON c.id = tm.company_id
    WHERE tm.user_id = %s AND tm.invitation_status = 'accepted'
    ORDER BY (tm.role = 'admin') DESC, tm.joined_at DESC NULLS LAST, tm.created_at DESC
    LIMIT 1
"""

LEGACY_SQL = """
    SELECT hp.company_id, COALESCE(c.name, c.company_name) AS company_name
    FROM hr_profiles hp
    JOIN companies c ON c.id::text = hp.company_id::text
    WHERE hp.user_id = %s AND hp.company_id IS NOT NULL
    LIMIT 1
"""


def _pair(row):
    if row is None:
        return None
    if isinstance(row, dict):
        cid, name = row.get('company_id'), row.get('company_name')
    else:
        cid, name = row[0], row[1]
    if not cid:
        return None
    return str(cid), name


def resolve_user_company(cur, user_id):
    """Return (company_id, company_name) or None. Works with tuple and
    RealDict cursors. Never raises for a missing row."""
    cur.execute(MEMBERSHIP_SQL, (str(user_id),))
    found = _pair(cur.fetchone())
    if found:
        return found
    cur.execute(LEGACY_SQL, (str(user_id),))
    return _pair(cur.fetchone())
