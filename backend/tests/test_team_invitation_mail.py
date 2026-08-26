"""A colleague invitation is the one message we can name a real person in.

WHY THIS FILE EXISTS

This flow became load-bearing on 2026-08-26, when a first contact with a company
started conferring employer_admin — an administrator whose entire purpose is to
invite their own recruiters and HR managers. Until then it ended in a printed
link, so the first employer to do exactly what the invitation told them to do
would have hit a dead end.

It is also the only outbound message where the platform KNOWS who is asking.
Every other one arrives unbidden from a government body; this one arrives
because a named colleague at the recipient's own employer asked for it, and
saying so is the difference between a credible invitation and phishing.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from brand import COUNCIL_NAME_EN, COUNCIL_NAME_AR, PLATFORM_NAME_EN  # noqa: E402
from company_team_system import (  # noqa: E402
    _INVITABLE_TEAM_ROLES, _TEAM_ROLE_LABELS, _team_invitation_body,
    _team_invitation_html, _team_invitation_subject, _team_role_label,
)

COMPANY = 'Al Rostamani Group'
INVITER = 'Ahmed Al Mansoori'
LINK = 'https://stg-emirati.ehrdc.gov.ae/join-team/tok123'


def test_the_inviting_colleague_is_named():
    """The one thing that makes this message credible rather than suspicious."""
    body = _team_invitation_body(COMPANY, INVITER, LINK, 'recruiter')
    assert INVITER in body
    assert COMPANY in body
    html = _team_invitation_html(COMPANY, INVITER, LINK, 'recruiter')
    assert INVITER in html


def test_it_still_reads_sensibly_with_no_inviter_name_on_file():
    """full_name is nullable. "  at Al Rostamani has invited you" would be
    worse than naming only the company."""
    for missing in (None, ''):
        body = _team_invitation_body(COMPANY, missing, LINK, 'recruiter')
        assert 'None' not in body
        assert ' at  ' not in body
        assert COMPANY in body


def test_english_leads_because_this_reaches_an_employer():
    body = _team_invitation_body(COMPANY, INVITER, LINK)
    assert body.index('Hello,') < body.index('مرحباً')
    html = _team_invitation_html(COMPANY, INVITER, LINK)
    assert html.index('dir="ltr"') < html.index('dir="rtl"')


def test_hr_manager_IS_invitable_here_unlike_operator_outreach():
    """This closes the loop on the owner's question. An operator cannot grant
    HR Manager because they are guessing at a shared mailbox; the employer's
    own administrator can, because they know who their HR manager is.
    """
    from growth_system import GrowthSystem
    assert 'hr_manager' in _INVITABLE_TEAM_ROLES
    assert 'hr_manager' not in GrowthSystem.ALLOWED_INVITE_ROLES
    assert 'hr_manager' in _TEAM_ROLE_LABELS


def test_every_invitable_role_has_wording():
    """A role with no label renders the fallback, which would tell a colleague
    the wrong thing about their own access."""
    assert set(_INVITABLE_TEAM_ROLES) <= set(_TEAM_ROLE_LABELS)
    for role in _INVITABLE_TEAM_ROLES:
        assert _team_role_label(role)
        assert _team_role_label(role, arabic=True)


def test_the_message_describes_access_not_a_job_title():
    for role in _INVITABLE_TEAM_ROLES:
        body = _team_invitation_body(COMPANY, INVITER, LINK, role)
        assert 'You will be able to' in body
        assert 'Invited as:' not in body


def test_it_says_uae_pass_will_be_required():
    """Somebody clicking an unexpected link should know what is coming before
    they arrive at an identity provider."""
    body = _team_invitation_body(COMPANY, INVITER, LINK, 'recruiter')
    assert 'UAE Pass' in body
    assert 'الهوية الرقمية' in body


def test_names_cannot_inject_markup():
    """Company name comes from a NAFIS CSV; inviter name from a user record."""
    html = _team_invitation_html('<script>a</script>', '<b>x</b>', LINK, 'hr')
    assert '<script>' not in html
    assert '<b>x</b>' not in html
    assert '&lt;script&gt;' in html


def test_the_link_is_alone_on_its_line_in_both_halves():
    body = _team_invitation_body(COMPANY, INVITER, LINK)
    assert body.count(LINK) == 2
    for line in (ln.strip() for ln in body.splitlines()):
        if LINK in line:
            assert line == LINK


def test_it_signs_off_as_the_council():
    body = _team_invitation_body(COMPANY, INVITER, LINK)
    assert COUNCIL_NAME_EN in body and COUNCIL_NAME_AR in body
    assert PLATFORM_NAME_EN in body


# ── The flow ────────────────────────────────────────────────────────────────

def test_email_is_optional_and_the_link_still_comes_back():
    """An administrator may prefer to hand the link over in person or by
    whatever channel their organisation actually uses. Forcing the email path
    would remove a working option to add a new one."""
    source = open(os.path.join(BACKEND, 'company_team_system.py'),
                  encoding='utf-8').read()
    assert 'email: str = None' in source
    assert "'no_email_given'" in source
    assert "'invite_link': link" in source


def test_the_message_joins_the_invitation_transaction():
    source = open(os.path.join(BACKEND, 'company_team_system.py'),
                  encoding='utf-8').read()
    assert 'cursor=cur' in source
    assert 'outbound_mail.queue(' in source


def test_the_route_does_not_claim_it_was_sent():
    routes = open(os.path.join(BACKEND, 'routes', 'company_team_routes.py'),
                  encoding='utf-8').read()
    assert 'BEEN SENT YET' in routes
    assert "email=data.get('email')" in routes


def test_all_three_role_variants_are_sampled_for_approval():
    """The role sentence varies the wording, so one rendering does not
    represent every message this template can send."""
    from services.mail_templates import render, TEMPLATES
    assert 'team_invitation' in TEMPLATES
    _subject, text, _html = render('team_invitation')
    for role in _INVITABLE_TEAM_ROLES:
        assert f'[ if invited as: {role} ]' in text
