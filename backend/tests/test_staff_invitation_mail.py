"""Platform-staff invitations, the last of the invitation flows to be wired.

WHY THIS ONE DIFFERS FROM THE OTHERS

It is the only outbound message addressed to a NAMED PERSON whose role the
operator deliberately chose. An employer invitation goes to a shared mailbox
taken from a NAFIS CSV, so the operator was guessing a job title for somebody
they could not identify — and the fix there was to stop asserting one. Here the
operator typed this person's name, address and role on purpose, so naming the
role is a fact about the invitation rather than a guess about the reader.

Sixteen roles are invitable, which is the interesting risk: a role added to
ALLOWED_STAFF_ROLES without a label would reach a real person as a raw
identifier, or as nothing at all.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from brand import (COUNCIL_NAME_EN, COUNCIL_NAME_AR, PLATFORM_NAME_EN,  # noqa: E402
                   BILINGUAL_RULE)
from role_labels import ROLE_LABELS  # noqa: E402
from staff_invitation_system import (  # noqa: E402
    ALLOWED_STAFF_ROLES, _staff_invitation_body,
    _staff_invitation_html, _staff_invitation_subject, _staff_role_label,
)

NAME = 'Fatima Al Suwaidi'
LINK = 'https://stg-emirati.ehrdc.gov.ae/join-staff/tok123'


def test_every_invitable_role_has_a_label_in_both_languages():
    """A role added to ALLOWED_STAFF_ROLES without a label reaches a real
    person as a raw identifier or as nothing."""
    missing = set(ALLOWED_STAFF_ROLES) - set(ROLE_LABELS)
    assert not missing, f'roles with no wording: {missing}'
    for role in ALLOWED_STAFF_ROLES:
        en, ar = ROLE_LABELS[role]
        assert en and ar
        assert '_' not in en, f'{role} label is a raw identifier: {en}'
        assert any('؀' <= c <= 'ۿ' for c in ar), f'{role} has no Arabic'


def test_no_role_label_is_a_raw_identifier_anywhere():
    for role in ALLOWED_STAFF_ROLES:
        body = _staff_invitation_body(NAME, role, LINK)
        assert role not in body, f'{role} leaked into the message as an identifier'


def test_an_unlabelled_role_degrades_to_something_readable():
    """validate_role should make this unreachable, but a raw identifier in a
    government email is worse than a vague one."""
    body = _staff_invitation_body(NAME, 'something_new', LINK)
    assert 'something_new' not in body
    assert 'the platform' in body


def test_the_person_is_addressed_by_name():
    """The only outbound message where the operator typed a real name."""
    body = _staff_invitation_body(NAME, 'advisor', LINK)
    assert f'Dear {NAME}' in body
    # And in the Arabic half. Split on the real separator constant: it is a run
    # of identical characters, so splitting on a few of them yields fragments.
    assert NAME in body.split(BILINGUAL_RULE)[1]


def test_a_missing_name_still_reads_as_a_greeting():
    for missing in (None, ''):
        body = _staff_invitation_body(missing, 'advisor', LINK)
        assert 'Dear Colleague' in body
        assert 'None' not in body


def test_the_role_IS_named_here_unlike_the_employer_invitation():
    """The distinction is the point: a guess at a shared mailbox versus a
    person the operator chose."""
    from growth_system import _company_invitation_body
    staff = _staff_invitation_body(NAME, 'coach', LINK)
    assert 'Career Coach' in staff

    employer = _company_invitation_body('Al Rostamani', LINK, 'recruiter')
    assert 'Invited as:' not in employer


def test_english_leads_because_this_is_professional_correspondence():
    """Arabic leads only the NAFIS candidate invitation, whose audience is
    specifically Emirati nationals."""
    body = _staff_invitation_body(NAME, 'advisor', LINK)
    assert body.index('Dear ') < body.index('عزيزي')
    html = _staff_invitation_html(NAME, 'advisor', LINK)
    assert html.index('dir="ltr"') < html.index('dir="rtl"')


def test_the_organisation_is_included_only_when_there_is_one():
    with_org = _staff_invitation_body(NAME, 'assessor', LINK, 'Zayed University')
    assert 'on behalf of Zayed University' in with_org
    without = _staff_invitation_body(NAME, 'assessor', LINK, None)
    assert 'on behalf of' not in without
    assert 'None' not in without


def test_it_says_uae_pass_and_the_expiry():
    body = _staff_invitation_body(NAME, 'mentor', LINK)
    assert 'UAE Pass' in body and 'الهوية الرقمية' in body
    assert '7 days' in body and '7 أيام' in body


def test_names_and_organisations_cannot_inject_markup():
    html = _staff_invitation_html('<script>a</script>', 'coach', LINK, '<b>x</b>')
    assert '<script>' not in html and '<b>x</b>' not in html
    assert '&lt;script&gt;' in html


def test_it_signs_off_as_the_council():
    body = _staff_invitation_body(NAME, 'coach', LINK)
    assert COUNCIL_NAME_EN in body and COUNCIL_NAME_AR in body
    assert PLATFORM_NAME_EN in body


def test_the_link_is_alone_on_its_line_in_both_halves():
    body = _staff_invitation_body(NAME, 'coach', LINK)
    assert body.count(LINK) == 2
    for line in (ln.strip() for ln in body.splitlines()):
        if LINK in line:
            assert line == LINK


# ── The flow ────────────────────────────────────────────────────────────────

def test_the_message_joins_the_invitation_transaction():
    source = open(os.path.join(BACKEND, 'staff_invitation_system.py'),
                  encoding='utf-8').read()
    assert 'outbound_mail.queue(' in source
    assert 'cursor=cur' in source


def test_the_link_is_still_returned_to_the_administrator():
    """The message waits for approval, and somebody starting on Sunday should
    not be blocked on a review queue."""
    source = open(os.path.join(BACKEND, 'staff_invitation_system.py'),
                  encoding='utf-8').read()
    assert "row['magic_link']" in source
    assert "'awaiting_approval'" in source


def test_the_approval_sample_lists_every_role():
    """Sixteen near-identical pages would not be read. One message plus the
    label list is, and the fingerprint still covers every label."""
    from services.mail_templates import render, TEMPLATES
    assert 'staff_invitation' in TEMPLATES
    _subject, text, _html = render('staff_invitation')
    for role in ALLOWED_STAFF_ROLES:
        assert _staff_role_label(role) in text
        assert _staff_role_label(role, arabic=True) in text
