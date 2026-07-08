#!/usr/bin/env python3
"""
Job Description Builder Engine
Emirati Journey Platform - JD Builder with Wizard UX

Provides wizard-based job description creation with completion scoring,
AI assistance, and UAE-specific features.
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import os

# Load environment variables
# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Qwen / DashScope client (replaces google.generativeai)
try:
    from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
    from backend.config.qwen_config import DASHSCOPE_API_KEY
    _qwen_available = bool(DASHSCOPE_API_KEY)
except ImportError:
    _qwen_available = False
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class JDBasicInfo:
    """Basic job description information"""
    title: str
    title_arabic: Optional[str] = None
    department: str = ""
    job_type: str = "full_time"
    job_level: str = "mid"
    emirate: str = ""
    city: str = ""
    remote_option: bool = False
    reports_to: str = ""
    team_size: Optional[int] = None


@dataclass
class JDRequirement:
    """Job requirement entry"""
    requirement_id: str
    category: str  # education, experience, skills, certification, language
    description: str
    is_required: bool = True
    priority: int = 1


@dataclass
class JDResponsibility:
    """Job responsibility entry"""
    responsibility_id: str
    description: str
    category: str = "core"  # core, additional, occasional
    priority: int = 1


@dataclass
class JDBenefit:
    """Job benefit entry"""
    benefit_id: str
    category: str  # compensation, health, time_off, development, perks
    description: str
    description_arabic: Optional[str] = None


class JDBuilderEngine:
    """Job Description Builder Engine with wizard functionality"""
    
    def __init__(self):
        """Initialize JD Builder Engine"""
        self.logger = logging.getLogger(__name__)
        self.logger.info("JDBuilderEngine initialized")
        
        # Initialize Gemini
        pass  # Qwen client is module-level
        if _qwen_available:
            try:
                api_key = DASHSCOPE_API_KEY
                if api_key:
                    # AI model initialized via qwen_client (lazy-loaded)
                    self.logger.info("Qwen AI initialized for JD generation")
                else:
                    self.logger.warning("DASHSCOPE_API_KEY not found in environment")
            except Exception as e:
                self.logger.error(f"Failed to initialize Qwen AI: {e}")
    
    def create_jd(
        self,
        recruiter_id: str,
        company_id: str,
        template: str = "standard"
    ) -> Dict[str, Any]:
        """Create a new job description"""
        try:
            jd_id = f"jd_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
            
            jd_data = {
                'metadata': {
                    'jd_id': jd_id,
                    'recruiter_id': recruiter_id,
                    'company_id': company_id,
                    'template': template,
                    'version': 1,
                    'status': 'draft',
                    'completion_score': 0,
                    'created_at': datetime.now().isoformat(),
                    'last_modified': datetime.now().isoformat(),
                    'is_active': True,
                    'current_step': 'basic_info'
                },
                'basic_info': {},
                'description': '',
                'description_arabic': '',
                'requirements': [],
                'responsibilities': [],
                'benefits': [],
                'compensation': {
                    'salary_min': None,
                    'salary_max': None,
                    'salary_currency': 'AED',
                    'salary_period': 'monthly',
                    'additional_compensation': []
                },
                'application_process': {
                    'application_deadline': None,
                    'expected_start_date': None,
                    'visa_sponsorship': False,
                    'relocation_assistance': False,
                    'contact_email': '',
                    'contact_phone': ''
                }
            }
            
            self.logger.info(f"Created JD: {jd_id}")
            return jd_data
            
        except Exception as e:
            self.logger.error(f"Error creating JD: {str(e)}")
            raise
    
    def update_basic_info(
        self,
        jd_data: Dict[str, Any],
        basic_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update basic information section"""
        try:
            jd_data['basic_info'].update(basic_info)
            jd_data['metadata']['last_modified'] = datetime.now().isoformat()
            jd_data['metadata']['completion_score'] = self._calculate_completion_score(jd_data)
            jd_data['metadata']['current_step'] = 'description'
            
            self.logger.info(f"Updated basic info for JD {jd_data['metadata']['jd_id']}")
            return jd_data
            
        except Exception as e:
            self.logger.error(f"Error updating basic info: {str(e)}")
            raise
    
    def update_description(
        self,
        jd_data: Dict[str, Any],
        description: str,
        description_arabic: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update job description"""
        try:
            jd_data['description'] = description
            if description_arabic:
                jd_data['description_arabic'] = description_arabic
            
            jd_data['metadata']['last_modified'] = datetime.now().isoformat()
            jd_data['metadata']['completion_score'] = self._calculate_completion_score(jd_data)
            jd_data['metadata']['current_step'] = 'requirements'
            
            self.logger.info(f"Updated description for JD {jd_data['metadata']['jd_id']}")
            return jd_data
            
        except Exception as e:
            self.logger.error(f"Error updating description: {str(e)}")
            raise
    
    def add_requirement(
        self,
        jd_data: Dict[str, Any],
        requirement: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add a job requirement"""
        try:
            requirement_id = f"req_{uuid.uuid4().hex[:8]}"
            requirement['requirement_id'] = requirement_id
            
            jd_data['requirements'].append(requirement)
            jd_data['metadata']['last_modified'] = datetime.now().isoformat()
            jd_data['metadata']['completion_score'] = self._calculate_completion_score(jd_data)
            
            self.logger.info(f"Added requirement to JD {jd_data['metadata']['jd_id']}")
            return jd_data
            
        except Exception as e:
            self.logger.error(f"Error adding requirement: {str(e)}")
            raise
    
    def add_responsibility(
        self,
        jd_data: Dict[str, Any],
        responsibility: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add a job responsibility"""
        try:
            responsibility_id = f"resp_{uuid.uuid4().hex[:8]}"
            responsibility['responsibility_id'] = responsibility_id
            
            jd_data['responsibilities'].append(responsibility)
            jd_data['metadata']['last_modified'] = datetime.now().isoformat()
            jd_data['metadata']['completion_score'] = self._calculate_completion_score(jd_data)
            jd_data['metadata']['current_step'] = 'responsibilities'
            
            self.logger.info(f"Added responsibility to JD {jd_data['metadata']['jd_id']}")
            return jd_data
            
        except Exception as e:
            self.logger.error(f"Error adding responsibility: {str(e)}")
            raise
    
    def add_benefit(
        self,
        jd_data: Dict[str, Any],
        benefit: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Add a job benefit"""
        try:
            benefit_id = f"ben_{uuid.uuid4().hex[:8]}"
            benefit['benefit_id'] = benefit_id
            
            jd_data['benefits'].append(benefit)
            jd_data['metadata']['last_modified'] = datetime.now().isoformat()
            jd_data['metadata']['completion_score'] = self._calculate_completion_score(jd_data)
            jd_data['metadata']['current_step'] = 'benefits'
            
            self.logger.info(f"Added benefit to JD {jd_data['metadata']['jd_id']}")
            return jd_data
            
        except Exception as e:
            self.logger.error(f"Error adding benefit: {str(e)}")
            raise
    
    def update_compensation(
        self,
        jd_data: Dict[str, Any],
        compensation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update compensation information"""
        try:
            jd_data['compensation'].update(compensation)
            jd_data['metadata']['last_modified'] = datetime.now().isoformat()
            jd_data['metadata']['completion_score'] = self._calculate_completion_score(jd_data)
            jd_data['metadata']['current_step'] = 'compensation'
            
            self.logger.info(f"Updated compensation for JD {jd_data['metadata']['jd_id']}")
            return jd_data
            
        except Exception as e:
            self.logger.error(f"Error updating compensation: {str(e)}")
            raise
    
    def generate_description_ai(
        self,
        jd_data: Dict[str, Any],
        industry: Optional[str] = None
    ) -> str:
        """Generate AI-powered job description using Gemini"""
        try:
            from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
            
            api_key = DASHSCOPE_API_KEY
            if not api_key:
                self.logger.warning("DASHSCOPE_API_KEY not found, using placeholder")
                return self._generate_placeholder_description(jd_data)
            # Model initialized via qwen_client (lazy-loaded)
            
            basic_info = jd_data.get('basic_info', {})
            title = basic_info.get('title', 'Position')
            department = basic_info.get('department', 'Department')
            level = basic_info.get('job_level', 'mid')
            location = f"{basic_info.get('city', '')}, {basic_info.get('emirate', 'UAE')}"
            
            prompt = f"""
            Write a professional job description for the following position in the UAE:
            
            Title: {title}
            Department: {department}
            Level: {level}
            Location: {location}
            Industry: {industry or 'General'}
            
            Requirements provided so far:
            {json.dumps(jd_data.get('requirements', []), indent=2)}
            
            Responsibilities provided so far:
            {json.dumps(jd_data.get('responsibilities', []), indent=2)}
            
            Please write a compelling 3-4 paragraph introduction and role overview.
            Focus on the opportunity, company culture (professional, innovative), and impact of the role.
            Keep it under 400 words. Use professional business English suitable for the UAE market.
            
            Your response must be a JSON object with a single key "description" containing the generated job description text. Example:
            {{
                "description": "We are seeking a talented..."
            }}
            """
            
            messages = [
                {"role": "system", "content": "You are an expert AI assistant for the UAE job market. Return ONLY raw, valid JSON matching the requested schema. No markdown, no code fences."},
                {"role": "user", "content": prompt},
            ]

            response = chat_completion(task_type="generate", messages=messages, response_format={"type": "json_object"})
            
            if response and isinstance(response, dict):
                self.logger.info(f"Generated AI description for JD {jd_data['metadata']['jd_id']}")
                desc = response.get('description') or response.get('job_description') or response.get('text')
                if not desc:
                    for val in response.values():
                        if isinstance(val, str):
                            desc = val
                            break
                return desc or self._generate_placeholder_description(jd_data)
            else:
                return self._generate_placeholder_description(jd_data)
            
        except Exception as e:
            self.logger.error(f"Error generating AI description: {str(e)}")
            return self._generate_placeholder_description(jd_data)

    def generate_full_jd_ai(self, title, department=None, level="mid", industry=None, emirate="UAE"):
        """AI-generate a full JD (description + requirements + responsibilities + benefits) from a job title."""
        try:
            from backend.services.qwen_client import chat_completion
            from backend.config.qwen_config import DASHSCOPE_API_KEY as _KEY
            if not _KEY:
                self.logger.warning("DASHSCOPE_API_KEY not set; smart-fill AI unavailable")
                return None
            prompt = (
                "You are writing a job description for the UAE job market.\n"
                "Generate a complete, professional job description for this role:\n"
                f"- Job Title: {title}\n"
                f"- Department: {department or 'N/A'}\n"
                f"- Level: {level}\n"
                f"- Industry: {industry or 'General'}\n"
                f"- Location: {emirate}, UAE\n\n"
                "Return ONLY a valid JSON object with EXACTLY this schema:\n"
                "{\n"
                '  "description": "3-4 paragraph role overview, under 350 words, professional UAE business English",\n'
                '  "requirements": [{"category": "skills|experience|education|certification", "description": "short", "is_required": true}],\n'
                '  "responsibilities": [{"category": "core", "description": "short"}],\n'
                '  "benefits": [{"category": "compensation|health|time_off|perks", "description": "short"}]\n'
                "}\n"
                f"Provide 6-8 requirements (mix of required and preferred), 5-7 responsibilities, and 4-6 benefits, all specific and realistic for a {title}."
            )
            messages = [
                {"role": "system", "content": "You are an expert HR job-description writer for the UAE market. Return ONLY raw, valid JSON matching the requested schema. No markdown, no code fences."},
                {"role": "user", "content": prompt},
            ]
            response = chat_completion(task_type="generate", messages=messages, response_format={"type": "json_object"})
            if response and isinstance(response, dict):
                return self._normalize_full_jd(response)
            return None
        except Exception as e:
            self.logger.error(f"generate_full_jd_ai error: {e}")
            return None

    def _normalize_full_jd(self, r):
        """Coerce an AI response into the exact shape the JD wizard expects."""
        def reqs(items):
            out = []
            for it in (items or []):
                if isinstance(it, dict):
                    d = str(it.get('description') or it.get('text') or '').strip()
                    if not d:
                        continue
                    cat = str(it.get('category') or 'skills').strip().lower()
                    if cat not in ('skills', 'experience', 'education', 'certification'):
                        cat = 'skills'
                    out.append({'category': cat, 'description': d, 'is_required': bool(it.get('is_required', True))})
                elif isinstance(it, str) and it.strip():
                    out.append({'category': 'skills', 'description': it.strip(), 'is_required': True})
            return out
        def lst(items, valid, default):
            out = []
            for it in (items or []):
                if isinstance(it, dict):
                    d = str(it.get('description') or it.get('text') or '').strip()
                    if not d:
                        continue
                    cat = str(it.get('category') or default).strip().lower()
                    if cat not in valid:
                        cat = default
                    out.append({'category': cat, 'description': d})
                elif isinstance(it, str) and it.strip():
                    out.append({'category': default, 'description': it.strip()})
            return out
        desc = r.get('description') or r.get('job_description') or r.get('overview') or ''
        if not isinstance(desc, str):
            desc = str(desc)
        return {
            'description': desc.strip(),
            'requirements': reqs(r.get('requirements')),
            'responsibilities': lst(r.get('responsibilities'), {'core', 'preferred', 'nice_to_have'}, 'core'),
            'benefits': lst(r.get('benefits'), {'compensation', 'health', 'time_off', 'perks'}, 'perks'),
        }

    def _generate_placeholder_description(self, jd_data: Dict[str, Any]) -> str:
        """Fallback placeholder description"""
        basic_info = jd_data.get('basic_info', {})
        title = basic_info.get('title', 'Position')
        department = basic_info.get('department', 'Department')
        location = f"{basic_info.get('city', '')}, {basic_info.get('emirate', 'UAE')}"
        
        return f"""We are seeking a talented {title} to join our {department} team. 

This role offers an exciting opportunity to contribute to our organization's growth and success in the UAE market. The ideal candidate will bring expertise, dedication, and a passion for excellence.

Key aspects of this role include working in a dynamic environment, collaborating with talented professionals, and making a meaningful impact on our operations.

This position is based in {location} and offers competitive compensation, professional development opportunities, and a supportive work culture."""
    
    def _calculate_completion_score(self, jd_data: Dict[str, Any]) -> int:
        """Calculate JD completion score (0-100)"""
        try:
            score = 0
            
            # Basic info (25 points)
            basic_info = jd_data.get('basic_info', {})
            if basic_info.get('title'):
                score += 8
            if basic_info.get('department'):
                score += 5
            if basic_info.get('job_type'):
                score += 4
            if basic_info.get('emirate') and basic_info.get('city'):
                score += 8
            
            # Description (20 points)
            description = jd_data.get('description', '')
            if description and len(description) >= 200:
                score += 20
            elif description and len(description) >= 100:
                score += 10
            elif description:
                score += 5
            
            # Requirements (20 points)
            requirements = jd_data.get('requirements', [])
            if len(requirements) >= 5:
                score += 20
            elif len(requirements) >= 3:
                score += 15
            elif len(requirements) >= 1:
                score += 10
            
            # Responsibilities (20 points)
            responsibilities = jd_data.get('responsibilities', [])
            if len(responsibilities) >= 5:
                score += 20
            elif len(responsibilities) >= 3:
                score += 15
            elif len(responsibilities) >= 1:
                score += 10
            
            # Compensation (10 points)
            compensation = jd_data.get('compensation', {})
            if compensation.get('salary_min') and compensation.get('salary_max'):
                score += 10
            elif compensation.get('salary_min') or compensation.get('salary_max'):
                score += 5
            
            # Benefits (5 points)
            benefits = jd_data.get('benefits', [])
            if len(benefits) >= 3:
                score += 5
            elif len(benefits) >= 1:
                score += 3
            
            return min(score, 100)
            
        except Exception as e:
            self.logger.error(f"Error calculating completion score: {str(e)}")
            return 0
    
    def get_completion_recommendations(self, jd_data: Dict[str, Any]) -> List[str]:
        """Get recommendations for completing JD"""
        recommendations = []
        
        basic_info = jd_data.get('basic_info', {})
        if not basic_info.get('title'):
            recommendations.append("Add job title")
        if not basic_info.get('emirate') or not basic_info.get('city'):
            recommendations.append("Add job location")
        
        description = jd_data.get('description', '')
        if not description:
            recommendations.append("Add job description")
        elif len(description) < 200:
            recommendations.append("Expand job description (recommended: 200+ characters)")
        
        requirements = jd_data.get('requirements', [])
        if len(requirements) < 3:
            recommendations.append(f"Add more requirements (current: {len(requirements)}, recommended: 5+)")
        
        responsibilities = jd_data.get('responsibilities', [])
        if len(responsibilities) < 3:
            recommendations.append(f"Add more responsibilities (current: {len(responsibilities)}, recommended: 5+)")
        
        compensation = jd_data.get('compensation', {})
        if not compensation.get('salary_min') or not compensation.get('salary_max'):
            recommendations.append("Add salary range")
        
        benefits = jd_data.get('benefits', [])
        if len(benefits) < 3:
            recommendations.append("Add employee benefits")
        
        return recommendations
    
    def validate_jd(self, jd_data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """Validate JD before publishing"""
        errors = []
        
        basic_info = jd_data.get('basic_info', {})
        if not basic_info.get('title'):
            errors.append("Job title is required")
        if not basic_info.get('emirate'):
            errors.append("Job location (emirate) is required")
        
        if not jd_data.get('description'):
            errors.append("Job description is required")
        
        if not jd_data.get('requirements') or len(jd_data.get('requirements', [])) == 0:
            errors.append("At least one requirement is required")
        
        if not jd_data.get('responsibilities') or len(jd_data.get('responsibilities', [])) == 0:
            errors.append("At least one responsibility is required")
        
        compensation = jd_data.get('compensation', {})
        if compensation.get('salary_min') and compensation.get('salary_max'):
            if compensation['salary_min'] > compensation['salary_max']:
                errors.append("Minimum salary cannot exceed maximum salary")
        
        is_valid = len(errors) == 0
        return is_valid, errors


# Singleton instance
_jd_builder_engine_instance = None


def get_jd_builder_engine() -> JDBuilderEngine:
    """Get singleton instance of JDBuilderEngine"""
    global _jd_builder_engine_instance
    if _jd_builder_engine_instance is None:
        _jd_builder_engine_instance = JDBuilderEngine()
    return _jd_builder_engine_instance
