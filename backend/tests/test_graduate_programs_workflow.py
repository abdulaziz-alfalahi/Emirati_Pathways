"""Graduate programmes: a curated directory, and the candidate's journey.

WHAT THIS REPLACED

Six rows written in one instant on 2026-06-17 attributing invented tuition,
invented enrolment and a rating from a non-existent rating system to six NAMED
REAL UNIVERSITIES — AED 95,000 for the MBRSG MBA, "Fully Funded" for a Masdar
PhD. Removed by migration 096. The page's button ran a Google search for
"<university> <programme> graduate admissions".

THE CONSTRAINT THIS IS BUILT AROUND

The platform cannot accept an application on a university's behalf. Anything
resembling "apply here" would be a lie somebody acts on. So it points accurately
and remembers the journey — and the journey is what Article 4(10) reporting
needs, because no admissions system reports back to the Council.

Design: docs/graduate_programs_design.md
"""
import inspect
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import code_only, js_code_only  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')
PAGE = ('pages', 'graduate-programs', 'index.tsx')


def _routes():
    return code_only(open(os.path.join(BACKEND, 'routes', 'graduate_programs_routes.py'),
                          encoding='utf-8').read())


def _js(*parts):
    path = os.path.join(FRONTEND, *parts)
    if not os.path.exists(path):
        pytest.skip('frontend not present')
    return js_code_only(open(path, encoding='utf-8').read())


# ── The rule the removed rows broke ─────────────────────────────────────────

def test_publishing_requires_a_source_and_a_checked_date():
    """The whole answer to what went wrong: the removed rows carried figures for
    named universities and no source at all."""
    source = _routes()
    publish = source[source.index('def publish('):source.index('def reject(')]
    assert 'application_link' in publish
    assert 'details_checked_on' in publish


def test_the_database_enforces_it_too():
    """A CHECK constraint, so a future writer cannot route around the endpoint."""
    sql = open(os.path.join(BACKEND, 'migrations',
                            '097_graduate_programs_directory.sql'), encoding='utf-8').read()
    assert 'graduate_programs_sourced_ck' in sql
    assert "status <> 'published'" in sql


def test_the_numbers_the_platform_cannot_know_are_gone():
    """No rating system exists; capacity and enrolment are the university's."""
    sql = open(os.path.join(BACKEND, 'migrations',
                            '097_graduate_programs_directory.sql'), encoding='utf-8').read()
    for col in ('rating', 'enrolled', 'capacity'):
        assert f'DROP COLUMN IF EXISTS {col}' in sql
    assert 'rating' not in _routes()


# ── The personas ────────────────────────────────────────────────────────────

def test_the_education_operator_curates():
    from routes.graduate_programs_routes import CURATOR_ROLES
    assert 'education_operator' in CURATOR_ROLES
    assert 'candidate' not in CURATOR_ROLES


def test_an_institution_may_only_submit_its_own_programmes():
    source = _routes()
    create = source[source.index('def create_program'):source.index('def update_program')]
    assert 'institution_staff' in source
    assert 'your own institution' in create


def test_guidance_roles_can_read_a_journey_but_never_write_it():
    """A career services operator or advisor who could edit this would make the
    record untrustworthy to the person it describes — and it is their record."""
    from routes.graduate_programs_routes import GUIDANCE_ROLES, CANDIDATE_ROLES
    assert 'career_services_operator' in GUIDANCE_ROLES
    assert 'advisor' in GUIDANCE_ROLES
    for writer in ('candidate', 'student'):
        assert writer in CANDIDATE_ROLES

    source = _routes()
    read_only = source[source.index('def interest_for_person'):source.index('def outcomes')]
    for write in ('INSERT', 'UPDATE', 'DELETE'):
        assert write not in read_only.upper(), 'the guidance view can write'


def test_only_the_person_records_their_own_stage():
    source = _routes()
    setter = source[source.index('def set_interest'):source.index('def clear_interest')]
    assert 'get_jwt_identity()' in setter
    assert "payload.get('user_id')" not in setter, 'the caller can choose whose record this is'


# ── The honest naming ───────────────────────────────────────────────────────

def test_it_is_called_interest_not_application():
    """The platform records what a person told us; it does not submit anything.
    A table called `applications` invites the next reader to build a submit
    button that cannot exist."""
    sql = open(os.path.join(BACKEND, 'migrations',
                            '097_graduate_programs_directory.sql'), encoding='utf-8').read()
    assert 'graduate_program_interest' in sql
    assert 'CREATE TABLE IF NOT EXISTS graduate_program_applications' not in sql


def test_nothing_claims_to_submit_an_application():
    source = _routes()
    assert 'submit_application' not in source
    page = _js(*PAGE)
    assert 'Apply on the university site' in page, 'the CTA must say where it goes'


# ── The listing ─────────────────────────────────────────────────────────────

def test_only_published_programmes_are_public():
    source = _routes()
    listing = source[source.index('def list_programs'):source.index('def create_program')]
    assert "p.status = 'published'" in listing


def test_the_link_checker_covers_this_directory_too():
    """A link is only worth something if somebody keeps checking it resolves."""
    # scripts/ is not on the path for the app, so read the file rather than
    # importing it — the checker is a standalone script by design.
    src = open(os.path.join(BACKEND, 'scripts', 'verify_links.py'), encoding='utf-8').read()
    assert "CHECKED_TABLES = ('scholarships', 'graduate_programs')" in src
    assert 'application_link IS NOT NULL' in src


def test_a_dead_link_is_surfaced_not_silently_dropped():
    # Raw, not code_only: the SQL lives in a string literal.
    source = open(os.path.join(BACKEND, 'routes', 'graduate_programs_routes.py'),
                  encoding='utf-8').read()
    assert 'def link_health' in source
    health = source[source.index('def link_health'):source.index('def set_interest')]
    assert "link_status IS DISTINCT FROM 'ok'" in health


# ── The page ────────────────────────────────────────────────────────────────

def test_the_page_no_longer_googles_the_university():
    page = _js(*PAGE)
    assert 'google.com/search' not in page


def test_the_page_shows_no_rating_and_no_invented_enrolment():
    page = _js(*PAGE)
    for gone in ('p.rating', 'p.enrolled', 'p.capacity'):
        assert gone not in page, f'{gone} is still rendered'


def test_tuition_is_attributed_not_asserted():
    """"as published by <institution>, checked <date>" — the fix for publishing
    a fee for a named university as though the platform knew it."""
    page = _js(*PAGE)
    assert 'Details as published by' in page
    assert 'checked' in page
