"""
Canonical job ⇄ candidate match score.

ONE scorer, used by BOTH the recruiter applicant view (inline_routes) and the
candidate job-matches (jobs_api). Previously each side had its own formula — the
recruiter used this weighted skills/experience/education algorithm while the
candidate side used a base-70 + 5-per-keyword heuristic (plus hard-coded 75/92/88
demo values), so the SAME candidate+job showed different percentages (e.g. 30% to
the candidate, 40% to the recruiter). Sharing this function makes them identical.

Design rules (GH #12) preserved: skills-based only — NO geography factor, NO flat
nationality bonus. National-priority stays a separate, disclosed axis and is NOT
folded in here.
"""

import json

try:
    from backend.verified_skills import verified_skill_names
except ImportError:  # pragma: no cover — the app runs under both roots
    from verified_skills import verified_skill_names


def _as_skill_list(value):
    """Normalise a skills field (JSON string, CSV string, or list of str/dict)
    into a lowercase set of skill names."""
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            value = [s.strip() for s in value.split(',') if s.strip()]
    out = set()
    for s in (value or []):
        if isinstance(s, str):
            if s:
                out.add(s.lower())
        elif isinstance(s, dict):
            name = str(s.get('name', s.get('skill', ''))).strip()
            if name:
                out.add(name.lower())
    return out


# ── What the EMPLOYER asked for ─────────────────────────────────────────────
#
# Until 2026-09-01 the experience and education halves of this score (40% of it)
# were computed from the candidate's profile ALONE: how many jobs they had
# listed, and whether they had any education at all. Nothing the employer stated
# about the role influenced who was nominated for it.
#
# That was reported by a call-centre operator asking for structured vacancy
# fields "to ensure that candidates are nominated based on the specific vacancy
# requirements" (fb_1788155502). They were right, and the cause ran deeper than
# missing fields: the matcher never read the requirements at all.
#
# The weights are UNCHANGED — 60 skills / 20 experience / 20 education, and the
# GH #12 rules above still hold. What changed is what the 40% is measured
# against: the vacancy's stated requirement when there is one, and the previous
# candidate-only behaviour when there is not. A vacancy that states nothing
# scores exactly as it did before.

#: Education ordering, lowest to highest. Used to ask "does this candidate meet
#: the level asked for?", never to rank people against each other.
_EDUCATION_RANK = {
    'high school': 1, 'secondary': 1, 'certificate': 2, 'diploma': 3,
    'higher diploma': 4, 'associate': 4, 'bachelor': 5, 'bachelors': 5,
    'degree': 5, 'honours': 6, 'postgraduate': 6, 'master': 7, 'masters': 7,
    'mba': 7, 'phd': 8, 'doctorate': 8,
}

#: Experience bands as employers write them, expressed as minimum years.
_EXPERIENCE_BANDS = {
    'entry': 0, 'entry-level': 0, 'graduate': 0, 'junior': 1, 'intern': 0,
    'mid': 3, 'mid-level': 3, 'intermediate': 3, 'associate': 2,
    'senior': 6, 'lead': 8, 'principal': 10, 'director': 10, 'executive': 12,
}


def _education_rank(text):
    """Highest level named in a free-text education string, or 0."""
    t = str(text or '').lower()
    best = 0
    for name, rank in _EDUCATION_RANK.items():
        if name in t:
            best = max(best, rank)
    return best


def _required_years(job):
    """Minimum years the vacancy asks for, or None if it does not say.

    Employers state this either as a number of years or as a band ("senior").
    A vacancy that says nothing must not be treated as asking for zero — that
    is the difference between "no requirement" and "no experience needed", and
    only the first should fall back to the old behaviour.
    """
    for key in ('min_experience_years', 'experience_years', 'required_experience_years'):
        raw = job.get(key)
        if raw not in (None, '', 0, '0'):
            try:
                return max(0.0, float(raw))
            except (TypeError, ValueError):
                pass
    band = str(job.get('experience_level') or '').strip().lower()
    if band in _EXPERIENCE_BANDS:
        return float(_EXPERIENCE_BANDS[band])
    return None


def _candidate_years(candidate):
    """Years of experience, from explicit years where given and otherwise from
    the number of roles listed — which is what this scorer has always used."""
    raw = candidate.get('years_of_experience') or candidate.get('total_experience_years')
    if raw not in (None, ''):
        try:
            return max(0.0, float(raw))
        except (TypeError, ValueError):
            pass
    entries = candidate.get('work_experience') or []
    if isinstance(entries, list):
        # The historical proxy: each listed role counts as a year of standing.
        return float(len(entries))
    return 0.0


def _candidate_education_rank(candidate):
    education = candidate.get('education') or []
    best = 0
    if isinstance(education, list):
        for edu in education:
            if isinstance(edu, dict):
                best = max(best,
                           _education_rank(edu.get('degree')),
                           _education_rank(edu.get('level')),
                           _education_rank(edu.get('qualification')))
            else:
                best = max(best, _education_rank(edu))
    else:
        best = _education_rank(education)
    return best


