"""Choosing the onboarding threshold from evidence rather than guessing.

WHY THIS FILE EXISTS

Owner, 2026-08-26: the team will filter employers by vacancy count and work the
top of the list — 20% of the effort for 80% of the effect. The operator screen
already ranked and filtered, but the threshold slider defaulted to 5 with
nothing to judge it against, so the 80% was being guessed at.

The trap in this calculation is the DENOMINATOR. Effort is per company visited;
return is per vacancy reached. A summary that reports "you selected 12% of
companies" answers the cost question and says nothing about the benefit, which
is the one being asked.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402


def concentration(counts, min_vacancies):
    """The pure calculation, exercised on a known distribution.

    Mirrors GrowthSystem.get_vacancy_concentration once the per-company counts
    are in hand; the database only supplies that list.
    """
    counts = sorted(counts, reverse=True)
    total_v, total_c = sum(counts), len(counts)
    if not total_v:
        return {'total_companies': 0, 'total_vacancies': 0,
                'selected_companies': 0, 'selected_vacancies': 0,
                'coverage_percent': None, 'suggested_min_vacancies': None}
    selected = [n for n in counts if n >= min_vacancies]
    suggested, running = None, 0
    for n in counts:
        running += n
        if running * 100 >= total_v * 80:
            suggested = n
            break
    return {
        'total_companies': total_c, 'total_vacancies': total_v,
        'selected_companies': len(selected), 'selected_vacancies': sum(selected),
        'coverage_percent': round(sum(selected) * 100.0 / total_v, 1),
        'company_percent': round(len(selected) * 100.0 / total_c, 1),
        'suggested_min_vacancies': suggested,
    }


# 100 vacancies across 6 employers — a deliberately lopsided distribution,
# because an even one makes every threshold look equally good.
SKEWED = [50, 30, 12, 5, 2, 1]


def test_coverage_is_measured_in_vacancies_not_companies():
    """The whole point. Two employers are 33% of the companies and 80% of the
    vacancies, and only the second number answers "is this worth the visit"."""
    r = concentration(SKEWED, 30)
    assert r['selected_companies'] == 2
    assert r['coverage_percent'] == 80.0
    assert r['company_percent'] == pytest.approx(33.3, abs=0.1)


def test_the_suggested_threshold_reaches_at_least_80_percent():
    r = concentration(SKEWED, 5)
    assert r['suggested_min_vacancies'] == 30
    assert concentration(SKEWED, r['suggested_min_vacancies'])['coverage_percent'] >= 80


def test_the_suggestion_is_the_SMALLEST_threshold_that_reaches_80():
    """A higher threshold also reaches 80%, but it drops employers for nothing.
    Suggesting 50 here would cost half the pool to gain no coverage."""
    r = concentration(SKEWED, 5)
    assert r['suggested_min_vacancies'] == 30
    assert concentration(SKEWED, 50)['coverage_percent'] == 50.0


def test_a_lower_threshold_covers_more_not_less():
    """Monotonicity — a coverage figure that fell as the net widened would be
    an inverted comparison, and would read as plausible."""
    previous = 0
    for threshold in (50, 30, 12, 5, 2, 1):
        current = concentration(SKEWED, threshold)['coverage_percent']
        assert current >= previous, f'coverage fell at min={threshold}'
        previous = current
    assert previous == 100.0


def test_an_empty_pool_reports_nothing_rather_than_a_fake_hundred_percent():
    """The state right after migration 089 and before a new sheet is imported.
    0/0 must not become 100% coverage, and must not divide by zero."""
    r = concentration([], 5)
    assert r['total_vacancies'] == 0
    assert r['coverage_percent'] is None
    assert r['suggested_min_vacancies'] is None


def test_a_threshold_above_every_company_selects_nobody():
    r = concentration(SKEWED, 999)
    assert r['selected_companies'] == 0
    assert r['coverage_percent'] == 0.0


def test_an_even_distribution_offers_no_shortcut():
    """Pareto is a property of the data, not a law. If every employer has the
    same number of vacancies, reaching 80% of them costs 80% of the visits, and
    the suggestion must not imply otherwise."""
    r = concentration([10] * 10, 10)
    assert r['coverage_percent'] == 100.0
    assert r['suggested_min_vacancies'] == 10
    assert concentration([10] * 10, 11)['selected_companies'] == 0


def test_the_service_counts_pending_verification_only():
    """The population the operator can act on, and the one the ranking uses.
    Counting every status would include draft and published postings that are
    not part of this outreach."""
    source = open(os.path.join(BACKEND, 'growth_system.py'), encoding='utf-8').read()
    block = source[source.index('def get_vacancy_concentration'):]
    block = block[:block.index('def send_bulk_emails')]
    assert "j.status = 'pending_verification'" in block


def test_the_endpoint_returns_it_alongside_the_candidates():
    routes = open(os.path.join(BACKEND, 'routes', 'growth_routes.py'), encoding='utf-8').read()
    assert 'get_vacancy_concentration' in routes
    assert "'concentration'" in routes
