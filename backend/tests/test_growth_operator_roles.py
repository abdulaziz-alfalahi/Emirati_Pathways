"""A role that is granted must be a role that is recognised.

WHY THIS FILE EXISTS

Reported twice on 2026-08-27, from opposite ends of one defect:

  "I added Samir to the Company Growth role, but he told me he wasn't granted
   access. Do I have to assign him the role from the users tab?"

  "Growth Operator Company — options not clickable."

The assignment API wrote secondary_roles = ['growth_operator_company']. The
navigation knew that string, so the menu item appeared. access_control had never
heard of it, so the guard — looking for the un-suffixed 'growth_operator' —
refused the user. A door the menu offered and the lock would not open.

The operator's instinct was right and the answer was still no: assigning again
from the Users tab would not have helped, because the name they would have
granted was not the name being checked.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from auth.access_control import (  # noqa: E402
    GROWTH_OPERATOR_DOMAINS, GROWTH_OPERATOR_ROLES, OPERATOR_ROLES,
)


def test_every_grantable_domain_role_is_authorised():
    """The defect itself: granted but not recognised."""
    for domain in GROWTH_OPERATOR_DOMAINS:
        role = f'growth_operator_{domain}'
        assert role in OPERATOR_ROLES, f'{role} can be granted but not used'


def test_the_role_that_was_reported_broken_now_works():
    assert 'growth_operator_company' in OPERATOR_ROLES


def test_the_assignment_api_and_the_guard_share_ONE_domain_list():
    """They were maintained separately and drifted. That drift IS the bug —
    two lists that must agree will eventually not."""
    from routes.growth_operator_assignment_api import VALID_DOMAINS
    assert sorted(VALID_DOMAINS) == sorted(GROWTH_OPERATOR_DOMAINS)

    source = open(os.path.join(BACKEND, 'routes',
                               'growth_operator_assignment_api.py'), encoding='utf-8').read()
    assert 'GROWTH_OPERATOR_DOMAINS' in source, 'the API redefines the list again'


def test_the_role_names_match_what_the_assignment_actually_writes():
    """The API builds them as f"growth_operator_{d}". If either side changed
    that shape independently, the grant would stop matching the guard again —
    silently, and in exactly the same way."""
    for domain in GROWTH_OPERATOR_DOMAINS:
        assert f'growth_operator_{domain}' in GROWTH_OPERATOR_ROLES


def test_authorisation_is_not_done_by_prefix():
    """A guard accepting anything starting with 'growth_operator_' would grant
    a future 'growth_operator_superuser' the moment somebody typed it into a
    domain list. The set is explicit for that reason."""
    assert 'growth_operator_superuser' not in OPERATOR_ROLES
    assert 'growth_operator_admin' not in OPERATOR_ROLES
    assert 'growth_operator_' not in OPERATOR_ROLES


def test_the_domain_does_not_widen_what_a_role_can_reach():
    """The domain scopes WHICH companies or candidates an operator handles, and
    that is enforced from growth_operator_assignments. It is not a permission
    tier, so every domain resolves to the same authorisation."""
    reachable = {r for r in GROWTH_OPERATOR_ROLES if r in OPERATOR_ROLES}
    assert reachable == set(GROWTH_OPERATOR_ROLES)


def test_the_un_suffixed_role_still_works():
    """Existing holders of plain 'growth_operator' must not lose access to fix
    somebody else's."""
    assert 'growth_operator' in OPERATOR_ROLES


def test_the_frontend_mirrors_the_same_domain_list():
    """ProtectedRoute checks secondary_roles, so it would have let these users
    through — if the names had been in allowedRoles. They were not."""
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'config', 'routeAccess.ts')
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    source = open(path, encoding='utf-8').read()
    for domain in GROWTH_OPERATOR_DOMAINS:
        assert f"'{domain}'" in source, f'{domain} missing from the frontend list'
    assert 'GROWTH_OPERATOR_ROLES' in source
