"""Skill-gap comparison, Phase 1 (docs/skill_gap_comparison_scope.md).

The feature's whole design is restraint. The two vocabularies barely intersect —
6-13% overlap with the taxonomy, measured live — so a string diff would report
~120 of 135 required skills as gaps, including ones the client plainly has under
another name. Shown to a client in a coaching session, that is not merely wrong,
it is visibly wrong.

So these tests are mostly about what the module REFUSES to conclude.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import skill_gap as sg  # noqa: E402

CLIENT, COACH = '784000000000270', '784000000000080'
PATH = 'f7341689-caba-4925-a4d8-294b05cc90b2'
KEY = f'{PATH}:0'


@pytest.fixture
def q(monkeypatch):
    """Stub execute_query, matching on a fragment of the SQL."""
    calls, responses = [], {}

    def fake(sql, params=None, fetch_one=False, fetch_all=True):
        flat = ' '.join(sql.split())
        calls.append({'sql': flat, 'params': params})
        for marker, value in responses.items():
            if marker in flat:
                return value
        return None if fetch_one else []

    monkeypatch.setattr(sg, 'execute_query', fake)
    fake.calls, fake.responses = calls, responses
    return fake


def a_role(required):
    return {'id': PATH, 'title_en': 'Software Engineering Leadership',
            'nodes': [{'role': 'Junior Developer', 'role_ar': 'مطور مبتدئ',
                       'years_experience': 0, 'certifications': [],
                       'required_skills': required}]}


# ── Normalisation: the line between a safe match and a false one ────────────

def test_c_cplusplus_and_csharp_stay_distinct():
    """Stripping all punctuation collapsed C, C++ and C# to "c", and C++ is in
    the live held-skills data — the module would have told a coach the client
    holds C++ when they listed C.

    A false HELD is worse than a false gap: the coach never works on a real
    deficiency, and nothing surfaces the error.
    """
    assert sg.normalise('C') != sg.normalise('C++')
    assert sg.normalise('C++') != sg.normalise('C#')
    assert sg.normalise('C') != sg.normalise('C#')


@pytest.mark.parametrize('a,b', [
    ('Project-Management', 'project management'),
    ('SQL', 'sql'),
    ('  Python  ', 'python'),
])
def test_trivial_differences_still_match(a, b):
    assert sg.normalise(a) == sg.normalise(b)


@pytest.mark.parametrize('a,b', [
    ('Microsoft Excel', 'Excel'),
    ('Communication & Negotiation', 'Communication'),
    ('Node.js', 'nodejs'),
])
def test_substring_and_separator_pairs_are_not_matched(a, b):
    """Each of these looks matchable and must not be. Guessing here is how
    false results get created; unclear costs a coach one click, a wrong answer
    costs them the client's confidence."""
    assert sg.normalise(a) != sg.normalise(b)


# ── The central rule: never infer "missing" ────────────────────────────────

def test_unmatched_requirements_are_unclear_never_missing(q):
    q.responses['FROM career_paths WHERE id'] = a_role(['Accounting Principles', 'Board Reporting'])
    q.responses['FROM user_skills'] = [{'skill_name': 'Microsoft Excel', 'proficiency': 'advanced',
                                        'source': 'self_reported', 'verified': False}]
    q.responses['FROM skill_gap_reviews'] = []

    out = sg.compare(CLIENT, KEY)

    assert [s['state'] for s in out['skills']] == [sg.UNCLEAR, sg.UNCLEAR]
    assert out['summary']['missing'] == 0, 'nothing may be called missing without a coach'
    assert out['summary']['unclear'] == 2


def test_summary_states_what_unclear_means(q):
    """The number must not be presentable as a finding on its own."""
    q.responses['FROM career_paths WHERE id'] = a_role(['SQL'])
    q.responses['FROM user_skills'] = []
    q.responses['FROM skill_gap_reviews'] = []

    out = sg.compare(CLIENT, KEY)

    assert 'not yet reviewed' in out['summary']['note']
    assert 'not a gap' in out['summary']['note']


def test_exact_match_is_held_and_says_so(q):
    q.responses['FROM career_paths WHERE id'] = a_role(['Python', 'SQL'])
    q.responses['FROM user_skills'] = [{'skill_name': 'python', 'proficiency': 'advanced',
                                        'source': 'self_reported', 'verified': True}]
    q.responses['FROM skill_gap_reviews'] = []

    out = sg.compare(CLIENT, KEY)
    by_name = {s['required']: s for s in out['skills']}

    assert by_name['Python']['state'] == sg.HELD
    assert by_name['Python']['decided_by'] == 'exact_match'
    # The name as the CLIENT wrote it, not the requirement's spelling.
    assert by_name['Python']['matched_skill'] == 'python'
    assert by_name['SQL']['state'] == sg.UNCLEAR


# ── The coach overrides the machine ─────────────────────────────────────────

def test_a_coach_review_beats_the_automatic_result(q):
    """The coach knows the client; the platform does not."""
    q.responses['FROM career_paths WHERE id'] = a_role(['Python'])
    q.responses['FROM user_skills'] = [{'skill_name': 'Python', 'proficiency': 'beginner',
                                        'source': 'self_reported', 'verified': False}]
    q.responses['FROM skill_gap_reviews'] = [
        {'skill_name': 'Python', 'status': sg.MISSING, 'matched_skill': None}]

    out = sg.compare(CLIENT, KEY)

    assert out['skills'][0]['state'] == sg.MISSING
    assert out['skills'][0]['decided_by'] == 'coach'


