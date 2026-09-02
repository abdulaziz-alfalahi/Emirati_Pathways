"""Tell a recruiter when a candidate who fits their vacancy appears.

REQUESTED 2026-09-02 (fb_1788343289, "Scout Mode for Proactive Candidate
Matching"), and settled by the owner the same day:

    "I need the platform to inform the recruiter when a new candidate matches a
     vacancy, as a 'new match found'."

WHY THIS IS A NOTIFICATION AND NOT A DISCLOSURE

The alert says a match exists and names the vacancy. It does not carry the
candidate's contact details, because the owner's other ruling the same day is
that contact details stay on the platform (see backend/candidate_privacy.py).
The recruiter follows the link, reads the profile they were always entitled to
read, and messages the candidate through the platform.

WHAT COUNTS AS A MATCH

`SCOUT_THRESHOLD` is 75. It is a judgement, not a measurement: the scorer's
own bands put 'excellent' at 80+ and 'good' at 60+, and alerting on 'good' would
mean a recruiter with an open vacancy hears about a large share of everyone who
updates a profile. 75 sits inside 'good' but near the top of it. It is named
here so it is one edit when somebody sees what the volume actually looks like.

WHY NOTHING RUNS ON A TIMER

There is no background worker on this platform. Scouting is therefore triggered
by the two events that can create a new match — a candidate profile changing,
and a vacancy being published — and it runs inline, capped, and never raises
into the request that triggered it. A notification failing must not fail a
candidate's profile save.
"""
import logging

logger = logging.getLogger(__name__)

try:
    from backend.db_utils import execute_query
    from backend.match_scoring import calculate_match_score
    from backend.notification_helper import create_notification
except ImportError:  # pragma: no cover — the app runs under both roots
    from db_utils import execute_query
    from match_scoring import calculate_match_score
    from notification_helper import create_notification

#: Score at or above which a recruiter is told. See the module docstring.
SCOUT_THRESHOLD = 75

#: Most vacancies one profile change may be scored against, and most alerts one
#: event may raise. A candidate updating their profile must not walk the whole
#: vacancy table inside their own save, and a recruiter must not receive fifty
#: notifications from one person editing their skills.
MAX_VACANCIES_SCANNED = 200
MAX_ALERTS_PER_EVENT = 5

NOTIFICATION_TYPE = 'scout_new_match'


def _already_alerted(recruiter_id, job_id, candidate_id):
    """Has this recruiter already been told about this pair?

    Without this, every profile edit re-alerts on the same candidate — which is
    how a useful signal becomes noise a recruiter learns to ignore.
    """
    row = execute_query(
        """SELECT 1 FROM notifications
            WHERE user_id = %s
              AND type = %s
              AND metadata->>'job_id' = %s
              AND metadata->>'candidate_id' = %s
            LIMIT 1""",
        (recruiter_id, NOTIFICATION_TYPE, str(job_id), str(candidate_id)),
        fetch_one=True)
    return row is not None


#: Where a candidate's matchable attributes actually live.
#:
#: match_scoring.calculate_match_score reads technical_skills, soft_skills,
#: work_experience and education — which is precisely the shape of `user_cvs`,
#: not of candidate_profiles (education_level, experience_duration) and not of
#: users (skills, experience_years). An earlier draft of this module read each
#: of the wrong two in turn and scored every candidate as empty, which is the
#: quietest possible way for a feature to not work: no error, no alert, and
#: nothing to notice.
#:
#: LEFT JOIN, not JOIN: a candidate with no CV row should score low, not vanish.
_CANDIDATE_SQL = """
    SELECT u.id AS user_id,
           cv.technical_skills,
           cv.soft_skills,
           cv.work_experience,
           cv.education,
           COALESCE(u.full_name,
                    NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''))
               AS full_name
      FROM users u
      LEFT JOIN user_cvs cv ON cv.user_id = u.id
     WHERE u.role IN ('candidate', 'job_seeker')
       AND u.is_active IS TRUE
"""


