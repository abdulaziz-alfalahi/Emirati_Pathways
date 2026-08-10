"""An invitation that was never delivered must never read as "Sent".

Both invite endpoints reported "Sent N invitations" while no SMTP host was
configured anywhere — `create_seeker_invitations` even documents itself as
"mock-email them". The operator was told delivery had happened, and the magic
link (the only way in) was discarded from the response and left in the container
log, so onboarding anyone required shell access to the host.
"""
import os
import sys

_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_here)
for p in (os.path.dirname(_backend), _backend):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.email_delivery import email_configured, invitation_result_message
except ImportError:  # pragma: no cover
    from email_delivery import email_configured, invitation_result_message


def test_not_configured_without_smtp_host(monkeypatch):
    monkeypatch.delenv('SMTP_HOST', raising=False)
    assert email_configured() is False


def test_blank_smtp_host_is_not_configured(monkeypatch):
    monkeypatch.setenv('SMTP_HOST', '   ')
    assert email_configured() is False


def test_configured_once_a_host_is_set(monkeypatch):
    monkeypatch.setenv('SMTP_HOST', 'smtp.ehrdc.gov.ae')
    assert email_configured() is True


def test_message_never_claims_sent_when_it_cannot_send(monkeypatch):
    """The regression itself."""
    monkeypatch.delenv('SMTP_HOST', raising=False)
    msg = invitation_result_message(3, 0)
    assert 'Sent' not in msg, f'claims delivery that did not happen: {msg}'
    assert 'NOT configured' in msg and 'nothing has been sent' in msg.lower()


def test_message_says_sent_once_delivery_works(monkeypatch):
    monkeypatch.setenv('SMTP_HOST', 'smtp.ehrdc.gov.ae')
    msg = invitation_result_message(3, 1)
    assert msg.startswith('Sent 3') and '1 failed' in msg


def test_wording_flips_on_config_alone(monkeypatch):
    """Provisioning SMTP must correct the wording with no code change."""
    monkeypatch.delenv('SMTP_HOST', raising=False)
    before = invitation_result_message(1, 0)
    monkeypatch.setenv('SMTP_HOST', 'smtp.ehrdc.gov.ae')
    after = invitation_result_message(1, 0)
    assert before != after and 'Sent' in after and 'Sent' not in before
