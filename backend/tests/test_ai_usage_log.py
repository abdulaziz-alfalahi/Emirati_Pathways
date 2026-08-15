"""AI spend is recorded durably, and recording can never break an AI call.

The tracker this replaces counted tokens in memory and was read by a function
called from nowhere, so the platform could not answer "what do we spend on AI".
These tests pin the two properties that make the replacement worth having:

  * it survives a restart (it is in the database), and
  * it cannot fail the work it measures.

The second matters more than the first. Telemetry that can break a CV upload is
worse than no telemetry, so most of what follows is about failure paths.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import ai_usage_log  # noqa: E402

# Distinctive so live-DB rows are findable and removable (ZZ- house rule).
TEST_MODEL = 'ZZ-TEST-MODEL'


@pytest.fixture
def recording_on(monkeypatch):
    """Re-enable recording, which is suppressed under pytest by default.

    The suppression exists because other tests in this suite exercise
    chat_completion with a stubbed client; without it they write rows into the
    live table that look exactly like real traffic. Only tests that are
    deliberately about the write path should turn it back on.
    """
    monkeypatch.setattr(ai_usage_log, '_recording_enabled', lambda: True)


# ── Cost estimation ──────────────────────────────────────────────────────────

def test_cost_uses_the_configured_price_list():
    # qwen-turbo is 0.80 in / 2.00 out per million.
    cost = ai_usage_log.estimate_cost_aed('qwen-turbo', 1_000_000, 1_000_000)
    assert cost == pytest.approx(2.80)


def test_unpriced_model_costs_zero_not_a_guess():
    """A self-hosted model has no per-token price.

    Recording 0 is truthful; inventing a number would quietly corrupt exactly
    the comparison this table exists to support.
    """
    assert ai_usage_log.estimate_cost_aed('some-local-model', 500_000, 500_000) == 0.0


def test_zero_tokens_cost_zero():
    assert ai_usage_log.estimate_cost_aed('qwen-turbo', 0, 0) == 0.0


# ── It must never break the caller ───────────────────────────────────────────

def test_record_returns_false_and_does_not_raise_when_db_is_unreachable(monkeypatch, recording_on):
    def boom():
        raise RuntimeError('database is down')
    monkeypatch.setattr(ai_usage_log, '_connect', boom)

    assert ai_usage_log.record(TEST_MODEL, 'parse', 10, 20) is False


def test_summary_degrades_to_empty_rather_than_raising(monkeypatch):
    monkeypatch.setattr(ai_usage_log, '_connect', lambda: (_ for _ in ()).throw(RuntimeError('down')))

    out = ai_usage_log.summary(days=7)
    assert out['available'] is False
    assert out['totals'] == {} and out['by_task'] == [] and out['by_model'] == []


def test_daily_degrades_to_empty_list(monkeypatch):
    monkeypatch.setattr(ai_usage_log, '_connect', lambda: (_ for _ in ()).throw(RuntimeError('down')))
    assert ai_usage_log.daily(days=7) == []


def test_unknown_outcome_is_coerced_not_rejected(monkeypatch, recording_on):
    """The DB CHECK would refuse an unknown outcome and lose the row entirely.

    Coercing to 'error' keeps the call counted, which is the point.
    """
    captured = {}

    class _Cur:
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def execute(self, sql, params): captured['params'] = params

    class _Conn:
        def cursor(self): return _Cur()
        def commit(self): pass
        def close(self): pass

    monkeypatch.setattr(ai_usage_log, '_connect', lambda: _Conn())
    assert ai_usage_log.record(TEST_MODEL, 'parse', 1, 1, outcome='sideways') is True
    assert captured['params'][6] == ai_usage_log.OUTCOME_ERROR


def test_negative_token_counts_are_clamped(monkeypatch, recording_on):
    """The DB CHECK requires >= 0; a bad count should not discard the row."""
    captured = {}

    class _Cur:
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def execute(self, sql, params): captured['params'] = params

    class _Conn:
        def cursor(self): return _Cur()
        def commit(self): pass
        def close(self): pass

    monkeypatch.setattr(ai_usage_log, '_connect', lambda: _Conn())
    ai_usage_log.record(TEST_MODEL, 'parse', -5, -9)
    assert captured['params'][2] == 0 and captured['params'][3] == 0


def test_recording_is_suppressed_under_pytest_by_default():
    """The suite must not write rows that look like real traffic.

    Other tests exercise chat_completion with a stubbed client; before this
    guard, a full-suite run left 8 synthetic rows in the live table — 10 prompt
    tokens, 1 ms latency, indistinguishable from production usage in any query.
    That would corrupt the very measurement the table exists to provide.

    Note this test takes no `recording_on` fixture: it asserts the default.
    """
    assert ai_usage_log._recording_enabled() is False
    assert ai_usage_log.record('ZZ-SHOULD-NOT-PERSIST', 'parse', 1, 1) is False


# ── It must not share the request's transaction ──────────────────────────────

def test_does_not_use_the_shared_request_connection():
    """Deliberate: db_utils.execute_query commits the request-scoped connection.

    Logging telemetry through it would commit whatever else the request had in
    flight — telemetry must never change the outcome of the work it measures.
    """
    import ast

    tree = ast.parse(open(ai_usage_log.__file__).read())
    imported = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imported.update(a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imported.add(node.module)
            imported.update(f'{node.module}.{a.name}' for a in node.names)

    # Parsed rather than grepped: the module's own docstring explains WHY it
    # avoids db_utils, and a substring check would trip over the explanation.
    offenders = {m for m in imported if 'db_utils' in m or m == 'flask' or m.startswith('flask.')}
    assert not offenders, (
        f'telemetry must not share the request connection or need an app context: {offenders}'
    )


# ── The client records what actually happened ────────────────────────────────

@pytest.fixture
def spy(monkeypatch):
    """Capture calls to ai_usage_log.record made via qwen_client."""
    from services import qwen_client
    calls = []
    monkeypatch.setattr(qwen_client.ai_usage_log, 'record',
                        lambda **kw: calls.append(kw) or True)
    return calls


def _stub_response(content, prompt_tokens=11, completion_tokens=22):
    usage = type('U', (), {'prompt_tokens': prompt_tokens, 'completion_tokens': completion_tokens})()
    msg = type('M', (), {'content': content})()
    choice = type('C', (), {'message': msg})()
    return type('R', (), {'choices': [choice], 'usage': usage})()


def _install_client(monkeypatch, responder):
    from services import qwen_client

    class _Completions:
        def create(self, **kwargs): return responder(kwargs)

    class _Client:
        def __init__(self): self.chat = type('Chat', (), {'completions': _Completions()})()

    monkeypatch.setattr(qwen_client, '_get_client', lambda: _Client())
    return qwen_client


def test_successful_call_is_recorded_with_tokens_and_task(monkeypatch, spy):
    qc = _install_client(monkeypatch, lambda kw: _stub_response('{"ok": true}'))

    result = qc.chat_completion('parse', [{'role': 'user', 'content': 'json please'}])

    assert result == {'ok': True}
    assert len(spy) == 1
    rec = spy[0]
    assert rec['task_type'] == 'parse'
    assert rec['prompt_tokens'] == 11 and rec['completion_tokens'] == 22
    assert rec['outcome'] == ai_usage_log.OUTCOME_OK
    assert rec['attempt'] == 1
    assert rec['latency_ms'] is not None


def test_unparseable_response_is_recorded_as_its_own_outcome(monkeypatch, spy):
    """The API answered and billed us, and delivered nothing usable.

    That is a distinct kind of waste from a failure and must be countable
    separately — it is the strongest single argument in a self-hosting case.
    """
    qc = _install_client(monkeypatch, lambda kw: _stub_response('not json at all'))

    with pytest.raises(qc.QwenParsingError):
        qc.chat_completion('score', [{'role': 'user', 'content': 'json'}], max_retries=2)

    assert [r['outcome'] for r in spy] == [ai_usage_log.OUTCOME_INVALID_JSON] * 2
    # Tokens were still consumed on each attempt.
    assert all(r['prompt_tokens'] == 11 for r in spy)


def test_every_retry_is_recorded_separately(monkeypatch, spy):
    """One row per response, not per logical call — each retry is billed."""
    qc = _install_client(monkeypatch, lambda kw: _stub_response('nope'))

    with pytest.raises(Exception):
        qc.chat_completion('parse', [{'role': 'user', 'content': 'json'}], max_retries=3)

    assert [r['attempt'] for r in spy] == [1, 2, 3]


def test_api_failure_is_recorded_with_zero_tokens(monkeypatch, spy):
    from openai import APIError

    def _fail(kwargs):
        raise APIError('boom', request=None, body=None)

    qc = _install_client(monkeypatch, _fail)

    with pytest.raises(qc.QwenClientError):
        qc.chat_completion('parse', [{'role': 'user', 'content': 'json'}], max_retries=1)

    assert len(spy) == 1
    assert spy[0]['outcome'] == ai_usage_log.OUTCOME_ERROR
    assert spy[0]['prompt_tokens'] == 0 and spy[0]['completion_tokens'] == 0


def test_telemetry_failure_does_not_break_the_ai_call(monkeypatch):
    """The property that matters most.

    A CV upload must succeed even if the usage table is unwritable.
    """
    from services import qwen_client

    def _explode(**kwargs):
        raise RuntimeError('usage table is gone')

    monkeypatch.setattr(qwen_client.ai_usage_log, 'record', _explode)
    qc = _install_client(monkeypatch, lambda kw: _stub_response('{"ok": 1}'))

    assert qc.chat_completion('parse', [{'role': 'user', 'content': 'json'}]) == {'ok': 1}


# ── Round trip against the real table ────────────────────────────────────────

@pytest.fixture
def ai_usage_table():
    """A database with the ai_usage_log schema present.

    CI runs against a fresh Postgres and there is no migration runner, so "the
    database is reachable" does NOT imply "the schema is there" — which is
    exactly how these tests first failed in CI while passing locally against
    the migrated live DB.

    Applying the real migration file rather than duplicating its DDL means CI
    also proves migration 069 parses and runs. It is idempotent, so this is
    safe against an already-migrated database.
    """
    try:
        conn = ai_usage_log._connect()
    except Exception:
        pytest.skip('database not reachable')

    try:
        migration = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'migrations', '069_ai_usage_log.sql')
        conn.autocommit = True          # the file carries its own BEGIN/COMMIT
        with conn.cursor() as cur:
            cur.execute(open(migration).read())
        yield conn
    finally:
        conn.close()


@pytest.mark.parametrize('outcome', [ai_usage_log.OUTCOME_OK,
                                     ai_usage_log.OUTCOME_INVALID_JSON,
                                     ai_usage_log.OUTCOME_ERROR])
def test_every_outcome_the_code_emits_is_accepted_by_the_db_check(outcome, recording_on, ai_usage_table):
    """Guards the drift that a CHECK constraint invites: code emitting a value
    the database refuses, silently losing rows."""
    try:
        assert ai_usage_log.record(TEST_MODEL, 'zz-test', 1, 1, outcome=outcome) is True
    finally:
        with ai_usage_table.cursor() as cur:
            cur.execute('DELETE FROM ai_usage_log WHERE model = %s', (TEST_MODEL,))


def test_summary_shape_is_stable_against_the_real_table(ai_usage_table):
    out = ai_usage_log.summary(days=1)
    assert out['available'] is True
    assert set(out) == {'days', 'totals', 'by_task', 'by_model', 'available'}
    assert set(out['totals']) == {
        'calls', 'prompt_tokens', 'completion_tokens', 'total_tokens',
        'estimated_cost_aed', 'failed_calls', 'retry_calls',
    }


def test_days_window_is_clamped_to_a_sane_range():
    assert ai_usage_log.summary(days=0)['days'] == 1
    assert ai_usage_log.summary(days=99999)['days'] == 365
