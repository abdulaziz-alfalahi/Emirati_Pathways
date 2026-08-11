"""Identity gate on seeker redemption.

Nothing else checks that the person completing UAE Pass is the person the
invitation was issued to — the link is the only credential. Without this gate a
forwarded or intercepted invitation hands over the invitee's government-supplied
profile (education, GPA, disability status), not merely an account.

Owner decisions 2026-08-11: refuse on a positive EID mismatch; keep age_group in
tier 1.
"""
import os
import sys
from unittest.mock import MagicMock

import pytest

_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_here)
for p in (os.path.dirname(_backend), _backend):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.nafis_talent_system import (
        NafisTalentSystem, _TIER2_VERIFIED_ONLY, _eid_digits, _NAFIS_PROFILE_MAP)
except ImportError:  # pragma: no cover
    from nafis_talent_system import (
        NafisTalentSystem, _TIER2_VERIFIED_ONLY, _eid_digits, _NAFIS_PROFILE_MAP)


def _system(rows):
    sysm = NafisTalentSystem()
    conn, cur = MagicMock(), MagicMock()
    cur.fetchone.side_effect = rows
    conn.cursor.return_value.__enter__.return_value = cur
    sysm._get_db_connection = lambda: conn
    sysm.ensure_tables = lambda: None
    return sysm, conn, cur


INV = {'id': 5, 'seeker_id': 9, 'is_used': False,
       'full_name': 'Sara A', 'emirates_id': '784-1234-1234567-1'}


def test_eid_compared_on_digits_only():
    """NAFIS stores 784-1234-1234567-1; UAE Pass returns unpunctuated."""
    assert _eid_digits('784-1234-1234567-1') == _eid_digits('784123412345671')
    assert _eid_digits(None) == '' and _eid_digits('') == ''


def test_mismatch_refuses_redemption():
    """The owner's decision: a positive mismatch is evidence the wrong person
    holds the link — refuse, do not merely withhold data."""
    sysm, conn, cur = _system([INV, {'id': '784000000000420'}])
    with pytest.raises(ValueError) as e:
        sysm.redeem_seeker_invitation_for_user(
            'tok', '784000000000420', proven_eid='784999999999999')
    assert 'different Emirates ID' in str(e.value)
    conn.commit.assert_not_called()


def test_absent_eid_proceeds_but_withholds_tier2():
    """Most personas (SOP1) return no EID. Refusing would block onboarding
    entirely rather than make it safer."""
    sysm, conn, cur = _system([
        INV, {'id': '784000000000420'},
        {'full_name': 'Sara A', 'education_level': 'Bachelor',
         'is_person_of_determination': True, 'marital_status': 'Single'},
        None,
    ])
    sysm.redeem_seeker_invitation_for_user('tok', '784000000000420', proven_eid=None)
    # only the WRITE matters — the read SELECTs every NAFIS column regardless
    writes = ' '.join(c.args[0] for c in cur.execute.call_args_list
                      if 'INSERT INTO candidate_profiles' in c.args[0]
                      or 'UPDATE candidate_profiles' in c.args[0])
    assert writes, 'no candidate_profiles write happened'
    for col in _TIER2_VERIFIED_ONLY:
        assert col not in writes, f'{col} must be withheld when the EID is unverified'
    assert 'education_level' in writes, 'tier 1 must still be seeded'
    conn.commit.assert_called_once()


def test_matching_eid_seeds_everything():
    sysm, conn, cur = _system([
        INV, {'id': '784000000000420'},
        {'full_name': 'Sara A', 'education_level': 'Bachelor',
         'is_person_of_determination': True, 'marital_status': 'Single'},
        None,
    ])
    sysm.redeem_seeker_invitation_for_user(
        'tok', '784000000000420', proven_eid='784123412345671')
    writes = ' '.join(c.args[0] for c in cur.execute.call_args_list
                      if 'INSERT INTO candidate_profiles' in c.args[0]
                      or 'UPDATE candidate_profiles' in c.args[0])
    for col in _TIER2_VERIFIED_ONLY:
        assert col in writes, f'{col} should be seeded once the EID matches'


def test_age_group_stays_in_tier_1():
    """Owner decision — demographic, but matching and reporting use it."""
    assert 'age_group' not in _TIER2_VERIFIED_ONLY
    assert any(dst == 'age_group' for _s, dst, _t in _NAFIS_PROFILE_MAP)


def test_tier2_is_exactly_the_fields_uaepass_cannot_supply():
    """full_name/phone/gender come from UAE Pass at rank 1, so gating them would
    be pointless. What remains is what only the import can provide."""
    assert _TIER2_VERIFIED_ONLY == {
        'is_person_of_determination', 'determination_type',
        'marital_status', 'military_status'}
