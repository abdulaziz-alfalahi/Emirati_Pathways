"""The one message kind allowed past the recipient allow-list.

Owner decision, 2026-08-30, after being shown that an approved template still
would not reach a parent: guardian consent may bypass the recipient list, and
nothing else may.

WHY THIS ONE

It is the first message type whose recipients are BY NATURE outside any
government domain — a parent's own Gmail or Etisalat address, typed by their
child at registration. Staff invitations and vacancy verifications go to
organisations; this goes to a mother's phone, and a list of government domains
can never contain it.

A consent nobody receives is worse than none: the place is held for fourteen
days and then silently released, and the young person never gets in.

THE RISK THIS ACCEPTS, AND WHAT BOUNDS IT

A signed-in user can name any address and cause a government-branded email to
reach it. Two things bound it, and both are asserted below: the body carries no
text the user supplies, and one person may cause only a few per day.
"""
import inspect
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

import outbound_mail  # noqa: E402
from tests.source_utils import code_only, comments_only_removed  # noqa: E402


@pytest.fixture
def sending_on(monkeypatch):
    """These tests are about the RECIPIENT check, which sits behind the
    environment switch. With sending off — the default here, and on any
    developer's machine — every call returns blocked_sending_off and the
    assertions below would pass for the wrong reason."""
    monkeypatch.setattr(outbound_mail, 'sending_enabled', lambda: True)


# ── The exemption is exactly one kind wide ──────────────────────────────────

def test_only_guardian_consent_is_exempt():
    assert outbound_mail.KINDS_EXEMPT_FROM_ALLOW_LIST == {'guardian_consent'}


@pytest.mark.parametrize('kind', [
    'company_invitation', 'vacancy_verification', 'staff_invitation',
    'seeker_invitation', 'team_invitation', 'board_office_notice', None,
])
def test_every_other_kind_still_obeys_the_allow_list(kind, sending_on):
    """The 267 vacancy messages to real employers were held by this check. It
    must keep holding them."""
    ok, why = outbound_mail.decide('stranger@example.com', approved=True,
                                   allow_list=['@ehrdc.gov.ae'], kind=kind)
    assert not ok
    assert why == outbound_mail.BLOCKED_RECIPIENT_NOT_ALLOWED


def test_guardian_consent_reaches_an_address_off_the_list(sending_on):
    ok, _ = outbound_mail.decide('mother@gmail.com', approved=True,
                                 allow_list=['@ehrdc.gov.ae'],
                                 kind='guardian_consent')
    assert ok


# ── What the exemption does NOT bypass ──────────────────────────────────────

def test_it_does_not_bypass_the_environment_switch():
    """Sending being off must still mean off, for every kind — including the
    exempt one. Asserted by calling it, not by reading the source."""
    ok, why = outbound_mail.decide('mother@gmail.com', approved=True,
                                   allow_list=[], kind='guardian_consent')
    assert not ok and why == outbound_mail.BLOCKED_SENDING_OFF


def test_it_does_not_bypass_approval(sending_on):
    ok, why = outbound_mail.decide('mother@gmail.com', approved=False,
                                   allow_list=[], kind='guardian_consent')
    assert not ok and why == outbound_mail.BLOCKED_NOT_APPROVED


def test_it_does_not_bypass_having_a_recipient_at_all(sending_on):
    ok, why = outbound_mail.decide('', approved=True, kind='guardian_consent')
    assert not ok and why == outbound_mail.BLOCKED_NO_RECIPIENT


def test_the_kind_is_taken_from_the_row_not_the_caller():
    """A caller that could assert a kind could claim an exemption for a message
    that was never queued with one — the same reasoning that makes send_one read
    the approval off the row."""
    src = code_only(inspect.getsource(
        __import__('services.graph_mail', fromlist=['send_one']).send_one))
    assert "kind=message.get('kind')" in src
    assert "kind='guardian_consent'" not in src


# ── What bounds the risk ────────────────────────────────────────────────────

def test_one_person_cannot_cause_unlimited_guardian_emails():
    assert isinstance(outbound_mail.GUARDIAN_REQUESTS_PER_DAY, int)
    assert 0 < outbound_mail.GUARDIAN_REQUESTS_PER_DAY <= 20

    source = comments_only_removed(
        open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
             encoding='utf-8').read())
    register = source[source.index('def register('):source.index('def cancel_registration')]
    assert 'GUARDIAN_REQUESTS_PER_DAY' in register
    assert "date_trunc('day', now())" in register, 'the cap is not per day'
    assert '429' in register


def test_the_message_carries_no_text_the_registrant_supplies():
    """The recipient is theirs to choose; the words are not. Programme and
    organiser come from an operator-reviewed listing, the name from the user
    record — so this cannot become a channel for arbitrary content."""
    from youth_consent import guardian_consent_body
    params = list(inspect.signature(guardian_consent_body).parameters)
    assert params == ['young_person', 'programme', 'organiser', 'when', 'link']

    source = comments_only_removed(
        open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
             encoding='utf-8').read())
    register = source[source.index('def register('):source.index('def cancel_registration')]
    call = register[register.index('guardian_consent_body('):]
    call = call[:call.index(')')]
    for supplied in ("payload.get('note')", "payload.get('message')", 'request.'):
        assert supplied not in call, 'caller-supplied text reaches the message body'
