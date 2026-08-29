"""Who works on the platform, and what each of them can do.

WHY THIS EXISTS

Owner, 2026-08-27: "I need a place where I see the platform operator and what
roles they are assigned."

There was no honest answer to that. The Users tab lists 38,000 people, most of
whom are candidates. The operators tab claimed to show growth operators and
found its people with

    u.secondary_roles::text ILIKE '%operator%'

a substring search over raw JSON — which matched every kind of operator on a
page about one kind, and matched anyone whose role list merely CONTAINED the
word, including a candidate carrying twenty-seven secondary roles. Seventeen
people were listed; one was actually a growth operator.

WHAT THIS ANSWERS INSTEAD

One row per member of staff, with every role they hold and where each came
from. Roles are matched EXACTLY against STAFF_ROLES, resolved across primary
and secondary — checking the primary alone is how operators granted through
secondary_roles became invisible in the first place.

Read-only. Granting and revoking already exist on the Users tab and the growth
domain screen; a third place to change roles is how the platform ended up with
"Duplicate locations for role assignment" in the feedback queue.
"""
import logging

from flask import Blueprint, jsonify, request

try:
    from backend.auth.access_control import (
        require_roles, ADMIN_ROLES, STAFF_ROLES, domain_for_role)
    from backend.db_utils import execute_query
    from backend.role_labels import label_for
except ImportError:                          # pragma: no cover — dual root
    from auth.access_control import (
        require_roles, ADMIN_ROLES, STAFF_ROLES, domain_for_role)
    from db_utils import execute_query
    from role_labels import label_for

logger = logging.getLogger(__name__)

staff_directory_bp = Blueprint('staff_directory', __name__)

#: One registry, shared with the Users tab and the invitation email. This module
#: kept its own list for a day and promptly invented a fourth name for a role
#: that already had three.
_label = label_for


@staff_directory_bp.route('', methods=['GET'])
@require_roles(*ADMIN_ROLES)
def list_staff():
    """Every member of staff, with the roles they hold.

    Matching is EXACT against STAFF_ROLES rather than a pattern, so a candidate
    whose secondary roles happen to contain the word "operator" is not listed
    as one.
    """
    search = (request.args.get('search') or '').strip()
    role_filter = (request.args.get('role') or '').strip().lower()

    rows = execute_query("""
        SELECT u.id, u.email, u.is_active, u.last_login, u.created_at,
               COALESCE(u.full_name, NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''))
                   AS full_name,
               u.role AS primary_role,
               u.secondary_roles,
               (SELECT g.domain FROM growth_operator_assignments g
                 WHERE g.user_id = u.id AND g.is_active AND g.is_primary
                 LIMIT 1) AS primary_domain
          FROM users u
         ORDER BY COALESCE(u.full_name, u.first_name)
    """) or []

    staff = []
    for r in rows:
        primary = (r.get('primary_role') or '').strip().lower()
        secondary = [str(x).strip().lower() for x in (r.get('secondary_roles') or [])]
        held = [x for x in ([primary] + secondary) if x]

        staff_roles = [x for x in held if x in STAFF_ROLES]
        if not staff_roles:
            continue

        if role_filter and role_filter not in held:
            continue
        if search:
            haystack = f"{r.get('full_name') or ''} {r.get('email') or ''}".lower()
            if search.lower() not in haystack:
                continue

        # Roles are reported with WHERE THEY CAME FROM. "Why does this person
        # have this?" is the question an administrator actually has, and
        # primary/secondary is the only provenance the data carries.
        entries = []
        seen = set()
        for role in held:
            if role in seen:
                continue
            seen.add(role)
            entries.append({
                'role': role,
                'label': _label(role),
                'label_ar': _label(role, arabic=True),
                'source': 'primary' if role == primary else 'secondary',
                'is_staff_role': role in STAFF_ROLES,
            })

        staff.append({
            'id': r['id'],
            'name': r.get('full_name') or r.get('email') or r['id'],
            'email': r.get('email'),
            'is_active': bool(r.get('is_active')),
            'last_login': r['last_login'].isoformat() if r.get('last_login') else None,
            'created_at': r['created_at'].isoformat() if r.get('created_at') else None,
            'primary_role': primary or None,
            'primary_label': _label(primary) if primary else None,
            'roles': entries,
            'staff_role_count': len(staff_roles),
            # Derived from the ROLES the person holds, not only from
            # growth_operator_assignments.
            #
            # Reported 2026-08-29: an administrator holding all seven domain
            # roles showed "—" here, while somebody holding one showed his
            # domain. The two columns read two different tables — "Roles held"
            # from users, this one from growth_operator_assignments — and only
            # the growth screen writes the second. Roles granted from the Users
            # tab produced no row, so the same fact had two answers side by side
            # on one screen. That is the defect this directory was built to end,
            # one layer down, and I introduced it.
            #
            # Since the 2026-08-27 unification the role IS the domain grant, so
            # the roles are the authoritative source and this column can simply
            # be read off them. The assignments table keeps what it alone knows:
            # which domain is the person's PRIMARY one.
            'growth_domains': sorted({d for d in (domain_for_role(x) for x in held) if d}),
            'primary_domain': r.get('primary_domain'),
        })

    # Counts across the WHOLE directory, not the filtered view: a filter that
    # also changes the totals beside it makes the totals unreadable.
    by_role = {}
    for person in staff:
        for entry in person['roles']:
            if entry['is_staff_role']:
                by_role[entry['role']] = by_role.get(entry['role'], 0) + 1

    return jsonify({
        'success': True,
        'staff': staff,
        'total': len(staff),
        'by_role': [
            {'role': role, 'label': _label(role), 'label_ar': _label(role, arabic=True),
             'count': count}
            for role, count in sorted(by_role.items(), key=lambda kv: (-kv[1], kv[0]))
        ],
        'note': ('Roles are granted on the Users tab, and growth domains on the '
                 'Growth Operator screen. This view reports; it does not change '
                 'anything.'),
    })
