"""Read auditing for staff access to other people's personal data.

The failure modes that matter here are quiet ones. An audit trail that records
the load balancer instead of the agent, or that silently drops rows when the
database hiccups, or that breaks the endpoint it is supposed to be observing,
all look fine from the outside. So most of what follows is about those rather
than about the happy path.
"""
import json
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pii_access_log as pal  # noqa: E402

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


def _fn(src, name):
    """The body of one route handler, up to the next route decorator."""
    body = src.split('def %s' % name, 1)[1]
    for marker in ('\n@crm_profile_bp.route', '\n@candidate_profile_bp.route',
                   '\n@coach_bp.route'):
        body = body.split(marker)[0]
    return body


# ── The client IP: the whole point of the exercise ───────────────────────────

class _Req:
    def __init__(self, headers=None, remote='1.2.3.4', args=None):
        self.headers = headers or {}
        self.remote_addr = remote
        self.args = args or {}


@pytest.fixture
def in_request(monkeypatch):
    """Stand in for a Flask request context."""
    state = {'req': _Req()}
    import flask
    monkeypatch.setattr(flask, 'has_request_context', lambda: True)
    monkeypatch.setattr(flask, 'request', property(lambda self: None), raising=False)
    # `from flask import request` binds the module attribute, so patch that.
    monkeypatch.setattr(flask, 'request', state['req'], raising=False)
    return state


def test_x_forwarded_for_wins_over_remote_addr(in_request):
    """In production every request arrives from the load balancer VIP
    (10.228.145.7 — Moro, 2026-08-17). Recording remote_addr would identify
    nobody, which is the difference between an audit trail and a row count."""
    in_request['req'] = _Req(headers={'X-Forwarded-For': '94.200.11.5'},
                             remote='10.228.145.7')
    import flask
    flask.request = in_request['req']
    got = pal.client_ip()
    assert got['ip'] == '94.200.11.5'
    assert got['ip_source'] == 'x_forwarded_for'


def test_the_leftmost_xff_entry_is_the_client(in_request):
    """XFF is a proxy chain. The client is the first hop; the rest are the WAF
    and the load balancer."""
    import flask
    flask.request = _Req(headers={'X-Forwarded-For': '94.200.11.5, 10.228.145.229, 10.228.145.7'})
    assert pal.client_ip()['ip'] == '94.200.11.5'


def test_remote_addr_is_the_fallback_and_says_so(in_request):
    """When no forwarding header is present the value is still recorded, but
    ip_source marks it — so a log full of load-balancer addresses is visibly
    diagnosable instead of quietly useless."""
    import flask
    flask.request = _Req(headers={}, remote='10.228.145.7')
    got = pal.client_ip()
    assert got['ip'] == '10.228.145.7'
    assert got['ip_source'] == 'remote_addr'


def test_no_request_context_is_not_a_crash():
    got = pal.client_ip()
    assert got['ip'] is None
    assert got['ip_source'] in ('no_request', 'no_flask')


# ── The write path ───────────────────────────────────────────────────────────

def _capture(monkeypatch, fail=False):
    """Capture the INSERT instead of writing it."""
    seen = {}

    class _Cur:
        def __enter__(self): return self

        def __exit__(self, *a): return False

        def execute(self, sql, params=None):
            if fail:
                raise RuntimeError('db down')
            seen['sql'] = ' '.join(sql.split())
            seen['params'] = params

    class _Conn:
        def cursor(self): return _Cur()
        def commit(self): seen['committed'] = True
        def close(self): seen['closed'] = True

    monkeypatch.setattr(pal, '_connect', lambda: _Conn())
    monkeypatch.setattr(pal, '_recording_enabled', lambda: True)
    return seen


def test_a_read_is_recorded_with_actor_action_and_count(monkeypatch):
    seen = _capture(monkeypatch)
    ok = pal.log_pii_read(pal.CRM_ROSTER_READ, 'candidate_roster',
                          actor_id='784000000000080', subject_count=50)
    assert ok is True
    assert 'INSERT INTO admin_audit_log' in seen['sql']
    assert '784000000000080' in seen['params']
    assert pal.CRM_ROSTER_READ in seen['params']
    details = json.loads([p for p in seen['params'] if isinstance(p, str) and p.startswith('{')][0])
    assert details['subject_count'] == 50


