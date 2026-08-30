"""No page hands a citizen to a search engine.

WHAT THIS PREVENTS

Eight pages carried a button that ran `window.open()` onto a Google search:

    Knowledge Camps            "<camp> Dubai registration"
    Graduate Programs          "<university> <programme> graduate admissions"
    University Programs        "<university> <programme> admissions"  (and one
                               more that searched for a university's name)
    Youth Development          "<programme> <org> UAE"
    School Programs            "<school> <programme> admissions"
    Mentorship                 "<resource title> UAE"
    Professional Certifications "<provider> <title> certification"
    Financial Planning         "<investment> UAE investment",
                               "<benefit> UAE government", "<tool> UAE"

Labelled "Find how to register", "How to apply", "Find this resource". A search
is a guess dressed as a destination: the platform does not know where the link
goes, cannot promise the result is the right organisation, and on a government
site that is a poor thing to promise.

WHAT REPLACED THEM

Where a real link exists on the record, it is used — the institution's own
application page, the provider's course page, the school's website. Where none
exists, the page says so plainly and offers the contact details it does have.
Where the thing being linked to never existed at all — six "financial planning
tools", six mentoring "guides" — the listing is empty rather than advertised.
"""
import os
import re
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')

#: A comment mentioning what was removed is the point of the comment. Only a
#: line that actually CALLS window.open counts.
_COMMENT = re.compile(r'^\s*(\*|//|/\*|\{/\*)')


def _live_search_calls():
    if not os.path.isdir(FRONTEND):
        pytest.skip('frontend not present')
    hits = []
    for root, _dirs, files in os.walk(FRONTEND):
        for name in files:
            if not name.endswith(('.tsx', '.ts')):
                continue
            path = os.path.join(root, name)
            for n, line in enumerate(open(path, encoding='utf-8'), 1):
                if 'google.com/search' not in line and 'bing.com/search' not in line:
                    continue
                if _COMMENT.match(line):
                    continue
                hits.append(f'{os.path.relpath(path, FRONTEND)}:{n}')
    return hits


def test_no_page_opens_a_web_search():
    hits = _live_search_calls()
    assert not hits, (
        'these hand the user to a search engine instead of a real destination: '
        + ', '.join(hits))


def test_the_replacements_use_a_link_that_is_on_the_record():
    """Each page now sends people somewhere the platform was actually told
    about, or admits it has nowhere to send them."""
    checks = {
        ('pages', 'graduate-programs', 'index.tsx'): 'application_link',
        ('pages', 'education', 'UniversityProgramsPage.tsx'): 'application_link',
        ('pages', 'professional-certifications',
         'ProfessionalCertificationsPage.tsx'): 'p.url',
        ('pages', 'SchoolProgramsPage.tsx',): 'school.website',
    }
    for parts, needle in checks.items():
        path = os.path.join(FRONTEND, *parts)
        if not os.path.exists(path):
            continue
        assert needle in open(path, encoding='utf-8').read(), (
            f'{parts[-1]} does not use {needle}')


def test_nothing_advertises_a_tool_or_document_it_does_not_have():
    """Six financial-planning tools ("Salary Calculator", "Loan Comparator")
    and six mentoring guides with read times were listed as though available.
    Each had an action button that searched the web for its own name."""
    for parts, gone in (
        (('pages', 'financial-planning', 'FinancialPlanningPage.tsx'), 'Loan Comparator'),
        (('pages', 'mentorship', 'MentorshipPage.tsx'), 'How to Be a Great Mentee'),
    ):
        path = os.path.join(FRONTEND, *parts)
        if not os.path.exists(path):
            continue
        body = open(path, encoding='utf-8').read()
        assert gone not in body, f'{parts[-1]} still advertises "{gone}"'


def test_the_council_publishes_no_investment_risk_rating():
    """Each investment option carried a Low / Moderate / High rating, assigned
    by nobody, on a government platform, beside a product a citizen might act
    on. A description of a Sukuk is education; a risk rating is advice."""
    path = os.path.join(FRONTEND, 'pages', 'financial-planning', 'FinancialPlanningPage.tsx')
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    body = open(path, encoding='utf-8').read()
    assert 'opt.risk' not in body
    assert not re.search(r"risk: t\('", body)
