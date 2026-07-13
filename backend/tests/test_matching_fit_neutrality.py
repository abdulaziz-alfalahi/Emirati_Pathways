"""Issue #12 — Job Fit must reflect genuine suitability ONLY.

Residence (emirate / preferred_location) and nationality must never change the
Job Fit score, and the fit breakdown must not expose a geography or nationality
component. Commute/geography are informational (UI) only.
"""
try:
    from hr_candidate_search_routes import CandidateSearchEngine
except ImportError:  # when imported as a package
    from backend.hr_candidate_search_routes import CandidateSearchEngine


BASE_CAND = {
    'experience_years': 5,
    'education_level': 'Bachelor',
    'skills': ['python', 'sql'],
    'preferred_salary_min': 10000,
}
JOB = {
    'min_experience': 3,
    'education_level': 'Bachelor',
    'skills': ['python', 'sql'],
    'location': 'Dubai',
    'salary_max': 15000,
}


def _score(**overrides):
    cand = dict(BASE_CAND)
    cand.update(overrides)
    return CandidateSearchEngine.calculate_match_score(cand, JOB)


def test_emirate_does_not_change_fit():
    a = _score(emirate='Dubai', preferred_location='Dubai')
    b = _score(emirate='Ras Al Khaimah', preferred_location='Ras Al Khaimah')
    assert a['total_score'] == b['total_score']
    assert a['match_percentage'] == b['match_percentage']


def test_nationality_does_not_change_fit():
    a = _score(is_uae_national=True)
    b = _score(is_uae_national=False)
    assert a['total_score'] == b['total_score']
    assert a['match_percentage'] == b['match_percentage']


def test_fit_details_have_no_geography_or_nationality():
    details = _score()['match_details']
    assert 'location_match' not in details
    assert 'nationality_bonus' not in details


if __name__ == '__main__':
    test_emirate_does_not_change_fit()
    test_nationality_does_not_change_fit()
    test_fit_details_have_no_geography_or_nationality()
    print("OK — Job Fit is neutral to residence and nationality")
