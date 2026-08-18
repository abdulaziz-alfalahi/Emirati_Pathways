"""The ATS compatibility score — one implementation, server side.

WHY THIS EXISTS

The score was computed in `CVProfile.tsx` and nowhere else. Three consequences,
all of which were visible on screen at once (owner review, 2026-08-18):

1. The number only existed while a candidate had the Profile & CV tab open. Any
   other surface asking "what is this person's ATS score" got nothing.
2. The dashboard therefore showed "Not scored yet" beside a profile the CV tab
   was scoring at 79% — the same complaint as feedback fb_1785810051, whose fix
   corrected the label and left the cause alone.
3. Nothing could act on it: no operator view, no report, no matching input.

Scoring belongs on the server for the same reason match scoring does
(`match_scoring.py`): a number the platform states about a person should not
depend on which page they happened to open.

FAITHFUL PORT, DELIBERATELY

The weights below are the frontend's, unchanged — 20 personal / 30 experience /
15 education / 20 skills / 15 keywords. This is a port, not a redesign: changing
what the score MEANS at the same time as changing where it is computed would
make a shifted score indistinguishable from a broken port. Tune it afterwards,
with the before/after visible.

WHAT IT IS NOT

Not a judgement of the person, and not a match score. It measures whether a CV
is machine-readable by applicant tracking systems — completeness and keyword
presence. `match_scoring.py` remains the only thing that scores a person against
a job.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Section ceilings. They sum to 100, which is what makes the total a percentage
# without further arithmetic.
MAX_PERSONAL_INFO = 20
MAX_EXPERIENCE = 30
MAX_EDUCATION = 15
MAX_SKILLS = 20
MAX_KEYWORDS = 15
MAX_TOTAL = (MAX_PERSONAL_INFO + MAX_EXPERIENCE + MAX_EDUCATION
             + MAX_SKILLS + MAX_KEYWORDS)

# A summary shorter than this reads as a placeholder rather than a summary.
MIN_SUMMARY_CHARS = 50
# Below this an experience entry is a job title with no substance for a parser.
MIN_DESCRIPTION_CHARS = 100


def _text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ''


def _pick(source: Any, *keys: str) -> Any:
    """First present, non-empty value among several key spellings.

    TWO SHAPES ARE REAL IN user_cvs, and this is not hypothetical: scoring the
    five most recent live CVs on 2026-08-18 gave personalInfo=0 for every one of
    them, including a CV with complete experience, education and skills. The
    reason is that the frontend scored its own in-memory CVData — camelCase,
    `personalInfo.fullName` — while the parser writes snake_case
    `personal_info.full_name` to the database. A port that read only the
    frontend's spelling would have scored every stored CV as anonymous, and the
    resulting number would have looked plausible enough to ship.
    """
    if not isinstance(source, dict):
        return None
    for key in keys:
        value = source.get(key)
        if value not in (None, '', [], {}):
            return value
    return None


def _as_list(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


def _skill_names(skills: Any) -> List[str]:
    """Skills arrive as bare strings or as {name: ...} objects, depending on
    which importer wrote them. Both shapes are real in this database."""
    out = []
    for s in _as_list(skills):
        if isinstance(s, str):
            name = s
        elif isinstance(s, dict):
            name = s.get('name') or s.get('skill') or ''
        else:
            name = ''
        name = _text(name).lower()
        if name:
            out.append(name)
    return out


def _priority_skills() -> List[str]:
    """D33 / Talent33 priority skills, lowercased.

    Imported lazily and defensively: a missing or renamed catalogue must cost
    the keyword section, not the whole score. A candidate seeing 0% because a
    config import moved is worse than one seeing 85 instead of 100.
    """
    names: List[str] = []
    try:
        try:
            from backend.config.d33_sectors import D33_SECTORS, TALENT33_SKILLS
        except ImportError:
            from config.d33_sectors import D33_SECTORS, TALENT33_SKILLS
        for sector in (D33_SECTORS or {}).values():
            names.extend(_as_list((sector or {}).get('skills')))
        for group in (TALENT33_SKILLS or {}).values():
            names.extend(_as_list(group))
    except Exception as e:  # pragma: no cover — catalogue is optional
        logger.warning("D33 skill catalogue unavailable, keyword section will score 0: %s", e)
        return []
    return sorted({_text(n).lower() for n in names if _text(n)})


def _score_personal_info(info: Dict[str, Any], recs: List[str],
                         fallback_summary: str = '') -> int:
    score = 0
    full_name = _text(_pick(info, 'fullName', 'full_name', 'name')) or ' '.join(
        p for p in (_text(_pick(info, 'firstName', 'first_name')),
                    _text(_pick(info, 'lastName', 'last_name'))) if p)
    if full_name:
        score += 4
    else:
        recs.append('Add your full name to your profile')

    if _text(_pick(info, 'email')):
        score += 4
    else:
        recs.append('Add your email address for recruiter contact')

    if _text(_pick(info, 'phone')):
        score += 3
    else:
        recs.append('Add your phone number')

    if _text(_pick(info, 'location', 'address', 'city')):
        score += 3
    else:
        recs.append('Add your location to improve local job matches')

    # The parser stores the summary at the TOP level as professional_summary,
    # while the frontend kept it inside personalInfo. Both count.
    summary = _text(_pick(info, 'summary', 'professional_summary')) or fallback_summary
    if len(summary) > MIN_SUMMARY_CHARS:
        score += 4
    else:
        recs.append('Add a professional summary (at least 50 characters) to stand out')

    if _text(_pick(info, 'linkedIn', 'linkedin', 'linked_in', 'linkedin_url')):
        score += 2
    else:
        recs.append('Add your LinkedIn profile URL')

    return min(score, MAX_PERSONAL_INFO)


def _score_experience(experience: List[Any], recs: List[str]) -> int:
    if not experience:
        recs.append('Add your work experience to significantly improve your ATS score')
        return 0

    score = 10
    entries = [e for e in experience if isinstance(e, dict)]

    if any(len(_text(_pick(e, 'description', 'summary', 'responsibilities')))
           > MIN_DESCRIPTION_CHARS for e in entries):
        score += 10
    else:
        recs.append('Add detailed descriptions to your work experience (100+ characters)')

    if any(_as_list(_pick(e, 'achievements', 'accomplishments', 'highlights'))
           for e in entries):
        score += 10
    else:
        recs.append('Add quantifiable achievements to your experience '
                    '(e.g., "Increased sales by 25%")')

    return min(score, MAX_EXPERIENCE)


def _score_education(education: List[Any], recs: List[str]) -> int:
    if not education:
        recs.append('Add your educational background')
        return 0

    score = 10
    entries = [e for e in education if isinstance(e, dict)]
    if any(_text(_pick(e, 'fieldOfStudy', 'field_of_study', 'field', 'major'))
           or _pick(e, 'gpa', 'GPA', 'grade') for e in entries):
        score += 5
    else:
        recs.append('Add field of study and GPA to your education')

    return min(score, MAX_EDUCATION)


def _score_skills(names: List[str], recs: List[str]) -> int:
    count = len(names)
    if count >= 10:
        score = 20
    elif count >= 5:
        score = 15
    elif count >= 3:
        score = 10
    elif count > 0:
        score = 5
    else:
        score = 0

    if count < 5:
        recs.append('Add more skills (aim for at least 10) to match more job requirements')

    return score


def _score_keywords(names: List[str], recs: List[str]) -> int:
    priority = _priority_skills()
    matches = 0
    for skill in priority:
        # Substring match in BOTH directions, as the frontend did: "python"
        # should match "Python 3" and "Advanced Python" alike.
        if any(skill in name or name in skill for name in names):
            matches += 1

    if matches >= 5:
        score = 15
    elif matches >= 3:
        score = 10
    elif matches >= 1:
        score = 5
    else:
        score = 0

    if matches < 3:
        recs.append('Add skills aligned with D33 priority sectors '
                    '(Technology, Sustainability, Finance)')

    return score


def score_cv(cv_data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Score one CV. Returns None when there is no CV to score.

    None is not zero. A candidate who has not built a CV has no score; a
    candidate whose CV scores badly has a score of 0. Collapsing the two would
    tell the first person they scored nothing, and would let every surface
    display a confident 0% for a profile nobody has filled in yet.
    """
    if not isinstance(cv_data, dict) or not cv_data:
        return None

    recommendations: List[str] = []
    names = _skill_names(_pick(cv_data, 'skills'))

    personal = _pick(cv_data, 'personalInfo', 'personal_info') or {}
    top_summary = _text(_pick(cv_data, 'professional_summary', 'summary'))

    breakdown = {
        'personalInfo': _score_personal_info(personal, recommendations, top_summary),
        'experience': _score_experience(
            _as_list(_pick(cv_data, 'experience', 'work_experience')), recommendations),
        'education': _score_education(
            _as_list(_pick(cv_data, 'education', 'educations')), recommendations),
        'skills': _score_skills(names, recommendations),
        'keywords': _score_keywords(names, recommendations),
    }

    return {
        'overall': sum(breakdown.values()),
        'breakdown': breakdown,
        'maximums': {
            'personalInfo': MAX_PERSONAL_INFO,
            'experience': MAX_EXPERIENCE,
            'education': MAX_EDUCATION,
            'skills': MAX_SKILLS,
            'keywords': MAX_KEYWORDS,
        },
        'recommendations': recommendations,
    }
