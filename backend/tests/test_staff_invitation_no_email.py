"""A staff invitation without an email address must still be created.

The admin form marks the address optional (the link can be handed over in
person), but create_invitation queued a mail regardless and the NOT NULL on
outbound_mail.to_email failed the whole request with a 500 — found while
recording the UAE Pass assessment scenario "administrator authorises a
non-national" on 2026-09-04.
"""
import os
import sys
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend import staff_invitation_system as sis  # noqa: E402


def _system():
    system = sis.StaffInvitationSystem()
    conn = MagicMock()
    cur = MagicMock()
    cur.fetchone.return_value = {'id': 7, 'token': 'tok', 'full_name': 'ZZ-E2E', 'email': None,
                                 'intended_role': 'career_services_operator', 'emirates_id': '784199900000001'}
    conn.cursor.return_value.__enter__.return_value = cur
    system._conn = MagicMock(return_value=conn)
    return system, conn, cur


def test_no_email_creates_the_invitation_and_queues_nothing(monkeypatch):
    queue = MagicMock(return_value=99)
    monkeypatch.setattr(sis.outbound_mail, 'queue', queue)
    monkeypatch.setattr(sis, 'record_invitation', MagicMock())
    system, conn, cur = _system()
    row = system.create_invitation(full_name='ZZ-E2E', email=None, intended_role='career_services_operator',
                                   invited_by='784000000000020', emirates_id='784199900000001')
    queue.assert_not_called()
    conn.commit.assert_called_once()
    assert row['message_status'] == 'no_address'
    assert row['magic_link']
    insert = [c.args for c in cur.execute.call_args_list if 'INSERT INTO staff_invitations' in c.args[0]][0]
    assert 'emirates_id' in insert[0] and insert[1][-1] == '784199900000001'


def test_with_email_the_mail_is_queued_as_before(monkeypatch):
    queue = MagicMock(return_value=99)
    monkeypatch.setattr(sis.outbound_mail, 'queue', queue)
    monkeypatch.setattr(sis, 'record_invitation', MagicMock())
    system, conn, _ = _system()
    row = system.create_invitation(full_name='ZZ-E2E', email='zz@example.com',
                                   intended_role='career_services_operator', invited_by='784000000000020')
    queue.assert_called_once()
    assert queue.call_args.kwargs['kind'] == 'staff_invitation'
    assert row['message_status'] == 'awaiting_approval'
