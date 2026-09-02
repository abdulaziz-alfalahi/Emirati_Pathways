"""A candidate holds at most three live applications — and recruiters must move.

Requested by a recruiter 2026-09-02 (fb_1788343258). The owner settled the shape
the same day:

    "I need to put a mechanism in place so the candidate can't apply for more
     than three jobs since the matching and scoring are already done, and at the
     same time I need to put some control on recruiters not to keep candidates
     hanging there."

THE TWO HALVES ARE ONE MECHANISM. A cap on live applications is only defensible
if the employer actually moves, so an application the EMPLOYER has left past the
response window stops counting against the candidate and counts against the
employer instead. Without that, three silent employers could lock a citizen out
of applying for work indefinitely, with nothing they could do about it.

An earlier draft implemented a rolling 42-hour window from the original feedback
text. The owner's wording — "can't apply for more than three jobs" — is a cap on
what is open, not a rate limit, and the pairing with recruiter accountability
only makes sense that way round.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from routes import applications_api as api  # noqa: E402

NOW = datetime.now(timezone.utc)


@pytest.fixture
def applications(monkeypatch):
    """Stand in for the candidate's live applications."""
    state = {'rows': []}

    def fake_execute_query(sql, params=None, **kwargs):
        if 'FROM job_applications' in sql and 'job_postings' not in sql:
            return state['rows']
        return []

    monkeypatch.setattr(api, 'execute_query', fake_execute_query)
    return state


def app_row(status, age_days=0):
    return {'status': status, 'last_touched': NOW - timedelta(days=age_days)}


def test_the_limit_is_three():
    assert api.OPEN_APPLICATION_LIMIT == 3


def test_a_candidate_below_the_limit_may_apply(applications):
    applications['rows'] = [app_row('submitted'), app_row('shortlisted')]
    counted, released, _ = api._open_application_state('784000000000001')
    assert counted == 2 and released == 0


def test_three_live_applications_reach_the_limit(applications):
    applications['rows'] = [app_row('submitted'), app_row('shortlisted'),
                            app_row('interview_scheduled')]
    counted, _released, _ = api._open_application_state('784000000000001')
    assert counted == api.OPEN_APPLICATION_LIMIT


# ── the half that makes the cap fair ────────────────────────────────────────

def test_an_application_the_employer_sat_on_stops_counting(applications):
    """The point of the whole design. A recruiter leaving an application
    untouched costs the recruiter a breach, not the candidate a slot."""
    applications['rows'] = [
        app_row('submitted', age_days=api.RESPONSE_WINDOW_DAYS + 1),
        app_row('shortlisted'),
        app_row('under_review'),
    ]
    counted, released, _ = api._open_application_state('784000000000001')
    assert released == 1
    assert counted == 2, 'the stale application still occupies a slot'


def test_three_silent_employers_cannot_lock_a_candidate_out(applications):
    applications['rows'] = [app_row('submitted', age_days=30)] * 3
    counted, released, _ = api._open_application_state('784000000000001')
    assert counted == 0 and released == 3


def test_waiting_on_the_CANDIDATE_never_ages_out(applications):
    """An offer sitting unanswered is the candidate's to act on. It keeps its
    slot for ever and is never an employer breach — otherwise a candidate could
    free slots by ignoring offers."""
    applications['rows'] = [app_row('offered', age_days=365)]
    counted, released, _ = api._open_application_state('784000000000001')
    assert counted == 1 and released == 0


@pytest.mark.parametrize('status', api.TERMINAL)
def test_finished_applications_do_not_occupy_a_slot(status, applications):
    """Withdrawn and rejected are excluded in SQL; asserted here so a status
    added to TERMINAL later cannot quietly start counting."""
    assert status not in api.AWAITING_EMPLOYER
    assert status not in api.AWAITING_CANDIDATE


def test_the_three_status_sets_do_not_overlap():
    """An overlap would make an application both the employer's problem and
    finished, and which one won would depend on statement order."""
    sets = [set(api.AWAITING_EMPLOYER), set(api.AWAITING_CANDIDATE), set(api.TERMINAL)]
    for i, a in enumerate(sets):
        for b in sets[i + 1:]:
            assert not (a & b), f'overlapping statuses: {a & b}'


def test_a_naive_timestamp_does_not_crash_the_comparison(applications):
    """Some rows carry a timestamp without a timezone. Comparing those against
    an aware `now` raises, and it would raise inside apply()."""
    applications['rows'] = [{'status': 'submitted',
                             'last_touched': datetime.now()}]  # naive
    counted, released, _ = api._open_application_state('784000000000001')
    assert counted + released == 1


def test_a_missing_timestamp_is_not_treated_as_stale(applications):
    """No timestamp is not evidence the employer ignored anything."""
    applications['rows'] = [{'status': 'submitted', 'last_touched': None}]
    counted, released, _ = api._open_application_state('784000000000001')
    assert counted == 1 and released == 0


def test_no_applications_means_no_limit(applications):
    applications['rows'] = []
    assert api._open_application_state('784000000000001') == (0, 0, None)


# ── what the candidate is told ──────────────────────────────────────────────

def test_the_refusal_is_bilingual_and_actionable():
    """A limit with no way out reads as a ban on applying for work. The message
    names the two things the candidate can actually do."""
    import inspect
    src = inspect.getsource(api.apply)
    assert 'message_ar' in src
    assert 'Withdraw an application' in src
    assert '429' in src


def test_already_applied_is_reported_before_the_limit():
    import inspect
    src = inspect.getsource(api.apply)
    assert src.index('already applied') < src.index('_open_application_state')


def test_the_candidate_can_see_what_the_delay_released():
    """So it is visible that the platform is not holding them to applications
    nobody is acting on."""
    import inspect
    assert 'released_by_employer_delay' in inspect.getsource(api.apply)


# ── the employer side ───────────────────────────────────────────────────────

def test_the_flag_threshold_is_more_than_three():
    """fb_1788343258: "if this occurs on more than three occasions"."""
    import inspect
    assert "int(r['overdue']) > 3" in inspect.getsource(api.employers_not_responding)


def test_the_employer_side_reports_rather_than_punishes():
    """The consequence of a red flag is somebody's decision. A platform that
    silently penalises an employer it has never told is not governance."""
    import inspect
    src = inspect.getsource(api.employers_not_responding)
    assert 'UPDATE' not in src.upper().replace('UPDATED_AT', '')
    assert 'DELETE' not in src.upper()
