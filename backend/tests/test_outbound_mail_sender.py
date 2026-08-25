"""The sender must never deliver a message a person has not approved.

WHY THIS FILE EXISTS

Migrations 086/087 retired 46 board emails and 131 invitation links that would
have reached real employers and board offices unreviewed. The queue and this
transport exist so that cannot recur. These tests pin the properties that make
that true — every one of them is a way the guarantee could be quietly lost:

  * a caller asserting approval that the row does not have
  * a config mistake that fails open instead of closed
  * a bulk path that skips the per-message decision
  * a secret reaching a log, an error string, or the operator UI

No test here talks to Microsoft. `send_one` is exercised with a fake transport,
because what is being tested is the decision, not Graph's HTTP.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

import outbound_mail  # noqa: E402
from services import graph_mail  # noqa: E402

REAL = 'someone@alrostamanigroup.ae'


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for name in ('MAIL_SENDING_ENABLED', 'MAIL_ALLOWED_RECIPIENTS',
                 'GRAPH_TENANT_ID', 'GRAPH_CLIENT_ID', 'GRAPH_CLIENT_SECRET',
                 'GRAPH_SENDER_ADDRESS'):
        monkeypatch.delenv(name, raising=False)
    graph_mail._token_cache['value'] = None
    graph_mail._token_cache['expires_at'] = 0.0


def _fully_configured(monkeypatch, allow=REAL):
    monkeypatch.setenv('MAIL_SENDING_ENABLED', 'true')
    monkeypatch.setenv('MAIL_ALLOWED_RECIPIENTS', allow)
    monkeypatch.setenv('GRAPH_TENANT_ID', 'tenant-abc')
    monkeypatch.setenv('GRAPH_CLIENT_ID', 'client-abc')
    monkeypatch.setenv('GRAPH_CLIENT_SECRET', 'super-secret-value')
    monkeypatch.setenv('GRAPH_SENDER_ADDRESS', 'no-reply@dghr.gov.ae')


def _message(**overrides):
    row = {'id': 1, 'to_email': REAL, 'to_name': 'Someone',
           'subject': 'Vacancy verification', 'body_text': 'Please confirm.',
           'body_html': None, 'kind': 'job_verification', 'attempts': 1,
           'approved_by': '784000000000020'}
    row.update(overrides)
    return row


class _Transport:
    """Records what would have been sent instead of sending it."""

    def __init__(self):
        self.calls = []

    def __call__(self, url, data, headers, is_form):
        self.calls.append({'url': url, 'data': data, 'headers': headers})
        if 'oauth2' in url:
            return 200, {'access_token': 'token-123', 'expires_in': 3600}
        return 202, {}


# ── The guarantee ───────────────────────────────────────────────────────────

def test_an_unapproved_message_is_never_sent(monkeypatch):
    """The row's approver — not the caller — decides.

    approved_by is None, everything else is perfectly configured. If this ever
    passes a message to the transport, per-message approval is decorative.
    """
    _fully_configured(monkeypatch)
    transport = _Transport()
    monkeypatch.setattr(graph_mail, '_post', transport)

    ok, decision, _detail = graph_mail.send_one(_message(approved_by=None))

    assert not ok
    assert decision == outbound_mail.BLOCKED_NOT_APPROVED
    assert transport.calls == [], 'an unapproved message reached the transport'


def test_an_approved_message_is_sent(monkeypatch):
    _fully_configured(monkeypatch)
    transport = _Transport()
    monkeypatch.setattr(graph_mail, '_post', transport)

    ok, decision, detail = graph_mail.send_one(_message())

    assert ok and decision == outbound_mail.ALLOWED
    assert '202' in detail
    send_calls = [c for c in transport.calls if 'sendMail' in c['url']]
    assert len(send_calls) == 1
    assert send_calls[0]['data']['message']['toRecipients'][0]['emailAddress']['address'] == REAL


def test_sending_switched_off_stops_an_approved_message(monkeypatch):
    """Approval is necessary, not sufficient."""
    _fully_configured(monkeypatch)
    monkeypatch.setenv('MAIL_SENDING_ENABLED', 'false')
    transport = _Transport()
    monkeypatch.setattr(graph_mail, '_post', transport)

    ok, decision, _ = graph_mail.send_one(_message())
    assert not ok and decision == outbound_mail.BLOCKED_SENDING_OFF
    assert transport.calls == []


def test_a_recipient_off_the_allow_list_is_stopped(monkeypatch):
    """The case that matters during a pilot: an approved message to somebody
    outside the group we agreed to mail."""
    _fully_configured(monkeypatch, allow='@ehrdc.gov.ae')
    transport = _Transport()
    monkeypatch.setattr(graph_mail, '_post', transport)

    ok, decision, _ = graph_mail.send_one(_message())
    assert not ok and decision == outbound_mail.BLOCKED_RECIPIENT_NOT_ALLOWED
    assert transport.calls == []


def test_the_batch_path_applies_the_same_decision(monkeypatch):
    """A bulk route must not be a way around the per-message check.

    send_approved_batch claims rows and calls send_one; if it ever grew its own
    shortcut, this catches it.
    """
    _fully_configured(monkeypatch)
    transport = _Transport()
    monkeypatch.setattr(graph_mail, '_post', transport)

    # Patch the module object graph_mail actually holds. Depending on which
    # import branch won ("backend.outbound_mail" vs "outbound_mail"), that may
    # be a DIFFERENT object from the one this test file imported — patching the
    # wrong one silently runs the real database code.
    queue = graph_mail.outbound_mail
    claimed = [_message(id=7, approved_by=None), None]
    monkeypatch.setattr(queue, 'claim_next_approved', lambda: claimed.pop(0))
    recorded = {}
    monkeypatch.setattr(queue, 'mark_failed',
                        lambda mid, err, gate_decision=None: recorded.update(
                            {'id': mid, 'gate': gate_decision}))
    monkeypatch.setattr(queue, 'mark_sent',
                        lambda *a, **k: pytest.fail('an unapproved message was marked sent'))

    result = graph_mail.send_approved_batch()

    assert result['blocked'] == 1 and result['sent'] == 0
    assert recorded['gate'] == outbound_mail.BLOCKED_NOT_APPROVED
    assert [c for c in transport.calls if 'sendMail' in c['url']] == []


# ── The secret ──────────────────────────────────────────────────────────────

def test_the_config_report_never_reveals_a_value(monkeypatch):
    """An operator checking setup must not be shown the secret.

    describe_config() feeds a screen that ends up in screenshots and feedback
    reports.
    """
    _fully_configured(monkeypatch)
    reported = repr(graph_mail.describe_config())
    assert 'super-secret-value' not in reported
    assert 'client-abc' not in reported
    assert 'tenant-abc' not in reported
    assert graph_mail.describe_config()['client_secret'] is True


def test_a_missing_setting_is_named_without_its_value(monkeypatch):
    monkeypatch.setenv('GRAPH_TENANT_ID', 'tenant-abc')
    with pytest.raises(graph_mail.MailNotConfigured) as exc:
        graph_mail.get_token()
    text = str(exc.value)
    assert 'GRAPH_CLIENT_SECRET' in text
    assert 'tenant-abc' not in text


def test_an_http_error_body_carrying_the_secret_is_redacted(monkeypatch):
    """Defence in depth — Graph does not echo the secret, but last_error is
    rendered in the operator UI, so a leak there would be visible and durable.
    """
    import urllib.error

    _fully_configured(monkeypatch)

    class _Err(urllib.error.HTTPError):
        def __init__(self):
            super().__init__('u', 400, 'Bad Request', {}, None)

        def read(self):
            return b'{"error":"bad secret super-secret-value here"}'

    detail = graph_mail._safe_error(_Err())
    assert 'super-secret-value' not in detail
    assert '[redacted]' in detail


def test_an_auth_failure_mentions_the_expiry_date(monkeypatch):
    """The secret expires 2027-08-23 and sending will stop silently.

    Whoever reads that error a year from now needs the hint in front of them.
    """
    import urllib.error

    _fully_configured(monkeypatch)

    def _boom(*args, **kwargs):
        raise urllib.error.HTTPError('u', 401, 'Unauthorized', {}, None)

    monkeypatch.setattr(graph_mail, '_post', _boom)
    with pytest.raises(graph_mail.MailNotConfigured) as exc:
        graph_mail.get_token()
    assert '2027-08-23' in str(exc.value)


# ── Token handling ──────────────────────────────────────────────────────────

def test_the_token_is_reused_rather_than_fetched_per_message(monkeypatch):
    _fully_configured(monkeypatch)
    transport = _Transport()
    monkeypatch.setattr(graph_mail, '_post', transport)

    graph_mail.send_one(_message())
    graph_mail.send_one(_message(id=2))

    token_calls = [c for c in transport.calls if 'oauth2' in c['url']]
    assert len(token_calls) == 1


def test_the_cached_token_expires_before_graph_expires_it(monkeypatch):
    """A token handed out at the last second dies mid-request."""
    _fully_configured(monkeypatch)
    monkeypatch.setattr(graph_mail, '_post', _Transport())
    graph_mail.get_token()
    import time
    lifetime = graph_mail._token_cache['expires_at'] - time.time()
    assert lifetime < 3600, 'the cached token outlives the real one'


# ── There is no bulk approval ───────────────────────────────────────────────

def test_no_approve_all_endpoint_exists():
    """Per-message approval is the requirement.

    A bulk button would recreate exactly what migrations 086/087 cleaned up, so
    its absence is a property worth pinning rather than a gap.
    """
    path = os.path.join(BACKEND, 'routes', 'outbound_mail_routes.py')
    source = open(path, encoding='utf-8').read()
    for forbidden in ('approve_all', 'approve-all', 'bulk_approve'):
        assert forbidden not in source
