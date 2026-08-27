"""A role that is granted must be a role that is recognised — and there must be
only one of it.

WHY THIS FILE EXISTS

Reported twice on 2026-08-27, from opposite ends of one defect:

  "I added Samir to the Company Growth role, but he told me he wasn't granted
   access. Do I have to assign him the role from the users tab?"

  "Growth Operator Company — options not clickable."

The assignment API wrote secondary_roles = ['growth_operator_company']. The
navigation knew that string, so the menu item appeared. access_control had never
heard of it, so the guard refused the user. A door the menu offered and the lock
would not open.

MY FIRST FIX WAS THE WRONG ONE, and this file recorded it as correct.

I taught the guard to accept growth_operator_<domain>. The reported symptom went
away. But employer_relations — "Company Onboarding Operator" on the Users tab,
five holders — was already that role, so the fix legitimised a duplicate instead
of removing it. The owner saw the result the same day:

  "The role is showing in one place but not the other. It is confusing."

Three screenshots, one person, three different names.

Owner's decision, 2026-08-27: keep talent_operator and employer_relations. Every
one of the seven domains already had a role; the parallel family had one holder
across all seven of its names against eleven for the roles it duplicated.

So the tests below now assert the opposite of what some of them once did. The
ones that survived unchanged are the ones that were about the SHAPE of the
problem rather than about which name won.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from auth.access_control import (  # noqa: E402
    GROWTH_OPERATOR_DOMAINS, GROWTH_OPERATOR_DOMAIN_ROLES,
    GROWTH_OPERATOR_ROLES, LEGACY_GROWTH_OPERATOR_ROLES, OPERATOR_ROLES,
    domain_for_role, role_for_domain,
)
from role_labels import label_for  # noqa: E402


def test_every_grantable_domain_role_is_authorised():
    """The original defect: granted but not recognised."""
    for domain in GROWTH_OPERATOR_DOMAINS:
        role = role_for_domain(domain)
        assert role, f'{domain} grants nothing'
        assert role in OPERATOR_ROLES, f'{role} can be granted but not used'


def test_the_role_that_was_reported_broken_now_works():
    assert role_for_domain('company') == 'employer_relations'
    assert 'employer_relations' in OPERATOR_ROLES


def test_each_domain_grants_a_role_the_platform_ALREADY_HAS():
    """The unification itself.

    A domain must not invent a name. If it does, the Users tab cannot grant the
    same thing, and the two screens disagree about who does the job — which is
    the entire defect this file is named after.
    """
    from routes.administrator_routes import get_roles  # noqa: F401
    import re
    source = open(os.path.join(BACKEND, 'routes', 'administrator_routes.py'),
                  encoding='utf-8').read()
    offered = set(re.findall(r"\{'id': '([a-z_]+)'", source))
    for domain, role in GROWTH_OPERATOR_DOMAIN_ROLES.items():
        assert role in offered, (
            f'{domain} grants {role}, which the Users tab does not offer — '
            f'an administrator cannot grant or revoke it there')


def test_no_domain_invents_a_second_name_for_a_job():
    """growth_operator_<domain> is retired. Nothing may mint one again."""
    for domain in GROWTH_OPERATOR_DOMAINS:
        assert f'growth_operator_{domain}' not in GROWTH_OPERATOR_ROLES


def test_two_domains_never_share_a_role():
    """If they did, removing one domain would revoke a role the other still
    grants — which _revoke_domain_role guards against, but only correctly while
    this holds."""
    roles = list(GROWTH_OPERATOR_DOMAIN_ROLES.values())
    assert len(roles) == len(set(roles))


def test_the_map_round_trips():
    for domain in GROWTH_OPERATOR_DOMAINS:
        assert domain_for_role(role_for_domain(domain)) == domain


def test_the_retired_names_are_still_admitted_but_never_granted():
    """Somebody carrying an old role must not lose access before migration 092
    reaches their row — but nothing may hand one out."""
    for role in LEGACY_GROWTH_OPERATOR_ROLES:
        assert role in OPERATOR_ROLES, f'{role} would lock out its holder'
        assert role not in GROWTH_OPERATOR_ROLES, f'{role} is still being granted'
        assert domain_for_role(role), f'{role} would drop off the domain screen'


def test_the_assignment_api_and_the_guard_share_ONE_domain_list():
    """They were maintained separately and drifted. That drift IS the bug —
    two lists that must agree will eventually not."""
    from routes.growth_operator_assignment_api import VALID_DOMAINS
    assert sorted(VALID_DOMAINS) == sorted(GROWTH_OPERATOR_DOMAINS)

    source = open(os.path.join(BACKEND, 'routes',
                               'growth_operator_assignment_api.py'), encoding='utf-8').read()
    assert 'GROWTH_OPERATOR_DOMAINS' in source, 'the API redefines the list again'


def test_the_assignment_api_mints_no_role_name_of_its_own():
    """It used to build them as f"growth_operator_{d}". Any string-built role
    here is a name only this module knows."""
    from tests.source_utils import code_only
    source = code_only(open(os.path.join(BACKEND, 'routes',
                       'growth_operator_assignment_api.py'), encoding='utf-8').read())
    assert 'growth_operator_{' not in source
    assert "replace('growth_operator_'" not in source
    assert 'role_for_domain(' in source


def test_naming_a_primary_domain_does_not_overwrite_the_primary_role():
    """It did. Setting somebody's primary domain wrote users.role, so naming an
    administrator's primary domain cost them 'admin'."""
    from tests.source_utils import code_only
    source = code_only(open(os.path.join(BACKEND, 'routes',
                       'growth_operator_assignment_api.py'), encoding='utf-8').read())
    primary = source[source.index('def set_primary_domain'):]
    primary = primary[:primary.index('@growth_operator_assignment_bp')
                      if '@growth_operator_assignment_bp' in primary else len(primary)]
    assert 'UPDATE users SET role' not in primary


