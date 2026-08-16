"""Recording consent and transcript retention.

Owner decision 2026-08-16: every video session is transcribed and retained, and
that is disclosed in the terms all users accept — because a government entity
asked for a record of a session should not have to answer that it does not keep
one.

The obligation cuts both ways, which is what most of these tests are about. Being
able to produce a record is one half; being able to evidence that the person
agreed to be recorded is the other, and reusing an old consent to claim the
second would recreate the weakness this change exists to remove.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import consent_policy as cp  # noqa: E402


def test_recording_is_a_required_consent():
    assert cp.RECORDING in cp.REQUIRED_CONSENTS


def test_the_original_three_consents_are_still_required():
    """Adding one must not quietly drop another."""
    for existing in ('terms', 'privacy', 'data_processing'):
        assert existing in cp.REQUIRED_CONSENTS


def test_the_policy_version_moved_past_the_terms_that_omitted_recording():
    """Users registered under 1.0 accepted terms that said nothing about
    recording. If the version had stayed at 1.0, their acceptance would silently
    read as consent to something it never mentioned."""
    assert cp.POLICY_VERSION != '1.0'


def test_registration_records_every_required_consent(monkeypatch):
    """The list is defined once so a new consent cannot be added in one place
    and missed in another."""
    src = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            'routes', 'auth_routes.py')).read()
    assert 'REQUIRED_CONSENTS' in src, 'registration must use the shared list'
    assert "required_consents = ['terms'" not in src, 'the literal list must not come back'
    assert "'1.0', 'registration'" not in src, 'the policy version must not be hardcoded'


# ── has_current_consent ─────────────────────────────────────────────────────

def _patch_execute_query(monkeypatch, fn):
    """has_current_consent imports execute_query INSIDE the function, trying
    `backend.db_utils` before `db_utils`. Those are distinct module objects, so
    patching only one silently misses."""
    import importlib
    patched = False
    for name in ('backend.db_utils', 'db_utils'):
        try:
            monkeypatch.setattr(importlib.import_module(name), 'execute_query', fn)
            patched = True
        except ImportError:
            continue
    assert patched, 'neither db_utils module could be imported'


def _stub_query(monkeypatch, result):
    def fn(*a, **k):
        if isinstance(result, Exception):
            raise result
        return result
    _patch_execute_query(monkeypatch, fn)


def test_consent_under_the_current_version_counts(monkeypatch):
    _stub_query(monkeypatch, {'?column?': 1})
    assert cp.has_current_consent('784000000000270') is True


def test_no_matching_row_is_false(monkeypatch):
    _stub_query(monkeypatch, None)
    assert cp.has_current_consent('784000000000270') is False


def test_an_unavailable_database_is_none_not_false(monkeypatch):
    """None and False are different claims. A database problem reading as "the
    user did not consent" would write a false record in the one direction that
    matters — and it is the direction that looks worse in an audit."""
    _stub_query(monkeypatch, RuntimeError('db down'))
    assert cp.has_current_consent('784000000000270') is None


def test_the_query_pins_the_version_and_excludes_withdrawn(monkeypatch):
    """A withdrawn consent is not a consent, and a consent to an older policy
    version is not consent to these terms."""
    captured = {}

    def fake(sql, params=None, **kw):
        captured['sql'] = ' '.join(sql.split())
        captured['params'] = params
        return {'x': 1}

    _patch_execute_query(monkeypatch, fake)
    cp.has_current_consent('784000000000270')

    assert 'policy_version = %s' in captured['sql']
    assert 'withdrawn_at IS NULL' in captured['sql']
    assert 'granted IS TRUE' in captured['sql']
    assert cp.POLICY_VERSION in captured['params']


# ── Retention ───────────────────────────────────────────────────────────────

def test_transcripts_have_their_own_retention_setting():
    """Deliberately separate from AUDIT_RETENTION_DAYS: a coaching transcript
    and an audit log entry are not obviously the same class of record, and one
    should be changeable without the other."""
    assert isinstance(cp.TRANSCRIPT_RETENTION_DAYS, int)
    assert cp.TRANSCRIPT_RETENTION_DAYS > 0


def test_the_purge_script_actually_deletes_expired_transcripts():
    """A retention period nothing enforces is a claim, not a policy."""
    src = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            'scripts', 'retention_purge.py')).read()
    assert 'interview_transcripts' in src
    assert 'TRANSCRIPT_RETENTION_DAYS' in src
    assert 'DELETE FROM interview_transcripts' in src


# ── The join path ───────────────────────────────────────────────────────────

def test_the_coaching_join_dispatches_the_transcription_agent():
    src = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            'coach_routes.py')).read()
    join_fn = src.split('def join_coaching_session')[1].split('\n@coach_bp.route')[0]
    assert 'AGENT_JOIN_URL' in join_fn, 'the agent must be summoned into a coaching room'


def test_the_join_response_declares_the_session_is_recorded():
    """The client is told in the room. A banner that depended on the consent
    lookup would go quiet exactly when the lookup failed, while the session was
    still being recorded."""
    src = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            'coach_routes.py')).read()
    join_fn = src.split('def join_coaching_session')[1].split('\n@coach_bp.route')[0]
    assert '"is_recorded": True' in join_fn


def test_a_missing_consent_is_recorded_not_enforced():
    """Refusing a session to everyone who registered before the terms changed
    would break the platform for its whole existing user base. The gap is
    logged so it is closeable rather than invisible."""
    src = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            'coach_routes.py')).read()
    join_fn = src.split('def join_coaching_session')[1].split('\n@coach_bp.route')[0]
    assert 'has_current_consent' in join_fn
    # No early return on the consent branch.
    consent_branch = join_fn.split('consented = has_current_consent')[1].split('return jsonify')[0]
    assert '403' not in consent_branch and 'return' not in consent_branch
