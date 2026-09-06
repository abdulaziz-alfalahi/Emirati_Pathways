"""The user payload's company comes from the ACL's store, not the legacy one."""
import os
import sys
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.user_company import resolve_user_company, MEMBERSHIP_SQL, LEGACY_SQL  # noqa: E402


def _cur(*rows):
    cur = MagicMock()
    cur.fetchone.side_effect = list(rows)
    return cur


def test_membership_wins_over_hr_profiles():
    cur = _cur({'company_id': 'a3d37974-real', 'company_name': 'ZZ-E2E Platform Company'})
    assert resolve_user_company(cur, '784000000000120') == ('a3d37974-real', 'ZZ-E2E Platform Company')
    assert cur.execute.call_count == 1
    assert 'company_team_members' in cur.execute.call_args.args[0]
    assert "invitation_status = 'accepted'" in MEMBERSHIP_SQL


def test_falls_back_to_hr_profiles_only_for_a_company_that_still_exists():
    cur = _cur(None, ('89692012-legacy', 'Legacy Co'))
    assert resolve_user_company(cur, 'u') == ('89692012-legacy', 'Legacy Co')
    assert cur.execute.call_count == 2
    # the legacy query JOINs companies, so a deleted company yields no row
    assert 'JOIN companies' in LEGACY_SQL


def test_nothing_known_returns_none_without_raising():
    assert resolve_user_company(_cur(None, None), 'u') is None
    assert resolve_user_company(_cur({'company_id': None, 'company_name': None}, None), 'u') is None


def test_admin_membership_is_preferred_and_ids_are_strings():
    assert "(tm.role = 'admin') DESC" in MEMBERSHIP_SQL
    cur = _cur((12345, 'Tuple Co'))
    assert resolve_user_company(cur, 'u') == ('12345', 'Tuple Co')
