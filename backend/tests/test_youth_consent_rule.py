"""When a youth-programme registration needs a guardian's confirmation.

Owner decision, 2026-08-30: the young person registers, a parent confirms.

THE RULE IS TESTED WITHOUT A DATABASE ON PURPOSE

Every branch is a decision somebody may have to defend later — "why was this
fifteen-year-old allowed to register alone?" — so the rule is a pure function
and each case is written out rather than inferred.
"""
import os
import sys
from datetime import date

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from youth_consent import (  # noqa: E402
    AGE_OF_MAJORITY, CONSENT_AGE_UNKNOWN, CONSENT_ALL_MINORS,
    CONSENT_MAY_BE_MINOR, CONSENT_NOT_NEEDED, age_on, consent_requirement,
    explain, parse_age_range)

TODAY = date(2026, 8, 30)


# ── Reading what providers actually write ───────────────────────────────────

@pytest.mark.parametrize('text,expected', [
    ('14-18', (14, 18)),
    ('10-16', (10, 16)),
    ('6-9', (6, 9)),
    ('6–9', (6, 9)),          # en dash, which a provider will paste from Word
    ('8 - 14', (8, 14)),
    ('18-25', (18, 25)),
    ('18+', (18, None)),
    ('16 and over', (16, None)),
    ('17', (17, 17)),
    ('18 to 30', (18, 30)),
    ('', (None, None)),
    (None, (None, None)),
    ('all ages', (None, None)),
    ('teenagers', (None, None)),
])
def test_age_ranges_are_read_as_providers_write_them(text, expected):
    assert parse_age_range(text) == expected


def test_a_reversed_range_still_reads_correctly():
    """"18-14" is a typo, not an adults-only programme."""
    assert parse_age_range('18-14') == (14, 18)


# ── The rule itself ─────────────────────────────────────────────────────────

def test_a_programme_entirely_for_minors_always_needs_consent():
    needed, reason = consent_requirement('10-16', today=TODAY)
    assert needed and reason == CONSENT_ALL_MINORS


def test_an_adult_cannot_argue_their_way_into_a_childrens_camp():
    """A 30-year-old's birthday does not make a 10-16 camp adult territory —
    and they are not eligible for it anyway."""
    needed, _ = consent_requirement('10-16', registrant_dob=date(1996, 1, 1), today=TODAY)
    assert needed


def test_an_adults_only_programme_never_needs_consent():
    needed, reason = consent_requirement('18-25', today=TODAY)
    assert not needed and reason == CONSENT_NOT_NEEDED
    assert consent_requirement('18+', today=TODAY)[0] is False


def test_a_mixed_range_needs_consent_when_the_birthday_is_unknown():
    """The common case: 14-18, and no date of birth on file for nine
    registrants in ten."""
    needed, reason = consent_requirement('14-18', registrant_dob=None, today=TODAY)
    assert needed and reason == CONSENT_MAY_BE_MINOR


def test_a_mixed_range_skips_consent_for_a_provably_adult_registrant():
    needed, _ = consent_requirement('14-18', registrant_dob=date(2005, 1, 1), today=TODAY)
    assert not needed


def test_a_mixed_range_requires_consent_for_a_provably_minor_registrant():
    needed, _ = consent_requirement('14-18', registrant_dob=date(2012, 1, 1), today=TODAY)
    assert needed


def test_an_unstated_age_range_fails_towards_asking():
    """The direction of failure is the whole point. The cost of asking an adult
    for a guardian is an annoyance; the cost of not asking a minor is what this
    exists to prevent."""
    for text in (None, '', 'all ages', 'teenagers'):
        needed, reason = consent_requirement(text, today=TODAY)
        assert needed, f'{text!r} let a registration through unasked'
        assert reason == CONSENT_AGE_UNKNOWN


def test_the_boundary_is_the_eighteenth_birthday():
    eighteen_today = date(TODAY.year - AGE_OF_MAJORITY, TODAY.month, TODAY.day)
    assert age_on(eighteen_today, today=TODAY) == AGE_OF_MAJORITY
    assert consent_requirement('14-18', registrant_dob=eighteen_today, today=TODAY)[0] is False

    day_after = date(TODAY.year - AGE_OF_MAJORITY, TODAY.month, TODAY.day - 1)
    still_17 = date(TODAY.year - AGE_OF_MAJORITY, TODAY.month + 1, 1)
    assert age_on(still_17, today=TODAY) == AGE_OF_MAJORITY - 1
    assert consent_requirement('14-18', registrant_dob=still_17, today=TODAY)[0] is True
    assert age_on(day_after, today=TODAY) == AGE_OF_MAJORITY


# ── What the registrant is told ─────────────────────────────────────────────

def test_every_reason_has_a_sentence_a_person_can_read():
    for reason in (CONSENT_ALL_MINORS, CONSENT_MAY_BE_MINOR, CONSENT_AGE_UNKNOWN):
        text = explain(reason, age_group='14-18')
        assert text and 'parent or guardian' in text
        assert '_' not in text, 'a reason code leaked into what the person sees'


def test_the_mixed_case_tells_an_adult_how_to_avoid_it_next_time():
    text = explain(CONSENT_MAY_BE_MINOR, age_group='14-18')
    assert 'date of birth' in text


# ── The parent's landing page ───────────────────────────────────────────────

def test_the_consent_route_is_in_every_route_group():
    """App.tsx declares its routes in FOUR groups. A public route added to only
    some of them works from one entry point and 404s from another — the
    recurring trap in this file, and the reason this asserts a count rather
    than presence."""
    app_tsx = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'App.tsx')
    if not os.path.exists(app_tsx):
        pytest.skip('frontend not present')
    body = open(app_tsx, encoding='utf-8').read()
    groups = body.count('<Route path="/join-staff/:token"')
    ours = body.count('<Route path="/youth-consent/:token"')
    assert ours == groups, (
        f'the consent route is in {ours} of {groups} route groups — it will 404 '
        f'from the ones it is missing from')
    assert 'YouthConsentPage = lazy' in body


def test_the_parents_page_needs_no_account_and_says_so():
    page = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'pages',
                        'public', 'YouthConsentPage.tsx')
    if not os.path.exists(page):
        pytest.skip('frontend not present')
    body = open(page, encoding='utf-8').read()
    assert 'do not need an account' in body
    # what is being agreed to, before the buttons
    for shown in ('Programme', 'Organiser', 'Ages', 'Dates'):
        assert shown in body, f'the page does not show the {shown.lower()}'
    assert 'released automatically' in body, 'it does not say what doing nothing means'
