"""The interview analytics screen must not invent anything about a candidate.

Reported 2026-08-31, minutes after a real interview (fb_1788181600): "I clicked
on analytics after the interview and saw mock data in the tabs."

Every figure was a hardcoded constant, identical for every candidate:

    overall score 88 · Culture Fit 92 · Leadership 80 · Technical 90
    sentiment "Positive" over ten invented time points
    duration 45:20        (the interview had run 14:21)
    speaking ratio 65/35  (which happened to be RIGHT — and that is why
                           nobody caught any of the rest)

Those were hiring judgements about a named person, invented by nobody. The
backend had never agreed to any of it: its report endpoint has always refused
to score without a real transcript.

Owner decision, 2026-08-31: show a real AI assessment — "the final say will be
with the recruiter and the HR Manager. The AI analysis are to expedite the
decision making process." So the tests below are about two things: that nothing
is fabricated, and that what IS shown is unmistakably labelled.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import comments_only_removed  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')
PANEL = os.path.join(FRONTEND, 'components', 'recruiter', 'interviews',
                     'InterviewAnalytics.tsx')
ROUTES = os.path.join(BACKEND, 'video_interview_routes.py')


def tsx(path):
    if not os.path.exists(path):
        pytest.skip(f'{os.path.basename(path)} not present')
    src = open(path, encoding='utf-8').read()
    out, i, n = [], 0, len(src)
    while i < n:
        two = src[i:i + 2]
        if two == '/*':
            j = src.find('*/', i + 2)
            i = n if j == -1 else j + 2
        elif two == '//':
            j = src.find('\n', i)
            i = n if j == -1 else j
        else:
            out.append(src[i]); i += 1
    return ''.join(out)


# ── nothing invented ────────────────────────────────────────────────────────

def test_the_fabricated_constants_are_gone():
    """The exact values that were shown about a real candidate."""
    code = tsx(PANEL)
    for ghost in ('overallScore', 'Culture Fit', 'fullMark: 100, ',
                  "'45:20'", 'System Design', 'Scalability'):
        assert ghost not in code, f'fabricated value still present: {ghost}'


def test_no_hardcoded_score_arrays_remain():
    """sentimentData/skillsData/topicData were literal arrays of invented
    numbers. Any reappearance is the bug returning."""
    code = tsx(PANEL)
    for name in ('sentimentData', 'skillsData', 'topicData', 'summaryData'):
        assert name not in code, f'{name} is back'


def test_the_panel_reads_the_interview_instead_of_declaring_it():
    code = tsx(PANEL)
    assert 'restClient.get' in code, 'the panel fetches nothing'
    assert '/transcript' in code
    assert 'analyze-transcript' in code


def test_duration_is_computed_from_the_record():
    code = tsx(PANEL)
    assert 'started_at' in code and 'ended_at' in code, \
        'duration is not derived from when the interview actually ran'


def test_speaking_share_is_counted_not_asserted():
    code = tsx(PANEL)
    assert 'segments' in code and 'split(' in code, \
        'the speaking share is not counted from the transcript'


# ── what is shown is labelled ───────────────────────────────────────────────

def test_the_assessment_is_labelled_as_ai_generated():
    """The owner's condition for showing it at all."""
    code = tsx(PANEL)
    assert 'AI-generated assessment' in code
    assert 'advisory' in code.lower()


def test_it_says_who_decides():
    code = tsx(PANEL)
    assert 'recruiter and the HR Manager' in code, \
        'nothing states that the decision rests with a person'


# ── absence is stated, and blamed correctly ─────────────────────────────────

def test_a_missing_transcript_is_reported_as_missing():
    code = tsx(PANEL)
    assert 'no_transcript' in code
    assert 'nothing to assess' in code


def test_a_poor_transcript_is_not_reported_as_a_poor_candidate():
    """The distinction the whole feature turns on."""
    code = tsx(PANEL)
    assert 'transcript_quality' in code
    assert 'not about the candidate' in code, \
        'a bad recording could be read as a bad candidate'


# ── the analysis must describe the interview that happened ──────────────────

def test_the_server_analyses_its_own_transcript():
    """A browser must not be able to post arbitrary text and have the result
    attached to a named candidate in a hiring decision."""
    body = comments_only_removed(open(ROUTES, encoding='utf-8').read())
    assert '_stored_transcript' in body, \
        'the analysis still depends on whatever the client sends'


def test_the_stored_transcript_is_resolved_by_room_as_well():
    """Segments are filed under the room name, not the interview id."""
    body = comments_only_removed(open(ROUTES, encoding='utf-8').read())
    fn = body[body.index('def _stored_transcript'):]
    fn = fn[:fn.index('def _stored_analysis')]
    assert 'meeting_link' in fn and "split('/')" in fn


def test_the_assessment_is_stored_so_everyone_sees_the_same_one():
    """The recruiter and the HR manager must weigh the same assessment.
    Re-running the model per page load would show them different scores for
    one interview and leave no record of which a decision was made against."""
    body = comments_only_removed(open(ROUTES, encoding='utf-8').read())
    assert '_save_analysis' in body
    assert 'ai_analysis' in body


