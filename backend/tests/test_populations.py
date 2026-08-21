"""Three population numbers, defined once, and who is allowed to see whom.

Owner request 2026-08-21: the number of employed Emiratis, the number of job
seekers, and the number who have actually onboarded — reported to board members,
the CRM, and other personas.

The trap this guards against is not a missing feature. It is the SAME question
being answered differently on two screens. "Job seeker" already had four
plausible definitions in the database, differing by 2.7x:

    work_status = 'Not Working'            3,091
    looking_status = 'Looking For Work'    1,969
    job_seeker_type IS NOT NULL            5,034
    rows in nafis_job_seekers              3,969

A board paper quoting one and a CRM screen showing another would discredit both.
So the definitions live in backend/populations.py and every surface reads them
from there.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


# ── Membership is derived, not stored ───────────────────────────────────────

def test_membership_is_derived_from_signing_in():
    """A flag someone must remember to set is how two stores end up disagreeing
    — the shape of both role bugs found on 2026-08-21. Derived from
    authentication, it becomes true the moment a person actually joins, with no
    backfill and nothing to keep in sync."""
    import populations as pop
    assert 'last_login IS NOT NULL' in pop.MEMBER_PREDICATE
    assert 'uaepass_uuid IS NOT NULL' in pop.MEMBER_PREDICATE
    assert 'is_member' not in pop.MEMBER_PREDICATE, 'membership must not become a column'


def test_the_predicate_can_be_aliased():
    """Pool queries alias the users table differently; a hard-coded 'u.' would
    force copies, and copies drift."""
    import populations as pop
    assert 'x.last_login' in pop.member_predicate('x')


# ── One definition per population ───────────────────────────────────────────

def test_all_three_questions_have_a_definition():
    import populations as pop
    for key in ('employed', 'seeking'):
        assert key in pop.POPULATIONS, key
    assert 'employment_unknown' in pop.POPULATIONS, \
        'people with neither field set must be counted as unknown, not folded into a bucket'


def test_seeking_is_not_the_same_as_not_working():
    """The distinction that makes the numbers defensible: 108 employed people
    are looking to move, and 363 not-working people are not looking."""
    import populations as pop
    assert pop.POPULATIONS['seeking']['sql'] != pop.POPULATIONS['not_working']['sql']
    assert 'looking_status' in pop.POPULATIONS['seeking']['sql']
    assert 'work_status' in pop.POPULATIONS['not_working']['sql']


def test_every_population_states_what_it_does_not_mean():
    """Each of these has been misread at least once; the caveat travels with
    the number."""
    import populations as pop
    for key, spec in pop.POPULATIONS.items():
        assert spec.get('means'), key
        assert spec.get('label_ar'), f'{key} has no Arabic label'


# ── Recorded is not registered ──────────────────────────────────────────────

def test_the_endpoint_reports_both_recorded_and_registered():
    """5,309 candidate records, 37 of whom have ever signed in. Publishing
    either number alone is a false statement about the other."""
    src = _src('routes', 'strategic_metrics_api.py')
    body = src.split('def population_summary')[1]
    assert "'registered'" in body
    assert "'recorded'" in body
    assert 'not_yet_signed_in' in body


def test_employers_are_not_shown_the_recorded_total():
    """A recruiter told "37,000 candidates" when 37 can answer has been given a
    false picture of the pool they can reach."""
    src = _src('routes', 'strategic_metrics_api.py')
    body = src.split('def population_summary')[1]
    assert 'if not members_only:' in body


def test_governance_readers_keep_the_full_picture():
    """The board must see both numbers — that is the whole point of separating
    them."""
    src = _src('routes', 'strategic_metrics_api.py')
    body = src.split('def population_summary')[1]
    assert 'GOVERNANCE_ROLES' in body


# ── Employer-facing pools exclude non-members ───────────────────────────────

MEMBER_SQL = '(u.last_login IS NOT NULL OR u.uaepass_uuid IS NOT NULL)'


def test_candidate_search_is_members_only():
    """The reported ask: exclude from matching people who are not really on the
    platform. Without it, the incoming 33,352 private-sector employees would be
    the overwhelming majority of every recruiter search result."""
    src = _src('hr_candidate_search_routes.py')
    block = src.split('where_conditions = [')[1].split(']')[0]
    assert 'last_login IS NOT NULL' in block


def test_the_employer_dashboard_pool_is_members_only():
    src = _src('routes', 'hr_dashboard_api.py')
    assert src.count(MEMBER_SQL) >= 2, 'an employer-facing pool query still includes non-members'


def test_the_employer_facing_total_is_members_only():
    src = _src('routes', 'hr_dashboard_api.py')
    block = src.split("'totalCandidates'")[1][:400]
    assert 'last_login IS NOT NULL' in block


def test_the_crm_is_not_restricted():
    """The CRM exists precisely to see people who have NOT joined yet and call
    them. Restricting it would remove its reason to exist."""
    import populations as pop
    assert 'career_services_operator' not in pop.AUDIENCE_MEMBERS_ONLY
    assert 'call_center_agent' not in pop.AUDIENCE_MEMBERS_ONLY
    assert 'recruiter' in pop.AUDIENCE_MEMBERS_ONLY


# ── Employment over time (owner request 2026-08-21) ─────────────────────────

def test_the_timeline_carries_its_own_caveat():
    """This counts people employed NOW, so every earlier year is undercounted —
    anyone who has since left is absent from the source. Presented bare, the
    rise from 529 starts in 2021 to 10,470 in 2025 reads as a fivefold increase
    in hiring, which the data cannot support on its own.

    The caveat travels in the payload so it cannot be lost between the API and
    a board slide.
    """
    src = _src('routes', 'strategic_metrics_api.py')
    body = src.split('def employment_timeline')[1]
    assert "'basis'" in body
    assert 'UNDERCOUNTED' in body or 'undercount' in body.lower()
    assert 'survivorship' in body.lower()


def test_the_timeline_is_not_offered_to_employers():
    """Employment history of the national workforce is governance and CRM
    material, not something to hand an employer alongside a candidate list."""
    src = _src('routes', 'strategic_metrics_api.py')
    head = src.split('def employment_timeline')[0]
    decorators = head.split("@strategic_metrics_bp.route('/employment-timeline'")[-1]
    assert 'GOVERNANCE_ROLES' in decorators
    assert 'recruiter' not in decorators
    assert 'employer_admin' not in decorators


def test_the_chart_renders_the_basis_next_to_the_bars():
    """A caveat only the API knows is a caveat nobody reads."""
    path = os.path.join(BACKEND, '..', 'frontend', 'src', 'pages',
                        'operator-dashboards', 'ExecutiveDashboard.tsx')
    if not os.path.exists(path):
        return
    with open(path, encoding='utf-8') as fh:
        src = fh.read()
    assert 'empTimeline.basis' in src, 'the chart shows numbers without their basis'
