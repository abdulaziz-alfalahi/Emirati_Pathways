"""Who works on the platform, answered honestly.

WHY THIS FILE EXISTS

Owner, 2026-08-27: "I need a place where I see the platform operator and what
roles they are assigned."

The tab that claimed to do this found its people with

    u.secondary_roles::text ILIKE '%operator%'

a substring search over raw JSON. On a page titled "Growth Operator Management"
it listed seventeen people; ONE was a growth operator. The rest were assessment,
mentorship, career-services, platform and board operators, plus a candidate
carrying twenty-seven secondary roles.

Harmless while the roles it offered to grant did nothing. Once
growth_operator_<domain> began granting real access earlier the same day, a
page inviting an administrator to drag thirteen of the wrong people into a
domain stopped being cosmetic.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)
# The helper lives beside this file; BACKEND alone does not reach it.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pytest  # noqa: E402

from source_utils import code_only, js_code_only  # noqa: E402

from auth.access_control import STAFF_ROLES, is_staff, OPERATOR_ROLES  # noqa: E402

ROUTES = os.path.join(BACKEND, 'routes', 'staff_directory_routes.py')


def _source():
    return open(ROUTES, encoding='utf-8').read()


# ── Who counts as staff ─────────────────────────────────────────────────────

def test_the_people_the_platform_SERVES_are_not_staff():
    """Listing someone as staff because they are also a candidate would put
    38,000 people in a directory of colleagues."""
    for role in ('candidate', 'student', 'parent', 'employee', 'seeker'):
        assert role not in STAFF_ROLES
        assert not is_staff([role])


def test_somebody_who_is_both_is_staff():
    """The owner is a candidate with twenty-seven secondary roles. Excluding
    him because his PRIMARY role is candidate is the mirror of the old bug."""
    assert is_staff(['candidate', 'career_services_operator'])


def test_a_role_granted_only_as_a_SECONDARY_role_still_counts():
    """Checking the primary alone is how operators granted through
    secondary_roles became invisible in the first place."""
    assert is_staff(['candidate', 'growth_operator_company'])


def test_matching_is_exact_not_a_substring():
    """The defect itself. 'operator' as a substring matched every kind of
    operator on a page about one kind."""
    assert not is_staff(['not_really_an_operator_at_all'])
    assert not is_staff(['operatorish'])
    assert is_staff(['platform_operator'])


def test_every_operator_role_is_staff():
    for role in OPERATOR_ROLES:
        if role in ('candidate', 'student'):
            continue
        assert role in STAFF_ROLES, f'{role} gates an operator surface but is not staff'


def test_staff_is_composed_from_the_gating_sets_not_typed_out():
    """A role added to any gating set should appear here without anyone
    remembering to add it twice — the drift that caused this bug."""
    source = open(os.path.join(BACKEND, 'auth', 'access_control.py'),
                  encoding='utf-8').read()
    block = source[source.index('STAFF_ROLES = ('):source.index('def is_staff(')]
    for gating_set in ('ADMIN_ROLES', 'BOARD_ROLES', 'OPERATOR_ROLES'):
        assert gating_set in block


# ── What the endpoint does ──────────────────────────────────────────────────

def test_the_endpoint_does_not_use_a_pattern_to_find_people():
    # code_only: the docstring above quotes the old ILIKE query, and a raw
    # search finds the explanation rather than the code.
    code = code_only(_source())
    assert 'ILIKE' not in code.upper()
    assert 'in STAFF_ROLES' in code


def test_it_is_read_only():
    """Roles are granted on the Users tab and growth domains on the assignment
    screen. A third place to change them is how "Duplicate locations for role
    assignment" reached the feedback queue."""
    code = code_only(_source())
    for write in ('UPDATE ', 'INSERT ', 'DELETE '):
        assert write not in code.upper(), f'the directory performs a {write.strip()}'


def test_it_is_administrator_only():
    """It carries every member of staff, their email and their access."""
    source = _source()
    idx = source.index('def list_staff(')
    assert '@require_roles(*ADMIN_ROLES)' in source[max(0, idx - 200):idx]


def test_roles_are_reported_with_where_they_came_from():
    """"Why does this person have this?" is the question an administrator
    actually has."""
    source = _source()
    assert "'source': 'primary' if role == primary else 'secondary'" in source


def test_no_role_is_shown_as_a_raw_identifier():
    """An administrator deciding whether somebody should hold a role should not
    have to read a database value to know what it is."""
    from routes.staff_directory_routes import _label
    for role in sorted(STAFF_ROLES):
        rendered = _label(role)
        assert '_' not in rendered, f'{role} renders as {rendered!r}'
        assert rendered[:1].isupper() or any('؀' <= c <= 'ۿ' for c in rendered)


def test_every_staff_role_has_arabic():
    from routes.staff_directory_routes import _label
    for role in sorted(STAFF_ROLES):
        assert _label(role, arabic=True)


def test_the_totals_describe_the_whole_directory_not_the_filter():
    """A filter that also changes the totals beside it makes the totals
    unreadable."""
    source = _source()
    assert 'Counts across the WHOLE directory' in source


def test_the_growth_manager_no_longer_invents_numbers():
    """It used to fill operatorCount, activityCount, trend, workload and every
    KPI with Math.random() and render them as real."""
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src',
                        'components', 'admin', 'GrowthOperatorManagerEnhanced.tsx')
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    assert 'Math.random' not in js_code_only(open(path, encoding='utf-8').read())