def test_removing_a_domain_revokes_the_role_it_granted():
    """Removal used to leave the role behind, which is why two separate readers
    grew code to re-derive roles from the assignments table on every read."""
    from tests.source_utils import code_only
    source = code_only(open(os.path.join(BACKEND, 'routes',
                       'growth_operator_assignment_api.py'), encoding='utf-8').read())
    assert '_revoke_domain_role' in source


def test_no_reader_rebuilds_roles_from_the_assignments_table():
    """Those readers must not come back. A domain role is now grantable from the
    Users tab too, so a role no longer says where it came from — rebuilding the
    set on read would revoke roles an administrator granted by hand."""
    from tests.source_utils import code_only
    for rel in (('routes', 'auth_routes.py'), ('administrator_system.py',)):
        source = code_only(open(os.path.join(BACKEND, *rel), encoding='utf-8').read())
        assert 'go_from_assignments' not in source, f'{rel} rebuilds roles on read'


def test_authorisation_is_not_done_by_prefix():
    """A guard accepting anything starting with 'growth_operator_' would grant
    a future 'growth_operator_superuser' the moment somebody typed it into a
    domain list. The set is explicit for that reason."""
    assert 'growth_operator_superuser' not in OPERATOR_ROLES
    assert 'growth_operator_admin' not in OPERATOR_ROLES
    assert 'growth_operator_' not in OPERATOR_ROLES
    assert domain_for_role('growth_operator_superuser') is None


def test_the_domain_does_not_widen_what_a_role_can_reach():
    """The domain scopes WHICH companies or candidates an operator handles, and
    that is enforced from growth_operator_assignments. It is not a permission
    tier, so every domain resolves to the same authorisation."""
    reachable = {r for r in GROWTH_OPERATOR_ROLES if r in OPERATOR_ROLES}
    assert reachable == set(GROWTH_OPERATOR_ROLES)


def test_the_un_suffixed_role_still_works():
    """Existing holders of plain 'growth_operator' must not lose access to fix
    somebody else's. One real user still carries it."""
    assert 'growth_operator' in OPERATOR_ROLES
    assert domain_for_role('growth_operator') is None, 'it names no single domain'


def test_the_frontend_mirrors_the_same_domain_list():
    """ProtectedRoute checks secondary_roles, so it would have let these users
    through — if the names had been in allowedRoles. They were not."""
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'config', 'routeAccess.ts')
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    source = open(path, encoding='utf-8').read()
    for domain, role in GROWTH_OPERATOR_DOMAIN_ROLES.items():
        assert f'{domain}:' in source, f'{domain} missing from the frontend map'
        assert f"'{role}'" in source, f'{role} missing from the frontend map'
    assert 'GROWTH_OPERATOR_ROLES' in source


