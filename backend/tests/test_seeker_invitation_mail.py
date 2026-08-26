"""The seeker invitation is the first flow to queue a real email.

WHY THIS FILE EXISTS

Until 2026-08-26 this flow printed the magic link to the container log and told
the operator "Sent N invitations". Now it composes a real bilingual message and
holds it for per-message approval.

Two properties carry the weight, and both have already gone wrong once on this
platform:

  1. THE MESSAGE MUST NOT OUTLIVE ITS TOKEN. 42 of the 46 board emails retired
     by migration 086 survived because their meeting was deleted and the
     notification was not — a fully-formed email about a thing that no longer
     existed. An invitation carrying a token has exactly that shape, so the
     message is written on the CALLER's cursor and lives or dies with it.

  2. THE OPERATOR MUST NOT BE TOLD IT WAS SENT. That wording is what let 46
     board emails and 131 invitation links sit unnoticed. "Queued" has to read
     as unfinished work.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

import outbound_mail  # noqa: E402
from email_delivery import invitation_result_message  # noqa: E402
from nafis_talent_system import _invitation_body, _invitation_subject  # noqa: E402

LINK = 'https://stg-emirati.ehrdc.gov.ae/register/abc123token'


# ── The message a real person receives ──────────────────────────────────────

def test_the_invitation_is_bilingual():
    """Every recipient here is an Emirati national reached through NAFIS."""
    body = _invitation_body('Dhabya Alfalahi', LINK)
    assert 'You have been invited' in body
    assert 'تمت دعوتك' in body
    assert 'أكمل تسجيلك' in _invitation_subject()


def test_the_link_appears_in_both_halves():
    """An Arabic reader must not have to scroll past English to find the link."""
    body = _invitation_body('Dhabya Alfalahi', LINK)
    assert body.count(LINK) == 2


def test_the_link_is_alone_on_its_line():
    """Mail clients that auto-link are unreliable about trailing punctuation,
    and a link that arrives broken looks like a broken platform."""
    lines = [ln.strip() for ln in _invitation_body('X', LINK).splitlines()]
    for line in lines:
        if LINK in line:
            assert line == LINK, f'link has neighbours on its line: {line!r}'


def test_the_recipient_name_is_used_in_both_languages():
    body = _invitation_body('Dhabya Alfalahi', LINK)
    assert body.count('Dhabya Alfalahi') == 2


def test_the_message_says_what_the_link_does_and_how_long_it_lasts():
    body = _invitation_body('X', LINK)
    assert '7 days' in body and '7 أيام' in body
    # Somebody who did not expect this needs to know they can ignore it.
    assert 'ignore this message' in body
    assert 'تجاهل هذه الرسالة' in body


def test_the_message_carries_no_emirates_id_or_personal_data():
    """The only personal thing in an unencrypted email should be the name.

    An invitation is sent to an address taken from a NAFIS CSV, which may be
    stale or wrong. Anything more identifying than a name reaches whoever holds
    that mailbox now.
    """
    body = _invitation_body('Dhabya Alfalahi', LINK).lower()
    for leak in ('emirates id', 'الهوية', '784', 'gpa', 'salary'):
        assert leak not in body


# ── Atomicity: the message must not outlive its token ───────────────────────

def test_queue_uses_the_callers_cursor_when_given_one():
    """With a cursor, the row joins the caller's transaction.

    If this silently fell back to the shared connection, the message would
    commit on its own and survive a rolled-back invitation — the orphan shape
    migration 086 cleaned up.
    """
    executed = {}

    class _Cursor:
        def execute(self, sql, params):
            executed['sql'] = sql
            executed['params'] = params

        def fetchone(self):
            return {'id': 4242}

    def _must_not_be_called(*args, **kwargs):
        raise AssertionError('queue() bypassed the caller transaction')

    original = outbound_mail.execute_query
    outbound_mail.execute_query = _must_not_be_called
    try:
        message_id = outbound_mail.queue(
            to_email='a@b.ae', subject='s', body_text='b',
            kind='seeker_invitation', cursor=_Cursor())
    finally:
        outbound_mail.execute_query = original

    assert message_id == 4242
    assert 'INSERT INTO outbound_mail' in executed['sql']
    # Nothing may name a status: the trigger from migration 088 refuses any
    # insert that is not held, and a call site must not try.
    assert 'status' not in executed['sql'].lower()


def test_queue_handles_a_plain_tuple_cursor():
    """Modules here use both RealDictCursor and plain cursors."""
    class _TupleCursor:
        def execute(self, sql, params):
            pass

        def fetchone(self):
            return (99,)

    assert outbound_mail.queue(to_email='a@b.ae', subject='s', body_text='b',
                               kind='k', cursor=_TupleCursor()) == 99


# ── What the operator is told ───────────────────────────────────────────────

def test_a_queued_invitation_is_never_described_as_sent():
    message = invitation_result_message(3, 0, queued_count=3)
    assert 'NOTHING HAS BEEN SENT YET' in message
    assert not message.startswith('Sent ')


def test_the_operator_is_told_where_to_go_and_approve():
    """Otherwise the queue fills up and nobody knows to look at it."""
    message = invitation_result_message(3, 0, queued_count=3)
    assert 'Outbound Mail' in message
    assert 'approval' in message.lower()


def test_setting_smtp_host_cannot_make_a_queued_message_read_as_sent(monkeypatch):
    """SMTP_HOST only ever controlled wording, and there is no SMTP transport.

    If it could override the queued wording, setting it would resurrect exactly
    the lie this module was written to remove.
    """
    monkeypatch.setenv('SMTP_HOST', 'smtp.example.com')
    message = invitation_result_message(2, 0, queued_count=2)
    assert 'NOTHING HAS BEEN SENT YET' in message


def test_the_old_wording_still_applies_when_nothing_was_queued(monkeypatch):
    """Flows that have not been migrated yet must keep their honest message."""
    monkeypatch.delenv('SMTP_HOST', raising=False)
    message = invitation_result_message(2, 1)
    assert 'NOT configured' in message
    assert 'manually' in message


def test_no_flow_claims_delivery_while_queued_count_is_zero(monkeypatch):
    """A queued_count of 0 is not the same as "queued" — it means none were
    composed, so the wording must not promise a queue to look at."""
    monkeypatch.delenv('SMTP_HOST', raising=False)
    assert 'Outbound Mail' not in invitation_result_message(0, 2, queued_count=0)


# ── The flow no longer prints secrets to the log ─────────────────────────────

def test_the_magic_link_is_no_longer_printed_to_the_container_log():
    """The link is a credential. It used to be printed, which meant anyone with
    log access could redeem somebody else's invitation."""
    path = os.path.join(BACKEND, 'nafis_talent_system.py')
    source = open(path, encoding='utf-8').read()
    assert 'MAGIC LINK' not in source
    assert 'SEEKER INVITATION EMAIL' not in source


