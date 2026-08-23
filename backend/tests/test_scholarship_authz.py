"""Publishing a scholarship and deciding an application are privileged.

WHY THIS FILE EXISTS

`create_scholarship` and `update_scholarship_application_status` carried
`@jwt_required()` and no role check, while their docstrings said
"(educator / operator)". Only the READ endpoint was guarded — so the two verbs
that CHANGE something were the open ones, and the one that merely lists was
locked.

Demonstrated against staging on 2026-08-23, signed in as a plain `candidate`
with no secondary roles:

    POST /api/education/scholarships              -> 201 Created
    POST /api/education/scholarships/2/apply      -> 201 Created
    PUT  .../applications/1/status {"approved"}   -> 200 "Application approved"

A candidate could invent a scholarship and award it to themselves. (The probe
rows used the ZZ- prefix and were deleted; both tables verified back to 0.)

This is the failure CLAUDE.md describes: a guard written inside the handler is a
guard somebody forgets to write, and its absence is invisible at the route.
These tests assert the decorator is present, because that is the thing whose
absence caused this.
"""
import os
import re

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROUTES = os.path.join(BACKEND, 'education_api_routes.py')

# Endpoints that create or change a scholarship or an application decision.
PRIVILEGED = [
    'create_scholarship',
    'update_scholarship_application_status',
    'get_scholarship_applications',
]


def _decorators():
    """{function name: the decorator lines directly above it}."""
    with open(ROUTES, encoding='utf-8') as fh:
        src = fh.read().split('\n')
    out, starts = {}, []
    for i, line in enumerate(src):
        m = re.match(r'def (\w+)\(', line)
        if m:
            starts.append((i, m.group(1)))
    for i, name in starts:
        j = i - 1
        deco = []
        while j >= 0 and (src[j].startswith('@') or src[j].strip() == ''):
            deco.append(src[j])
            j -= 1
        out[name] = '\n'.join(deco)
    return out


def test_privileged_scholarship_endpoints_require_a_role():
    deco = _decorators()
    missing = [n for n in PRIVILEGED if 'require_roles' not in deco.get(n, '')]
    assert not missing, (
        f'These endpoints do not check the caller\'s role: {missing}. '
        'A candidate could publish a scholarship and approve their own '
        'application — verified against staging 2026-08-23.'
    )


def test_no_privileged_endpoint_is_left_on_jwt_required_alone():
    """@jwt_required() alone means "any signed-in user", which is the bug."""
    deco = _decorators()
    offenders = [n for n in PRIVILEGED
                 if '@jwt_required' in deco.get(n, '') and 'require_roles' not in deco.get(n, '')]
    assert not offenders, (
        f'{offenders} authenticate the caller but never authorise them.'
    )


def test_the_reviewer_role_set_includes_every_admin_variant():
    """The hand-written set missed 'administrator' and 'super_user'.

    Both are real roles elsewhere in access_control, so two kinds of admin were
    refused by a set that was trying to admit admins.
    """
    import sys
    sys.path.insert(0, BACKEND)
    from education_api_routes import SCHOLARSHIP_REVIEWER_ROLES
    from auth.access_control import ADMIN_ROLES

    assert ADMIN_ROLES <= SCHOLARSHIP_REVIEWER_ROLES, (
        'Some admin roles cannot review scholarships: '
        f'{sorted(ADMIN_ROLES - SCHOLARSHIP_REVIEWER_ROLES)}'
    )
    for role in ('educator', 'education_operator'):
        assert role in SCHOLARSHIP_REVIEWER_ROLES


def test_applying_is_not_privileged():
    """The candidate-facing verb must stay open to candidates.

    Guarding it would fix the wrong thing: applying is what the feature is FOR.
    """
    deco = _decorators()
    assert 'require_roles' not in deco.get('apply_to_scholarship', ''), (
        'apply_to_scholarship now requires a reviewer role, which locks '
        'candidates out of the one action the page exists to offer.'
    )
