"""
Resume Parser — Qwen-Powered CV Extraction
Emirati Journey Platform — Qwen Migration

Parses CV/resume files or raw text into structured JSON using Qwen
via the DashScope OpenAI-compatible API. Includes UAE NQF mapping,
bilingual Arabic/English support, and Emirates-specific fields.
"""

import logging
import os
from typing import Any, Dict, Optional

from backend.config.qwen_config import MAX_INPUT_CHARS
from backend.services.qwen_client import chat_completion, QwenParsingError
from backend.services.pdf_extractor import extract_text, extract_text_from_stream

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_resume(
    source: str,
    *,
    model: Optional[str] = None,
    is_file_path: bool = True,
) -> Dict[str, Any]:
    """Parse a resume into structured JSON.

    Args:
        source: Either a file path (PDF/DOCX/TXT) or raw text.
        model: Override default model (defaults to routing for "parse").
        is_file_path: If True, treats `source` as a file path and extracts
                      text first. If False, treats it as raw CV text.

    Returns:
        Validated dict matching the resume JSON schema.

    Raises:
        QwenParsingError: If the response cannot be parsed after retries.
        ValueError: If no text could be extracted.
    """
    # 1. Extract text
    if is_file_path:
        if not os.path.exists(source):
            raise FileNotFoundError(f"Resume file not found: {source}")
        text = extract_text(source)
    else:
        text = source

    if not text or len(text.strip()) < 50:
        raise ValueError(
            f"Insufficient text extracted from resume ({len(text)} chars). "
            "File may be image-based or corrupt."
        )

    # 2. Build messages
    messages = _build_parsing_messages(text)

    # 3. Call Qwen
    parsed = chat_completion(
        task_type="parse",
        messages=messages,
        model_override=model,
        response_format={"type": "json_object"},
    )

    # 4. Post-validate
    parsed = _post_validate(parsed)

    logger.info(
        f"✅ Resume parsed: {parsed.get('personal_info', {}).get('full_name', 'N/A')} "
        f"| NQF={parsed.get('highest_nqf_level', '?')} "
        f"| Skills={len(parsed.get('skills', []))}"
    )
    return parsed