def test_the_invitation_is_queued_not_sent():
    """No transport may appear in this flow — approval sits between."""
    path = os.path.join(BACKEND, 'nafis_talent_system.py')
    source = open(path, encoding='utf-8').read()
    assert 'outbound_mail.queue(' in source
    for forbidden in ('send_one', 'send_approved_batch', 'smtplib', 'graph_mail'):
        assert forbidden not in source, f'{forbidden} in the invitation flow'


# ── Direction: what the first real send exposed ─────────────────────────────
#
# Outlook rendered the plain-text Arabic with every full stop and colon at the
# LEFT edge — ".تمت دعوتك" — because a text body carries no direction and the
# client laid the paragraph out left-to-right. The characters were already in
# the right logical order, so no change to the text could fix it. HTML with an
# explicit dir is the fix, and these tests keep it.

from nafis_talent_system import _invitation_html  # noqa: E402


def test_the_arabic_half_declares_rtl():
    html = _invitation_html('Dhabya Alfalahi', LINK)
    assert 'dir="rtl"' in html, (
        'without an explicit direction the Arabic punctuation renders at the '
        'wrong edge of every sentence'
    )
    assert 'dir="ltr"' in html


def test_the_url_stays_ltr_inside_the_arabic_block():
    """A bidi client reorders punctuation inside link TEXT in an rtl paragraph,
    and the URL stops being recognisable as the same address."""
    html = _invitation_html('X', LINK)
    arabic_half = html.split('<hr', 1)[1]
    assert 'dir="ltr"' in arabic_half


def test_the_name_is_escaped():
    """Names come from a NAFIS CSV. A stray '<' would eat the paragraph."""
    html = _invitation_html('Ali <b>x</b>', LINK)
    assert '&lt;b&gt;' in html
    assert '<b>' not in html


def test_no_duplicate_style_attributes():
    """A second style attribute on one tag is silently ignored, so the styling
    that was meant to apply just does not — and nothing reports it."""
    import re
    for tag in re.findall(r'<[a-z]+[^>]*>', _invitation_html('X', LINK)):
        assert tag.count('style=') <= 1, f'duplicate style attribute: {tag}'


def test_the_html_carries_no_images_or_external_css():
    """An image is a tracking pixel to a spam filter, and this domain has no
    sending reputation yet. Stylesheets are stripped by mail clients anyway."""
    html = _invitation_html('X', LINK)
    for forbidden in ('<img', '<link', '<style', 'background-image', 'http://'):
        assert forbidden not in html, forbidden


def test_the_html_and_text_carry_the_same_link():
    text = _invitation_body('X', LINK)
    html = _invitation_html('X', LINK)
    assert LINK in text and LINK in html


def test_the_delivered_body_is_the_html_one():
    """graph_mail prefers body_html when present — so the flow must pass it,
    or the direction fix is written and never used."""
    path = os.path.join(BACKEND, 'nafis_talent_system.py')
    source = open(path, encoding='utf-8').read()
    assert 'body_html=_invitation_html(' in source
