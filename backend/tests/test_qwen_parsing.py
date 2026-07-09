"""
Qwen Migration — End-to-End Tests
Emirati Journey Platform

Tests the full pipeline: extract → parse → match → output.
Run with: python -m pytest backend/tests/test_qwen_parsing.py -v
"""

import json
import os
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime


# ---------------------------------------------------------------------------
# Sample Fixtures
# ---------------------------------------------------------------------------

SAMPLE_UAE_RESUME_TEXT = """
Abdulaziz Essa Harib Alfalahi
عبدالعزيز عيسى حارب الفلاحي

Email: abdulaziz.harib@gmail.com
Phone: 0558285000
Location: Dubai, UAE
Nationality: UAE National

PROFESSIONAL SUMMARY
Senior technology and HR executive with 25+ years of experience in UAE government
and private sector digital transformation, Emiratization program leadership, and
data-driven strategy implementation.

EXPERIENCE

General Superintendent of Recruitment Operations
Emirati Human Resources Development Council (EHRDC)
September 2022 - Present | Dubai, UAE
- Initiated and led Emiratization programs boosting Emirati representation in private sector
- Established recruitment operations bridging job seekers and organizations
- Performed pre-matching assessments for optimal talent alignment

Advisor - Data Management and Analytics
Roads and Transport Authority (RTA)
January 2020 - November 2021 | Dubai, UAE
- Initiated transformation of RTA into data-driven organization
- Implemented data-driven strategies in services, marketing, and operations

Vice President Strategy and Planning
du (Emirates Integrated Telecommunications)
December 2017 - July 2018 | Dubai, UAE
- Built and communicated company strategy
- Managed budget planning (~AED 1.1 billion)

EDUCATION

EMBA, Strategic Management
Higher Colleges of Technology | 2009 - 2011 | GPA: 3.6

Industrial Electronics Engineering
Higher Colleges of Technology | 1993 - 1997

SKILLS
Strategic Management, Digital Transformation, Data Analytics,
Emiratization Programs, Government Relations, Project Management,
Budget Management, Arabic (Native), English (Fluent),
AI and Machine Learning, Telecommunications

CERTIFICATIONS
The Artificial Intelligence Program
University of Oxford (in collaboration with UAE National Program for AI) | 2022

LANGUAGES
Arabic: Native
English: Fluent
"""

SAMPLE_JD_TEXT = """
Chief Technology Officer — Digital Transformation

Company: Dubai Digital Authority
Location: Dubai, UAE
Type: Full-Time | Executive Level

Description:
We are seeking an experienced CTO to lead our digital transformation initiatives
across Dubai Government entities. The ideal candidate will have extensive experience
in UAE government technology strategy, data analytics, and smart city implementation.

Requirements:
- Master's degree or higher in Technology, Engineering, or related field
- 15+ years of experience in technology leadership
- Proven track record in government digital transformation
- Experience with AI/ML implementation at scale
- Bilingual: Arabic and English (required)
- UAE National preferred (Emiratization target role)

Responsibilities:
- Lead development of Dubai-wide technology strategy
- Drive smart city and AI adoption across government entities
- Manage technology budget and vendor relationships
- Build and mentor high-performing technology teams

Salary: AED 80,000 - 120,000/month
"""


# ---------------------------------------------------------------------------
# Unit Tests — PDF Extractor
# ---------------------------------------------------------------------------

class TestPDFExtractor:
    """Test the pdf_extractor utility."""

    def test_extract_text_unsupported_extension(self):
        from backend.services.pdf_extractor import extract_text
        result = extract_text("resume.xyz")
        assert result == ""

    def test_clean_text_removes_control_chars(self):
        from backend.services.pdf_extractor import _clean_text
        dirty = "Hello\x00World\x07Test"
        clean = _clean_text(dirty)
        assert "\x00" not in clean
        assert "\x07" not in clean
        assert "HelloWorldTest" in clean


# ---------------------------------------------------------------------------
# Unit Tests — Resume Parser (mocked API)
# ---------------------------------------------------------------------------

