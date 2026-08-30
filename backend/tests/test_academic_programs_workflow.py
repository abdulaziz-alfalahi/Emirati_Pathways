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

Design: docs/academic_programs_design.md
"""
import inspect
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import (  # noqa: E402
    code_only, comments_only_removed, js_code_only)

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')
PAGE = ('pages', 'graduate-programs', 'index.tsx')


def _routes():
    return code_only(open(os.path.join(BACKEND, 'routes', 'academic_programs_routes.py'),
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
    created = open(os.path.join(BACKEND, 'migrations',
                                '097_graduate_programs_directory.sql'), encoding='utf-8').read()
    renamed = open(os.path.join(BACKEND, 'migrations',
                                '099_rename_academic_programme_constraints.sql'), encoding='utf-8').read()
    # 097 created it under the table's then-name; 098 renamed the table, which
    # in Postgres leaves every constraint carrying the old one; 099 renamed
    # those. A constraint named for a table that no longer exists is the same
    # drift as a role named for a family that no longer exists.
    assert 'graduate_programs_sourced_ck' in created
    assert "status <> 'published'" in created
    assert 'academic_program' in renamed and 'RENAME CONSTRAINT' in renamed


def test_the_numbers_the_platform_cannot_know_are_gone():
    """No rating system exists; capacity and enrolment are the university's."""
    sql = open(os.path.join(BACKEND, 'migrations',
                            '097_graduate_programs_directory.sql'), encoding='utf-8').read()
    for col in ('rating', 'enrolled', 'capacity'):
        assert f'DROP COLUMN IF EXISTS {col}' in sql
    assert 'rating' not in _routes()


# ── The personas ────────────────────────────────────────────────────────────

def test_the_education_operator_curates():
    from routes.academic_programs_routes import CURATOR_ROLES
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
    from routes.academic_programs_routes import GUIDANCE_ROLES, CANDIDATE_ROLES
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
    created = open(os.path.join(BACKEND, 'migrations',
                                '097_graduate_programs_directory.sql'), encoding='utf-8').read()
    renamed = open(os.path.join(BACKEND, 'migrations',
                                '098_one_academic_programme_directory.sql'), encoding='utf-8').read()
    assert 'graduate_program_interest' in created, 'created under the old name'
    assert 'academic_program_interest' in renamed, '098 renamed it'
    for wrong in ('graduate_program_applications', 'academic_program_applications'):
        assert f'CREATE TABLE IF NOT EXISTS {wrong}' not in created + renamed


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
    assert "CHECKED_TABLES = ('scholarships', 'academic_programs')" in src
    assert 'application_link IS NOT NULL' in src


def test_a_dead_link_is_surfaced_not_silently_dropped():
    # Raw, not code_only: the SQL lives in a string literal.
    source = open(os.path.join(BACKEND, 'routes', 'academic_programs_routes.py'),
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


# ── One directory, two pages (migration 098) ────────────────────────────────

def test_one_table_serves_both_pages():
    """University Programs and Graduate Programs were two tables for one object.

    An undergraduate degree and a master's are both a programme, at an
    institution, with a link and a checked date. `university_programs` sat
    beside `graduate_programs` holding the same shape, and `universities` sat
    beside `institutions` holding the same concept — a doubly parallel subsystem
    filled only by a seed script that invented a ranking of real UAE
    universities and graduate employment rates of 96-98%.
    """
    sql = open(os.path.join(BACKEND, 'migrations',
                            '098_one_academic_programme_directory.sql'), encoding='utf-8').read()
    assert 'DROP TABLE IF EXISTS university_programs' in sql
    assert 'DROP TABLE IF EXISTS universities' in sql
    assert 'academic_programs_level_ck' in sql


def test_the_level_is_what_separates_the_two_pages():
    source = _routes()
    listing = source[source.index('def list_programs'):source.index('def listed_institutions')]
    assert 'p.level = ANY(%s)' in listing


def test_the_fabricated_seed_script_is_gone():
    """It inserted a ranking of real UAE universities (1st, 2nd, 3rd), their
    student counts, and graduate EMPLOYMENT RATES of 96-98% — the exact number a
    student uses to choose a degree, invented and attributed to named
    institutions. The migrations README pointed people at it."""
    assert not os.path.exists(os.path.join(BACKEND, 'migrations', 'seed_education.py'))
    readme = open(os.path.join(BACKEND, 'migrations', 'README.md'), encoding='utf-8').read()
    assert 'Deleted 2026-08-30' in readme


def test_nothing_claims_to_lodge_a_university_application():
    """POST /api/education/programs/<id>/apply answered "Application submitted
    successfully" while sending nothing to any university."""
    # code_only: the comment recording the removal quotes that sentence on
    # purpose, and an explanation of the fix must not read as the fix undone.
    src = code_only(open(os.path.join(BACKEND, 'education_api_routes.py'),
                         encoding='utf-8').read())
    assert "route('/programs/<int:program_id>/apply'" not in src
    assert 'Application submitted successfully' not in src

    api = os.path.join(FRONTEND, 'services', 'educationAPI.ts')
    if os.path.exists(api):
        js = open(api, encoding='utf-8').read()
        assert 'export async function applyToProgram' not in js


def test_the_institution_list_is_derived_not_a_second_table():
    """`universities` carried an invented ranking, student counts and employment
    rates. What can be said honestly is which institutions have programmes
    listed here — which is a GROUP BY, not a directory to maintain."""
    # comments_only_removed, not code_only: the GROUP BY lives inside a
    # triple-quoted SQL string, which code_only strips.
    source = comments_only_removed(
        open(os.path.join(BACKEND, 'routes', 'academic_programs_routes.py'),
             encoding='utf-8').read())
    block = source[source.index('def listed_institutions'):]
    block = block[:block.index('def create_program')]
    # Narrow to the QUERY. The docstring above it names `ranking` and the
    # employment rates deliberately, to record what this replaced — and a test
    # that reads the explanation as the code would fail on its own comment.
    sql = block[block.index('execute_query("""') + len('execute_query("""'):]
    sql = sql[:sql.index('""")')]
    assert 'GROUP BY' in sql
    assert 'ranking' not in sql and 'students_count' not in sql
    assert 'employment_rate' not in sql


def test_the_university_page_no_longer_googles_anything():
    page = _js('pages', 'education', 'UniversityProgramsPage.tsx')
    assert 'google.com/search' not in page
