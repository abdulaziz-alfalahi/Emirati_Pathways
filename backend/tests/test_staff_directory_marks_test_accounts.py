"""Test personas must not read as real staff.

REPORTED BY THE OWNER 2026-09-01, looking at Admin Dashboard → Operators:
"These operators are invented. Please review and delete them."

They are invented — "Fatima Al Shamsi", "Khalid Al Mansouri", "Mariam Al
Dhaheri" — and they sat in the operators console indistinguishable from real
EHRDC staff, sorted in among them by name.

DELETING THEM IS NOT THE FIX. They are the dev-login fleet (migration 073, PR
#454): one account per role, and dev-login refuses any account not flagged
`is_test_account`. There is no password login on this platform — UAE Pass is the
sole real login — so these accounts are the only way to verify any role end to
end. Four of the five the owner pointed at are the ONLY test account for their
role: assessor, board_member, call_center_agent and talent_operator.

The flag existed the whole time. The directory simply never asked for it, so the
screen could not tell the administrator something the database already knew.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(BACKEND)
for path in (BACKEND, REPO):
    if path not in sys.path:
        sys.path.insert(0, path)

import inspect  # noqa: E402
import re  # noqa: E402

from routes import staff_directory_routes as directory  # noqa: E402
from tests.source_utils import code_only  # noqa: E402

RAW = inspect.getsource(directory)          # the SQL lives in a string literal
SOURCE = code_only(RAW)                      # comments stripped, for the rest
COMPONENT = os.path.join(REPO, 'frontend', 'src', 'components', 'admin',
                         'StaffDirectory.tsx')


def test_the_query_actually_selects_the_flag():
    """A response key populated from a column the query never selected would
    report False for everybody — the exact bug, wearing a fix.

    Scoped to the SELECT..FROM block so that a comment mentioning the column
    cannot satisfy this. code_only() is no use here: it strips string literals,
    and the query IS a string literal.
    """
    select_block = RAW[RAW.index('SELECT u.id'):RAW.index('FROM users u')]
    assert 'u.is_test_account' in select_block


def test_the_endpoint_reports_the_flag():
    assert "'is_test_account'" in SOURCE, \
        'the staff directory no longer tells the screen which rows are personas'


def test_the_flag_is_not_used_to_filter_rows_out_server_side():
    """Hiding them server-side would be a second way for this screen to mislead:
    an administrator would have no way to learn the accounts exist. The screen
    marks them and offers to hide; the endpoint returns everybody."""
    body = SOURCE[SOURCE.index('def list_staff'):]
    body = body[:body.index('return jsonify')] if 'return jsonify' in body else body
    assert not re.search(r'is_test_account\s*(IS|=)\s*(TRUE|FALSE|NOT)', body, re.I), \
        'the endpoint filters on is_test_account instead of reporting it'


def test_the_screen_marks_them():
    src = open(COMPONENT, encoding='utf-8').read()
    assert 'is_test_account' in src, 'the directory component ignores the flag'
    assert 'TEST' in src, 'no visible marker for a test persona'


def test_the_screen_does_not_hide_them_by_default():
    """Defaulting to hidden trades one misleading screen for another — the
    accounts would silently not exist. Default is to show, clearly marked."""
    src = open(COMPONENT, encoding='utf-8').read()
    assert 'useState(false)' in src.split('hideTestAccounts')[1][:40], \
        'test accounts are hidden by default'


def test_the_dev_login_fleet_is_still_the_thing_being_marked():
    """If dev-login ever stops keying on is_test_account, this marker is
    labelling the wrong set and the test should fail rather than reassure."""
    from routes import uaepass_routes
    src = code_only(inspect.getsource(uaepass_routes))
    assert 'is_test_account' in src, \
        'dev-login no longer keys on is_test_account — re-check what this marks'
