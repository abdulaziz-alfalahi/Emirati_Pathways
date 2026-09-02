"""An offer is pre-filled from the vacancy, and never invented.

Requested 2026-09-02 (fb_1788344147): auto-fill offer details "based on the
approved job vacancy, candidate profile, and predefined company templates".

MOST OF THIS IS DELIBERATELY NOT AN AI PROBLEM.

An offer carries somebody's salary. The platform's own AI instructions already
forbid inventing figures for career ADVICE; for an offer the stakes are higher,
because a generated number that looks plausible is worse than an empty box — an
empty box gets filled in, and a plausible number gets sent.

So the title, salary, employment type and location are COPIED from the approved
vacancy, the probation period is a stated default, and where the vacancy is
silent the field comes back empty saying so. Every field carries its source, so
the recruiter can see what to check before sending.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

import offer_prefill  # noqa: E402


@pytest.fixture
def vacancy(monkeypatch):
    state = {'row': {}}

    def fake_execute_query(sql, params=None, **kwargs):
        if 'FROM job_postings' in sql:
            return state['row'] or None
        if 'FROM users' in sql:
            return state.get('person')
        return None

    monkeypatch.setattr(offer_prefill, 'execute_query', fake_execute_query)
    return state


BASE = {'id': 1, 'jd_id': 'JD-1', 'title': 'Python Engineer',
        'employment_type': 'full_time', 'job_type': None,
        'location': 'Dubai', 'emirate': 'Dubai', 'city': 'Deira',
        'remote_option': False, 'working_hours': None,
        'salary_range_min': None, 'salary_range_max': None,
        'currency': None, 'benefits': None, 'status': 'published'}


def test_the_title_and_location_come_from_the_vacancy(vacancy):
    vacancy['row'] = dict(BASE)
    out = offer_prefill.build('JD-1')
    assert out['position_title'] == {'value': 'Python Engineer', 'source': 'vacancy'}
    assert out['work_location']['value'] == 'Dubai'
    assert out['work_location']['source'] == 'vacancy'


def test_a_vacancy_with_no_salary_fills_in_nothing(vacancy):
    """The heart of it. A plausible invented salary is worse than an empty box
    because an empty box gets filled in and a plausible number gets sent."""
    vacancy['row'] = dict(BASE)
    out = offer_prefill.build('JD-1')
    assert out['salary_amount']['value'] is None
    assert out['salary_amount']['source'] == 'unknown'
    assert 'does not state a salary' in out['salary_amount']['note']


def test_a_single_salary_is_copied_exactly(vacancy):
    vacancy['row'] = dict(BASE, salary_range_min=18000, salary_range_max=18000)
    out = offer_prefill.build('JD-1')
    assert out['salary_amount']['value'] == 18000.0
    assert out['salary_amount']['source'] == 'vacancy'


def test_a_range_offers_the_lower_bound_and_says_so(vacancy):
    """A midpoint presented without explanation looks like a decision somebody
    made. The recruiter is negotiating; they get a starting point and the range
    it came from."""
    vacancy['row'] = dict(BASE, salary_range_min=15000, salary_range_max=22000)
    out = offer_prefill.build('JD-1')
    field = out['salary_amount']
    assert field['value'] == 15000.0
    assert '15,000' in field['note'] and '22,000' in field['note']
    assert 'starting point' in field['note']


def test_probation_is_a_labelled_default_not_a_prediction(vacancy):
    vacancy['row'] = dict(BASE)
    out = offer_prefill.build('JD-1')
    assert out['probation_period_months']['value'] == 6
    assert out['probation_period_months']['source'] == 'default'
    assert 'Adjust' in out['probation_period_months']['note']


def test_benefits_the_employer_stated_win_over_defaults(vacancy):
    vacancy['row'] = dict(BASE, benefits={'annual_leave_days': 25,
                                          'housing_allowance': 4000})
    out = offer_prefill.build('JD-1')
    assert out['benefits']['value']['annual_leave_days'] == 25
    assert out['benefits']['value']['housing_allowance'] == 4000
    # A default the employer did not override survives.
    assert out['benefits']['value']['health_insurance'] is True
    assert out['benefits']['source'] == 'vacancy'


def test_benefits_written_as_free_text_are_not_guessed_into_fields(vacancy):
    """A list of phrases is not a set of amounts. It is handed back for the
    recruiter to translate rather than parsed into numbers we would be
    inventing."""
    vacancy['row'] = dict(BASE, benefits=['Annual flight home', 'Family visa'])
    out = offer_prefill.build('JD-1')
    assert out['additional_benefits']['value'] == 'Annual flight home; Family visa'
    assert 'translate' in out['benefits']['note']


def test_every_field_declares_where_it_came_from(vacancy):
    """The recruiter's first sensible question about a pre-filled offer."""
    vacancy['row'] = dict(BASE)
    out = offer_prefill.build('JD-1')
    for key, field in out.items():
        if key.startswith('_'):
            continue
        assert field['source'] in ('vacancy', 'default', 'unknown'), key


def test_an_unknown_vacancy_returns_nothing_rather_than_a_guess(vacancy):
    vacancy['row'] = {}
    assert offer_prefill.build('nope') is None


def test_the_candidate_block_carries_no_contact_details(vacancy):
    """Contact details are concealed from the employer side, and an offer form
    does not need them. The name is enough to address the offer."""
    vacancy['row'] = dict(BASE)
    vacancy['person'] = {'full_name': 'A Candidate'}
    out = offer_prefill.build('JD-1', candidate_id='784000000000001')
    assert out['_candidate'] == {'full_name': 'A Candidate'}


def test_nothing_in_this_module_calls_a_model():
    """If auto-fill ever starts generating figures, it should be a deliberate
    decision with its own review — not something that arrives quietly."""
    src = open(os.path.join(BACKEND, 'offer_prefill.py'), encoding='utf-8').read()
    for forbidden in ('chat_completion', 'qwen', 'openai', 'dashscope'):
        assert forbidden not in src.lower(), f'{forbidden} reached the offer pre-fill'


# ── the screen has to use it, and has to show the caveats ───────────────────

def test_the_dialog_asks_for_the_prefill():
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'components',
                        'recruiter', 'offers', 'CreateOfferDialog.tsx')
    src = open(path, encoding='utf-8').read()
    assert 'offers/prefill' in src
    assert 'prefillFromVacancy()' in src, 'the dialog never calls it'


def test_the_dialog_shows_the_notes_rather_than_swallowing_them():
    """A note the backend wrote and the screen dropped would leave the recruiter
    to discover the missing salary by sending the offer."""
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'components',
                        'recruiter', 'offers', 'CreateOfferDialog.tsx')
    src = open(path, encoding='utf-8').read()
    assert 'prefillNotes.map' in src, 'the pre-fill notes are collected and never rendered'


def test_a_failed_prefill_does_not_block_creating_an_offer():
    path = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src', 'components',
                        'recruiter', 'offers', 'CreateOfferDialog.tsx')
    src = open(path, encoding='utf-8').read()
    block = src[src.index('const prefillFromVacancy'):]
    block = block[:block.index('\n  };')]
    assert 'catch' in block
