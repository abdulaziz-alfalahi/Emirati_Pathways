"""The two fixes behind the 2026-08-31 video-interview verification.

1. A TIME column made GET /api/video-interview/sessions/<id> return 500 for
   every interview ever scheduled (15 of 15 rows).
2. psycopg2 froze the single gevent worker, expiring Socket.IO sessions and
   producing the 400 reconnect loop that also disabled the call's P2P fallback.

Both are tested without a database and without gevent: the first is a pure
encoding question, the second a pure "did we decide to patch" question.
"""
import datetime
import decimal
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402
from flask import Flask, jsonify  # noqa: E402

from json_provider import DatabaseFriendlyJSONProvider  # noqa: E402


@pytest.fixture()
def client():
    app = Flask(__name__)
    app.json = DatabaseFriendlyJSONProvider(app)

    @app.route('/row')
    def row():
        return jsonify(app.config['ROW'])

    app.config['ROW'] = {}
    return app


def render(app, value):
    app.config['ROW'] = {'v': value}
    return app.test_client().get('/row')


# ── the column that actually broke ──────────────────────────────────────────

def test_a_time_column_no_longer_returns_500(client):
    """The exact failure: interview_schedules.scheduled_time is a TIME."""
    r = render(client, datetime.time(20, 30, 35))
    assert r.status_code == 200
    assert r.get_json()['v'] == '20:30:35'


def test_a_whole_session_row_serialises(client):
    """A realistic row from SELECT s.* — the shape that 500'd."""
    r = render(client, {
        'interview_id': '4ecd0fa0-20da-4029-abdd-5b4e00c98ae9',
        'scheduled_date': datetime.date(2026, 8, 30),
        'scheduled_time': datetime.time(20, 30, 35),
        'duration_minutes': 30,
        'created_at': datetime.datetime(2026, 8, 31, 0, 25, 39),
        'rating': decimal.Decimal('4.5'),
        'notes': None,
    })
    assert r.status_code == 200
    body = r.get_json()['v']
    assert body['scheduled_time'] == '20:30:35'
    # Flask's own rendering of DATE, left exactly as it was
    assert body['scheduled_date'] == 'Sun, 30 Aug 2026 00:00:00 GMT'
    assert body['rating'] == '4.5'


# ── the rest of what psycopg2 hands back ────────────────────────────────────

def test_an_interval_is_a_number_not_a_python_repr(client):
    """'1 day, 0:00:00' is unparseable in JavaScript; seconds are not."""
    r = render(client, datetime.timedelta(hours=1, minutes=30))
    assert r.status_code == 200
    assert r.get_json()['v'] == 5400.0


def test_numeric_keeps_its_precision(client):
    """float() would round a rate or an amount. A string round-trips exactly."""
    r = render(client, decimal.Decimal('12345.675'))
    assert r.status_code == 200
    assert r.get_json()['v'] == '12345.675'


def test_bytea_does_not_explode(client):
    r = render(client, memoryview(b'\x00\xff'))
    assert r.status_code == 200
    assert r.get_json()['v'] == '00ff'


# ── the guarantee that makes this safe to apply app-wide ────────────────────

@pytest.mark.parametrize('value,expected', [
    ('text', 'text'),
    (42, 42),
    (3.5, 3.5),
    (True, True),
    (None, None),
    ([1, 2], [1, 2]),
    ({'a': 1}, {'a': 1}),
    (datetime.date(2026, 8, 30), 'Sun, 30 Aug 2026 00:00:00 GMT'),
])
def test_everything_flask_already_encoded_is_unchanged(client, value, expected):
    """The provider only ADDS types. A response that worked before must encode
    identically now — this is what makes a global provider safe rather than a
    silent change to ~90 blueprints."""
    r = render(client, value)
    assert r.status_code == 200
    assert r.get_json()['v'] == expected


def test_an_unknown_type_still_raises(client):
    """It must not paper over a genuine bug by stringifying anything."""
    class Weird:
        pass
    with pytest.raises(TypeError):
        DatabaseFriendlyJSONProvider.default(Weird())


def test_the_app_actually_installs_the_provider():
    """A provider written but never wired would leave the 500 in place."""
    import re
    body = open(os.path.join(BACKEND, 'app.py'), encoding='utf-8').read()
    assert re.search(r'app\.json\s*=\s*DatabaseFriendlyJSONProvider\(app\)', body), \
        'app.py does not install the JSON provider'


# ── the outage guard ────────────────────────────────────────────────────────
#
# psycogreen was added on 2026-08-31 to stop psycopg2 freezing the single
# Socket.IO worker, and took the backend down within a day: it removed the
# accidental serialisation that was the only thing making a SHARED psycopg2
# connection safe, and two greenlets deadlocked on it. See gevent_db.py.

from gevent_db import patch_psycopg2_for_gevent  # noqa: E402


def test_the_gevent_patch_is_disabled():
    """It must stay a no-op until no connection is shared between greenlets."""
    assert patch_psycopg2_for_gevent() is False


def test_the_app_does_not_install_the_patch():
    """The outage was caused by calling this at import. If someone re-adds the
    call without first fixing the shared connections, this fails."""
    body = open(os.path.join(BACKEND, 'app.py'), encoding='utf-8').read()
    assert 'patch_psycopg2_for_gevent()' not in body, (
        'app.py calls the gevent patch again — read gevent_db.py first: this '
        'deadlocked the worker on administrator_system\'s shared connection')


def test_psycogreen_is_not_a_dependency():
    req = open(os.path.join(BACKEND, 'requirements.txt'), encoding='utf-8').read()
    assert 'psycogreen' not in req


def test_the_reason_is_recorded_where_someone_would_look():
    """The next person hits the same symptom; the docstring is what stops them
    repeating the fix."""
    doc = open(os.path.join(BACKEND, 'gevent_db.py'), encoding='utf-8').read()
    assert 'may not be shared between greenlets' in doc
    assert 'administrator' in doc.lower()
