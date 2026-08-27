"""Inviting a company composes an email. The operator must be told so.

WHY THIS FILE EXISTS

Reported 2026-08-27. An operator was asked about a queued invitation to a real
employer — al Rostamani Group — and said he had not taken that action.

He had. The audit log puts him on the platform half an hour earlier, and the
invitation carries his id. What he had not done was the thing he was being told
he did, because the button he pressed said the opposite of what it does:

    "Invitation ready. Copy this magic link and send it to the employer:"

That sentence tells an operator the platform sent nothing and the sending is
theirs to do. It was written when it was true — the code comment beside it still
said "Auto-email is deferred" — and it stopped being true when outbound mail
shipped. Since then the same click has also composed a message to the employer's
real address and put it in the approval queue, silently.

The bulk NAFIS path was wrong in the other direction: its panel announced
"Invitations Sent" when nothing had been sent and every message was held.

Nothing ever reached anyone: the recipient allow-list and the owner's approval
both held. The defect is that the person taking the action could not know they
had taken it — which is also what makes an audit trail worthless, since the
operator it names will truthfully deny it.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import code_only, js_code_only  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')


def _read(*parts):
    path = os.path.join(FRONTEND, *parts)
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    return js_code_only(open(path, encoding='utf-8').read())


def test_the_endpoint_reports_what_it_queued():
    """The count the screens need. It was already returned and both ignored it."""
    source = code_only(open(os.path.join(BACKEND, 'routes', 'growth_routes.py'),
                            encoding='utf-8').read())
    invite = source[source.index('def invite_companies'):source.index('def verify_company')]
    assert 'messages_awaiting_approval' in invite


def test_the_single_invite_no_longer_claims_nothing_was_sent():
    source = _read('pages', 'GrowthOperatorDashboard.tsx')
    assert 'Copy this magic link and send it to the employer' not in source, (
        'the button still tells the operator the platform sent nothing')
    assert 'messages_awaiting_approval' in source
    assert 'waiting for approval' in source


def test_the_bulk_invite_no_longer_claims_the_invitations_were_sent():
    source = _read('components', 'growth-operator', 'NafisVacancyImport.tsx')
    assert "'Invitations Sent'" not in source, 'the panel still says they were sent'
    assert 'messages_awaiting_approval' in source


def test_both_screens_name_the_address_or_say_there_was_none():
    """"An email was prepared" is only useful with the address in it — that is
    the fact the operator would have queried."""
    single = _read('pages', 'GrowthOperatorDashboard.tsx')
    assert 'company.contactEmail' in single
    assert 'No email address on file' in single

    bulk = _read('components', 'growth-operator', 'NafisVacancyImport.tsx')
    assert 'no addresses on file' in bulk


def test_the_handler_warns_the_next_reader_that_it_composes_an_email():
    """A stale comment — "Auto-email is deferred" — is why the wording was
    never revisited when outbound mail shipped. The replacement has to be
    impossible to read past, because the next person to touch this handler is
    the one who decides whether the message stays honest."""
    source = open(os.path.join(FRONTEND, 'pages', 'GrowthOperatorDashboard.tsx'),
                  encoding='utf-8').read()
    handler = source[source.index('const handleSendInvite'):]
    preamble = source[:source.index('const handleSendInvite')]
    assert 'THIS ALSO COMPOSES AN EMAIL TO THE EMPLOYER' in preamble[-2000:], (
        'nothing warns a reader of this handler that it emails the employer')


def test_invitations_still_only_ever_queue_held_messages():
    """The wording changed; the safety did not. queue() cannot produce a
    sendable row — migration 088 puts a check constraint behind it."""
    source = code_only(open(os.path.join(BACKEND, 'growth_system.py'),
                            encoding='utf-8').read())
    assert 'outbound_mail.queue(' in source
    assert 'outbound_mail.send' not in source