def _scorable(row):
    """The row is already the scorer's shape; this only fills the id it wants."""
    out = dict(row or {})
    out.setdefault('user_id', out.get('id'))
    return out


def _candidate_for_scoring(candidate_id):
    row = execute_query(_CANDIDATE_SQL + ' AND u.id = %s',
                        (candidate_id,), fetch_one=True)
    return _scorable(row) if row else None


def _open_vacancies():
    return execute_query(
        """SELECT id, title, recruiter_id, required_skills, education_level,
                  experience_level
             FROM job_postings
            WHERE status = 'published'
              AND recruiter_id IS NOT NULL
            ORDER BY COALESCE(published_at, created_at) DESC
            LIMIT %s""",
        (MAX_VACANCIES_SCANNED,)) or []


def scout_for_candidate(candidate_id):
    """Score one candidate against open vacancies and alert on strong matches.

    Returns the number of alerts raised. Never raises: called from a profile
    save, and a notification problem must not cost a candidate their edit.
    """
    try:
        candidate = _candidate_for_scoring(candidate_id)
        if not candidate:
            return 0

        raised = 0
        for job in _open_vacancies():
            if raised >= MAX_ALERTS_PER_EVENT:
                break
            recruiter_id = job.get('recruiter_id')
            if not recruiter_id:
                continue
            score = calculate_match_score(candidate, dict(job))
            if score < SCOUT_THRESHOLD:
                continue
            if _already_alerted(recruiter_id, job['id'], candidate_id):
                continue
            # The name, not the contact details. The recruiter opens the profile
            # and messages them on the platform.
            create_notification(
                user_id=recruiter_id,
                notification_type=NOTIFICATION_TYPE,
                title='New match found',
                message=(f"{candidate.get('full_name') or 'A candidate'} matches "
                         f"“{job.get('title') or 'your vacancy'}” at {int(score)}%."),
                metadata={
                    'job_id': str(job['id']),
                    'candidate_id': str(candidate_id),
                    'match_score': int(score),
                    'title_ar': 'تم العثور على مرشح مطابق',
                },
            )
            raised += 1
        return raised
    except Exception as exc:                                   # noqa: BLE001
        logger.warning('scout_for_candidate(%s) failed: %s', candidate_id, exc)
        return 0


def scout_for_vacancy(job_id):
    """The other direction: a vacancy is published, so who already fits it?

    Same caps and the same silence on failure. Publishing a vacancy must not
    fail because a notification could not be written.
    """
    try:
        job = execute_query(
            """SELECT id, title, recruiter_id, required_skills, education_level,
                      experience_level
                 FROM job_postings WHERE id = %s""", (job_id,), fetch_one=True)
        if not job or not job.get('recruiter_id'):
            return 0

        candidates = [_scorable(r) for r in (execute_query(
            _CANDIDATE_SQL + """ AND cv.technical_skills IS NOT NULL
                ORDER BY cv.updated_at DESC NULLS LAST
                LIMIT %s""", (MAX_VACANCIES_SCANNED,)) or [])]

        raised = 0
        for candidate in candidates:
            if raised >= MAX_ALERTS_PER_EVENT:
                break
            score = calculate_match_score(candidate, dict(job))
            if score < SCOUT_THRESHOLD:
                continue
            if _already_alerted(job['recruiter_id'], job['id'], candidate['user_id']):
                continue
            create_notification(
                user_id=job['recruiter_id'],
                notification_type=NOTIFICATION_TYPE,
                title='New match found',
                message=(f"{candidate.get('full_name') or 'A candidate'} matches "
                         f"“{job.get('title') or 'your vacancy'}” at {int(score)}%."),
                metadata={
                    'job_id': str(job['id']),
                    'candidate_id': str(candidate['user_id']),
                    'match_score': int(score),
                    'title_ar': 'تم العثور على مرشح مطابق',
                },
            )
            raised += 1
        return raised
    except Exception as exc:                                   # noqa: BLE001
        logger.warning('scout_for_vacancy(%s) failed: %s', job_id, exc)
        return 0