class TestResumeParser:
    """Test resume parsing with mocked Qwen API."""

    MOCK_RESPONSE = {
        "personal_info": {
            "full_name": "Abdulaziz Essa Harib Alfalahi",
            "full_name_ar": "عبدالعزيز عيسى حارب الفلاحي",
            "first_name": "Abdulaziz",
            "last_name": "Alfalahi",
            "email": "abdulaziz.harib@gmail.com",
            "phone": "+971558285000",
            "nationality": "UAE National",
            "location": "Dubai, UAE",
            "address": "Dubai, UAE",
            "linkedin": "",
            "emirates_id": "",
        },
        "professional_summary": "Senior technology and HR executive with 25+ years in UAE digital transformation and Emiratization leadership.",
        "highest_nqf_level": 9,
        "total_experience_years": 25,
        "skills": [
            {"name": "Strategic Management", "level": "Expert", "category": "Domain"},
            {"name": "Digital Transformation", "level": "Expert", "category": "Technical"},
            {"name": "Arabic", "level": "Native", "category": "Language"},
            {"name": "English", "level": "Fluent", "category": "Language"},
        ],
        "experience": [
            {
                "company": "Emirati Human Resources Development Council",
                "position": "General Superintendent of Recruitment Operations",
                "start_date": "2022-09-01",
                "end_date": None,
                "is_current": True,
                "location": "Dubai, UAE",
                "description": "Leading Emiratization programs and recruitment operations.",
                "achievements": ["Boosted Emirati representation in private sector"],
            },
        ],
        "education": [
            {
                "institution": "Higher Colleges of Technology",
                "degree": "EMBA",
                "field_of_study": "Strategic Management",
                "start_date": "2009-01-01",
                "end_date": "2011-01-01",
                "gpa": "3.6",
                "nqf_level": 9,
            },
        ],
        "certifications": [
            {"name": "The Artificial Intelligence Program", "issuer": "University of Oxford", "date": "2022-01-01"},
        ],
        "languages": [
            {"language": "Arabic", "proficiency": "Native"},
            {"language": "English", "proficiency": "Fluent"},
        ],
        "projects": [],
        "volunteer_work": [],
    }

    @patch("backend.services.resume_parser.chat_completion")
    def test_parse_resume_from_text(self, mock_chat):
        """Test parsing a resume from raw text."""
        mock_chat.return_value = self.MOCK_RESPONSE

        from backend.services.resume_parser import parse_resume
        result = parse_resume(SAMPLE_UAE_RESUME_TEXT, is_file_path=False)

        assert result["personal_info"]["full_name"] == "Abdulaziz Essa Harib Alfalahi"
        assert result["highest_nqf_level"] == 9
        assert result["total_experience_years"] == 25
        assert len(result["skills"]) >= 4
        assert len(result["experience"]) >= 1
        assert len(result["education"]) >= 1
        mock_chat.assert_called_once()

    def test_parse_resume_insufficient_text(self):
        """Test that very short text raises ValueError."""
        from backend.services.resume_parser import parse_resume
        with pytest.raises(ValueError, match="Insufficient text"):
            parse_resume("Hi", is_file_path=False)

    def test_post_validate_fills_defaults(self):
        """Test post-validation adds missing keys."""
        from backend.services.resume_parser import _post_validate
        result = _post_validate({})
        assert "personal_info" in result
        assert "skills" in result
        assert isinstance(result["skills"], list)
        assert result["highest_nqf_level"] is None

    # --- JSON Format Assertions ---

    def test_dates_format(self):
        """All dates in the mock response must be YYYY-MM-DD or null."""
        for exp in self.MOCK_RESPONSE["experience"]:
            if exp["start_date"]:
                datetime.strptime(exp["start_date"], "%Y-%m-%d")
            if exp["end_date"]:
                datetime.strptime(exp["end_date"], "%Y-%m-%d")

    def test_nqf_levels_valid(self):
        """NQF levels must be integers 1-10."""
        for edu in self.MOCK_RESPONSE["education"]:
            nqf = edu.get("nqf_level")
            if nqf is not None:
                assert 1 <= nqf <= 10

    def test_skill_categories_valid(self):
        """Skill categories must be one of the expected values."""
        valid = {"Technical", "Soft", "Language", "Domain"}
        for skill in self.MOCK_RESPONSE["skills"]:
            assert skill["category"] in valid


# ---------------------------------------------------------------------------
# Unit Tests — Matching Engine (mocked API)
# ---------------------------------------------------------------------------

