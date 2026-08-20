"""The three figures the board asked to see on the overview.

"the board members should see the total number of active JS, the total number of
employees from Dubai, and the total number of active vacancies"
(fb_1787129939).

Two of the three are real counts. The third is not available, and the point of
these tests is that it stays unavailable rather than being approximated by a
number that happens to be nearby.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FE = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'pages',
                  'operator-dashboards', 'ExecutiveDashboard.tsx')


def _api():
    with open(os.path.join(BACKEND, 'routes', 'strategic_metrics_api.py'),
              encoding='utf-8') as fh:
        return fh.read()


def _fe():
    with open(FE, encoding='utf-8') as fh:
        return fh.read()


# ── The two that are real ───────────────────────────────────────────────────

def test_active_vacancies_counts_published_only():
    """Today: 7 published, 302 pending_verification, 24 draft. Counting all
    three would report roughly forty times the number anyone can apply to."""
    api = _api()
    block = api.split('active_jobseekers = active_vacancies')[1][:1200]
    assert "status = 'published'" in block
    assert 'pending_verification' not in block
    assert "'draft'" not in block


def test_active_jobseekers_comes_from_the_nafis_type():
    api = _api()
    block = api.split('active_jobseekers = active_vacancies')[1][:1200]
    assert 'ActiveJobseeker' in block


# ── The one that is not ─────────────────────────────────────────────────────

def test_the_dubai_wide_total_is_explicitly_null():
    """That figure would come from MOHRE, which the platform does not hold.
    Explicit null so the roster number is never read as standing in for it."""
    api = _api()
    assert "'dubai_employees_total': None" in api


def test_the_roster_figure_is_named_for_what_it_counts():
    """"Employed on roster", not "employees from Dubai" — 1,054 candidates this
    platform records as working is a different claim from the emirate's total,
    and the label is the only thing standing between the two."""
    api = _api()
    assert "'employed_on_roster'" in api
    fe = _fe()
    assert 'Employed on Roster' in fe
    assert 'Not the Dubai-wide total' in fe


def test_the_message_says_what_is_and_is_not_connected():
    api = _api()
    assert 'PUBLISHED postings only' in api
    # The phrase spans two adjacent string literals ("it is NOT " + "the total
    # number..."), so the SOURCE has a quote and newline between them. Assert on
    # the distinctive fragment rather than the joined sentence.
    assert 'total number of employees in Dubai' in api
    assert 'MOHRE' in api


# ── Failure is not zero ─────────────────────────────────────────────────────

def test_a_failed_read_leaves_the_counts_None():
    """A database problem must not tell the board there are no jobseekers and
    no vacancies — which is what 0 would say."""
    api = _api()
    block = api.split('active_jobseekers = active_vacancies')[1][:1600]
    assert 'active_jobseekers = active_vacancies = employed_on_roster = None' in api
    assert 'logger.warning' in block
    assert '= 0' not in block.split('except Exception')[1][:300]


def test_the_cards_render_an_em_dash_when_null():
    fe = _fe()
    for key in ('active_jobseekers', 'active_vacancies', 'employed_on_roster'):
        seg = fe.split(f'kpis.{key} != null')[1][:160]
        assert "'—'" in seg, key


def test_it_uses_the_modules_own_connection_helper():
    """This module has no db_utils import; reaching for execute_query would have
    been an ImportError at request time rather than a visible one at boot."""
    api = _api()
    block = api.split('active_jobseekers = active_vacancies')[1][:1600]
    assert 'get_db_connection()' in block
    assert 'execute_query(' not in block
