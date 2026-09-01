"""The pre-cutover check must model the real callback, not a copy of it.

Owner's question, 2026-09-01: board members were onboarded on synthetic
Emirates IDs — will they have to be onboarded again when real EIDs arrive?

Mostly no: `_migrate_user_id` moves an account onto its real Emirates ID and
repoints every foreign key. But a contact-point match into a PRIVILEGED account
is refused (issue #95), so accounts that also hold operator or admin roles
cannot rebind on an email and would silently become a second, empty account.

The value of the check is entirely in whether it agrees with the callback. A
check that reasons from its own copy of the rules would keep reporting a
reassuring answer after the rules moved, which is worse than having no check.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(BACKEND)
for path in (BACKEND, REPO):
    if path not in sys.path:
        sys.path.insert(0, path)

import pytest  # noqa: E402

from scripts import cutover_identity_check as check  # noqa: E402


# ── parity with the code that actually decides ──────────────────────────────

def test_it_uses_the_callbacks_own_role_set():
    """Imported, not copied. If uaepass_routes changes what counts as
    privileged, this check changes with it and nobody has to remember."""
    from routes.uaepass_routes import PRIVILEGED_LINK_ROLES
    assert check.PRIVILEGED_LINK_ROLES is PRIVILEGED_LINK_ROLES


def test_the_source_does_not_hardcode_a_role_list():
    import inspect
    src = inspect.getsource(check)
    body = src.split('def assess', 1)[1]
    for invented in ("'admin'", '"admin"', "'recruiter'", '"recruiter"'):
        assert invented not in body, (
            f'assess() names {invented} directly instead of using the '
            'imported role set — that is how a check goes stale')


# ── roles_of mirrors the callback's three sources ───────────────────────────

def test_roles_come_from_role_user_type_and_secondary():
    roles = check.roles_of({'role': 'candidate', 'user_type': 'job_seeker',
                            'secondary_roles': ['board_member', 'recruiter']})
    assert roles == {'candidate', 'job_seeker', 'board_member', 'recruiter'}


def test_secondary_roles_are_read_when_stored_as_text():
    """The column is jsonb, but rows written by older paths hold a string."""
    assert 'recruiter' in check.roles_of(
        {'role': 'candidate', 'user_type': None,
         'secondary_roles': '["recruiter", "board_member"]'})


def test_an_unparseable_secondary_value_is_still_counted():
    """Better to treat a malformed value as a role and over-report a strand
    than to drop it and call a privileged account safe."""
    assert 'weird' in check.roles_of(
        {'role': None, 'user_type': None, 'secondary_roles': 'weird'})


def test_missing_roles_do_not_produce_a_none_entry():
    assert check.roles_of({'role': None, 'user_type': None,
                           'secondary_roles': None}) == set()


# ── masking, because this output gets pasted into messages ──────────────────

@pytest.mark.parametrize('value, expected_visible', [
    ('someone@example.gov.ae', '@example.gov.ae'),
    ('971551234567', '97155'),
])
def test_contact_points_are_masked(value, expected_visible):
    out = check.mask(value)
    assert expected_visible in out
    assert value not in out


def test_mask_handles_nothing():
    assert check.mask(None) == '—'
    assert check.mask('') == '—'


# ── the synthetic-id definition ─────────────────────────────────────────────

def test_the_synthetic_prefix_matches_what_the_platform_mints():
    """workspace_phase2_routes mints f"7840000{seq:07d}0"; the callback tests
    startswith('7840000'). Both must agree with this script."""
    assert check.SYNTHETIC_PREFIX == '7840000'
    minted = f"7840000{42:07d}0"
    assert minted.startswith(check.SYNTHETIC_PREFIX)
    assert len(minted) == 15


def test_a_real_emirates_id_is_not_treated_as_synthetic():
    assert not '784111100000030'.startswith(check.SYNTHETIC_PREFIX)
