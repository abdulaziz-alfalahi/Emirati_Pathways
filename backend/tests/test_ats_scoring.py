"""The ATS compatibility score.

This is a PORT of logic that ran in CVProfile.tsx. The risk in a port is not
that it crashes — it is that it quietly returns a different number, which nobody
notices because the new number is also plausible. So the first test reproduces
the exact score from the owner's 2026-08-18 review (79%, with its published
breakdown) from a CV built to match that screenshot.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ats_scoring as ats  # noqa: E402

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


# ── Parity with the number candidates already saw ───────────────────────────

def a_cv_scoring_79():
    """Reconstructed from the review screenshot: 14/20 personal, 20/30
    experience, 10/15 education, 20/20 skills, 15/15 keywords."""
    return {
        # 14/20: name(4) + email(0, missing) + phone(3) + location(3) +
        # summary(4) + linkedIn(0, missing) = 14
        'personalInfo': {
            'fullName': 'Abdulaziz Essa Harib Alfalahi',
            'phone': '+971 50 000 5000',
            'location': 'Dubai',
            'summary': ('Accomplished executive with over 25 years of transformative '
                        'leadership experience in the telecommunications and technology sectors.'),
        },
        # 20/30: has entries(10) + long description(10) + no achievements(0)
        'experience': [{
            'title': 'General Superintendent of Recruitment Operations',
            'description': ('Initiated and led Emiratization programs to boost the '
                            'representation of Emiratis in the private sector. Established '
                            'recruitment operations to bridge the gap between job seekers '
                            'and organizations with vacancies.'),
        }],
        # 10/15: has entries(10) + no fieldOfStudy/gpa(0)
        'education': [{'institution': 'A University', 'degree': 'BSc'}],
        # 20/20 skills (>=10) and 15/15 keywords (>=5 D33 matches)
        'skills': [
            'Data Science', 'Cloud Computing', 'Cybersecurity', 'Digital Transformation',
            'Project Management', 'Strategic Leadership', 'Risk Management',
            'Change Management', 'Business Analysis', 'Data Analytics',
        ],
    }


def test_the_ported_scorer_reproduces_the_reviewed_score():
    result = ats.score_cv(a_cv_scoring_79())
    assert result['overall'] == 79, result['breakdown']


def test_the_reviewed_breakdown_matches_section_by_section():
    """A total can match by luck while two sections cancel out."""
    b = ats.score_cv(a_cv_scoring_79())['breakdown']
    assert b['personalInfo'] == 14
    assert b['experience'] == 20
    assert b['education'] == 10
    assert b['skills'] == 20
    assert b['keywords'] == 15


# ── None is not zero ────────────────────────────────────────────────────────

def test_no_cv_scores_None_not_zero():
    """A candidate who has not built a CV has no score. A score of 0 is a
    judgement about a CV that exists — showing it to someone with no CV is a
    statement we cannot support."""
    assert ats.score_cv(None) is None
    assert ats.score_cv({}) is None


def test_an_empty_but_real_cv_scores_zero():
    """The other side of the same distinction."""
    result = ats.score_cv({'personalInfo': {}, 'experience': [], 'education': [], 'skills': []})
    assert result is not None
    assert result['overall'] == 0


# ── The ceiling holds ───────────────────────────────────────────────────────

def test_the_maximum_is_100_so_the_total_is_a_percentage():
    assert ats.MAX_TOTAL == 100


def test_a_complete_cv_cannot_exceed_100():
    cv = a_cv_scoring_79()
    cv['personalInfo']['email'] = 'a@b.ae'
    cv['personalInfo']['linkedIn'] = 'https://linkedin.com/in/x'
    cv['experience'][0]['achievements'] = ['Increased placements by 25%']
    cv['education'][0]['fieldOfStudy'] = 'Engineering'
    result = ats.score_cv(cv)
    assert result['overall'] == 100
    for key, value in result['breakdown'].items():
        assert value <= result['maximums'][key]


# ── Shapes that are real in this database ───────────────────────────────────

def test_skills_may_be_strings_or_objects():
    """Different importers wrote both shapes into user_cvs."""
    as_strings = ats.score_cv({'skills': ['Data Science', 'Cloud Computing', 'IoT']})
    as_objects = ats.score_cv({'skills': [{'name': 'Data Science'},
                                          {'name': 'Cloud Computing'},
                                          {'name': 'IoT'}]})
    assert as_strings['breakdown']['skills'] == as_objects['breakdown']['skills']
    assert as_strings['breakdown']['keywords'] == as_objects['breakdown']['keywords']


def test_the_snake_case_shape_the_PARSER_writes_scores_identically():
    """THE NEAR-MISS. The frontend scored its own camelCase CVData; the parser
    writes snake_case to user_cvs. Reading only the frontend's spelling scored
    every stored CV as anonymous — verified on 2026-08-18, when the five most
    recent live CVs all returned personalInfo=0, including one with complete
    experience, education and skills. The wrong number was plausible enough to
    have shipped.
    """
    camel = {
        'personalInfo': {
            'fullName': 'A B', 'email': 'a@b.ae', 'phone': '+971500000000',
            'location': 'Dubai', 'linkedIn': 'https://linkedin.com/in/ab',
            'summary': 'x' * 60,
        },
        'experience': [{'description': 'y' * 150, 'achievements': ['grew X by 20%']}],
        'education': [{'fieldOfStudy': 'Engineering'}],
        'skills': ['Data Science'],
    }
    snake = {
        'personal_info': {
            'full_name': 'A B', 'email': 'a@b.ae', 'phone': '+971500000000',
            'address': 'Dubai', 'linkedin': 'https://linkedin.com/in/ab',
        },
        'professional_summary': 'x' * 60,   # top level, as the parser stores it
        'work_experience': [{'responsibilities': 'y' * 150,
                             'accomplishments': ['grew X by 20%']}],
        'education': [{'field_of_study': 'Engineering'}],
        'skills': ['Data Science'],
    }
    assert ats.score_cv(camel)['breakdown'] == ats.score_cv(snake)['breakdown']


def test_a_first_and_last_name_count_as_a_full_name():
    """The parser often fills first_name/last_name without full_name."""
    result = ats.score_cv({'personal_info': {'first_name': 'A', 'last_name': 'B'}})
    assert result['breakdown']['personalInfo'] >= 4


def test_malformed_entries_do_not_crash_the_score():
    """Parsed CVs contain surprises; a bad row must cost points, not the score."""
    result = ats.score_cv({
        'personalInfo': {'fullName': 'X'},
        'experience': ['not a dict', None, 42],
        'education': [None],
        'skills': [None, 123, {'no_name': 'x'}],
    })
    assert result is not None
    assert isinstance(result['overall'], int)


def test_keyword_matching_is_substring_in_both_directions():
    """As the frontend did: 'Python' should match 'Advanced Python' and
    'Data Science' should match a user skill of 'Data'."""
    result = ats.score_cv({'skills': ['Advanced Data Science', 'Cloud']})
    assert result['breakdown']['keywords'] > 0


# ── One implementation, not two ─────────────────────────────────────────────

def test_the_frontend_no_longer_computes_the_score():
    """The whole point. Two implementations drift, and the drift is invisible
    because both numbers look reasonable."""
    src = open(os.path.join(os.path.dirname(BACKEND), 'frontend', 'src',
                            'components', 'candidate', 'CVProfile.tsx'),
               encoding='utf-8').read()
    fn = src.split('const calculateATSScore')[1].split('const generateSkillRecommendations')[0]
    assert '/api/cv/ats-score' in fn, 'must fetch the canonical score'
    assert 'breakdown.personalInfo +=' not in fn, 'must not score locally'


def test_the_dashboard_endpoint_sends_the_stored_score():
    src = _src('candidate_job_routes.py')
    assert "'ats_score': ats_score" in src
    assert 'FROM user_cvs' in src


def test_storing_a_cv_persists_its_score():
    """The PUT used to return 200 and drop the field: 0 of 26 rows had a score."""
    src = _src('cv_storage_manager.py')
    assert 'ats_score' in src
    assert 'score_cv' in src


# ── The fabricated stats are gone ───────────────────────────────────────────

def test_the_mocked_profile_views_literal_is_gone():
    """Every candidate on the platform saw exactly 12 profile views."""
    src = _src('candidate_job_routes.py')
    # The KEY is gone, not just the literal — asserting on the phrase "Mock for
    # now" instead matched the comment explaining its removal, which is the kind
    # of test that fails on prose and teaches people to delete the prose.
    assert "'profileViews'" not in src


def test_interviews_is_counted_not_hardcoded():
    """It was the literal 0 while the same response's recentActivity listed a
    completed interview — the screen contradicted itself in one viewport."""
    src = _src('candidate_job_routes.py')
    assert "'interviews': 0" not in src, 'including the no-database fallback'
    assert 'FROM interview_schedules WHERE candidate_id' in src


def test_job_matches_is_not_a_count_of_all_vacancies():
    """jobMatches was every published vacancy: the same number for every
    candidate, and not a match. The key is renamed to what it counts."""
    src = _src('candidate_job_routes.py')
    assert "'jobMatches': job_count" not in src
    assert "'openVacancies': job_count" in src


def test_an_unreachable_database_is_reported_not_papered_over():
    """It returned success:True with invented numbers, so an outage looked like
    a working dashboard."""
    src = _src('candidate_job_routes.py')
    assert "'jobMatches': 8" not in src
    assert "'error': 'Database unavailable'" in src


def test_a_count_that_cannot_be_determined_is_None():
    """None renders as an em-dash. Zero would be a claim about the candidate."""
    src = _src('candidate_job_routes.py')
    block = src.split('interview_count = None')[1][:900]
    assert 'interview_count = 0' not in block
