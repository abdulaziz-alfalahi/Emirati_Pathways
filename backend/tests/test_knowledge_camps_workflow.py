"""Knowledge Camps: providers submit, an operator publishes, people register.

WHAT THIS REPLACED

Six seed rows written on 2026-05-04 inside `ensure_camps_table()`, carrying
invented ratings (4.5-4.9), invented enrolment counts (45/60, 52/60) and
invented prices — which the public page summed into a "Students Enrolled"
figure. The register button ran:

    window.open(`https://www.google.com/search?q=${camp.title.en} Dubai registration`)

and the "My Registrations" tab beneath it could never populate, because nothing
recorded a registration. No endpoint could create a camp at all.

Design: docs/knowledge_camps_design.md
"""
import inspect
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import code_only, js_code_only  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')


def _routes():
    return code_only(open(os.path.join(BACKEND, 'routes', 'knowledge_camps_routes.py'),
                          encoding='utf-8').read())


def _js(*parts):
    path = os.path.join(FRONTEND, *parts)
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    return js_code_only(open(path, encoding='utf-8').read())


# ── The seeding, which is the reason the page could not be trusted ──────────

def test_the_camps_table_is_never_seeded_again():
    """`ensure_camps_table` inserted six invented camps whenever it found the
    table empty. Left in place it would have re-inserted all six the moment
    migration 095 deleted them."""
    import education_api_routes
    source = inspect.getsource(education_api_routes.ensure_camps_table)
    assert 'INSERT INTO knowledge_camps' not in source
    assert 'Coding Bootcamp' not in source


def test_no_fabricated_camp_survives():
    """Scoped to the CAMPS, deliberately. A file-wide search for invented
    ratings also finds graduate_programs, which carries its own seeded 4.8s and
    is a separate problem — noted, not silently swept into this change."""
    src = open(os.path.join(BACKEND, 'education_api_routes.py'), encoding='utf-8').read()
    for invented in ('Robotics & AI Camp', 'Young Scientists Academy',
                     'Coding Bootcamp for Teens', 'Sports Excellence Program'):
        assert invented not in src, f'{invented!r} is still seeded'


# ── Who may publish ─────────────────────────────────────────────────────────

def test_the_education_operator_reviews_not_the_professional_dev_operator():
    """The split is by AUDIENCE: camps are school-age, training programmes are
    for working adults."""
    from routes.knowledge_camps_routes import REVIEW_ROLES
    assert 'education_operator' in REVIEW_ROLES
    assert 'professional_dev_operator' not in REVIEW_ROLES
    assert 'candidate' not in REVIEW_ROLES


def test_creating_a_camp_can_never_publish_it():
    """Whoever calls it, including an operator. Publishing is a reviewed act
    with a name attached; a create that could publish makes review optional."""
    source = _routes()
    create = source[source.index('def create_camp'):source.index('def update_camp')]
    assert "'published'" not in create


def test_a_provider_cannot_set_its_own_status():
    """A payload that could carry `status` would walk straight past review."""
    from routes.knowledge_camps_routes import SUBMITTABLE
    for forbidden in ('status', 'reviewed_by', 'reviewed_at', 'created_by', 'featured'):
        assert forbidden not in SUBMITTABLE


def test_a_submitter_must_be_bound_to_the_organisation():
    """Otherwise "stakeholders post" quietly means "anybody posts"."""
    source = _routes()
    assert 'institution_staff' in source
    assert 'training_center_staff' in source
    create = source[source.index('def create_camp'):source.index('def update_camp')]
    assert 'not staff of that institution' in create


def test_rejection_requires_a_reason():
    """A rejection the provider cannot read is one they repeat."""
    source = _routes()
    reject = source[source.index('def reject_camp'):source.index('def register(')]
    assert 'a reason is required' in reject


def test_publishing_and_rejecting_are_audited():
    source = _routes()
    assert "record_admin_action('knowledge_camp_published'" in source
    assert "record_admin_action('knowledge_camp_rejected'" in source


# ── The listing ─────────────────────────────────────────────────────────────

def test_only_published_camps_are_public():
    """A listing that can be talked into returning drafts makes review
    decorative — so the filter is applied server-side, not by the caller."""
    source = _routes()
    listing = source[source.index('def list_camps'):source.index('def create_camp')]
    assert "c.status = 'published'" in listing
    assert "request.args.get('status')" not in listing


def test_enrolment_is_counted_not_stored():
    """The column it replaces held numbers nobody counted, and the page summed
    them into a public total."""
    source = _routes()
    assert 'FROM camp_registrations r' in source
    assert 'c.enrolled' not in source
    assert 'c.rating' not in source


# ── Registration ────────────────────────────────────────────────────────────

def test_capacity_is_decided_with_the_row_locked():
    """Two people racing for the last place must not both get it, which a
    read-then-write cannot prevent."""
    source = _routes()
    register = source[source.index('def register('):source.index('def cancel_registration')]
    assert 'FOR UPDATE' in register
    assert 'conn.commit()' in register
    assert 'conn.rollback()' in register


def test_a_full_camp_waitlists_rather_than_refusing():
    """Demand the operator cannot see is demand the platform threw away."""
    source = _routes()
    register = source[source.index('def register('):source.index('def cancel_registration')]
    assert "'waitlisted'" in register


def test_registration_is_refused_on_an_unpublished_camp():
    source = _routes()
    register = source[source.index('def register('):source.index('def cancel_registration')]
    assert "!= 'published'" in register


def test_cancelling_keeps_the_row():
    """So an operator can see somebody registered and withdrew, rather than the
    withdrawal leaving no trace."""
    # Raw, not code_only: the SQL lives in a string literal, which the stripper
    # removes along with the docstrings.
    source = open(os.path.join(BACKEND, 'routes', 'knowledge_camps_routes.py'),
                  encoding='utf-8').read()
    cancel = source[source.index('def cancel_registration'):source.index('def my_registrations')]
    assert "status = 'cancelled'" in cancel
    assert 'DELETE FROM camp_registrations' not in cancel


# ── The page ────────────────────────────────────────────────────────────────

def test_the_register_button_no_longer_googles_the_camp():
    source = _js('pages', 'summer-camps', 'index.tsx')
    assert 'google.com/search' not in source, 'the button still runs a web search'
    assert 'knowledge-camps/${campId}/register' in source or 'register' in source


def test_the_page_reports_real_registrations():
    source = _js('pages', 'summer-camps', 'index.tsx')
    assert 'my-registrations' in source
    assert 'c.enrolled' not in source


def test_the_operator_has_somewhere_to_review():
    source = _js('pages', 'operator-dashboards', 'EducationOperatorDashboard.tsx')
    assert 'CampReviewQueue' in source
    assert "'camps'" in source


def test_the_parent_view_no_longer_selects_columns_that_do_not_exist():
    """career_services_routes asked for start_date, end_date, location_ar,
    age_range and spots_remaining inside a bare `except:` — five columns that
    did not exist — so it returned an empty list to every parent."""
    source = open(os.path.join(BACKEND, 'career_services_routes.py'), encoding='utf-8').read()
    block = source[source.index('Knowledge Camps (from knowledge_camps'):]
    # Slice from the SQL, not from the comment above it — the explanatory
    # comment contains the word "except", so cutting at the first occurrence
    # ended the slice before the query it is meant to check.
    block = block[block.index('cur.execute'):]
    block = block[:block.index('camps.append')]
    assert 'age_group AS age_range' in block, 'still selecting a column named age_range'
    assert 'camp_registrations' in block, 'spots_remaining is still a phantom column'
