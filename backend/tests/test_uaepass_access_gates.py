"""UAE Pass access gates (assessment items 1, 4, 5 and the non-national clarification).

Rule 1: sign-in below the minimum assurance level (SOP1 by default) is refused.
Rule 2: a non-national signs in only with an invitation in hand or an account
        that already holds an operator-granted role.
Rule 3: a staff invitation that names an Emirates ID is redeemable only by
        that Emirates ID, asserted by UAE Pass — not by whoever holds the link.
Rule 4: UAE Pass attributes cannot be edited through the profile API once an
        account is verified.

No database: the account lookup is stubbed, the redeemer gets a mock connection.
"""
import os
import sys
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.routes import uaepass_routes as ur  # noqa: E402


# ── Rule 1: assurance level ────────────────────────────────────────────────

@pytest.mark.parametrize('user_type, level', [
    ('SOP1', 1), ('SOP2', 2), ('SOP3', 3), ('sop3', 3), (' SOP2 ', 2),
    ('', None), (None, None), ('VISITOR', None), ('SOP', None),
])
def test_sop_level_parses_what_uae_pass_sends(user_type, level):
    assert ur._sop_level({'uaepass_usertype': user_type}) == level


def test_minimum_sop_defaults_to_two_and_reads_the_env(monkeypatch):
    monkeypatch.delenv('UAEPASS_MIN_SOP', raising=False)
    assert ur._min_sop() == 2
    monkeypatch.setenv('UAEPASS_MIN_SOP', '1')
    assert ur._min_sop() == 1
    monkeypatch.setenv('UAEPASS_MIN_SOP', 'nonsense')
    assert ur._min_sop() == 2


# ── Rule 2: nationality ────────────────────────────────────────────────────

@pytest.mark.parametrize('nat, national', [
    ('ARE', True), ('UAE', True), ('are', True), ('United Arab Emirates', True),
    ('OMN', False), ('EGY', False), ('IND', False), ('', False), (None, False),
])
def test_uae_nationality_codes(nat, national):
    assert ur._is_uae_national({'nationality': nat}) is national


def test_an_invitation_in_this_sign_in_authorises_a_non_national(monkeypatch):
    monkeypatch.setattr(ur, '_existing_account', lambda p: pytest.fail('must not hit the DB'))
    assert ur._non_national_authorised({'nationality': 'OMN'}, {'invitation_token': 'tok'})


def test_an_account_with_a_granted_role_authorises_a_non_national(monkeypatch):
    monkeypatch.setattr(ur, '_existing_account',
                        lambda p: {'id': '784200000000001', 'role': 'career_services_operator',
                                   'secondary_roles': []})
    assert ur._non_national_authorised({'nationality': 'EGY'}, {})


def test_a_secondary_role_counts_as_granted():
    assert ur._holds_granted_role({'role': 'candidate', 'secondary_roles': ['mentor']})
    assert ur._holds_granted_role({'role': 'candidate', 'secondary_roles': '["coach"]'})


def test_a_bare_candidate_account_does_not_authorise_a_non_national(monkeypatch):
    """The live DB held exactly this: an Omani candidate with no invitation.
    Existing does not mean authorised."""
    monkeypatch.setattr(ur, '_existing_account',
                        lambda p: {'id': '784000000000570', 'role': 'candidate', 'secondary_roles': []})
    assert not ur._non_national_authorised({'nationality': 'OMN'}, {})


def test_no_account_and_no_invitation_is_refused(monkeypatch):
    monkeypatch.setattr(ur, '_existing_account', lambda p: None)
    assert not ur._non_national_authorised({'nationality': 'IND'}, {'invitation_token': ''})


# ── Rule 3: the invitation names the person ────────────────────────────────

def _redeemer_with(invitation_row):
    from backend.staff_invitation_system import StaffInvitationSystem
    system = StaffInvitationSystem()
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchone.side_effect = [invitation_row, {'id': '784200000000001', 'role': 'candidate'}]
    conn.cursor.return_value.__enter__.return_value = cur
    system._conn = MagicMock(return_value=conn)
    return system, conn, cur


def test_a_different_emirates_id_cannot_accept_a_named_invitation():
    system, conn, _ = _redeemer_with(
        {'id': 1, 'intended_role': 'career_services_operator', 'emirates_id': '784199900000001'})
    with pytest.raises(ValueError, match='different Emirates ID'):
        system.redeem_staff_invitation_for_user('tok', '784200000000001', proven_eid='784-2000-0000000-1')
    conn.commit.assert_not_called()


def test_a_named_invitation_needs_a_verified_account():
    system, conn, _ = _redeemer_with(
        {'id': 1, 'intended_role': 'career_services_operator', 'emirates_id': '784199900000001'})
    with pytest.raises(ValueError, match='verified UAE Pass'):
        system.redeem_staff_invitation_for_user('tok', '784000000000999', proven_eid='')
    conn.commit.assert_not_called()


def test_the_named_person_accepts_hyphens_or_not():
    system, conn, cur = _redeemer_with(
        {'id': 1, 'intended_role': 'career_services_operator', 'emirates_id': '784199900000001',
         'full_name': 'A', 'email': None, 'phone': None})
    res = system.redeem_staff_invitation_for_user('tok', '784199900000001', is_new_user=True,
                                                  proven_eid='784-1999-0000000-1')
    assert res['role'] == 'career_services_operator'
    conn.commit.assert_called_once()


def test_an_unnamed_invitation_keeps_working_for_existing_rows():
    system, conn, _ = _redeemer_with(
        {'id': 1, 'intended_role': 'career_services_operator', 'emirates_id': None,
         'full_name': 'A', 'email': None, 'phone': None})
    res = system.redeem_staff_invitation_for_user('tok', '784200000000001', is_new_user=False,
                                                  proven_eid=None)
    assert res['role'] == 'career_services_operator'
    conn.commit.assert_called_once()


# ── Rule 4: UAE Pass owns the identity attributes ──────────────────────────

def test_profile_api_drops_uaepass_attributes_for_verified_accounts():
    from backend.auth.auth_manager_fixed import AuthenticationManager
    mgr = AuthenticationManager()
    conn = MagicMock()
    cur = MagicMock()
    # the verification lookup, then the profile_data read
    cur.fetchone.side_effect = [{'uaepass_uuid': 'abc'}, {'profile_data': {}}]
    conn.cursor.return_value = cur
    mgr._get_db_connection = MagicMock(return_value=conn)
    mgr.update_user_profile('784200000000001', {'personal_info': {
        'first_name': 'X', 'last_name': 'Y', 'nationality': 'OMN', 'phone': '+971500000000'}})
    updates = [c.args[0] for c in cur.execute.call_args_list if 'UPDATE users' in c.args[0]]
    assert updates, 'the contact field must still be written'
    assert 'phone = %s' in updates[0]
    for owned in ('first_name', 'last_name', 'nationality'):
        assert f'{owned} = %s' not in updates[0]