def test_one_name_per_role_across_every_screen():
    """The reported confusion, asserted directly.

    The Users tab, the staff invitation email and the staff directory each kept
    their own list of names. talent_operator was "Candidate Onboarding Operator"
    on one and "Talent Operator" on another, so somebody granted the first was
    appointed the second by email.
    """
    from staff_invitation_system import _staff_role_label
    from routes.staff_directory_routes import _label
    import re
    source = open(os.path.join(BACKEND, 'routes', 'administrator_routes.py'),
                  encoding='utf-8').read()
    users_tab = dict(re.findall(r"\{'id': '([a-z_]+)'.*?'display_name': '([^']+)'", source))

    for role in GROWTH_OPERATOR_DOMAIN_ROLES.values():
        canonical = label_for(role)
        assert users_tab.get(role) == canonical, (
            f'the Users tab calls {role} "{users_tab.get(role)}", '
            f'the registry "{canonical}"')
        assert _staff_role_label(role) == canonical, 'the invitation email disagrees'
        assert _label(role) == canonical, 'the staff directory disagrees'


def test_no_screen_keeps_its_own_copy_of_the_names():
    """Three lists is how they drifted. The registry is the only one."""
    from tests.source_utils import code_only
    for rel in (('staff_invitation_system.py',), ('routes', 'staff_directory_routes.py')):
        source = code_only(open(os.path.join(BACKEND, *rel), encoding='utf-8').read())
        assert '_STAFF_ROLE_LABELS = {' not in source
        assert '_EXTRA_LABELS = {' not in source
        assert 'role_labels import' in source


# ── The role list an administrator actually ticks ───────────────────────────

def _users_tab_roles():
    import re
    source = open(os.path.join(BACKEND, 'routes', 'administrator_routes.py'),
                  encoding='utf-8').read()
    block = source[source.index('def get_roles()'):source.index('seen = {}')]
    return re.findall(r"\{'id': '([a-z_]+)'.*?'display_name': '([^']+)'", block)


def test_no_role_is_offered_twice():
    """Three ids appeared twice, so six checkboxes granted three roles.

    platform_operator was a genuine duplicate — two names, two categories, the
    same grant. The other two were the WRONG ID: ticking "Student" granted
    'candidate', and ticking "Training Center Representative" granted
    'training_provider'.
    """
    import collections
    ids = [rid for rid, _ in _users_tab_roles()]
    dupes = {k: v for k, v in collections.Counter(ids).items() if v > 1}
    assert not dupes, f'the same role is offered under more than one checkbox: {dupes}'


def test_the_two_corrected_checkboxes_grant_what_they_say():
    offered = dict(_users_tab_roles())
    assert offered.get('student') == 'Student'
    assert offered.get('training_center_rep') == 'Training Center Representative'
    assert offered.get('candidate') == 'Job Seeker'
    assert offered.get('training_provider') == 'Educator'


def test_every_offered_role_is_a_role_the_platform_KNOWS():
    """A checkbox granting a name nothing recognises is the whole defect this
    file is named after, in miniature.

    "Known" means two things, and a role needs both: the platform can NAME it
    (it is in the label registry, so no screen shows a raw identifier) and some
    guard ADMITS it (it is in at least one role set, so holding it does
    something). 'student' failed the second test as recently as this morning —
    it existed in STUDENT_ROLES but no checkbox granted it.
    """
    from auth import access_control
    from auth.access_control import END_USER_ROLES
    from role_labels import ROLE_LABELS

    admitted = set()
    for name, value in vars(access_control).items():
        if name.endswith('ROLES') and isinstance(value, (set, frozenset)):
            admitted |= {str(r).lower() for r in value}

    for rid, label in _users_tab_roles():
        assert rid in ROLE_LABELS, f'"{label}" grants {rid}, which has no name'
        if rid in END_USER_ROLES:
            continue          # held by the people the platform serves; gated by
                              # what they own, not by membership of a role set
        assert rid in admitted, f'"{label}" grants {rid}, which no guard admits'


def test_the_enrolment_verified_role_cannot_be_granted_by_hand_alone():
    """`student` is granted by an advisor enrolling somebody, which writes the
    students row and the role together. Granted alone it scopes a workspace to
    an enrolment that does not exist — one person already holds it that way,
    against zero rows in `students`."""
    from auth.access_control import BOUND_ROLE_REQUIREMENTS
    assert 'student' in BOUND_ROLE_REQUIREMENTS
    kind, how = BOUND_ROLE_REQUIREMENTS['student']
    assert kind == 'enrolment'
    assert 'enrolling them' in how, 'the refusal must name the flow that works'


def test_both_corrected_roles_are_bound_roles():
    """Correcting an id changes what a checkbox GRANTS. Neither correction may
    hand out a role that means nothing without its binding."""
    from auth.access_control import BOUND_ROLE_REQUIREMENTS
    for role in ('student', 'training_center_rep'):
        assert role in BOUND_ROLE_REQUIREMENTS, f'{role} can now be granted unbound'