def parse_resume_from_stream(
    file_stream,
    filename: str = "resume.pdf",
    *,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Parse a resume from an in-memory file stream (e.g. Flask upload).

    Args:
        file_stream: File-like object.
        filename: Original filename for type detection.
        model: Override default model.

    Returns:
        Validated resume JSON dict.
    """
    text = extract_text_from_stream(file_stream, filename)
    if not text or len(text.strip()) < 50:
        raise ValueError("Insufficient text extracted from uploaded file.")
    return parse_resume(text, model=model, is_file_path=False)


# ---------------------------------------------------------------------------
# Prompt Builder
# ---------------------------------------------------------------------------

def _build_parsing_messages(text: str) -> list:
    """Construct the system + user messages for resume parsing."""
    system_prompt = (
        "You are an expert AI Resume Parser built for the UAE job market "
        "and Emirati workforce. You MUST return ONLY raw, valid JSON. "
        "No markdown, no code fences, no explanatory text. "
        "Field keys MUST be in English. Values can be in Arabic or English "
        "per the source CV."
    )

    user_prompt = _create_parsing_prompt(text)

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def _create_parsing_prompt(text: str) -> str:
    """Full parsing prompt — used verbatim for both qwen-turbo and qwen-plus."""
    return f"""Extract structured JSON from this CV/resume. Follow every rule precisely.

═══════════════════════════════════════════
LANGUAGE & ENCODING
═══════════════════════════════════════════
- The CV may be in English, Arabic, or bilingual. Extract ALL content regardless of language.
- For Arabic names, transliterate to Latin script in `full_name` AND keep the original in `full_name_ar`.
- If the CV is entirely in Arabic, still return field keys in English with Arabic values.
- For skills/languages: keep original terms unless CV explicitly transliterates.

═══════════════════════════════════════════
EXTRACTION RULES
═══════════════════════════════════════════
0. **Uncertainty Principle**: If information is ambiguous, missing, or unclear:
   - Use null for dates/numbers, empty string "" for text fields.
   - Do NOT guess, infer, or fabricate data.

1. **Name**: Almost always the very first line. Extract `full_name` strictly. Split into `first_name` and `last_name`.

2. **Dates**: MUST be "YYYY-MM-DD" or null.
   - Currently working → `end_date`: null, `is_current`: true. NEVER use "Present" or "Current".
   - Day unknown → use "01". Month unknown → use "01". (e.g., "2022" → "2022-01-01")
   - Durations like "5 years" → do NOT guess dates. Leave as null and note in description.

3. **Summary**: Maximum 2 sentences, 30 words. Be extremely concise.

4. **Skills**: Extract ALL technical and soft skills. Categorize each as "Technical", "Soft", "Language", or "Domain".
   - For Technical/Soft/Domain skills: proficiency = "Beginner" | "Intermediate" | "Advanced" | "Expert"
   - For Language skills ONLY: proficiency = "Native" | "Fluent" | "Professional" | "Basic"

5. **Experience**: Extract company, position, dates, location, and a description of responsibilities.
   - Also extract key `achievements` as a separate array of strings per role.

6. **Education**: Extract institution, degree, field_of_study, dates, and GPA if mentioned.

7. **Phone**: UAE numbers use formats like +971-50-XXX-XXXX or 05XXXXXXXX. Normalize to include country code.

8. **Projects**: Extract any personal, academic, or professional projects mentioned.

9. **Certifications**: Include issuer and date obtained if available.

═══════════════════════════════════════════
UAE NATIONAL QUALIFICATIONS FRAMEWORK (NQF)
═══════════════════════════════════════════
Map each education entry to the UAE NQF level:
- Level 1: Certificate — basic vocational
- Level 2: Certificate — skilled vocational
- Level 3: Certificate — advanced vocational / High School Diploma
- Level 4: Certificate — post-secondary vocational
- Level 5: Diploma / Associate Degree
- Level 6: Advanced Diploma / Higher Diploma
- Level 7: Bachelor's Degree
- Level 8: Postgraduate Diploma / Bachelor's Honours
- Level 9: Master's Degree / MBA / EMBA
- Level 10: Doctoral Degree (PhD / DBA)

Set `nqf_level` as an integer (1-10) on each education entry. If unclear, estimate from the degree name.
Also set `highest_nqf_level` at the top level as the maximum across all education entries.

═══════════════════════════════════════════
CV TEXT
═══════════════════════════════════════════
{text[:MAX_INPUT_CHARS]}

═══════════════════════════════════════════
OUTPUT (return ONLY valid JSON)
═══════════════════════════════════════════
{{
    "personal_info": {{
        "full_name": "",
        "full_name_ar": "",
        "first_name": "",
        "last_name": "",
        "email": "",
        "phone": "",
        "nationality": "",
        "location": "",
        "address": "",
        "linkedin": ""
    }},
    "professional_summary": "",
    "highest_nqf_level": null,
    "total_experience_years": null,
    "skills": [
        {{ "name": "", "level": "", "category": "" }}
    ],
    "experience": [
        {{
            "company": "",
            "position": "",
            "start_date": null,
            "end_date": null,
            "is_current": false,
            "location": "",
            "description": "",
            "achievements": []
        }}
    ],
    "education": [
        {{
            "institution": "",
            "degree": "",
            "field_of_study": "",
            "start_date": null,
            "end_date": null,
            "gpa": "",
            "nqf_level": null
        }}
    ],
    "certifications": [
        {{ "name": "", "issuer": "", "date": null }}
    ],
    "languages": [
        {{ "language": "", "proficiency": "" }}
    ],
    "projects": [
        {{ "name": "", "description": "", "technologies": [] }}
    ],
    "volunteer_work": []
}}"""


# ---------------------------------------------------------------------------
# Post-Validation
# ---------------------------------------------------------------------------

_REQUIRED_KEYS = {
    "personal_info", "skills", "experience", "education",
    "certifications", "languages",
}


def _post_validate(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure all required top-level keys exist and apply defaults."""
    for key in _REQUIRED_KEYS:
        if key not in data:
            data[key] = {} if key == "personal_info" else []

    # Ensure personal_info has required sub-keys
    pi = data.get("personal_info", {})
    for field in ("full_name", "email", "phone", "location"):
        if field not in pi:
            pi[field] = ""
    data["personal_info"] = pi

    # Default NQF
    if "highest_nqf_level" not in data:
        nqf_levels = [
            ed.get("nqf_level") for ed in data.get("education", [])
            if ed.get("nqf_level")
        ]
        data["highest_nqf_level"] = max(nqf_levels) if nqf_levels else None

    # Default total experience
    if "total_experience_years" not in data:
        data["total_experience_years"] = None

    # Ensure arrays
    for key in ("skills", "experience", "education", "certifications",
                "languages", "projects", "volunteer_work"):
        if not isinstance(data.get(key), list):
            data[key] = []

    return data
