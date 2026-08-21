"""Every role the platform gates on must be assignable.

board_chairman was added to access_control, to the route guards, to the
frontend types, to routeAccess, to the Arabic labels and to the admin UI's
FALLBACK list — and was still not offerable, because the Edit User dialog reads
GET /api/admin/roles and that endpoint carries its own hardcoded copy. The role
existed everywhere except the one list that decides what an administrator can
tick, so it could be enforced but never granted.

Role metadata lives in three places that can drift: this endpoint,
frontend/src/types/auth.ts, and the frontend fallback in UserManagerEnhanced.
Consolidating them is a larger change than the bug that exposed it; this test
closes the failure that actually bites — a role that guards something but
cannot be given to anyone.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _assignable_role_ids():
    """The ids GET /api/admin/roles offers, read from its literal."""
    with open(os.path.join(BACKEND, 'routes', 'administrator_routes.py'), encoding='utf-8') as fh:
        src = fh.read()
    body = src.split('def get_roles')[1].split('@admin_bp.route')[0]
    return set(re.findall(r"\{'id': '([a-z_]+)'", body))


# Accepted by the guards, but NOT separately grantable — the same status as
# the admin aliases. Verified 2026-08-21: no user holds any of them.
#
#   hr, hr_manager   normalise to employer_admin, which IS offered as
#                    "HR Manager" (frontend/src/types/auth.ts normalizeRole).
#                    Offering both would let an admin grant the non-canonical
#                    spelling, and both are company-bound anyway — they cannot
#                    be held without a company membership.
#   growth_operator  a PREFIX family (growth_operator_<domain>), not a role in
#                    its own right.
#   operator         a generic legacy synonym kept so old rows still pass the
#                    guards.
#
# Listed rather than silently skipped: if one of these ever becomes a real
# role, deleting its line here is what makes this test demand a checkbox.
SYNONYMS = {'hr', 'hr_manager', 'growth_operator', 'operator'}


def _gated_roles():
    """Roles named in access_control's role sets — what the platform enforces.

    Admin aliases are excluded: 'administrator', 'super_user' and friends are
    accepted synonyms rather than separately grantable roles, and only 'admin'
    is offered. SYNONYMS above are excluded for the same reason.
    """
    from auth import access_control as ac

    gated = set()
    for name in ('BOARD_ROLES', 'OPERATOR_ROLES', 'CAREER_SERVICES_ROLES',
                 'HR_ROLES', 'RECRUITER_ROLES', 'CHAIRMAN_ROLES'):
        gated |= set(getattr(ac, name, set()) or set())
    return {r for r in gated if r not in ac.ADMIN_ROLES and r not in SYNONYMS} | {'admin'}


def test_every_gated_role_can_be_assigned():
    """The failure this file exists for."""
    missing = sorted(_gated_roles() - _assignable_role_ids())
    assert not missing, (
        'these roles gate access but cannot be granted through the Users tab: '
        + ', '.join(missing)
    )


def test_the_chairman_is_assignable():
    """Named explicitly: it is the one that was reported, and a regression here
    means the board cannot adopt its own minutes."""
    assert 'board_chairman' in _assignable_role_ids()


def test_the_board_roles_are_all_offerable():
    for role in ('board_member', 'board_operator', 'board_chairman'):
        assert role in _assignable_role_ids(), role


def test_the_frontend_fallback_agrees_about_the_board():
    """The fallback is used when the API call fails. It disagreeing with the
    API is how a role appears in one place and not the other."""
    path = os.path.join(BACKEND, '..', 'frontend', 'src', 'components', 'admin',
                        'UserManagerEnhanced.tsx')
    if not os.path.exists(path):          # backend-only checkout
        return
    with open(path, encoding='utf-8') as fh:
        src = fh.read()
    for role in ('board_member', 'board_operator', 'board_chairman'):
        assert f"id: '{role}'" in src, f'{role} missing from the offline fallback'
