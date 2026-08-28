"""Signing in has to leave a mark, or "when did they last use it" has no answer.

WHY THIS FILE EXISTS

Asked on 2026-08-27 whether an operator had issued an invitation to a real
employer, users.last_login said he had not signed in for twelve days. The audit
log showed him working that same afternoon.

The column was written by the legacy PASSWORD auth managers and by dev-login.
UAE Pass is the sole real login and never touched it, so for every real user it
held whatever a password login last wrote — frozen, and read as current
everywhere it was shown, including the "Last signed in" column on the operators
screen.

A stale timestamp presented as a current fact is worse than an empty one: it
argues confidently for the wrong conclusion. It nearly produced the answer "he
was not even on the platform", about somebody who was.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from tests.source_utils import code_only  # noqa: E402

SOURCE = code_only(open(os.path.join(BACKEND, 'routes', 'uaepass_routes.py'),
                        encoding='utf-8').read())


def _callback():
    start = SOURCE.index('def uaepass_callback')
    end = SOURCE.index('def uaepass_logout')
    return SOURCE[start:end]


def test_the_real_login_records_the_sign_in():
    """The path every real user takes. dev-login already did this; the one that
    matters did not."""
    assert 'last_login = NOW()' in _callback()


def test_dev_login_still_records_it_too():
    start = SOURCE.index('dev-login')
    assert 'last_login = NOW()' in SOURCE[start:]


def test_bookkeeping_never_costs_somebody_their_session():
    """They have just proved their identity with UAE Pass. A failed UPDATE must
    not turn that into a failed login."""
    callback = _callback()
    write = callback.index('last_login = NOW()')
    around = callback[max(0, write - 700):write + 400]
    assert 'try:' in around and 'except Exception' in around


def test_the_write_happens_before_the_tokens_are_issued():
    """Not for correctness — for readability. The sign-in is recorded where the
    sign-in is decided, not appended after the response is half-built."""
    callback = _callback()
    assert callback.index('last_login = NOW()') < callback.index('create_access_token(')
