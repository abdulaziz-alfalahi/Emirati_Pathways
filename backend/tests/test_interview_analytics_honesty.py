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


# ── the four screens that had no data behind them ───────────────────────────
#
# Completing the survey. Each charted literal arrays and fetched nothing:
# 2,767 lines between them, about people who do not exist.
#
# Their backends were already honest — the educator analytics endpoint has
# carried "leave null rather than assert a fabricated 85 (#26)" for months.
# None of the four called anything.

FOUR = {
    'QualityAssuranceDashboard': os.path.join(FRONTEND, 'components', 'assessor',
                                              'QualityAssuranceDashboard.tsx'),
    'CompetencyValidation': os.path.join(FRONTEND, 'components', 'assessor',
                                         'CompetencyValidation.tsx'),
    'StudentTracking': os.path.join(FRONTEND, 'components', 'educator',
                                    'StudentTracking.tsx'),
    'PerformanceAnalytics': os.path.join(FRONTEND, 'components', 'educator',
                                         'PerformanceAnalytics.tsx'),
}


@pytest.mark.parametrize('name', sorted(FOUR))
def test_each_screen_reads_something(name):
    code = tsx(FOUR[name])
    assert 'restClient.get' in code, f'{name} still fetches nothing'


@pytest.mark.parametrize('name', sorted(FOUR))
def test_each_screen_says_when_it_is_empty(name):
    """All four are empty today. Empty has to read as empty, not as broken and
    not as a result."""
    code = tsx(FOUR[name])
    assert 'yet' in code.lower(), f'{name} has no empty state wording'


#: CSS keys that look exactly like data rows — `{ width: '100%', height: 220 }`
#: matches the same shape as `{ subject: 'Technical', A: 90 }`. Excluding them
#: is what keeps this test from failing on a style object later.
_STYLE_KEYS = ('width', 'height', 'top', 'left', 'right', 'bottom', 'margin',
               'padding', 'gap', 'fontSize', 'lineHeight', 'zIndex', 'flex',
               'minHeight', 'maxWidth', 'borderRadius', 'opacity')


@pytest.mark.parametrize('name', sorted(FOUR))
def test_no_literal_score_rows_remain(name):
    """The signature of the defect: a literal object carrying a label and a
    number, rendered into a chart."""
    import re
    code = tsx(FOUR[name])
    rows = [m for m in re.findall(
                r"\{\s*(\w+)\s*:\s*['\"][^'\"]+['\"]\s*,\s*\w+\s*:\s*-?\d+", code)
            if m not in _STYLE_KEYS]
    assert not rows, f'{name} still declares literal data rows: {rows[:3]}'


def test_the_invented_people_are_gone_everywhere():
    for name, path in FOUR.items():
        code = tsx(path)
        for ghost in ('Ahmed Al Mansouri', 'Fatima Al Zahra', 'Omar Hassan'):
            assert ghost not in code, f'{name} still names {ghost}'


def test_competency_validation_admits_it_has_no_framework():
    """competency_models holds zero rows. Scoring against a framework nobody has
    defined is how the original numbers came to exist."""
    code = tsx(FOUR['CompetencyValidation'])
    assert 'No competency framework is defined yet' in code


def test_quality_monitoring_states_its_own_limit():
    """The endpoint reads an in-memory store that empties on restart. An empty
    monitor presented as 'no problems found' would be its own kind of lie."""
    code = tsx(FOUR['QualityAssuranceDashboard'])
    assert 'not a clean bill of health' in code
    assert 'in memory' in code


def test_an_untracked_measure_is_not_shown_as_zero():
    """The educator backend returns null for placement success on purpose."""
    code = tsx(FOUR['PerformanceAnalytics'])
    assert 'not tracked yet' in code


# ── the sweep that has to keep passing ──────────────────────────────────────
#
# The first survey counted `{ position: 'fixed', inset: 0 }` as chart data and
# so reported thirteen suspect screens that were not suspect. Tuned to ignore
# CSS and to require a REPEATED data-shaped row, it found exactly one thing the
# hand review had missed: an inline NQF distribution inside AssessorDashboard
# (25 assessments at Level 6, 18 at Level 7 …) plus "47 Digital Credentials
# Issued" and a compliance panel of green ticks. The assessments table has no
# NQF column at all.
#
# This is the guard against the whole class returning anywhere in the frontend.

_CSS_KEYS = {
    'width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding', 'gap',
    'position', 'inset', 'fontSize', 'lineHeight', 'zIndex', 'flex', 'minHeight',
    'maxWidth', 'borderRadius', 'opacity', 'stroke', 'fill', 'strokeWidth',
    'fontWeight', 'minWidth', 'maxHeight', 'marginTop', 'marginBottom', 'marginLeft',
    'marginRight', 'paddingTop', 'paddingBottom', 'order', 'flexGrow', 'outerRadius',
    'innerRadius', 'cx', 'cy', 'paddingAngle', 'strokeDasharray', 'r', 'x', 'y',
    'dx', 'dy',
}


