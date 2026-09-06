"""A candidate invites a recruiter to view them (migration 110) — no database."""
import os
import sys
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend import candidate_referrals as cr  # noqa: E402


def _system(fetchone_results, fetchall_results=None):
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchone.side_effect = list(fetchone_results)
    cur.fetchall.side_effect = list(fetchall_results or [[]] * 10)
    conn.cursor.return_value.__enter__.return_value = cur
    system = cr.CandidateReferralSystem(db_connection=conn)
    return system, conn, cur


def test_recruiter_already_on_the_platform_is_granted_and_notified(monkeypatch):
    notify = MagicMock()
    monkeypatch.setattr(cr, '_notify', notify)
    monkeypatch.setattr(cr, 'find_company_id', lambda cur, name, tl=None: None)
    system, conn, cur = _system([
        {'id': '784000000000220', 'full_name': 'Dev Recruiter'},            # user by email
        {'id': 7, 'candidate_id': '784000000000060', 'recruiter_name': 'Sara', 'recruiter_email': 'sara@adnoc.ae',
         'status': 'granted', 'company_id': None},                          # inserted row
        {'full_name': 'Test Student'},                                      # candidate name
    ])
    row = system.create('784000000000060', ' Sara ', 'Sara@ADNOC.ae ', 'ADNOC', 'we met')
    assert row['route'] == 'granted'
    insert = [c for c in cur.execute.call_args_list if 'INSERT INTO candidate_recruiter_referrals' in c.args[0]][0]
    assert insert.args[1][2] == 'sara@adnoc.ae' and insert.args[1][5] == '784000000000220' and insert.args[1][7] == 'granted'
    notify.assert_called_once()
    assert notify.call_args.args[0] == '784000000000220' and notify.call_args.args[1] == 'referral_received'
    conn.commit.assert_called_once()


def test_company_on_the_platform_asks_its_admins(monkeypatch):
    notify = MagicMock()
    monkeypatch.setattr(cr, '_notify', notify)
    monkeypatch.setattr(cr, 'find_company_id', lambda cur, name, tl=None: 'c0mp-uuid')
    system, conn, cur = _system(
        [None,                                                                # no user by email
         {'id': 8, 'candidate_id': '784000000000060', 'recruiter_name': 'Sara', 'recruiter_email': 'sara@adnoc.ae',
          'status': 'pending', 'company_id': 'c0mp-uuid'},
         {'full_name': 'Test Student'}],
        [[{'user_id': '784000000000120'}, {'user_id': '784000000000030'}]],  # the company's admins
    )
    row = system.create('784000000000060', 'Sara', 'sara@adnoc.ae', 'ADNOC')
    assert row['route'] == 'company_admins'
    assert notify.call_count == 2 and notify.call_args_list[0].args[1] == 'referral_pending_company'


def test_unknown_company_goes_to_the_operators(monkeypatch):
    monkeypatch.setattr(cr, '_notify', MagicMock())
    monkeypatch.setattr(cr, 'find_company_id', lambda cur, name, tl=None: None)
    system, conn, cur = _system([None, {'id': 9, 'candidate_id': 'x', 'recruiter_name': 'Sara', 'recruiter_email': 's@new.ae',
                                        'status': 'pending', 'company_id': None}, {'full_name': 'T'}])
    assert system.create('784000000000060', 'Sara', 's@new.ae', 'New Co')['route'] == 'operators'


@pytest.mark.parametrize('name, email', [('', 's@x.ae'), ('Sara', ''), ('Sara', 'not-an-email')])
def test_a_name_and_a_valid_email_are_required(name, email):
    system, conn, cur = _system([])
    with pytest.raises(ValueError):
        system.create('784000000000060', name, email)
    conn.commit.assert_not_called()


def test_revoke_is_scoped_to_the_candidate():
    system, conn, cur = _system([{'recruiter_user_id': None}])
    assert system.revoke('784000000000060', 7) is True
    sql, params = cur.execute.call_args.args
    assert 'candidate_id = %s' in sql and params == (7, '784000000000060')
    system2, conn2, cur2 = _system([None])
    assert system2.revoke('784000000000999', 7) is False


def test_lazy_link_grants_pending_referrals_for_the_account_email(monkeypatch):
    notify = MagicMock()
    monkeypatch.setattr(cr, '_notify', notify)
    cur = MagicMock()
    cur.fetchall.return_value = [{'id': 3, 'candidate_id': '784000000000060', 'recruiter_name': 'Sara'}]
    assert cr.CandidateReferralSystem.link_for_user(cur, '784000000000220', 'Sara@ADNOC.ae') == 1
    sql, params = cur.execute.call_args.args
    assert "status = 'pending'" in sql and params == ('784000000000220', 'sara@adnoc.ae')
    assert notify.call_args.args[0] == '784000000000060' and notify.call_args.args[1] == 'referral_granted'
    assert cr.CandidateReferralSystem.link_for_user(cur, 'x', '') == 0


def test_record_view_only_counts_a_live_grant():
    system, conn, cur = _system([])
    cur.rowcount = 1
    assert system.record_view('784000000000220', '784000000000060') is True
    sql = cur.execute.call_args.args[0]
    assert "status = 'granted'" in sql and 'grant_expires_at > now()' in sql and 'view_count + 1' in sql
