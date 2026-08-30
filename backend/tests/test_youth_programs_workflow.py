"""Knowledge Camps: providers submit, an operator publishes, people register.

WHAT THIS REPLACED

Six seed rows written on 2026-05-04 inside `ensure_camps_table()`, carrying
invented ratings (4.5-4.9), invented enrolment counts (45/60, 52/60) and
invented prices — which the public page summed into a "Students Enrolled"
figure. The register button ran:

    window.open(`https://www.google.com/search?q=${camp.title.en} Dubai registration`)

and the "My Registrations" tab beneath it could never populate, because nothing
recorded a registration. No endpoint could create a camp at all.

Design: docs/youth_programs_design.md
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


def _routes():
    return code_only(open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
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
    assert 'INSERT INTO youth_programs' not in source
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
    from routes.youth_programs_routes import REVIEW_ROLES
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
    from routes.youth_programs_routes import SUBMITTABLE
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
    assert "record_admin_action('youth_program_published'" in source
    assert "record_admin_action('youth_program_rejected'" in source


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
    assert 'FROM youth_program_registrations r' in source
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
    source = open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
                  encoding='utf-8').read()
    cancel = source[source.index('def cancel_registration'):source.index('def my_registrations')]
    assert "status = 'cancelled'" in cancel
    assert 'DELETE FROM youth_program_registrations' not in cancel


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
    block = source[source.index('Knowledge Camps (from youth_programs'):]
    # Slice from the SQL, not from the comment above it — the explanatory
    # comment contains the word "except", so cutting at the first occurrence
    # ended the slice before the query it is meant to check.
    block = block[block.index('cur.execute'):]
    block = block[:block.index('camps.append')]
    assert 'age_group AS age_range' in block, 'still selecting a column named age_range'
    assert 'youth_program_registrations' in block, 'spots_remaining is still a phantom column'


# ── One directory, two pages (migration 100) ────────────────────────────────

def test_one_table_serves_camps_and_development():
    """`youth_programs` was a parallel table to knowledge_camps: a read endpoint
    ordering by an invented `enrolled` column, with no workflow, no review and
    no registration. Its rows — "Youth Innovation Bootcamp" (Dubai Future
    Foundation), "STEM Excellence Academy" (Ministry of Education) — are camps
    in all but name."""
    sql = open(os.path.join(BACKEND, 'migrations',
                            '100_one_youth_programme_directory.sql'), encoding='utf-8').read()
    assert 'DROP TABLE IF EXISTS youth_programs' in sql
    assert 'ALTER TABLE knowledge_camps      RENAME TO youth_programs' in sql
    assert 'youth_programs_stream_ck' in sql


def test_the_stream_separates_the_two_pages():
    source = _routes()
    listing = source[source.index('def list_camps'):source.index('def create_camp')]
    assert 'c.stream = %s' in listing


def test_the_rename_did_not_leave_stale_constraint_names():
    """Migration 098 renamed a table and left seventeen constraints, three
    indexes and two sequences wearing the old name, needing 099 to repair it.
    That lesson is applied INLINE here — same migration, not the next one."""
    sql = open(os.path.join(BACKEND, 'migrations',
                            '100_one_youth_programme_directory.sql'), encoding='utf-8').read()
    assert 'RENAME CONSTRAINT' in sql
    assert 'ALTER INDEX' in sql
    assert 'ALTER SEQUENCE' in sql


def test_the_youth_page_registers_rather_than_searching():
    page = _js('pages', 'youth-development', 'YouthDevelopmentPage.tsx')
    assert 'google.com/search' not in page
    assert '/api/youth-programs' in page
    assert 'my-registrations' in page


def test_the_youth_page_counts_registrations_not_a_stored_number():
    """The column it replaces held 1200/1200 credited to the Ministry of
    Defence, and the old endpoint sorted by it."""
    page = _js('pages', 'youth-development', 'YouthDevelopmentPage.tsx')
    assert 'p.registered' in page
    assert 'p.enrolled' not in page


def test_the_response_key_matches_what_the_pages_read():
    """The endpoint returned `camps` — a leftover from before migration 100 —
    while the Youth Development page read `programs`. It would have rendered
    silently empty: 200, no error, no listings.

    Caught only because a verification script raised KeyError on the same
    mismatch. This is the recurring shape from the outbound-mail work: the
    backend returns one name and the frontend reads another, and nothing fails
    loudly enough to notice.
    """
    source = _routes()
    assert "'camps': rows" not in source
    assert source.count("'programs': rows") >= 3

    for page in (('pages', 'summer-camps', 'index.tsx'),
                 ('pages', 'youth-development', 'YouthDevelopmentPage.tsx')):
        js = _js(*page)
        assert 'data.programs' in js or 'data?.programs' in js, f'{page} reads the wrong key'
        assert 'data.camps' not in js


# ── Guardian consent for minors (migration 101) ─────────────────────────────

def test_consent_is_decided_by_the_programme_not_the_registrant():
    """The registrant's birthday is on file for about one person in nine, so
    the provider's declared age range is what the rule reads. The rule itself is
    tested exhaustively in test_youth_consent_rule.py."""
    source = _routes()
    register = source[source.index('def register('):source.index('def cancel_registration')]
    assert 'consent_requirement(' in register
    assert "camp['age_group']" in register


def test_a_pending_place_is_held_not_given_away():
    """Confirming your consent and then being told the camp filled up while you
    waited is worse than a seat somebody never confirms."""
    source = comments_only_removed(
        open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
             encoding='utf-8').read())
    assert "IN ('registered', 'pending_consent')" in source


def test_a_pending_row_must_carry_somebody_to_ask_and_a_way_to_confirm():
    """Otherwise the seat is held for ever and nothing can release it."""
    sql = open(os.path.join(BACKEND, 'migrations',
                            '101_guardian_consent_for_minors.sql'), encoding='utf-8').read()
    assert 'youth_program_registrations_consent_ck' in sql
    assert "status <> 'pending_consent'" in sql


def test_the_guardian_endpoints_need_no_account():
    """A parent asked to confirm a child's place is not a platform user and will
    not have UAE Pass. Requiring a sign-in means the consent never arrives, and
    a consent step nobody can complete holds the place for ever."""
    # Check the decorators ATTACHED to each consent view, not a slice between
    # functions — a slice runs on into the decorator belonging to the next one.
    raw = open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
               encoding='utf-8').read().splitlines()
    for fn in ('def consent_details(', 'def give_consent('):
        i = next(n for n, l in enumerate(raw) if l.startswith(fn))
        decorators = []
        j = i - 1
        while j >= 0 and (raw[j].startswith('@') or not raw[j].strip()):
            if raw[j].startswith('@'):
                decorators.append(raw[j])
            j -= 1
        joined = ' '.join(decorators)
        assert 'require_roles' not in joined, f'{fn} demands a signed-in user'
        assert 'jwt_required' not in joined, f'{fn} demands a signed-in user' 


def test_the_consent_token_is_single_use():
    source = comments_only_removed(
        open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
             encoding='utf-8').read())
    block = source[source.index('def give_consent'):source.index('def my_registrations')]
    assert 'consent_token = NULL' in block, 'a used token still works'


def test_declining_releases_the_place():
    source = comments_only_removed(
        open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
             encoding='utf-8').read())
    block = source[source.index('def give_consent'):source.index('def my_registrations')]
    assert "status = 'cancelled'" in block


def test_the_guardian_message_is_a_registered_template():
    """New wording cannot send until the owner approves it — the same gate every
    other outbound kind passes through."""
    from services.mail_templates import TEMPLATES, render
    assert 'guardian_consent' in TEMPLATES
    subject, body, _html = render('guardian_consent')
    assert subject and body


def test_the_guardian_message_says_what_happens_if_it_is_ignored():
    """A parent who does nothing must know the place is released, and must not
    be asked to create an account."""
    from youth_consent import guardian_consent_body
    body = guardian_consent_body('Sara', 'Robotics Camp', 'Some Org',
                                 '15-29 September', 'https://x/consent/tok')
    assert 'released' in body and 'يُلغى' in body
    assert 'do not need an account' in body
    assert body.index('عزيزي') < body.index('Dear Parent'), 'Arabic should lead'


def test_the_consent_mail_commits_with_the_registration():
    """A queued email holding a consent link to a registration that never
    existed is the orphan shape migration 086 had to clean up."""
    source = comments_only_removed(
        open(os.path.join(BACKEND, 'routes', 'youth_programs_routes.py'),
             encoding='utf-8').read())
    register = source[source.index('def register('):source.index('def cancel_registration')]
    assert 'cursor=cur' in register
