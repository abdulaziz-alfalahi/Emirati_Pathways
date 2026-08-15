"""The one definition layer for what an employer received.

These numbers will appear in an employer view, an operator view and Council
reporting. The failure mode worth guarding is not a crash — it is a confident
figure that is quietly wrong, because that is the kind that survives into a
pricing decision.

So most of what follows tests restraint: that an unmeasurable duration is None
and not zero, that a rate over three applications is suppressed, and that a
median computed from a fraction of placements says so.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import employer_value as ev  # noqa: E402

COMPANY = '11111111-2222-3333-4444-555555555555'


@pytest.fixture
def q(monkeypatch):
    """Capture SQL and return canned rows. _query is the single seam."""
    calls = []
    responses = {}

    def fake(sql, params=None, one=False):
        calls.append({'sql': ' '.join(sql.split()), 'params': params, 'one': one})
        for marker, value in responses.items():
            if marker in ' '.join(sql.split()):
                return value
        return {} if one else []

    monkeypatch.setattr(ev, '_query', fake)
    fake.calls = calls
    fake.responses = responses
    return fake


# ── Honest nulls: the point of the module ───────────────────────────────────

def test_unmeasurable_duration_is_none_not_zero(q):
    """Zero days would read as "hired instantly" — the opposite of the truth."""
    q.responses["count(*) AS measured"] = {'measured': 0, 'median_days': None}
    q.responses["count(DISTINCT a.id) AS n"] = {'n': 0}

    out = ev.time_to_hire(COMPANY)

    assert out['median_days'] is None
    assert out['median_days'] != 0


def test_rate_is_suppressed_below_the_minimum_denominator():
    # "33%" from three applications invites a decision the data cannot support.
    assert ev.rate(1, 3) is None
    assert ev.rate(0, 0) is None
    assert ev.rate(5, ev.MIN_RATE_DENOMINATOR) == 50.0


def test_partial_coverage_is_declared_not_hidden(q):
    """A median over 8 of 40 placements is a different claim from a median
    over 40, and the caller must be able to tell."""
    q.responses["count(*) AS measured"] = {'measured': 8, 'median_days': 21.4}
    q.responses["count(DISTINCT a.id) AS n"] = {'n': 40}

    out = ev.time_to_hire(COMPANY)

    assert out['median_days'] == 21.4
    assert out['measured'] == 8 and out['total'] == 40
    assert out['complete'] is False
    assert '8 of 40' in out['note']


def test_full_coverage_is_marked_complete(q):
    q.responses["count(*) AS measured"] = {'measured': 12, 'median_days': 15.0}
    q.responses["count(DISTINCT a.id) AS n"] = {'n': 12}

    out = ev.time_to_hire(COMPANY)

    assert out['complete'] is True
    assert 'note' not in out


# ── The settled decisions ───────────────────────────────────────────────────

def test_only_the_authoritative_timestamp_is_read(q):
    """job_applications carries applied_at AND submitted_at, populated
    identically today. Reading both is how two dashboards start disagreeing."""
    ev.employer_value(COMPANY, days=30)

    all_sql = ' '.join(c['sql'] for c in q.calls)
    assert 'applied_at' in all_sql
    assert 'submitted_at' not in all_sql


def test_placements_are_counted_at_the_transition_not_the_current_status(q):
    """Decision 3: value is delivered at the hire, so the placement belongs to
    the period it happened in — and a row later edited still counts."""
    ev.placements(COMPANY, days=30)

    sql = q.calls[-1]['sql']
    assert 'application_status_history' in sql
    assert "h.new_status = 'placed'" in sql
    assert 'h.changed_at' in sql


def test_attribution_requires_an_application_record(q):
    """Decision 1: a hire is ours when the candidate applied through us. Every
    outcome query must join job_applications, or we would be counting hires we
    cannot evidence."""
    ev.employer_value(COMPANY)

    for call in q.calls:
        assert 'job_applications' in call['sql'], call['sql']
        assert 'job_postings' in call['sql'], call['sql']


def test_the_posting_join_keeps_its_cast(q):
    """job_postings.id is integer and job_applications.job_id is text, so an
    uncast join fails outright. The cast is on the POSTING side deliberately:
    a.job_id::integer would raise on the first non-numeric value ever written,
    turning a report into an outage. Do not "tidy" this away.
    """
    ev.employer_value(COMPANY)

    joins = [c['sql'] for c in q.calls if 'job_postings' in c['sql']]
    assert joins, 'no query joined job_postings'
    for sql in joins:
        assert 'p.id::text = a.job_id' in sql, sql
        assert 'a.job_id::integer' not in sql, sql


def test_lifetime_window_omits_the_time_filter(q):
    ev.placements(COMPANY, days=None)
    assert 'make_interval' not in q.calls[-1]['sql']

    ev.placements(COMPANY, days=90)
    assert 'make_interval' in q.calls[-1]['sql']


def test_time_to_first_shortlist_measures_platform_not_employer_speed(q):
    """Kept separate from time-to-hire on purpose: one is our performance, the
    other includes how fast the employer moves."""
    ev.time_to_first_shortlist(COMPANY)

    assert q.calls[-1]['params'][1] == ev.SHORTLISTED


# ── Funnel shape ────────────────────────────────────────────────────────────

def test_stage_counts_include_empty_stages(q):
    """A consumer must be able to draw a complete funnel without inventing the
    gaps, so every canonical stage is present even at zero."""
    q.responses['GROUP BY a.status'] = [
        {'status': 'submitted', 'n': 5}, {'status': 'placed', 'n': 2},
    ]

    counts = ev.stage_counts(COMPANY)

    from application_stages import APPLICATION_STAGES
    assert set(APPLICATION_STAGES) <= set(counts)
    assert counts['submitted'] == 5 and counts['placed'] == 2
    assert counts['offered'] == 0


def test_terminal_states_are_kept_even_though_they_are_not_stages(q):
    """rejected and withdrawn are ends, not rungs — but dropping them would
    silently shrink the application total."""
    q.responses['GROUP BY a.status'] = [
        {'status': 'submitted', 'n': 3}, {'status': 'rejected', 'n': 4},
        {'status': 'withdrawn', 'n': 1},
    ]

    counts = ev.stage_counts(COMPANY)

    assert counts['rejected'] == 4 and counts['withdrawn'] == 1
    assert sum(counts.values()) == 8


# ── The single call a surface makes ─────────────────────────────────────────

def test_employer_value_reports_no_outcomes_rather_than_zeros(q):
    """An employer with no hires yet must be distinguishable from one measured
    at zero — the same discipline the AI usage panel follows."""
    q.responses["count(*) AS measured"] = {'measured': 0, 'median_days': None}
    q.responses["count(DISTINCT a.id) AS n"] = {'n': 0}
    q.responses['GROUP BY a.status'] = [{'status': 'submitted', 'n': 3}]

    out = ev.employer_value(COMPANY, days=90)

    assert out['has_outcomes'] is False
    assert out['placements'] == 0
    assert out['time_to_hire']['median_days'] is None
    # 3 applications is below the denominator, so no rate is offered.
    assert out['placement_rate_pct'] is None


def test_employer_value_shape_is_stable(q):
    out = ev.employer_value(COMPANY)
    assert set(out) == {
        'company_id', 'window_days', 'applications', 'placements',
        'time_to_hire', 'time_to_first_shortlist', 'stage_counts',
        'placement_rate_pct', 'has_outcomes', 'min_rate_denominator',
    }


# ── Against the real schema ─────────────────────────────────────────────────

def test_queries_run_against_the_live_schema():
    """Every query above is exercised with mocks, which proves nothing about
    whether the columns exist. This runs them for real.

    A company id that matches nothing is fine — the assertion is that the SQL
    parses and the joins resolve, not that rows come back.
    """
    # Load the environment explicitly. Without this the test passes only when
    # some OTHER test module happened to call load_dotenv first, and skips
    # silently when run alone — which is exactly when someone is iterating on
    # these queries and most needs it to run.
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

    import importlib
    import db_utils
    importlib.reload(db_utils)          # pick up the freshly loaded DB_* vars

    import psycopg2
    try:
        conn = psycopg2.connect(**db_utils.DATABASE_CONFIG, connect_timeout=5)
    except Exception as e:
        pytest.skip(f'database not reachable: {e}')

    # The point of this test is the PLATFORM schema, which CI's fresh Postgres
    # does not have — there is no migration runner and these are core tables,
    # not something a single migration file creates. Skipping there is correct;
    # failing would be a false signal about the SQL. It runs wherever the real
    # schema exists, which is where it protects anything.
    required = ('job_applications', 'job_postings', 'application_status_history')
    try:
        with conn.cursor() as cur:
            cur.execute("""SELECT table_name FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_name = ANY(%s)""",
                        (list(required),))
            present = {r[0] for r in cur.fetchall()}
    finally:
        conn.close()

    missing = set(required) - present
    if missing:
        pytest.skip(f'platform schema not present here (missing: {sorted(missing)})')

    DATABASE_CONFIG = db_utils.DATABASE_CONFIG

    import psycopg2.extras

    def real_query(sql, params=None, one=False):
        conn = psycopg2.connect(**DATABASE_CONFIG, connect_timeout=5)
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                return cur.fetchone() if one else cur.fetchall()
        finally:
            conn.close()

    original = ev._query
    ev._query = real_query
    try:
        out = ev.employer_value('00000000-0000-0000-0000-000000000000', days=90)
        assert out['placements'] == 0
        assert out['time_to_hire']['median_days'] is None
        assert out['has_outcomes'] is False
    finally:
        ev._query = original
