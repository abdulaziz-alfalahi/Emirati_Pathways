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


# ── Vacancy verification: one message PER VACANCY ROW ───────────────────────
#
# The highest-volume flow on the platform. A single CSV import fans out to one
# message per job, which is how one test run on 2026-08-21 produced 126 live
# tokens across 219 domains. Two things were wrong with it beyond not sending:
# the link was hardcoded to http://localhost:8089, and each print incremented a
# counter the import endpoint reported as "Sent N emails".

from growth_system import (  # noqa: E402
    _vacancy_verification_body, _vacancy_verification_html,
    _vacancy_verification_subject,
)

JOB = 'Site Engineer'
VLINK = 'https://stg-emirati.ehrdc.gov.ae/verify-job/tok123'


def test_the_link_is_not_hardcoded_to_localhost():
    """Had this flow ever really sent, every employer would have received a
    link to their own machine."""
    source = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    assert 'http://localhost:8089/verify-job/' not in source
    assert "os.environ.get('FRONTEND_URL'" in source


def test_the_subject_carries_both_the_company_and_the_job():
    """An employer with twelve open roles gets twelve messages, and the
    reviewer sees twelve queue rows. Without the job title they are
    indistinguishable — to both of them."""
    subject = _vacancy_verification_subject(COMPANY, JOB)
    assert COMPANY in subject and JOB in subject
    assert subject.index('التحقق من شاغر') < subject.index('Verify the vacancy')


def test_arabic_leads_and_the_url_stays_ltr():
    body = _vacancy_verification_body(COMPANY, JOB, VLINK)
    assert body.index('السادة') < body.index(f'Dear {COMPANY}')
    html = _vacancy_verification_html(COMPANY, JOB, VLINK)
    assert html.index('dir="rtl"') < html.index('dir="ltr"')
    assert html.split('<hr', 1)[0].count('dir="ltr"') == 1   # the URL inside the Arabic half


def test_the_job_title_cannot_inject_markup():
    """A job title is free text typed by an employer — likelier than the
    company name to contain a character that breaks markup."""
    html = _vacancy_verification_html(COMPANY, '<script>alert(1)</script>', VLINK)
    assert '<script>' not in html
    assert '&lt;script&gt;' in html


def test_it_offers_a_way_out_for_a_closed_vacancy():
    """These come from data the employer never gave us directly, and a vacancy
    may have been filled months ago."""
    body = _vacancy_verification_body(COMPANY, JOB, VLINK)
    assert 'no longer open' in body
    assert 'لم يعد هذا الشاغر متاحاً' in body


def test_a_vacancy_with_no_company_email_queues_nothing():
    source = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    assert "if not (email or '').strip():" in source
    assert "'without_email_on_file'" in source


def test_the_import_no_longer_counts_or_claims_emails_sent():
    """The counter fed a response that said "Sent N emails" when none had been."""
    source = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    routes = open(os.path.join(BACKEND, 'routes', 'growth_routes.py'), encoding='utf-8').read()
    assert "'emails_sent': 0" not in source
    assert "report['emails_sent'] += 1" not in source
    assert 'Sent {report[' not in routes
    # The phrase is split across concatenated literals in the source, so match
    # a contiguous fragment rather than the sentence the operator will read.
    assert 'BEEN SENT YET' in routes
    assert 'Outbound Mail' in routes
    assert 'messages_queued' in routes


def test_the_verification_message_joins_the_import_transaction():
    source = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    assert 'cursor=cur' in source
    assert '[EMAIL SIMULATION]' not in source