def test_a_live_chunk_is_not_stored_as_the_assessment():
    """Mid-interview impressions stream in continuously; the assessment of the
    interview is computed once, from the whole record."""
    body = comments_only_removed(open(ROUTES, encoding='utf-8').read())
    assert 'stored_only' in body, \
        'the live path and the finished-interview path are not distinguished'


def test_a_failure_to_store_does_not_deny_the_caller_its_analysis():
    body = comments_only_removed(open(ROUTES, encoding='utf-8').read())
    fn = body[body.index('def _save_analysis'):]
    fn = fn[:fn.index('@video_interview_bp')]
    assert 'except' in fn, 'a storage failure would propagate as a request failure'


# ── the assessor dashboard ──────────────────────────────────────────────────
#
# Surveyed out of the same report. This screen invented ninety-five assessments,
# an 83.2 average and a reliability of 0.89 — and a work queue of candidates who
# do not exist ("Ahmed Al Mansouri", "Fatima Al Zahra", "Omar Hassan"), each
# with a scheduled date. It also published a Bias Detection Score and a Fairness
# figure, invented, on a government assessment platform.
#
# It faked the wait too: a 1000ms setTimeout before setting constants, so it
# looked like it had fetched something.

ASSESSOR = os.path.join(FRONTEND, 'components', 'assessor', 'AssessorDashboard.tsx')


def test_the_invented_candidates_are_gone():
    code = tsx(ASSESSOR)
    for name in ('Ahmed Al Mansouri', 'Fatima Al Zahra', 'Omar Hassan'):
        assert name not in code, f'invented candidate still in the work queue: {name}'


def test_no_invented_fairness_or_bias_scores():
    """Nothing in the platform measures these. On an assessment service a
    plausible fairness number is worse than none at all."""
    code = tsx(ASSESSOR)
    for ghost in ('Bias Detection', 'Inter-rater', 'Fairness', 'qualityTrends'):
        assert ghost not in code, f'invented quality measure still present: {ghost}'


def test_the_fake_loading_delay_is_gone():
    """A setTimeout before setting constants made it look like a fetch."""
    code = tsx(ASSESSOR)
    assert 'setTimeout(resolve, 1000)' not in code


def test_it_reads_the_real_assessor_endpoints():
    code = tsx(ASSESSOR)
    assert '/api/assessor/dashboard' in code
    assert '/api/assessor/applications' in code


def test_the_charts_are_derived_from_the_assessors_own_rows():
    code = tsx(ASSESSOR)
    assert 'useMemo' in code, 'chart data is not derived from fetched rows'
    assert 'competencyDistribution = [' not in code, 'the literal split is back'


def test_it_says_when_nothing_has_been_recorded():
    """There are zero assessments on the platform today. An empty dashboard has
    to read as empty, not as broken."""
    code = tsx(ASSESSOR)
    assert 'No quality measures have been recorded' in code


# ── the admin system analytics ──────────────────────────────────────────────
#
# Also surveyed out of fb_1788181600. It reported 1,247 users when the platform
# held 38,339; a role split invented to round numbers (45/25/15/10/5); five
# named articles with view counts that were never written; and a full
# infrastructure console — CPU, memory, disk, network, error rate, "99.8%
# uptime" — for infrastructure this platform does not monitor.
#
# And it MOVED: those came from Math.random() on a thirty-second refresh, so an
# administrator watching it saw CPU fluctuate and had every reason to believe
# it was live.

SYSAN = os.path.join(FRONTEND, 'components', 'admin', 'SystemAnalytics.tsx')


def test_no_random_numbers_are_presented_as_measurements():
    """The most deceptive part: figures that animate look measured."""
    code = tsx(SYSAN)
    assert 'Math.random()' not in code, \
        'randomly generated figures are being shown as system metrics'


def test_the_invented_user_totals_are_gone():
    code = tsx(SYSAN)
    for ghost in ('1247', 'total_users: 1247', "value: 45", 'user_retention_rate: 78.3'):
        assert ghost not in code, f'invented figure still present: {ghost}'


def test_infrastructure_it_cannot_measure_is_not_reported():
    """A console that reports uptime from nowhere is worse than one that does
    not offer it — an administrator would trust it during an incident."""
    code = tsx(SYSAN)
    for ghost in ('cpu_usage:', 'memory_usage:', 'disk_usage:', 'formatUptime'):
        assert ghost not in code, f'fabricated infrastructure metric: {ghost}'


def test_it_says_where_server_health_actually_lives():
    code = tsx(SYSAN)
    assert 'not' in code and 'collected by this platform' in code


def test_it_reads_the_real_user_statistics():
    code = tsx(SYSAN)
    assert '/api/admin/users/statistics' in code


def test_the_role_split_is_read_not_declared():
    code = tsx(SYSAN)
    assert 'users_by_role' in code
    assert "{ name: 'Job Seekers'" not in code, 'the invented role split is back'


def test_the_invented_articles_are_gone():
    code = tsx(SYSAN)
    assert 'UAE Career Development Guide' not in code
    assert 'popular_content' not in code
