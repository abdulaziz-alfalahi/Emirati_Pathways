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

# Gated, grantable, but NOT through the Users tab — and deliberately so.
#
# growth_operator_<domain> is granted by assigning an operator to a domain on
# the Growth Operator screen, which also records WHICH companies or candidates
# they handle. Offering the same role as a Users-tab checkbox would grant the
# name without the scope, and produce a user the guards admit and the
# assignment table knows nothing about.
#
# It would also be the second place to do one thing, which is already a
# reported complaint: "Duplicate locations for role assignment" (2026-08-27).
# One grant path, on the screen that carries the scope with it.
GRANTED_BY_DOMAIN_ASSIGNMENT = {
    f'growth_operator_{d}' for d in
    ('candidate', 'company', 'education', 'assessment',
     'mentorship', 'community', 'monitoring')
}


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
    excluded = SYNONYMS | GRANTED_BY_DOMAIN_ASSIGNMENT
    return {r for r in gated if r not in ac.ADMIN_ROLES and r not in excluded} | {'admin'}


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


def test_domain_roles_are_granted_by_assignment_and_not_by_checkbox():
    """The exemption above must stay honest.

    If these ever appear as Users-tab checkboxes, an administrator can grant the
    role without the domain scope that gives it meaning — and the platform grows
    a second place to do one thing, which is what was reported.
    """
    offered = _assignable_role_ids()
    for role in GRANTED_BY_DOMAIN_ASSIGNMENT:
        assert role not in offered, (
            f'{role} is offered as a checkbox; it should be granted by domain '
            f'assignment, which carries the scope with it'
        )


def test_the_domain_roles_really_are_gated():
    """The exemption is only safe while these are enforced somewhere. If they
    stopped gating anything, exempting them would hide a dead role rather than
    a deliberately-scoped one."""
    from auth import access_control as ac
    for role in GRANTED_BY_DOMAIN_ASSIGNMENT:
        assert role in ac.OPERATOR_ROLES
