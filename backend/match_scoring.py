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


def calculate_match_score(candidate: dict, job: dict) -> float:
    """Weighted match percentage (0–100) for a candidate against a job.

    Components (unchanged from the original recruiter algorithm):
      • Skills overlap — 60% of the total. Fraction of the job's required skills
        that the candidate holds. + a capped assessment-verification bonus
        (+4 per verified required skill, max +10) so passing an assessment
        demonstrably improves the match. Strictly additive.
      • Experience — 20%. Scales with the number of work-experience entries
        (saturates at 5).
      • Education — 20%. +15 for having any education, +5 for an advanced degree
        (master/PhD/MBA).

    `candidate` keys used: technical_skills, soft_skills, work_experience,
    education, and user_id (or candidate_id) for verified-skill lookup.
    `job` key used: required_skills.
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

    # Experience — 20%
    max_score += 20
    work_experience = candidate.get('work_experience') or []
    if work_experience:
        exp_count = len(work_experience) if isinstance(work_experience, list) else 0
        score += min(exp_count / 5, 1.0) * 20

    # Education — 20%
    max_score += 20
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