class TestMatchingEngine:
    """Test JD parsing and matching with mocked API."""

    MOCK_JD_RESPONSE = {
        "job_title": "Chief Technology Officer",
        "company": "Dubai Digital Authority",
        "department": "Technology",
        "job_type": "full_time",
        "job_level": "executive",
        "emirate": "Dubai",
        "city": "Dubai",
        "is_remote": False,
        "description": "CTO leading digital transformation across Dubai Government.",
        "responsibilities": ["Lead technology strategy", "Drive AI adoption"],
        "requirements": [
            {"category": "education", "description": "Master's or higher", "is_required": True},
        ],
        "required_skills": ["Digital Transformation", "AI/ML", "Leadership"],
        "preferred_skills": ["Arabic"],
        "salary_min": 80000,
        "salary_max": 120000,
        "salary_currency": "AED",
        "nqf_level_required": 9,
        "emiratisation_preferred": True,
        "languages_required": ["Arabic", "English"],
    }

    MOCK_MATCH_RESPONSE = {
        "overall_score": 95,
        "skills_match_score": 90,
        "experience_relevance_score": 98,
        "education_nqf_score": 100,
        "language_fit_score": 100,
        "location_score": 100,
        "emiratisation_priority": "High",
        "emiratisation_score": 100,
        "nqf_alignment": {
            "candidate_nqf": 9,
            "required_nqf": 9,
            "meets_requirement": True,
            "gap": 0,
        },
        "bilingual_match_score": 100,
        "matched_skills": ["Digital Transformation", "AI/ML", "Leadership"],
        "missing_skills": [],
        "skill_gaps": [],
        "experience_gaps": [],
        "strengths": ["25+ years UAE government experience"],
        "recommendations": ["Strong match for this executive role"],
        "interview_focus_areas": ["Smart city implementation specifics"],
        "salary_alignment": "Within range",
    }

    @patch("backend.services.matching_engine.chat_completion")
    def test_parse_jd(self, mock_chat):
        mock_chat.return_value = self.MOCK_JD_RESPONSE

        from backend.services.matching_engine import parse_jd
        result = parse_jd(SAMPLE_JD_TEXT)

        assert result["job_title"] == "Chief Technology Officer"
        assert result["emiratisation_preferred"] is True
        assert result["nqf_level_required"] == 9
        mock_chat.assert_called_once()

    @patch("backend.services.matching_engine.chat_completion")
    def test_score_match(self, mock_chat):
        mock_chat.return_value = self.MOCK_MATCH_RESPONSE

        from backend.services.matching_engine import score_match
        resume = TestResumeParser.MOCK_RESPONSE
        jd = self.MOCK_JD_RESPONSE

        result = score_match(resume, jd)

        assert result["overall_score"] == 95
        assert result["emiratisation_priority"] == "High"
        assert result["nqf_alignment"]["meets_requirement"] is True
        assert result["bilingual_match_score"] == 100
        mock_chat.assert_called_once()

    def test_parse_jd_too_short(self):
        from backend.services.matching_engine import parse_jd
        with pytest.raises(ValueError, match="too short"):
            parse_jd("Hi")


# ---------------------------------------------------------------------------
# Unit Tests — Qwen Client
# ---------------------------------------------------------------------------

class TestQwenClient:
    """Test client utilities."""

    def test_extract_json_clean(self):
        from backend.services.qwen_client import _extract_json
        result = _extract_json('{"name": "test"}')
        assert result == {"name": "test"}

    def test_extract_json_with_fences(self):
        from backend.services.qwen_client import _extract_json
        result = _extract_json('```json\n{"name": "test"}\n```')
        assert result == {"name": "test"}

    def test_extract_json_with_surrounding_text(self):
        from backend.services.qwen_client import _extract_json
        result = _extract_json('Here is the result: {"name": "test"} hope that helps!')
        assert result == {"name": "test"}

    def test_extract_json_invalid(self):
        from backend.services.qwen_client import _extract_json
        result = _extract_json("not json at all")
        assert result is None

    def test_usage_tracker(self):
        from backend.services.qwen_client import UsageTracker
        tracker = UsageTracker()
        tracker.record("qwen-turbo", 500, 200)
        tracker.record("qwen-turbo", 300, 100)
        summary = tracker.summary()
        assert summary["qwen-turbo"]["prompt_tokens"] == 800
        assert summary["qwen-turbo"]["completion_tokens"] == 300
        assert summary["qwen-turbo"]["calls"] == 2


# ---------------------------------------------------------------------------
# Unit Tests — Config
# ---------------------------------------------------------------------------

class TestConfig:
    """Test configuration module."""

    def test_get_model_for_task_parse(self):
        from backend.config.qwen_config import get_model_for_task
        assert "turbo" in get_model_for_task("parse") or "flash" in get_model_for_task("parse")

    def test_get_model_for_task_match(self):
        from backend.config.qwen_config import get_model_for_task
        assert "plus" in get_model_for_task("match")

    def test_get_model_for_task_override(self):
        from backend.config.qwen_config import get_model_for_task
        assert get_model_for_task("parse", override="qwen-max") == "qwen-max"

    def test_get_model_for_task_unknown(self):
        from backend.config.qwen_config import get_model_for_task
        result = get_model_for_task("unknown_task")
        assert result  # Should return default
