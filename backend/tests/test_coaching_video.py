"""Online coaching sessions — who may enter the room, and when.

A coaching conversation is private between two people. The failure that matters
is not a crash; it is the wrong person receiving a token, so most of what
follows is about refusal.

Deliberately different from board meetings: that forum admits an admin as a
recorded observer because it is a governance body. A coaching session has
exactly two members and no observer role — the client never agreed to open the
conversation to anyone else.
"""
import os
import sys
from datetime import datetime, timedelta

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import coach_routes  # noqa: E402

COACH = '784000000000080'
CLIENT = '784000000000270'
STRANGER = '784000000000320'


class _Cur:
    def __init__(self, row): self._row = row
    def __enter__(self): return self
    def __exit__(self, *a): return False
    def execute(self, sql, params=None): self._sql = sql
    def fetchone(self): return self._row
    def fetchall(self): return [self._row] if self._row else []
    def close(self): pass


class _Conn:
    def __init__(self, row): self._row = row
    def cursor(self, **kw): return _Cur(self._row)
    def commit(self): pass
    def close(self): pass



def _now():
    """Wall-clock "now" in PLATFORM terms, as the column actually stores it.

    NOT datetime.now(). The dev box runs Gulf time and CI runs UTC, so a naive
    now() means different things in the two places — these tests passed locally
    and failed in CI for exactly that reason once the join window started
    interpreting naive values as Gulf wall-clock (#438).
    """
    try:
        from backend import platform_time
    except ImportError:
        import platform_time
    return platform_time.now().replace(tzinfo=None)


def a_session(**over):
    base = {
        'id': 1, 'coach_id': COACH, 'client_id': CLIENT,
        'room_name': 'coach-abc123def456',
        'session_date': _now(), 'duration_minutes': 60,
    }
    base.update(over)
    return base


@pytest.fixture
def app_ctx(monkeypatch):
    """A request context with a chosen identity, and the DB stubbed."""
    from flask import Flask
    app = Flask(__name__)
    app.register_blueprint(coach_routes.coach_bp)

    state = {'row': a_session(), 'identity': COACH}
    monkeypatch.setattr(coach_routes, 'get_db', lambda: _Conn(state['row']))
    monkeypatch.setattr(coach_routes, 'get_jwt_identity', lambda: state['identity'])

    class _Engine:
        def generate_livekit_token(self, room, identity, name):
            state['minted'] = {'room': room, 'identity': identity, 'name': name}
            return 'a.jwt.token'

    import types
    fake = types.ModuleType('video_interview_system')
    fake.video_interview_engine = _Engine()
    monkeypatch.setitem(sys.modules, 'video_interview_system', fake)
    monkeypatch.setitem(sys.modules, 'backend.video_interview_system', fake)

    app.state = state
    return app


def _join(app, session_id=1):
    # __wrapped__ skips @jwt_required: identity is stubbed, and token
    # verification is flask-jwt-extended's job, exercised elsewhere. What is
    # under test here is who the HANDLER lets in.
    handler = coach_routes.join_coaching_session.__wrapped__
    with app.test_request_context(f'/api/coach/sessions/{session_id}/join', method='POST'):
        resp = handler(session_id)
    body, status = (resp[0].get_json(), resp[1]) if isinstance(resp, tuple) else (resp.get_json(), 200)
    return status, body


# ── Who may enter ───────────────────────────────────────────────────────────

def test_the_coach_may_join(app_ctx):
    app_ctx.state['identity'] = COACH
    status, body = _join(app_ctx)
    assert status == 200
    assert body['data']['token'] == 'a.jwt.token'
    assert body['data']['role'] == 'coach'


def test_the_client_may_join(app_ctx):
    """The client holds no coach role, so this endpoint deliberately sits
    outside _require_coach_role — they are half the conversation."""
    app_ctx.state['identity'] = CLIENT
    status, body = _join(app_ctx)
    assert status == 200
    assert body['data']['role'] == 'client'


def test_nobody_else_may_join(app_ctx):
    app_ctx.state['identity'] = STRANGER
    status, body = _join(app_ctx)
    assert status == 403
    assert 'not your session' in body['message']
    assert 'minted' not in app_ctx.state, 'no token may be generated for a refused caller'


def test_an_admin_is_not_an_exception(app_ctx):
    """Board meetings admit an admin as an observer; a coaching session does
    not. Membership here is exactly two people, and there is no role that
    overrides the client's expectation of privacy."""
    app_ctx.state['identity'] = '784000000000240'   # a user holding admin
    status, _ = _join(app_ctx)
    assert status == 403
    assert 'minted' not in app_ctx.state


