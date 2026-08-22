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


def test_the_employed_figure_still_disclaims_the_dubai_wide_total():
    """The caveat outlived the card that carried it.

    The "Employed on Roster" tile was removed on 2026-08-22: it counted
    candidate_profiles.work_status = \'Working\' (33,511) directly beneath the
    population strip reporting the same concept as 33,510, because the strip
    also requires an active users row with a candidate role. Two near-identical
    numbers side by side on a board screen destroy confidence in both.

    What must NOT be lost is the disclaimer — "employees the platform has a
    record for" is not "employees in Dubai", and only the wording stands between
    those two claims. It now rides on the strip\'s disclosure line instead of a
    tile of its own.
    """
    api = _api()
    assert "'employed_on_roster'" in api, (
        'the API field was deleted, not just unrendered — check nothing else '
        'depended on it before removing this assertion'
    )
    fe = _fe()
    # Match the LABEL CALL, not the words. The removal comment names the tile
    # it removed, and a bare substring check fails on that comment — a test that
    # cannot tell an explanation from a reinstatement.
    assert "b('Employed on Roster'" not in fe, (
        'the duplicate employed tile is back; it will disagree with the '
        'population strip by one'
    )
    assert 'not the Dubai-wide total' in fe, (
        'the MOHRE disclaimer was lost when the tile was removed — the board '
        'can now read a platform record count as the emirate total'
    )
    assert 'MOHRE' in fe


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
    """A failed read shows a dash, never a zero.

    employed_on_roster is no longer in this list because it is no longer
    rendered — see test_the_employed_figure_still_disclaims_the_dubai_wide_total.
    The strip that replaced it reports nothing at all on failure rather than a
    row of zeros, which is the same rule by a different mechanism.
    """
    fe = _fe()
    for key in ('active_jobseekers', 'active_vacancies'):
        seg = fe.split(f'kpis.{key} != null')[1][:160]
        assert "'—'" in seg, key


def test_it_uses_the_modules_own_connection_helper():
    """This module has no db_utils import; reaching for execute_query would have
    been an ImportError at request time rather than a visible one at boot."""
    api = _api()
    block = api.split('active_jobseekers = active_vacancies')[1][:1600]
    assert 'get_db_connection()' in block
    assert 'execute_query(' not in block
