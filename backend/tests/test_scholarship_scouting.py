"""The scout proposes; a person decides; a rejection sticks.

WHY THIS FILE EXISTS

Phase 2 puts an AI in front of a government directory. Three properties have to
hold, and each fails quietly rather than loudly:

  * NOTHING PUBLISHES ITSELF. The review step is the product. An AI that
    published directly would be a machine for putting unverified claims about
    money in front of people.

  * THE MODEL DOES NOT INVENT ELIGIBILITY. A wrong "minimum GPA 3.0" stops a
    qualified person applying and nobody ever finds out. Verified against the
    real model on 2026-08-25: given a page saying "fully funded", it returned
    coverage_type="Fully funded" and NO amount, no min_gpa, no academic_level.

  * A REJECTION STICKS. The scout reads the same pages every day. Without a
    memory of what was turned down, the same item returns every morning until
    the operator stops opening the queue — the tool dying of repetition rather
    than of being wrong.
"""
import os
import re
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

ROUTES = os.path.join(BACKEND, 'education_api_routes.py')
SCOUT = os.path.join(BACKEND, 'scholarship_scout.py')
MIGRATION = os.path.join(BACKEND, 'migrations', '084_scholarship_scouting.sql')


def _read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def _function(src, name):
    start = src.index(f'def {name}(')
    nxt = src.find('\n@education_bp', start)
    return src[start:nxt if nxt > 0 else len(src)]


# ── Nothing publishes itself ────────────────────────────────────────────────

def test_every_scouting_endpoint_requires_a_reviewer_role():
    src = _read(ROUTES)
    for name in ('list_scholarship_drafts', 'approve_scholarship_draft',
                 'reject_scholarship_draft', 'scholarship_sources',
                 'remove_scholarship_source'):
        deco = src[:src.index(f'def {name}(')].rsplit('@education_bp.route', 1)[1]
        assert 'require_roles' in deco, f'{name} has no role check'


def test_the_scout_writes_drafts_not_scholarships():
    """The runner must never insert straight into the published table."""
    runner = _read(os.path.join(BACKEND, 'scripts', 'scout_scholarships.py'))
    assert 'INSERT INTO scholarship_drafts' in runner
    assert 'INSERT INTO scholarships' not in runner, (
        'the scout writes directly into the published directory, bypassing '
        'the review step that is the whole point of it'
    )


def test_approving_still_requires_an_application_link():
    """A scouted entry is not exempt from the directory's own rule."""
    body = _function(_read(ROUTES), 'approve_scholarship_draft')
    assert 'needs an application link' in body, (
        'a draft can be published without somewhere for the candidate to apply'
    )


# ── The model does not invent ───────────────────────────────────────────────

def test_the_prompt_forbids_inferring_values():
    src = _read(SCOUT)
    assert 'NEVER infer' in src
    assert 'omission is always better than a guess' in src


def test_a_deadline_is_only_accepted_in_the_exact_form_the_page_gave():
    """Coercing is how "closes end of June" becomes a confident 30 June."""
    from scholarship_scout import _clean_date
    from datetime import date
    assert _clean_date('2026-06-30') == date(2026, 6, 30)
    for bad in ('end of June', '30/06/2026', 'June 2026', '', None, '2026-6-30'):
        assert _clean_date(bad) is None, f'{bad!r} was coerced into a date'


def test_fully_funded_does_not_become_an_amount():
    from scholarship_scout import normalise
    out = normalise({'title': 'X', 'coverage_type': 'Fully funded'}, 'https://x')
    assert out['amount'] is None
    assert out['min_gpa'] is None


def test_eligibility_is_quoted_not_turned_into_a_filter():
    """A quote the operator can check beats a structured claim nobody verified."""
    from scholarship_scout import normalise
    out = normalise({'title': 'X', 'eligibility_text': 'Must hold a Dubai family book'},
                    'https://x')
    assert 'Dubai family book' in (out['description'] or '')
    assert out['min_gpa'] is None


def test_a_fabricated_application_link_is_dropped():
    from scholarship_scout import normalise
    out = normalise({'title': 'X', 'application_link': 'see the website'}, 'https://x')
    assert out['application_link'] is None


# ── A rejection sticks ──────────────────────────────────────────────────────

def test_rejecting_records_the_identity_not_just_the_draft():
    body = _function(_read(ROUTES), 'reject_scholarship_draft')
    assert 'INSERT INTO scholarship_rejections' in body
    assert 'source_url' in body and 'fingerprint' in body, (
        'a rejection that does not record WHICH page and WHICH content cannot '
        'suppress the same item tomorrow'
    )


def test_the_scout_checks_rejections_before_proposing():
    runner = _read(os.path.join(BACKEND, 'scripts', 'scout_scholarships.py'))
    assert '_already_rejected' in runner
    idx_check = runner.index('_already_rejected(c2')
    idx_insert = runner.index('INSERT INTO scholarship_drafts')
    assert idx_check < idx_insert, 'rejections are consulted after the draft is written'


def test_the_rejection_identity_is_unique_in_the_database():
    """Enforced in the schema, not left to whichever script writes next."""
    sql = _read(MIGRATION)
    assert 'idx_scholarship_rejections_identity' in sql
    assert re.search(r'UNIQUE INDEX.*scholarship_rejections_identity', sql, re.S)


def test_an_unreadable_source_is_not_reported_as_finding_nothing():
    """Silence is not success — the distinction Phase 0 exists to preserve."""
    runner = _read(os.path.join(BACKEND, 'scripts', 'scout_scholarships.py'))
    assert "entry['error']" in runner
    assert 'could not be read' in runner


# ── Provenance ──────────────────────────────────────────────────────────────

def test_an_approved_draft_keeps_what_the_model_was_given():
    sql = _read(MIGRATION)
    assert 'extracted_raw' in sql
    body = _function(_read(ROUTES), 'approve_scholarship_draft')
    assert 'operator_edits' in body, (
        'the operator’s corrections are not recorded, so there is no honest '
        'measure of whether the scout is worth running'
    )
