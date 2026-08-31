"""Assigning a growth domain must not destroy a person's other roles.

Reported 2026-08-27 (fb_1787816290): "I added Samir to the Company Growth role,
but he told me he wasn't granted access. Do I have to assign him the role from
the users tab?"

Two screens write `users.secondary_roles` — the Users tab and the growth-domain
assignment screen — and the second REPLACED the field with only the roles it
derives from the assigned domains. Everything the Users tab had granted
(assessor, coach, call_center_agent, career_services_operator, …) vanished on
save, silently.

Measured against the live database on 2026-08-31, before the fix:

    users holding any secondary role                     28
    of those, holding a role a domain save would DESTROY 24
    worst case: one person holding 22 roles, cut to 1

The screen may own the seven domain roles. It may not own the rest.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from routes.growth_operator_assignment_api import merge_domain_roles  # noqa: E402
from auth.access_control import GROWTH_OPERATOR_DOMAIN_ROLES  # noqa: E402

COMPANY = GROWTH_OPERATOR_DOMAIN_ROLES['company']        # employer_relations
CANDIDATE = GROWTH_OPERATOR_DOMAIN_ROLES['candidate']    # talent_operator
EDUCATION = GROWTH_OPERATOR_DOMAIN_ROLES['education']


# ── the reported bug ────────────────────────────────────────────────────────

def test_assigning_a_domain_keeps_roles_granted_elsewhere():
    """The whole report. A call-centre operator holding three roles must not
    lose two of them because somebody assigned him a domain."""
    before = ['career_services_operator', 'call_center_agent']
    after = merge_domain_roles(before, ['company'])
    assert 'career_services_operator' in after
    assert 'call_center_agent' in after
    assert COMPANY in after


def test_the_worst_case_on_the_live_data_is_preserved():
    """One person held 22 secondary roles. A domain save used to leave them 1."""
    before = ['recruiter', 'platform_operator', 'career_services_operator',
              'employer_relations', 'professional_dev_operator', 'compliance_auditor',
              'call_center_agent', 'talent_operator', 'board_member', 'employer_admin',
              'candidate', 'assessment_operator', 'mentorship_operator',
              'community_operator', 'assessor', 'mentor', 'training_provider',
              'parent', 'advisor', 'internship_coordinator', 'coach', 'education_operator']
    after = merge_domain_roles(before, ['company'])
    for role in ('recruiter', 'assessor', 'mentor', 'coach', 'advisor', 'parent',
                 'board_member', 'employer_admin', 'call_center_agent'):
        assert role in after, f'{role} was destroyed by a domain assignment'
    assert len(after) > 10


# ── it still owns the domain namespace ──────────────────────────────────────

def test_removing_a_domain_removes_its_role():
    """Reconciliation has to work in both directions, or a revoked domain would
    leave the access behind."""
    before = [COMPANY, CANDIDATE, 'assessor']
    after = merge_domain_roles(before, ['company'])
    assert COMPANY in after
    assert CANDIDATE not in after, 'a domain that was taken away kept its role'
    assert 'assessor' in after


def test_assigning_no_domains_strips_every_domain_role_and_nothing_else():
    before = [COMPANY, CANDIDATE, EDUCATION, 'coach', 'assessor']
    after = merge_domain_roles(before, [])
    assert after == ['coach', 'assessor']


def test_saving_the_same_domains_twice_changes_nothing():
    """An idempotent save: an operator pressing Save again must not accumulate
    duplicates in the jsonb array."""
    once = merge_domain_roles(['assessor'], ['company', 'candidate'])
    twice = merge_domain_roles(once, ['company', 'candidate'])
    assert once == twice
    assert len(twice) == len(set(twice))


def test_every_domain_maps_to_a_role():
    """A domain with no role would assign access that authorises nothing —
    the shape of the original growth_operator_<domain> defect."""
    for domain in GROWTH_OPERATOR_DOMAIN_ROLES:
        assert merge_domain_roles([], [domain]), f'{domain} granted no role'


# ── it must not fall over on real-world data ────────────────────────────────

@pytest.mark.parametrize('existing,expected', [
    (None,                 [COMPANY]),
    ([],                   [COMPANY]),
    (['assessor'],         ['assessor', COMPANY]),
    ([None, 'assessor'],   ['assessor', COMPANY]),
    (['', 'assessor'],     ['', 'assessor', COMPANY]),
])
def test_it_survives_whatever_is_in_the_column(existing, expected):
    """secondary_roles is free-form jsonb written by more than one screen, so it
    can hold nulls. The exact output is asserted rather than a property, because
    a loose assertion here would pass whatever the function did."""
    assert merge_domain_roles(existing, ['company']) == expected


def test_a_non_string_in_the_column_is_dropped_not_kept():
    out = merge_domain_roles(['assessor', None, 42], ['company'])
    assert out == ['assessor', COMPANY]


# ── the domain tiles must respond to a click ────────────────────────────────
#
# Reported 2026-08-27 (fb_1787815977): "When selecting 'Growth Operator Company'
# role, the page opens; however, none of the available options are clickable."
#
# The tile carried onClick AND the checkbox inside it handled its own change, so
# clicking the checkbox toggled twice — once for itself, once as the event
# bubbled to the tile — for a net change of nothing. Clicking the tile's
# whitespace worked, which is why it read as broken rather than fiddly.

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')
MANAGER = os.path.join(FRONTEND, 'components', 'admin',
                       'GrowthOperatorManagerEnhanced.tsx')


def _manager_code():
    if not os.path.exists(MANAGER):
        pytest.skip('GrowthOperatorManagerEnhanced.tsx not present')
    src = open(MANAGER, encoding='utf-8').read()
    out, i, n = [], 0, len(src)
    while i < n:
        two = src[i:i + 2]
        if two == '/*':
            j = src.find('*/', i + 2)
            i = n if j == -1 else j + 2
        elif two == '//':
            j = src.find('\n', i)
            i = n if j == -1 else j
        else:
            out.append(src[i]); i += 1
    return ''.join(out)


def test_only_one_thing_handles_a_domain_tile_click():
    """Two handlers on nested elements cancel each other out."""
    code = _manager_code()
    block = code[code.index('Select Domains'):code.index('Select Domains') + 1800]
    assert 'onCheckedChange={() => handleDomainToggle' not in block, \
        'the checkbox handles the change again and cancels the tile click'


def test_the_domain_tile_is_reachable_by_keyboard():
    """It is a div acting as a control. Without this it cannot be operated
    without a mouse — the checkbox that used to carry the role is now
    presentational."""
    code = _manager_code()
    block = code[code.index('Select Domains'):code.index('Select Domains') + 1800]
    assert 'role="checkbox"' in block, 'the tile announces no role'
    assert 'aria-checked' in block, 'nothing conveys whether the domain is selected'
    assert 'onKeyDown' in block, 'the tile cannot be operated from the keyboard'