def test_coach_can_resolve_a_requirement_to_a_differently_named_skill(q):
    q.responses['FROM career_paths WHERE id'] = a_role(['Spreadsheet Modelling'])
    q.responses['FROM user_skills'] = [{'skill_name': 'Microsoft Excel', 'proficiency': 'advanced',
                                        'source': 'self_reported', 'verified': False}]
    q.responses['FROM skill_gap_reviews'] = [
        {'skill_name': 'Spreadsheet Modelling', 'status': sg.HELD,
         'matched_skill': 'Microsoft Excel'}]

    out = sg.compare(CLIENT, KEY)

    assert out['skills'][0]['state'] == sg.HELD
    assert out['skills'][0]['matched_skill'] == 'Microsoft Excel'


def test_unclear_cannot_be_stored(q):
    """It is the absence of a review, not a verdict. Storing it would blur
    "not looked at" with "looked at and could not tell"."""
    assert sg.record_review(CLIENT, COACH, KEY, 'SQL', sg.UNCLEAR) is False
    assert not q.calls, 'nothing should reach the database'


def test_review_upserts_rather_than_accumulating(q):
    q.responses['INSERT INTO skill_gap_reviews'] = {'id': 1}

    assert sg.record_review(CLIENT, COACH, KEY, 'SQL', sg.HELD, 'Databases') is True

    sql = q.calls[-1]['sql']
    assert 'ON CONFLICT' in sql and 'DO UPDATE' in sql, 'a coach changing their mind must not add a row'


def test_the_raw_pair_is_stored_unnormalised(q):
    """The labelled pair IS the training signal for Phase 2. Normalising on the
    way in would destroy the evidence."""
    q.responses['INSERT INTO skill_gap_reviews'] = {'id': 1}

    sg.record_review(CLIENT, COACH, KEY, 'Spreadsheet Modelling', sg.HELD, 'Microsoft Excel')

    params = q.calls[-1]['params']
    assert 'Spreadsheet Modelling' in params
    assert 'Microsoft Excel' in params


# ── Target roles ────────────────────────────────────────────────────────────

def test_roles_without_required_skills_are_not_offered(q):
    """A target with nothing to compare against would present as a role whose
    every requirement is already met."""
    q.responses['FROM career_paths ORDER BY'] = [{
        'id': PATH, 'title_en': 'Path', 'title_ar': 'مسار', 'sector': 'Technology',
        'nodes': [
            {'role': 'Has requirements', 'required_skills': ['Python']},
            {'role': 'Has none', 'required_skills': []},
            {'role': 'Missing the key'},
        ]}]

    roles = sg.list_target_roles()

    assert [r['role'] for r in roles] == ['Has requirements']
    assert roles[0]['role_key'] == f'{PATH}:0'


def test_unknown_role_key_returns_none_not_an_empty_comparison(q):
    """404 material. An empty requirement list would render as "this client
    meets every requirement"."""
    q.responses['FROM career_paths WHERE id'] = None

    assert sg.compare(CLIENT, f'{PATH}:0') is None
    assert sg.compare(CLIENT, 'nonsense') is None
    assert sg.compare(CLIENT, '') is None


def test_out_of_range_node_index_is_refused(q):
    q.responses['FROM career_paths WHERE id'] = a_role(['Python'])

    assert sg.compare(CLIENT, f'{PATH}:99') is None
    assert sg.compare(CLIENT, f'{PATH}:-1') is None


# ── Against the real schema ─────────────────────────────────────────────────

def test_queries_run_against_the_live_schema():
    """The mocked tests prove nothing about whether these columns exist."""
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
    import importlib
    import db_utils
    import psycopg2
    import psycopg2.extras
    importlib.reload(db_utils)

    try:
        conn = psycopg2.connect(**db_utils.DATABASE_CONFIG, connect_timeout=5)
    except Exception as e:
        pytest.skip(f'database not reachable: {e}')

    with conn.cursor() as cur:
        cur.execute("""SELECT table_name FROM information_schema.tables
                        WHERE table_schema='public'
                          AND table_name = ANY(%s)""", (['career_paths', 'user_skills', 'skill_gap_reviews'],))
        present = {r[0] for r in cur.fetchall()}
    conn.close()
    missing = {'career_paths', 'user_skills', 'skill_gap_reviews'} - present
    if missing:
        pytest.skip(f'schema not present here (missing: {sorted(missing)})')

    def real(sql, params=None, fetch_one=False, fetch_all=True):
        c = psycopg2.connect(**db_utils.DATABASE_CONFIG, connect_timeout=5)
        try:
            with c.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                return cur.fetchone() if fetch_one else cur.fetchall()
        finally:
            c.close()

    original = sg.execute_query
    sg.execute_query = real
    try:
        roles = sg.list_target_roles()
        assert roles, 'career_paths should yield target roles'
        assert all(r['required_count'] > 0 for r in roles)

        out = sg.compare('784000000000270', roles[0]['role_key'])
        assert out is not None
        s = out['summary']
        assert s['held'] + s['missing'] + s['unclear'] == s['required']
        # No coach has reviewed anything, so nothing may be marked missing.
        assert s['missing'] == 0
    finally:
        sg.execute_query = original