# ── When ────────────────────────────────────────────────────────────────────

def test_too_early_is_refused_with_the_opening_time(app_ctx):
    app_ctx.state['row'] = a_session(session_date=_now() + timedelta(hours=3))
    status, body = _join(app_ctx)
    assert status == 409
    assert body['error_code'] == 'too_early'
    assert 'opens at' in body['message']


def test_a_finished_session_is_closed(app_ctx):
    app_ctx.state['row'] = a_session(
        session_date=_now() - timedelta(hours=4), duration_minutes=60)
    status, body = _join(app_ctx)
    assert status == 409
    assert body['error_code'] == 'closed'


def test_the_room_opens_shortly_before_the_start(app_ctx):
    """A participant arriving a few minutes early should not be turned away."""
    app_ctx.state['row'] = a_session(session_date=_now() + timedelta(minutes=5))
    status, _ = _join(app_ctx)
    assert status == 200


def test_a_grace_period_follows_the_end(app_ctx):
    # Started an hour ago, ran 60 minutes: just ended, still joinable.
    app_ctx.state['row'] = a_session(
        session_date=_now() - timedelta(minutes=70), duration_minutes=60)
    status, _ = _join(app_ctx)
    assert status == 200


# ── Sessions without a room ─────────────────────────────────────────────────

def test_a_session_logged_after_the_fact_has_no_room(app_ctx):
    """room_name NULL is the honest representation of a conversation that
    already happened in person. It is a 400, not a 500."""
    app_ctx.state['row'] = a_session(room_name=None)
    status, body = _join(app_ctx)
    assert status == 400
    assert body['error_code'] == 'not_virtual'


def test_unknown_session_is_404(app_ctx):
    app_ctx.state['row'] = None
    status, _ = _join(app_ctx)
    assert status == 404


# ── The token ───────────────────────────────────────────────────────────────

def test_the_token_is_scoped_to_this_room_and_this_person(app_ctx):
    app_ctx.state['identity'] = CLIENT
    _join(app_ctx)
    minted = app_ctx.state['minted']
    assert minted['room'] == 'coach-abc123def456'
    assert minted['identity'] == CLIENT


def test_the_session_is_transcribed(app_ctx):
    """REVERSED 2026-08-16. This test previously asserted the opposite — that no
    agent joins a coaching room, because the client had not consented to being
    recorded.

    The owner's decision changed the premise rather than overruling it: every
    video session is now transcribed and retained, and that is disclosed in the
    terms all users accept (consent_policy.py). A government entity asked for a
    record of a session should not have to answer that it does not keep one.

    So the consent objection was answered by obtaining consent, which is the
    right way to answer it. See test_consent_policy.py for the evidence half.
    """
    app_ctx.state['identity'] = COACH
    status, body = _join(app_ctx)
    assert status == 200
    # The participant is told in the room, regardless of what the consent
    # lookup returned — the session is recorded either way.
    assert body['data']['is_recorded'] is True
    assert 'policy_version' in body['data']


def test_the_opening_time_names_which_clock(app_ctx):
    """A bare wall-clock time does not say whose clock it is.

    The comparison itself was fixed long ago (fb_1787135002): the server
    correctly decides that a session scheduled for 18:15 Gulf time has not
    opened yet. But the refusal still read "This session opens at 18:15", and a
    coach reading that at 18:32 in Brisbane concluded the platform was broken
    (fb_1787560378, 2026-08-24).

    They were right to. The server was correct and the sentence was misleading,
    which — to the person locked out of their session — is the same thing.
    """
    app_ctx.state['row'] = a_session(session_date=_now() + timedelta(hours=3))
    status, body = _join(app_ctx)
    assert status == 409
    assert 'Dubai time' in body['message'], (
        f"the refusal does not say which clock it means: {body['message']!r}"
    )


def test_the_opening_time_is_also_machine_readable(app_ctx):
    """So a client can show the reader THEIR time rather than parse a string.

    The message is a fallback. `opens_at` carries the offset, which is the only
    form a browser in another country can render correctly.
    """
    app_ctx.state['row'] = a_session(session_date=_now() + timedelta(hours=3))
    status, body = _join(app_ctx)
    assert status == 409
    assert body.get('opens_at'), 'no machine-readable opening time returned'
    from datetime import datetime
    parsed = datetime.fromisoformat(body['opens_at'])
    assert parsed.utcoffset() is not None, (
        f"opens_at carries no UTC offset, so it is as ambiguous as the string "
        f"it was meant to replace: {body['opens_at']!r}"
    )