def test_no_screen_authors_its_own_chart_data():
    """A chart whose numbers are written into the source is a chart about
    nobody. Three or more identically-shaped literal rows is an authored
    dataset, not configuration."""
    import re
    if not os.path.isdir(FRONTEND):
        pytest.skip('frontend not present')

    row = re.compile(
        r"\{\s*(\w+)\s*:\s*['\"][^'\"]{1,60}['\"]\s*,\s*(\w+)\s*:\s*(-?\d+(?:\.\d+)?)\s*[,}]")
    chart = re.compile(r"<(Bar|Line|Area|Pie|Radar|Radial|Scatter)\b|<ResponsiveContainer")

    offenders = []
    for dirpath, _dirs, files in os.walk(FRONTEND):
        if 'node_modules' in dirpath or '__tests__' in dirpath:
            continue
        for fn in files:
            if not fn.endswith('.tsx'):
                continue
            path = os.path.join(dirpath, fn)
            code = tsx(path)
            if not chart.search(code):
                continue
            shapes = {}
            for k1, k2, _v in row.findall(code):
                if k1 in _CSS_KEYS or k2 in _CSS_KEYS:
                    continue
                shapes[(k1, k2)] = shapes.get((k1, k2), 0) + 1
            worst = [(s, n) for s, n in shapes.items() if n >= 3]
            if worst:
                offenders.append((os.path.relpath(path, FRONTEND), worst))

    assert not offenders, (
        'these screens write their own chart data instead of reading it:\n'
        + '\n'.join(f'  {rel}: {w}' for rel, w in offenders))


# ── invented PEOPLE ─────────────────────────────────────────────────────────
#
# A fabricated person is worse than a fabricated number: a reader believes
# somebody applied, somebody was assessed, somebody wrote the article.
#
# Swept 2026-09-01. Three real offenders, all now removed:
#
#   GrowthOperatorManagerEnhanced  five invented operators shown SILENTLY
#                                  whenever the roster API returned nothing —
#                                  Ahmed Al Maktoum, Fatima Al Nahyan, Mohammed
#                                  Al Qasimi, Sara Al Falasi, Khalid Al
#                                  Mazrouei, on @emiratipathways.ae addresses.
#                                  This is the screen roles are granted on, and
#                                  those are the surnames of UAE ruling
#                                  families.
#   ProfileManagement              a complete fictional identity as the initial
#                                  state — "Ahmed Al Emirati", 75% complete,
#                                  status "verified" — shown to the signed-in
#                                  user until their own profile arrived.
#   ContentManager                 an article library bylined to four people
#                                  who do not exist.
#
# The live database was swept too and is CLEAN: all 24 placeholder-domain
# accounts are flagged is_test_account, and no unflagged account sits on a
# placeholder domain.

_INVENTED_PEOPLE = (
    'Ahmed Al Maktoum', 'Fatima Al Nahyan', 'Mohammed Al Qasimi',
    'Sara Al Falasi', 'Khalid Al Mazrouei', 'Ahmed Al Mansouri',
    'Fatima Al Zahra', 'Omar Hassan', 'Sarah Al-Mansouri',
    'Fatima Al-Zahra', 'Mohammed Al-Rashid', 'Ahmed Al Emirati',
)

_PEOPLE_FILES = (
    ('components', 'admin', 'GrowthOperatorManagerEnhanced.tsx'),
    ('components', 'admin', 'ContentManager.tsx'),
    ('pages', 'profile', 'ProfileManagement.tsx'),
    ('components', 'assessor', 'AssessorDashboard.tsx'),
)


@pytest.mark.parametrize('parts', _PEOPLE_FILES)
def test_no_invented_person_is_presented_as_real(parts):
    path = os.path.join(FRONTEND, *parts)
    code = tsx(path)
    present = [n for n in _INVENTED_PEOPLE if n in code]
    assert not present, f'{parts[-1]} still names: {present}'


def test_an_empty_operator_roster_is_empty():
    """The fabricated operators were a SILENT fallback: they appeared only when
    the API returned nothing, so the screen looked populated precisely when it
    knew least."""
    code = tsx(os.path.join(FRONTEND, 'components', 'admin',
                            'GrowthOperatorManagerEnhanced.tsx'))
    assert 'setOperators([])' in code, \
        'the roster falls back to something other than empty'
    assert '@emiratipathways.ae' not in code, 'invented staff addresses remain'


def test_a_signed_in_user_is_never_shown_someone_elses_identity():
    """The initial profile state was a whole fictional person, spread beneath
    the real one — so any field missing from the real profile fell through to
    the invention, including a verification status of "verified"."""
    code = tsx(os.path.join(FRONTEND, 'pages', 'profile', 'ProfileManagement.tsx'))
    assert "firstName: 'Ahmed'" not in code
    # Assert the honest default rather than the absence of 'verified': the word
    # also appears in the TYPE union, which is legitimate.
    assert "verificationStatus: 'unverified'" in code, \
        'the default profile does not start unverified'
    assert "profileCompletion: 0" in code, \
        'the default profile still claims to be partly complete'