def test_the_connection_is_always_closed(monkeypatch):
    seen = _capture(monkeypatch)
    pal.log_pii_read(pal.CRM_ROSTER_READ, 'candidate_roster', actor_id='x', subject_count=1)
    assert seen.get('closed') is True


def test_a_database_failure_returns_false_and_does_not_raise(monkeypatch):
    """An unaudited read is a real failure, but breaking the read would be worse
    — and would create pressure to remove the auditing entirely."""
    _capture(monkeypatch, fail=True)
    assert pal.log_pii_read(pal.CRM_ROSTER_READ, 'candidate_roster',
                            actor_id='x', subject_count=1) is False


def test_an_unknown_action_is_still_recorded(monkeypatch):
    """Silently discarding an audit record is the one behaviour this module must
    never have."""
    seen = _capture(monkeypatch)
    assert pal.log_pii_read('some_new_read', 'thing', actor_id='x') is True
    assert 'some_new_read' in seen['params']


def test_recording_is_suppressed_under_pytest():
    """admin_audit_log is APPEND-ONLY (migration 002), so test rows written to
    the live table can never be removed — 172 rows of `Pytest Action` residue
    are already there permanently."""
    assert pal._recording_enabled() is False


# ── It must not use the request-scoped connection ────────────────────────────

def test_the_helper_owns_its_connection():
    """db_utils.execute_query reuses the connection from `g` and commits it, so
    auditing through it would commit whatever the request had in flight. An
    audit record must never change the outcome of the action it records."""
    src = _src('pii_access_log.py')
    assert 'psycopg2.connect' in src
    # A CALL, not the word: the module docstring names execute_query precisely to
    # explain why it is not used, and matching the bare word failed on that.
    assert 'execute_query(' not in src, \
        'must not use the request-scoped, committing query helper'


# ── The endpoints are actually wired ─────────────────────────────────────────

def test_the_crm_roster_read_is_audited():
    """The endpoint whose own docstring says it returns national_id, phone and
    counselling notes, and which had no read auditing at all."""
    body = _fn(_src('candidate_profile_routes.py'), 'get_crm_candidates')
    assert 'log_pii_read(CRM_ROSTER_READ' in body


def test_the_roster_records_how_many_people_were_returned():
    body = _fn(_src('candidate_profile_routes.py'), 'get_crm_candidates')
    assert 'subject_count=len(formatted)' in body, \
        'the count is what makes the log reasonable at volume'


def test_the_candidate_history_read_is_audited_with_the_subject():
    """Single-subject reads record WHO was read, not just that a read happened."""
    body = _fn(_src('candidate_profile_routes.py'), 'crm_candidate_history')
    assert 'log_pii_read(CRM_CANDIDATE_HISTORY_READ' in body
    assert 'resource_id=user_id' in body


def test_the_coach_client_reads_are_audited():
    src = _src('coach_routes.py')
    assert 'log_pii_read(COACH_CLIENT_LIST_READ' in src
    assert 'log_pii_read(COACH_SKILL_GAP_READ' in src


def test_the_audit_write_sits_after_the_authorization_check():
    """Ordering matters: a refused caller must not produce a row that reads as
    though they saw the data. The 403 returns before the audit call."""
    body = _fn(_src('coach_routes.py'), 'client_skill_gap')
    assert body.index('Forbidden - not your client') < body.index('log_pii_read')


# ── Self-reads are deliberately excluded ─────────────────────────────────────

def test_self_reads_are_not_audited():
    """`GET /api/profile/candidate` is keyed on the caller's own JWT identity.
    Auditing it would log every candidate viewing their own profile — huge
    volume, no investigative value, and it would bury the reads that matter.
    """
    body = _fn(_src('candidate_profile_routes.py'), 'get_candidate_profile')
    assert 'log_pii_read' not in body


def test_aggregate_endpoints_are_not_audited():
    """crm-stats returns counts, not people."""
    body = _fn(_src('candidate_profile_routes.py'), 'get_crm_stats')
    assert 'log_pii_read' not in body


# ── Naming ───────────────────────────────────────────────────────────────────

def test_every_read_action_is_suffixed_read():
    """The suffix lets the audit viewer separate access events from mutations,
    which are the two things an investigator asks about separately."""
    for a in pal.READ_ACTIONS:
        assert a.endswith('_read'), a
