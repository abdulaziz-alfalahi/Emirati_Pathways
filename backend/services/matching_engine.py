"""
Matching Engine — Qwen-Powered JD Parsing & Candidate Scoring
Emirati Journey Platform — Qwen Migration

Uses qwen-plus (balanced model) for semantic matching, gap analysis,
Emiratization priority scoring, and NQF alignment checks.
"""

import logging
from typing import Any, Dict, List, Optional

from backend.config.qwen_config import MAX_INPUT_CHARS
from backend.services.qwen_client import chat_completion, QwenParsingError

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# JD Parsing
# ═══════════════════════════════════════════════════════════════════════════

def parse_jd(
    jd_text: str,
    *,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Parse a job description into structured JSON.

    Args:
        jd_text: Raw text of the job description.
        model: Override model (defaults to routing for "parse").

    Returns:
        Structured JD dict.
    """
    if not jd_text or len(jd_text.strip()) < 30:
        raise ValueError("Job description text is too short to parse.")

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert Job Description Parser for the UAE job market. "
                "Return ONLY raw, valid JSON. No markdown, no code fences, "
                "no explanatory text. Field keys in English."
            ),
        },
        {
            "role": "user",
            "content": _create_jd_prompt(jd_text),
        },
    ]

    parsed = chat_completion(
        task_type="parse",
        messages=messages,
        model_override=model,
        response_format={"type": "json_object"},
    )

    # Ensure defaults
    for key in ("requirements", "responsibilities", "benefits",
                "required_skills", "preferred_skills"):
        if key not in parsed:
            parsed[key] = []

    logger.info(
        f"✅ JD parsed: {parsed.get('job_title', 'N/A')} "
        f"at {parsed.get('company', 'N/A')}"
    )
    return parsed


def _create_jd_prompt(text: str) -> str:
    return f"""Extract structured JSON from this job description.

═══════════════════════════════════════════
EXTRACTION RULES
═══════════════════════════════════════════
- Extract all fields present. Use null or "" for missing data.
- Dates in "YYYY-MM-DD" format or null.
- Normalize UAE phone numbers to +971 format.
- The JD may be in English, Arabic, or bilingual. Keep values in their source language.

═══════════════════════════════════════════
JD TEXT
═══════════════════════════════════════════
{text[:MAX_INPUT_CHARS]}

═══════════════════════════════════════════
OUTPUT (return ONLY valid JSON)
═══════════════════════════════════════════
{{
    "job_title": "",
    "job_title_ar": "",
    "company": "",
    "department": "",
    "job_type": "full_time",
    "job_level": "mid",
    "emirate": "",
    "city": "",
    "is_remote": false,
    "description": "",
    "responsibilities": [],
    "requirements": [
        {{ "category": "education|experience|skills|certification|language",
           "description": "", "is_required": true }}
    ],
    "required_skills": [],
    "preferred_skills": [],
    "benefits": [
        {{ "category": "compensation|health|time_off|development|perks",
           "description": "" }}
    ],
    "salary_min": null,
    "salary_max": null,
    "salary_currency": "AED",
    "experience_years_min": null,
    "experience_years_max": null,
    "education_level_required": "",
    "nqf_level_required": null,
    "emiratisation_preferred": false,
    "languages_required": [],
    "posted_date": null,
    "closing_date": null
}}"""


# ═══════════════════════════════════════════════════════════════════════════
# Candidate-JD Matching & Scoring
# ═══════════════════════════════════════════════════════════════════════════

def score_match(
    resume_json: Dict[str, Any],
    jd_json: Dict[str, Any],
    *,
    model: Optional[str] = None,
    employer_emiratisation_weight: float = 1.0,
) -> Dict[str, Any]:
    """Score how well a candidate matches a job description.

    Uses qwen-plus for high-accuracy semantic reasoning.

    Args:
        resume_json: Structured resume JSON (from parse_resume).
        jd_json: Structured JD JSON (from parse_jd).
        model: Override model (defaults to routing for "match").
        employer_emiratisation_weight: Multiplier (0.5–2.0) for
            Emiratization priority. Higher = more weight.

    Returns:
        Matching result dict with scores, gap analysis, and recommendations.
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert UAE recruitment matching engine. "
                "Compare the candidate profile to the job description. "
                "Return ONLY raw, valid JSON with scoring and analysis. "
                "No markdown, no code fences."
            ),
        },
        {
            "role": "user",
            "content": _create_matching_prompt(
                resume_json, jd_json, employer_emiratisation_weight
            ),
        },
    ]

    result = chat_completion(
        task_type="match",
        messages=messages,
        model_override=model,
        response_format={"type": "json_object"},
    )

    # Inject metadata
    result["candidate_name"] = resume_json.get("personal_info", {}).get("full_name", "")
    result["job_title"] = jd_json.get("job_title", "")
    result["company"] = jd_json.get("company", "")

    logger.info(
        f"✅ Match scored: {result.get('candidate_name', '?')} → "
        f"{result.get('job_title', '?')} = {result.get('overall_score', '?')}%"
    )
    return result


