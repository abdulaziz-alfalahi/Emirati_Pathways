"""Every way of misconfiguring outbound mail must fail CLOSED.

WHY THIS FILE EXISTS

On 2026-08-25, a sweep run hours before the first real mail credentials were
configured found 46 board emails and 126 employer invitation links queued to
real people — Al Rostamani, Majid Al Futtaim, Gargash Hospital, personal gmail
addresses across 219 domains. None had been delivered, because email had never
worked. The moment it worked, all of it would have gone out, and 42 of the 46
announced test meetings that had already been deleted.

The backlog is retired (migrations 086, 087). This file pins the property that
stops the next one: a mistake in configuration leaves mail OFF, never ON.

Most of these tests look trivial. They are the ones that matter — every real
"staging mailed the customer list" incident is one of these assertions being
false, and each is a single character away from being false again.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from outbound_mail import (  # noqa: E402
    decide, explain, is_blocked, recipient_allowed, sending_enabled,
    allowed_recipients,
    ALLOWED, BLOCKED_SENDING_OFF, BLOCKED_RECIPIENT_NOT_ALLOWED,
    BLOCKED_NOT_APPROVED, BLOCKED_NO_RECIPIENT,
)

REAL = 'someone@alrostamanigroup.ae'          # a domain from the live sweep


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    """Start every test from "nothing configured" — the state a fresh box is in."""
    monkeypatch.delenv('MAIL_SENDING_ENABLED', raising=False)
    monkeypatch.delenv('MAIL_ALLOWED_RECIPIENTS', raising=False)


def _configure(monkeypatch, enabled=None, allow=None):
    if enabled is not None:
        monkeypatch.setenv('MAIL_SENDING_ENABLED', enabled)
    if allow is not None:
        monkeypatch.setenv('MAIL_ALLOWED_RECIPIENTS', allow)


# ── Gate 1: the switch ──────────────────────────────────────────────────────

def test_nothing_configured_sends_nothing():
    """The default state of an unconfigured box."""
    ok, decision = decide(REAL, approved=True)
    assert not ok
    assert decision == BLOCKED_SENDING_OFF


@pytest.mark.parametrize('value', ['', ' ', '0', 'false', 'no', 'off',
                                   'ture', 'yes please', 'null',
                                   'undefined', '"true"'])
def test_only_an_explicit_true_switches_sending_on(monkeypatch, value):
    """Typos, quoting accidents and half-edited values all leave it OFF.

    '"true"' is the one that catches people: a .env written with quotes reads
    back WITH them, and a looser check would treat it as enabled.

    Surrounding whitespace is NOT in this list — it is stripped, so 'true ' does
    enable sending. That is deliberate: the value is still explicitly true, and
    a trailing space in a .env is an accident that should not silently disable
    mail once somebody has decided to switch it on.
    """
    _configure(monkeypatch, enabled=value, allow=REAL)
    assert not sending_enabled(), f'{value!r} enabled sending'
    assert not decide(REAL, approved=True)[0]


@pytest.mark.parametrize('value', ['1', 'true', 'TRUE', 'yes', 'on', ' true '])
def test_a_real_true_does_switch_it_on(monkeypatch, value):
    """The gate must not be so strict it cannot be opened deliberately."""
    _configure(monkeypatch, enabled=value, allow=REAL)
    assert sending_enabled()
    assert decide(REAL, approved=True)[0]


# ── Gate 2: the allow-list ──────────────────────────────────────────────────

def test_an_empty_allow_list_matches_nobody(monkeypatch):
    """"No list configured" must never mean "everyone".

    This is the single assertion that separates a safe staging box from one
    that mails a production customer list.
    """
    _configure(monkeypatch, enabled='true', allow='')
    assert allowed_recipients() == []
    assert not recipient_allowed(REAL)
    assert decide(REAL, approved=True)[1] == BLOCKED_RECIPIENT_NOT_ALLOWED


def test_an_unset_allow_list_matches_nobody(monkeypatch):
    _configure(monkeypatch, enabled='true')
    assert not recipient_allowed(REAL)


def test_an_exact_address_matches_only_itself(monkeypatch):
    _configure(monkeypatch, enabled='true', allow='ops@ehrdc.gov.ae')
    assert recipient_allowed('ops@ehrdc.gov.ae')
    assert not recipient_allowed('someone.else@ehrdc.gov.ae')
    assert not recipient_allowed(REAL)


def test_a_domain_entry_allows_that_domain_only(monkeypatch):
    _configure(monkeypatch, enabled='true', allow='@ehrdc.gov.ae')
    assert recipient_allowed('anyone@ehrdc.gov.ae')
    assert not recipient_allowed('anyone@dghr.gov.ae')
    assert not recipient_allowed(REAL)


def test_a_domain_entry_does_not_match_a_lookalike(monkeypatch):
    """@ehrdc.gov.ae must not allow evil-ehrdc.gov.ae or ehrdc.gov.ae.attacker.com."""
    _configure(monkeypatch, enabled='true', allow='@ehrdc.gov.ae')
    for address in ('x@evil-ehrdc.gov.ae', 'x@ehrdc.gov.ae.attacker.com',
                    'x@notehrdc.gov.ae', 'x@sub.ehrdc.gov.ae'):
        assert not recipient_allowed(address), address


def test_matching_is_case_insensitive(monkeypatch):
    """The live sweep found GMAIL.COM and MAF.AE stored in mixed case."""
    _configure(monkeypatch, enabled='true', allow='@Ehrdc.Gov.Ae, Ops@DGHR.gov.ae')
    assert recipient_allowed('ANYONE@ehrdc.GOV.ae')
    assert recipient_allowed('ops@dghr.gov.ae')


def test_whitespace_and_blank_entries_are_ignored_not_treated_as_wildcards(monkeypatch):
    _configure(monkeypatch, enabled='true', allow=' , ,@ehrdc.gov.ae , ')
    assert allowed_recipients() == ['@ehrdc.gov.ae']
    assert recipient_allowed('a@ehrdc.gov.ae')
    assert not recipient_allowed(REAL)


# ── Gate 3: approval ────────────────────────────────────────────────────────

def test_an_allowed_recipient_still_needs_the_message_approved(monkeypatch):
    """The owner's actual requirement.

    An approved RECIPIENT is not an approved MESSAGE. Without this gate, one
    approved address is enough for any unreviewed message to reach them.
    """
    _configure(monkeypatch, enabled='true', allow=REAL)
    ok, decision = decide(REAL, approved=False)
    assert not ok
    assert decision == BLOCKED_NOT_APPROVED


def test_all_three_gates_open_is_the_only_way_through(monkeypatch):
    _configure(monkeypatch, enabled='true', allow=REAL)
    assert decide(REAL, approved=True) == (True, ALLOWED)


# ── Bad input ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize('address', [None, '', '   ', 'not-an-address',
                                     '@', 'nobody@'])
def test_a_malformed_address_is_never_sendable(monkeypatch, address):
    _configure(monkeypatch, enabled='true', allow='@ehrdc.gov.ae')
    ok, _decision = decide(address, approved=True)
    assert not ok


def test_a_missing_address_is_reported_as_such_not_as_a_config_problem(monkeypatch):
    _configure(monkeypatch, enabled='true', allow=REAL)
    assert decide(None, approved=True)[1] == BLOCKED_NO_RECIPIENT


# ── The shape of the module itself ──────────────────────────────────────────

def test_anything_that_is_not_explicitly_allowed_counts_as_blocked():
    """is_blocked is defined as "not ALLOWED", so a decision added later is
    blocked by default rather than silently becoming sendable."""
    assert is_blocked('some_future_decision_nobody_has_written_yet')
    assert is_blocked(BLOCKED_SENDING_OFF)
    assert not is_blocked(ALLOWED)


def test_there_is_no_transport_in_this_module():
    """The gate must stay pure and testable.

    If a transport is ever added here, it has to be added deliberately — and
    this test is the place to notice that `decide()` is still consulted first.
    """
    import outbound_mail
    source = open(outbound_mail.__file__, encoding='utf-8').read()
    for forbidden in ('smtplib', 'requests.post', 'urlopen', 'graph.microsoft.com'):
        assert forbidden not in source, (
            f'{forbidden} appeared in the gate module — a transport belongs '
            f'behind decide(), not inside it'
        )


def test_every_decision_has_operator_wording():
    for decision in (ALLOWED, BLOCKED_SENDING_OFF, BLOCKED_RECIPIENT_NOT_ALLOWED,
                     BLOCKED_NOT_APPROVED, BLOCKED_NO_RECIPIENT):
        assert explain(decision)
        assert 'blocked_' not in explain(decision), (
            'operators should not be shown a raw constant name'
        )
