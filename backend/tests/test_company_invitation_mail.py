"""Company magic links now compose a real email instead of printing one.

WHY THIS FILE EXISTS

This is the flow that produced the 126 live invitation tokens migration 087 had
to void — addressed to Al Rostamani, Prime Health, Gargash Hospital, Azadea,
Majid Al Futtaim, NMC and personal addresses across 219 domains, from a single
test import run. None had ever been delivered, because the flow printed the
magic link to the container log and reported "Sent N invitations".

So it is the first flow where a mistake reaches an employer rather than one
person, and the properties below are the ones that keep that from happening.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from brand import (  # noqa: E402
    PLATFORM_NAME_EN, PLATFORM_NAME_AR, COUNCIL_NAME_EN, COUNCIL_NAME_AR,
)
from growth_system import (  # noqa: E402
    _company_invitation_body, _company_invitation_html,
    _company_invitation_subject, _role_label,
)

LINK = 'https://stg-emirati.ehrdc.gov.ae/join/abc123token'
COMPANY = 'Al Rostamani Group'


# ── The message an employer receives ────────────────────────────────────────

def test_arabic_leads_the_message():
    body = _company_invitation_body(COMPANY, LINK)
    assert body.index('السادة') < body.index(f'Dear {COMPANY}')
    html = _company_invitation_html(COMPANY, LINK)
    assert html.index('dir="rtl"') < html.index('dir="ltr"')
    subject = _company_invitation_subject(COMPANY)
    assert subject.index('دعوة للانضمام') < subject.index('Invitation to join')


def test_the_company_name_is_in_the_subject():
    """An employer scans an unexpected government email for something that
    identifies THEM before deciding it is genuine rather than phishing."""
    assert COMPANY in _company_invitation_subject(COMPANY)


def test_the_message_says_what_they_are_invited_AS():
    """"You have been invited" without saying as what is how an employer
    decides a message is phishing."""
    for role, label in (('employer_admin', 'Employer Administrator'),
                        ('recruiter', 'Recruiter'),
                        ('hr_manager', 'HR Manager')):
        body = _company_invitation_body(COMPANY, LINK, role)
        assert label in body
        assert 'صفة الدعوة' in body


def test_an_unknown_role_still_reads_sensibly():
    """The role comes from operator input, so it must not render as a raw
    identifier or an empty space in a message to a real employer."""
    for role in (None, '', 'something_new'):
        body = _company_invitation_body(COMPANY, LINK, role)
        assert 'Recruiter or HR Manager' in body
        assert 'None' not in body
        assert 'صفة الدعوة: \n' not in body


def test_the_link_appears_in_both_halves_and_alone_on_its_line():
    body = _company_invitation_body(COMPANY, LINK)
    assert body.count(LINK) == 2
    for line in (ln.strip() for ln in body.splitlines()):
        if LINK in line:
            assert line == LINK, f'link has neighbours: {line!r}'


def test_a_company_name_cannot_inject_markup():
    """Names arrive from a NAFIS vacancy CSV — the same source that produced
    the 126 tokens. A stray '<' in a trade name would eat the paragraph."""
    html = _company_invitation_html('Smith & Co <script>alert(1)</script>', LINK)
    assert '<script>' not in html
    assert '&lt;script&gt;' in html
    assert '&amp;' in html


def test_the_role_label_cannot_inject_markup_either():
    html = _company_invitation_html(COMPANY, LINK, '<b>x</b>')
    assert '<b>x</b>' not in html


def test_the_message_carries_no_data_beyond_the_company_name():
    """The address comes from a CSV and may be stale, so anything more
    identifying reaches whoever holds that mailbox now."""
    body = _company_invitation_body(COMPANY, LINK).lower()
    for leak in ('trade licence', 'trade_license', 'emirates id', 'الهوية', 'salary'):
        assert leak not in body


def test_it_signs_off_as_the_council_in_both_languages():
    for render in (_company_invitation_body, _company_invitation_html):
        out = render(COMPANY, LINK)
        assert COUNCIL_NAME_EN in out
        assert COUNCIL_NAME_AR in out
        assert PLATFORM_NAME_EN in out
        assert PLATFORM_NAME_AR in out


def test_no_duplicate_style_attributes():
    import re
    for tag in re.findall(r'<[a-z]+[^>]*>', _company_invitation_html(COMPANY, LINK)):
        assert tag.count('style=') <= 1, f'duplicate style attribute: {tag}'


def test_no_images_or_external_css():
    html = _company_invitation_html(COMPANY, LINK)
    for forbidden in ('<img', '<link', '<style', 'background-image', 'http://'):
        assert forbidden not in html, forbidden


# ── The flow ────────────────────────────────────────────────────────────────

def test_the_magic_link_is_no_longer_printed():
    """The link is a credential. Printing it meant anyone with log access could
    redeem an employer's invitation."""
    source = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    assert 'MAGIC LINK' not in source
    assert '[INVITATION EMAIL]' not in source


def test_the_invitation_is_queued_and_never_sent_from_this_module():
    source = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    assert 'outbound_mail.queue(' in source
    assert 'cursor=cur' in source, (
        'the message must join the invitation transaction, or it can outlive '
        'the token it carries'
    )
    for forbidden in ('send_one', 'send_approved_batch', 'smtplib', 'graph_mail'):
        assert forbidden not in source, f'{forbidden} in the invitation flow'


def test_a_company_with_no_email_gets_a_link_but_no_message():
    """Queuing a message addressed to nobody puts an unsendable row in the
    reviewer's queue for ever. The operator passes that link on by hand."""
    source = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    assert "if company_email:" in source
    assert "'no_email_on_file'" in source


def test_the_operator_is_told_messages_are_waiting_not_sent():
    from email_delivery import invitation_result_message
    message = invitation_result_message(40, 0, queued_count=40)
    assert 'NOTHING HAS BEEN SENT YET' in message
    assert 'Outbound Mail' in message
    assert not message.startswith('Sent ')