def _create_matching_prompt(
    resume: Dict, jd: Dict, emir_weight: float
) -> str:
    """Build the scoring prompt sent to qwen-plus."""
    import json as _json
    try:
        from backend.services.prompt_safety import INJECTION_GUARD, wrap_untrusted, minimise_pii
    except ImportError:  # pragma: no cover
        from services.prompt_safety import INJECTION_GUARD, wrap_untrusted, minimise_pii

    # Strip direct-contact/identifier PII (email, phone, DOB, EID, address) before sending to
    # the external LLM — matching doesn't need it (audit AI-03) — and delimit the untrusted
    # resume/JD so embedded instructions can't hijack the score (audit AI-02).
    resume_str = wrap_untrusted("CANDIDATE PROFILE", _json.dumps(minimise_pii(resume), ensure_ascii=False, default=str)[:8000])
    jd_str = wrap_untrusted("JOB DESCRIPTION", _json.dumps(minimise_pii(jd), ensure_ascii=False, default=str)[:8000])

    return f"""{INJECTION_GUARD}

Score this candidate against the job description.

═══════════════════════════════════════════
SCORING CRITERIA (total = 100%)
═══════════════════════════════════════════
1. **Skills Match (30%)**: % of required skills the candidate has.
2. **Experience Relevance (25%)**: Role similarity, industry overlap, seniority fit.
3. **Education & NQF Alignment (15%)**: Does education level meet/exceed JD requirements?
   - Compare candidate's highest_nqf_level to jd's nqf_level_required.
4. **Language Fit (10%)**: Arabic/English proficiency match.
5. **Location & Logistics (10%)**: Emirate match, remote eligibility.
6. **Emiratisation Priority (10% × weight={emir_weight})**: Is the candidate a UAE national?
   - "High" if UAE national AND emiratisation_preferred is true.
   - "Medium" if one condition met.
   - "Low" if neither.

═══════════════════════════════════════════
CANDIDATE PROFILE
═══════════════════════════════════════════
{resume_str}

═══════════════════════════════════════════
JOB DESCRIPTION
═══════════════════════════════════════════
{jd_str}

═══════════════════════════════════════════
OUTPUT (return ONLY valid JSON)
═══════════════════════════════════════════
{{
    "overall_score": 0,
    "skills_match_score": 0,
    "experience_relevance_score": 0,
    "education_nqf_score": 0,
    "language_fit_score": 0,
    "location_score": 0,
    "emiratisation_priority": "High|Medium|Low",
    "emiratisation_score": 0,
    "nqf_alignment": {{
        "candidate_nqf": null,
        "required_nqf": null,
        "meets_requirement": false,
        "gap": 0
    }},
    "bilingual_match_score": 0,
    "matched_skills": [],
    "missing_skills": [],
    "skill_gaps": [
        {{ "skill": "", "importance": "required|preferred", "candidate_level": "", "required_level": "" }}
    ],
    "experience_gaps": [],
    "strengths": [],
    "recommendations": [],
    "interview_focus_areas": [],
    "salary_alignment": ""
}}"""


# ═══════════════════════════════════════════════════════════════════════════
# Batch Matching Helper
# ═══════════════════════════════════════════════════════════════════════════

def batch_match(
    resumes: List[Dict[str, Any]],
    jd_json: Dict[str, Any],
    *,
    model: Optional[str] = None,
    top_n: int = 10,
) -> List[Dict[str, Any]]:
    """Score multiple candidates against a single JD and rank them.

    Args:
        resumes: List of parsed resume JSONs.
        jd_json: Parsed JD JSON.
        model: Override model.
        top_n: Return only the top N matches.

    Returns:
        List of match results sorted by overall_score descending.
    """
    results = []
    for i, resume in enumerate(resumes):
        try:
            result = score_match(resume, jd_json, model=model)
            results.append(result)
        except (QwenParsingError, Exception) as e:
            name = resume.get("personal_info", {}).get("full_name", f"Candidate {i+1}")
            logger.warning(f"⚠️ Matching failed for {name}: {e}")
            results.append({
                "candidate_name": name,
                "overall_score": 0,
                "error": str(e),
            })

    results.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    return results[:top_n]
