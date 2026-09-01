"""Nominations must reflect what the employer asked for.

Requested by a call-centre operator, 2026-08-31 (fb_1788155502): structured
vacancy fields "to ensure that candidates are nominated based on the specific
vacancy requirements".

The cause ran deeper than missing fields. Measured on the live database
2026-09-01:

    vacancies with required_skills populated ..... 0 of 298
    code anywhere in the backend that WRITES it ... none

required_skills carries 60% of the match. It was empty everywhere, so the
dominant axis contributed nothing to any candidate on any vacancy — and the
remaining 40% was scored from the candidate's own profile, never against the
employer's requirement. Nothing the employer stated influenced who was
nominated.

The weights are unchanged (60/20/20) and the GH #12 rules still hold — no
geography, no flat nationality bonus. What changed is what the 40% is measured
against.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from match_scoring import calculate_match_score  # noqa: E402

SKILLED = {
    'technical_skills': ['python', 'sql'],
    'work_experience': [{'title': 'a'}, {'title': 'b'}],
    'education': [{'degree': 'Bachelor of Science'}],
}


# ── the vacancy's requirement now counts ────────────────────────────────────

def test_meeting_the_required_experience_beats_falling_short():
    job = {'required_skills': ['python'], 'experience_level': 'senior'}
    junior = dict(SKILLED, years_of_experience=1)
    senior = dict(SKILLED, years_of_experience=8)
    assert calculate_match_score(senior, job) > calculate_match_score(junior, job)


def test_falling_short_is_proportionate_not_a_cliff():
    """Somebody one year short of a five-year role is a far better nomination
    than somebody with none, and the shortlist should show that."""
    job = {'required_skills': ['python'], 'min_experience_years': 5}
    none = calculate_match_score(dict(SKILLED, years_of_experience=0), job)
    close = calculate_match_score(dict(SKILLED, years_of_experience=4), job)
    met = calculate_match_score(dict(SKILLED, years_of_experience=5), job)
    assert none < close < met


def test_meeting_the_required_education_beats_falling_short():
    job = {'required_skills': ['python'], 'education_level': "Master's degree"}
    diploma = dict(SKILLED, education=[{'degree': 'Diploma in IT'}])
    masters = dict(SKILLED, education=[{'degree': 'Master of Science'}])
    assert calculate_match_score(masters, job) > calculate_match_score(diploma, job)


def test_exceeding_the_requirement_is_not_penalised():
    """A PhD against a bachelor requirement meets it. Over-qualification is a
    hiring judgement for a person, not something to score down silently."""
    job = {'required_skills': ['python'], 'education_level': 'Bachelor'}
    bachelor = dict(SKILLED, education=[{'degree': 'Bachelor of Science'}])
    phd = dict(SKILLED, education=[{'degree': 'PhD'}])
    assert calculate_match_score(phd, job) >= calculate_match_score(bachelor, job)


def test_a_qualified_candidate_below_the_level_is_never_zeroed():
    job = {'required_skills': ['python'], 'education_level': 'PhD'}
    bachelor = dict(SKILLED, education=[{'degree': 'Bachelor'}])
    nothing = dict(SKILLED, education=[])
    assert calculate_match_score(bachelor, job) > calculate_match_score(nothing, job)


# ── the old behaviour survives where nothing is stated ──────────────────────

def test_a_vacancy_stating_nothing_scores_exactly_as_before():
    """The fallbacks ARE the original code paths. A vacancy that states no
    requirements must not move because of this change — most of the 298 state
    nothing."""
    job = {'required_skills': ['python', 'sql']}
    # Two work-experience entries, any education, no advanced degree:
    # 60 * (2/2 matched) + 20 * (2/5) + 15  ==  83 of 100
    assert calculate_match_score(SKILLED, job) == 83.0


def test_no_requirement_is_not_the_same_as_requiring_zero():
    """A silent vacancy falls back to candidate standing; one that explicitly
    asks for no experience gives full marks to everybody. Conflating them would
    quietly re-rank every vacancy in the table."""
    silent = {'required_skills': ['python']}
    explicit_zero = {'required_skills': ['python'], 'experience_level': 'entry'}
    thin = dict(SKILLED, work_experience=[{'title': 'a'}], years_of_experience=0)
    assert calculate_match_score(thin, explicit_zero) > calculate_match_score(thin, silent)


def test_an_empty_job_still_returns_the_neutral_score():
    assert calculate_match_score(SKILLED, {}) == 50.0


# ── the settled design is untouched ─────────────────────────────────────────

def test_no_geography_or_nationality_factor_crept_in():
    """GH #12: skills-based only. National priority stays a separate, disclosed
    axis and must not be folded in here."""
    job = {'required_skills': ['python'], 'location': 'Dubai', 'emirate': 'Dubai'}
    near = dict(SKILLED, emirate='Dubai', nationality='UAE')
    far = dict(SKILLED, emirate='Fujairah', nationality='Other')
    assert calculate_match_score(near, job) == calculate_match_score(far, job)


def test_the_score_stays_within_bounds():
    job = {'required_skills': ['python'], 'experience_level': 'entry',
           'education_level': 'High School'}
    strong = dict(SKILLED, years_of_experience=40,
                  education=[{'degree': 'PhD'}], technical_skills=['python'])
    assert 0 <= calculate_match_score(strong, job) <= 100


# ── the field the matcher reads must now be written ─────────────────────────

from hr_job_posting_routes import _required_skills_for  # noqa: E402


def test_explicit_skills_are_recorded():
    assert _required_skills_for({'required_skills': ['Python', 'SQL']}) == ['Python', 'SQL']


def test_skills_are_lifted_from_requirements_when_no_list_is_given():
    """The JD wizard collects requirements as categorised entries. A vacancy
    created through it should start matching without anybody re-entering the
    same words into a second field."""
    job = {'requirements': [{'description': 'Python'}, {'description': 'Stakeholder management'}]}
    assert _required_skills_for(job) == ['Python', 'Stakeholder management']


def test_a_comma_separated_string_is_accepted():
    assert _required_skills_for({'required_skills': 'Python, SQL'}) == ['Python', 'SQL']


def test_duplicates_collapse():
    assert _required_skills_for({'required_skills': ['Python', 'python', 'Python']}) == \
        ['Python', 'python']


def test_a_vacancy_with_nothing_to_say_yields_an_empty_list_not_a_crash():
    assert _required_skills_for({}) == []