def calculate_match_score(candidate: dict, job: dict) -> float:
    """Weighted match percentage (0–100) for a candidate against a job.

    Components (unchanged from the original recruiter algorithm):
      • Skills overlap — 60% of the total. Fraction of the job's required skills
        that the candidate holds. + a capped assessment-verification bonus
        (+4 per verified required skill, max +10) so passing an assessment
        demonstrably improves the match. Strictly additive.
      • Experience — 20%. Measured against the vacancy's stated requirement
        (min_experience_years, or an experience_level band such as "senior")
        when it states one, proportionately below it rather than as a cliff.
        When the vacancy states nothing, scales with the number of
        work-experience entries exactly as before.
      • Education — 20%. Measured against the vacancy's required level when it
        states one, proportionately below it. When it states nothing, +15 for
        having any education and +5 for an advanced degree, as before.

    `candidate` keys used: technical_skills, soft_skills, work_experience,
    education, years_of_experience, and user_id (or candidate_id) for
    verified-skill lookup.
    `job` keys used: required_skills, experience_level / min_experience_years,
    education_level / education_requirements.

    A vacancy that states no requirements scores exactly as it did before this
    change — the fallbacks are the original code paths.
    """
    if not job:
        return 50.0

    score = 0.0
    max_score = 0.0

    # Required skills → lowercase list
    required_skills = job.get('required_skills') or []
    if isinstance(required_skills, str):
        try:
            required_skills = json.loads(required_skills)
        except Exception:
            required_skills = [s.strip().lower() for s in required_skills.split(',') if s.strip()]
    if isinstance(required_skills, list):
        required_skills = [s.lower() if isinstance(s, str) else str(s).lower() for s in required_skills]

    # Candidate skills (technical + soft) as a set, plus assessment-verified skills
    all_candidate_skills = _as_skill_list(candidate.get('technical_skills')) | \
        _as_skill_list(candidate.get('soft_skills'))
    verified = verified_skill_names(candidate.get('user_id') or candidate.get('candidate_id'))
    all_candidate_skills |= verified

    # Skills match — 60%
    if required_skills:
        max_score += 60
        matched_skills = 0
        verified_matches = 0
        for req_skill in required_skills:
            req_lower = req_skill.lower() if isinstance(req_skill, str) else str(req_skill).lower()
            for cand_skill in all_candidate_skills:
                if req_lower in cand_skill or cand_skill in req_lower:
                    matched_skills += 1
                    if cand_skill in verified or any(
                            (v in cand_skill or cand_skill in v) for v in verified):
                        verified_matches += 1
                    break
        if len(required_skills) > 0:
            score += (matched_skills / len(required_skills)) * 60
        # Verification bonus: up to +10 (added to score, not max_score; final capped at 100).
        score += min(verified_matches * 4, 10)
    else:
        # No required skills specified → baseline.
        score += 40
        max_score += 60

    # Experience — 20%, measured against what the vacancy ASKS FOR when it says.
    max_score += 20
    required_years = _required_years(job)
    if required_years is not None:
        years = _candidate_years(candidate)
        if years >= required_years:
            score += 20
        elif required_years > 0:
            # Partial credit, not a cliff: somebody one year short of a
            # five-year role is a far better nomination than somebody with
            # none, and an operator reviewing the shortlist can see both.
            score += max(0.0, years / required_years) * 20
    else:
        # The vacancy states no requirement — score as this always has, from
        # the candidate's own standing.
        work_experience = candidate.get('work_experience') or []
        if work_experience:
            exp_count = len(work_experience) if isinstance(work_experience, list) else 0
            score += min(exp_count / 5, 1.0) * 20

    # Education — 20%, likewise.
    max_score += 20
    required_edu = _education_rank(job.get('education_level')
                                  or job.get('education_requirements'))
    candidate_edu = _candidate_education_rank(candidate)
    if required_edu:
        if candidate_edu >= required_edu:
            score += 20
        elif candidate_edu:
            # Below the level asked for, but qualified: proportionate, never
            # zero. A diploma against a degree requirement is a real candidate.
            score += (candidate_edu / required_edu) * 20
    else:
        # No level stated — the previous behaviour, unchanged.
        education = candidate.get('education') or []
        if education:
            score += 15
            for edu in (education if isinstance(education, list) else []):
                degree = str(edu.get('degree', '')).lower() if isinstance(edu, dict) else ''
                if 'master' in degree or 'phd' in degree or 'mba' in degree:
                    score += 5
                    break

    if max_score > 0:
        final_score = min((score / max_score) * 100, 100)
    else:
        final_score = 50.0

    return round(final_score, 1)
