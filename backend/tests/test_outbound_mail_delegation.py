"""Delegated release: the owner approves wording, operators release messages.

WHY THIS FILE EXISTS

Per-message approval was right for the first five sends and wrong for four
hundred. An owner clicking approve on four hundred renderings of one template
is not reviewing them; it is rubber-stamping, which is worse than no review
because it produces a signature.

Owner, 2026-08-26: "I don't want to be the bottleneck. I would let the agents
do their job, but I need a mechanism where I can audit and verify the quality
of the operation."

So the risk moves. It is no longer "an unreviewed message goes out" — it is
"a message goes out under an approval that no longer describes it", or "one
operator mistake becomes four hundred emails". These tests are about those.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

import outbound_mail  # noqa: E402


# ── The fingerprint: what makes an approval of WORDING meaningful ───────────

def test_the_same_wording_fingerprints_the_same():
    a = outbound_mail.template_fingerprint('subject', 'body', '<p>body</p>')
    b = outbound_mail.template_fingerprint('subject', 'body', '<p>body</p>')
    assert a == b


def test_changing_any_part_of_the_wording_moves_the_fingerprint():
    """The whole mechanism rests on this. If an edit did not move the hash, an
    approval would keep authorising text the owner never read."""
    base = outbound_mail.template_fingerprint('subject', 'body', '<p>body</p>')
    assert outbound_mail.template_fingerprint('SUBJECT', 'body', '<p>body</p>') != base
    assert outbound_mail.template_fingerprint('subject', 'BODY', '<p>body</p>') != base
    assert outbound_mail.template_fingerprint('subject', 'body', '<p>BODY</p>') != base


def test_the_html_counts_toward_the_fingerprint():
    """HTML is what is actually delivered. A change there that leaves the plain
    text alone is still a change to what a recipient reads."""
    text_only = outbound_mail.template_fingerprint('s', 'b', None)
    with_html = outbound_mail.template_fingerprint('s', 'b', '<p>b</p>')
    assert text_only != with_html


def test_fields_cannot_be_shuffled_between_each_other():
    """Concatenating without a separator would make ('ab','c') and ('a','bc')
    hash identically — two different messages sharing one approval."""
    assert (outbound_mail.template_fingerprint('ab', 'c', '')
            != outbound_mail.template_fingerprint('a', 'bc', ''))


# ── Anomaly detection: stopping a bad run rather than explaining one ────────

def test_a_surge_of_unseen_domains_is_caught(monkeypatch):
    """More likely a wrong recipient list than a good week."""
    monkeypatch.setattr(outbound_mail, 'execute_query',
                        lambda *a, **k: [] if 'DISTINCT' in a[0] else [])
    many = [f'x@company{i}.ae' for i in range(outbound_mail.NEW_DOMAIN_LIMIT + 5)]
    reason = outbound_mail.detect_anomaly(many)
    assert reason and 'never sent to before' in reason


def test_a_normal_run_to_known_domains_is_not_flagged(monkeypatch):
    def fake(sql, *a, **k):
        if 'DISTINCT' in sql:
            return [{'d': 'ehrdc.gov.ae'}]
        return []
    monkeypatch.setattr(outbound_mail, 'execute_query', fake)
    assert outbound_mail.detect_anomaly(['a@ehrdc.gov.ae', 'b@ehrdc.gov.ae']) is None


def test_a_failure_spike_is_caught(monkeypatch):
    """Delivery is not working; releasing more would only multiply it."""
    def fake(sql, *a, **k):
        if 'DISTINCT' in sql:
            return [{'d': 'ehrdc.gov.ae'}]
        return [{'status': 'failed'}] * outbound_mail.FAILURE_SAMPLE
    monkeypatch.setattr(outbound_mail, 'execute_query', fake)
    reason = outbound_mail.detect_anomaly(['a@ehrdc.gov.ae'])
    assert reason and 'failed' in reason


def test_a_few_failures_do_not_trip_it(monkeypatch):
    """A false pause costs one admin click, but a checker that fires constantly
    gets ignored, and then it is not a guardrail at all."""
    def fake(sql, *a, **k):
        if 'DISTINCT' in sql:
            return [{'d': 'ehrdc.gov.ae'}]
        return ([{'status': 'failed'}] * 2
                + [{'status': 'sent'}] * (outbound_mail.FAILURE_SAMPLE - 2))
    monkeypatch.setattr(outbound_mail, 'execute_query', fake)
    assert outbound_mail.detect_anomaly(['a@ehrdc.gov.ae']) is None


def test_too_few_sends_to_judge_does_not_trip_it(monkeypatch):
    """Three failures out of three is 100% and means nothing."""
    def fake(sql, *a, **k):
        if 'DISTINCT' in sql:
            return [{'d': 'ehrdc.gov.ae'}]
        return [{'status': 'failed'}] * 3
    monkeypatch.setattr(outbound_mail, 'execute_query', fake)
    assert outbound_mail.detect_anomaly(['a@ehrdc.gov.ae']) is None


def test_a_broken_anomaly_check_does_not_block_sending(monkeypatch):
    """It is a guardrail, not a gate. The gate is decide(); if this check
    itself breaks it must not become an outage of the whole operation."""
    def boom(*a, **k):
        raise RuntimeError('db down')
    monkeypatch.setattr(outbound_mail, 'execute_query', boom)
    assert outbound_mail.detect_anomaly(['a@ehrdc.gov.ae']) is None


def test_malformed_addresses_do_not_crash_the_check(monkeypatch):
    monkeypatch.setattr(outbound_mail, 'execute_query', lambda *a, **k: [])
    assert outbound_mail.detect_anomaly([None, '', 'no-at-sign', 'a@b.ae']) is None


# ── The shape of the mechanism ─────────────────────────────────────────────

def test_release_never_raises_it_returns_a_state(monkeypatch):
    """The caller is running a bulk operation. A traceback mid-run tells them
    nothing about what already went out."""
    monkeypatch.setattr(outbound_mail, 'controls',
                        lambda: {'paused': True, 'pause_reason': 'probe'})
    result = outbound_mail.release('seeker_invitation', 'op')
    assert result['released'] == 0
    assert result['blocked'] == 'paused'


def test_a_pause_stops_release_before_anything_else_is_considered(monkeypatch):
    """Not after the template lookup, not after the cap — a paused system must
    not do work that could partially succeed."""
    called = {'template': False}

    def spy(kind):
        called['template'] = True
        return None
    monkeypatch.setattr(outbound_mail, 'controls',
                        lambda: {'paused': True, 'pause_reason': 'probe'})
    monkeypatch.setattr(outbound_mail, 'approved_template', spy)
    outbound_mail.release('seeker_invitation', 'op')
    assert not called['template']


def test_an_unapproved_kind_releases_nothing(monkeypatch):
    monkeypatch.setattr(outbound_mail, 'controls',
                        lambda: {'paused': False, 'daily_release_cap': 500})
    monkeypatch.setattr(outbound_mail, 'approved_template', lambda kind: None)
    result = outbound_mail.release('anything', 'op')
    assert result['released'] == 0
    assert result['blocked'] == 'no_approved_template'


def test_the_cap_is_per_operator_per_day(monkeypatch):
    """One mistake must not become four hundred emails."""
    monkeypatch.setattr(outbound_mail, 'controls',
                        lambda: {'paused': False, 'daily_release_cap': 10})
    monkeypatch.setattr(outbound_mail, 'approved_template',
                        lambda kind: {'version': 1})
    monkeypatch.setattr(outbound_mail, 'released_today', lambda op: 10)
    result = outbound_mail.release('seeker_invitation', 'op')
    assert result['released'] == 0
    assert result['blocked'] == 'daily_cap'


def test_a_release_is_trimmed_to_what_remains_of_the_cap(monkeypatch):
    """Not refused — trimmed. An operator with 3 left should send 3, not zero,
    and should be told what remains."""
    monkeypatch.setattr(outbound_mail, 'controls',
                        lambda: {'paused': False, 'daily_release_cap': 10})
    monkeypatch.setattr(outbound_mail, 'approved_template', lambda kind: {'version': 1})
    monkeypatch.setattr(outbound_mail, 'released_today', lambda op: 7)
    monkeypatch.setattr(outbound_mail, 'releasable',
                        lambda kind: [{'id': i, 'to_email': f'a{i}@ehrdc.gov.ae'}
                                      for i in range(50)])
    monkeypatch.setattr(outbound_mail, 'detect_anomaly', lambda r: None)
    captured = {}
    monkeypatch.setattr(outbound_mail, 'execute_query',
                        lambda *a, **k: captured.update({'ids': a[1][3]}))
    result = outbound_mail.release('seeker_invitation', 'op')
    assert result['released'] == 3
    assert result['remaining_today'] == 0
    assert len(captured['ids']) == 3


def test_an_anomaly_pauses_and_releases_nothing(monkeypatch):
    monkeypatch.setattr(outbound_mail, 'controls',
                        lambda: {'paused': False, 'daily_release_cap': 500})
    monkeypatch.setattr(outbound_mail, 'approved_template', lambda kind: {'version': 1})
    monkeypatch.setattr(outbound_mail, 'released_today', lambda op: 0)
    monkeypatch.setattr(outbound_mail, 'releasable',
                        lambda kind: [{'id': 1, 'to_email': 'a@x.ae'}])
    monkeypatch.setattr(outbound_mail, 'detect_anomaly', lambda r: 'looks wrong')
    paused = {}
    monkeypatch.setattr(outbound_mail, 'pause',
                        lambda reason, by=None: paused.update({'reason': reason}))
    monkeypatch.setattr(outbound_mail, 'execute_query',
                        lambda *a, **k: pytest.fail('released during an anomaly'))
    result = outbound_mail.release('seeker_invitation', 'op')
    assert result['blocked'] == 'anomaly'
    assert paused['reason'] == 'looks wrong'


def test_release_only_ever_moves_rows_out_of_held(monkeypatch):
    """A rejected or already-sent message must not be revived by a bulk run."""
    monkeypatch.setattr(outbound_mail, 'controls',
                        lambda: {'paused': False, 'daily_release_cap': 500})
    monkeypatch.setattr(outbound_mail, 'approved_template', lambda kind: {'version': 1})
    monkeypatch.setattr(outbound_mail, 'released_today', lambda op: 0)
    monkeypatch.setattr(outbound_mail, 'releasable',
                        lambda kind: [{'id': 1, 'to_email': 'a@ehrdc.gov.ae'}])
    monkeypatch.setattr(outbound_mail, 'detect_anomaly', lambda r: None)
    sql = {}
    monkeypatch.setattr(outbound_mail, 'execute_query',
                        lambda *a, **k: sql.update({'q': a[0]}))
    outbound_mail.release('seeker_invitation', 'op')
    assert "status = 'held'" in sql['q']
    assert "release_basis" in sql['q']


# ── What the audit must be able to answer ──────────────────────────────────

def test_releasable_requires_a_fingerprint_match_in_sql():
    """A message composed before the wording changed must not be swept up by a
    later release. Enforced in the join, not by a Python filter that a future
    caller could bypass."""
    source = open(os.path.join(BACKEND, 'outbound_mail.py'), encoding='utf-8').read()
    block = source[source.index('def releasable('):]
    block = block[:block.index('def release(')]
    assert 't.fingerprint = m.template_fingerprint' in block
    assert "t.status = 'approved'" in block
    assert "m.status = 'held'" in block


def test_the_audit_reports_authority_not_just_volume():
    """"How many did we send" reassures without informing. The question is on
    whose authority they left."""
    source = open(os.path.join(BACKEND, 'outbound_mail.py'), encoding='utf-8').read()
    block = source[source.index('def audit_summary('):]
    block = block[:block.index('def audit_sample(')]
    assert 'by_authority' in block
    assert 'unauthorised' in block


def test_the_sample_is_random_not_the_most_recent():
    """The newest messages are the ones an operator was watching, and the
    least likely to be wrong."""
    source = open(os.path.join(BACKEND, 'outbound_mail.py'), encoding='utf-8').read()
    block = source[source.index('def audit_sample('):]
    block = block[:block.index('def audit_drift(')]
    assert 'ORDER BY random()' in block
    assert 'body_text' in block, 'a sample without bodies verifies nothing'


def test_drift_flags_anything_sent_without_recorded_authority():
    source = open(os.path.join(BACKEND, 'outbound_mail.py'), encoding='utf-8').read()
    block = source[source.index('def audit_drift('):]
    assert 'release_basis IS NULL' in block
    assert "'high'" in block


def test_resuming_is_narrower_than_pausing():
    """A pause is usually automatic and means a run looked wrong. The person
    who decides it is safe to continue should not be the one who tripped it."""
    routes = open(os.path.join(BACKEND, 'routes', 'outbound_mail_routes.py'),
                  encoding='utf-8').read()
    pause_block = routes[routes.index('def pause_sending'):]
    resume_block = routes[routes.index('def resume_sending'):]
    assert '@require_roles(*OPERATOR_ROLES)' in routes[
        routes.index('/controls/pause'):routes.index('def pause_sending')]
    assert '@require_roles(*ADMIN_ROLES)' in routes[
        routes.index('/controls/resume'):routes.index('def resume_sending')]


def test_approving_a_template_is_an_admin_act_and_releasing_is_not():
    routes = open(os.path.join(BACKEND, 'routes', 'outbound_mail_routes.py'),
                  encoding='utf-8').read()
    assert '@require_roles(*ADMIN_ROLES)' in routes[
        routes.index("/templates/<int:template_id>/approve"):routes.index('def approve_template')]
    assert '@require_roles(*OPERATOR_ROLES)' in routes[
        routes.index("'/release'"):routes.index('def release_messages')]


def test_there_is_no_bulk_approve_of_messages():
    """Delegation replaces per-message approval; it must not smuggle in a way
    to mass-approve messages that have no approved template behind them."""
    routes = open(os.path.join(BACKEND, 'routes', 'outbound_mail_routes.py'),
                  encoding='utf-8').read()
    for forbidden in ('approve_all', 'approve-all', 'bulk_approve'):
        assert forbidden not in routes


# ── The register ───────────────────────────────────────────────────────────

def test_every_kind_that_is_queued_has_a_registered_template():
    """A wording nobody registered is a wording nobody approved, and its
    messages would sit held for ever with no obvious cause."""
    import re
    from services import mail_templates
    kinds = set()
    for module in ('nafis_talent_system.py', 'growth_system.py'):
        src = open(os.path.join(BACKEND, module), encoding='utf-8').read()
        kinds.update(re.findall(r"kind=['\"]([a-z_]+)['\"]", src))
    unregistered = kinds - set(mail_templates.TEMPLATES)
    assert not unregistered, f'queued but unregistered: {unregistered}'


def test_registering_approves_nothing():
    """Recording new wording and authorising it are separate acts."""
    source = open(os.path.join(BACKEND, 'services', 'mail_templates.py'),
                  encoding='utf-8').read()
    block = source[source.index('def register_all('):]
    assert "'approved'" not in block
    assert 'approved_by' not in block
