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

def test_english_leads_an_EMPLOYER_message():
    """Owner, 2026-08-26: employer messages lead in English.

    The audiences are opposites. A NAFIS candidate is an Emirati national for
    whom Arabic IS the message; an employer invitation lands in a shared HR
    mailbox, which is business correspondence in the UAE and frequently is not
    read in Arabic at all. The candidate invitation still leads in Arabic — see
    test_seeker_invitation_mail.py — and that difference is deliberate.
    """
    body = _company_invitation_body(COMPANY, LINK)
    assert body.index(f'Dear {COMPANY}') < body.index('السادة')
    html = _company_invitation_html(COMPANY, LINK)
    assert html.index('dir="ltr"') < html.index('dir="rtl"')
    subject = _company_invitation_subject(COMPANY)
    assert subject.index('Invitation to join') < subject.index('دعوة للانضمام')


def test_the_company_name_is_in_the_subject():
    """An employer scans an unexpected government email for something that
    identifies THEM before deciding it is genuine rather than phishing."""
    assert COMPANY in _company_invitation_subject(COMPANY)


def test_the_message_says_what_the_invitation_GRANTS_not_who_the_reader_is():
    """Owner, 2026-08-26: "The invitation is to join as a recruiter; what if he
    is the HR manager?"

    These addresses come from a NAFIS vacancy CSV — usually hr@ or info@, a
    shared mailbox — so the operator was guessing the job title of somebody
    they cannot identify, and the message asserted that guess back to them.
    It now describes the ACCESS, which is a fact about the account rather than
    a claim about the reader.
    """
    admin = _company_invitation_body(COMPANY, LINK, 'employer_admin')
    assert 'manage your organisation' in admin
    assert 'invite your colleagues' in admin

    recruiter = _company_invitation_body(COMPANY, LINK, 'recruiter')
    assert 'publish vacancies and review candidates' in recruiter

    for body in (admin, recruiter):
        # No job title is asserted about the reader in either language.
        assert 'Invited as:' not in body
        assert 'صفة الدعوة' not in body


def test_the_message_tells_the_wrong_reader_what_to_do():
    """A shared mailbox means the first reader is often not the right person,
    and a government email with no instruction gets deleted rather than
    forwarded."""
    body = _company_invitation_body(COMPANY, LINK, 'employer_admin')
    assert 'pass this message to the right colleague' in body
    assert 'تحويل الرسالة إلى الزميل المختص' in body


def test_a_role_the_system_cannot_grant_is_not_offered():
    """The template once carried labels for HR Manager and HR, which
    ALLOWED_INVITE_ROLES cannot produce — it offered a choice the system does
    not have."""
    from growth_system import _ROLE_LABELS, GrowthSystem
    assert set(_ROLE_LABELS) <= set(GrowthSystem.ALLOWED_INVITE_ROLES)


def test_an_unknown_role_still_reads_sensibly():
    """The role reaches the template from operator input, so it must never
    render as a raw identifier or an empty space to a real employer."""
    for role in (None, '', 'something_new'):
        body = _company_invitation_body(COMPANY, LINK, role)
        assert 'None' not in body
        assert 'something_new' not in body
        assert 'will be able to publish vacancies' in body


def test_first_contact_makes_the_reader_the_account_owner():
    """The company knows who is who and the operator does not, so the first
    person to redeem administers their own account and invites colleagues from
    inside. The guess disappears rather than being made more precisely."""
    from growth_system import GrowthSystem
    assert GrowthSystem._validate_role(None) == 'employer_admin'
    assert GrowthSystem._validate_role('') == 'employer_admin'


def test_an_unrecognised_role_still_degrades_rather_than_widening():
    """Deliberately different from the absent case. "Nobody chose" and
    "something supplied a value we do not understand" are different
    situations, and collapsing them would turn a typo into a privilege
    escalation."""
    from growth_system import GrowthSystem
    for junk in ('hr_manager', 'nonsense', 'admin', 123, object()):
        assert GrowthSystem._validate_role(junk) == 'recruiter'


def test_the_approval_sample_shows_BOTH_role_variants():
    """The role sentence changes the WORDING, not just a name, so one
    rendering does not represent every message the template can send. Without
    this the owner approves one variant and the platform sends the other."""
    from services.mail_templates import render
    _subject, text, _html = render('company_invitation')
    assert 'manage your organisation' in text
    assert 'publish vacancies and review candidates' in text


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
    assert subject.index('Verify the vacancy') < subject.index('التحقق من شاغر')


def test_english_leads_and_the_url_stays_ltr():
    """Also an employer message, so also English first."""
    body = _vacancy_verification_body(COMPANY, JOB, VLINK)
    assert body.index(f'Dear {COMPANY}') < body.index('السادة')
    html = _vacancy_verification_html(COMPANY, JOB, VLINK)
    assert html.index('dir="ltr"') < html.index('dir="rtl"')
    # The Arabic half is now second; its URL paragraph still carries dir="ltr"
    # so a bidi client does not reorder the punctuation inside the link text.
    arabic_half = html.split('<hr', 1)[1]
    assert 'dir="ltr"' in arabic_half


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
