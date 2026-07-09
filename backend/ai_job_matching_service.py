"""
AI-Powered Job Matching Service
Uses Google Qwen / DashScope for semantic matching between CVs and job postings
Supports experience level filtering and D33/Talent33 alignment

IMPORTANT: This service requires Google Qwen AI. No fallback to basic matching.
"""

import os
import json
import logging
import re
import time
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Experience level definitions
EXPERIENCE_LEVELS = {
    'trainee': {'min_years': 0, 'max_years': 0, 'keywords': ['trainee', 'intern', 'internship', 'graduate', 'entry level', 'fresh graduate', 'no experience required']},
    'junior': {'min_years': 0, 'max_years': 2, 'keywords': ['junior', 'entry', 'associate', '0-2 years', '1-2 years', 'early career']},
    'mid': {'min_years': 2, 'max_years': 5, 'keywords': ['mid-level', 'intermediate', '2-5 years', '3-5 years', '2+ years', '3+ years']},
    'senior': {'min_years': 5, 'max_years': 10, 'keywords': ['senior', 'lead', 'principal', '5+ years', '5-10 years', 'experienced']},
    'executive': {'min_years': 10, 'max_years': 99, 'keywords': ['director', 'head', 'vp', 'chief', 'executive', '10+ years', 'c-level']}
}

# D33 Priority Sectors for UAE alignment
D33_SECTORS = {
    'technology': ['software', 'it', 'digital', 'ai', 'machine learning', 'data', 'cloud', 'cybersecurity', 'fintech'],
    'green_sustainable': ['sustainability', 'renewable', 'green', 'environment', 'clean energy', 'solar', 'ev'],
    'financial_services': ['banking', 'finance', 'investment', 'insurance', 'wealth management', 'fintech'],
    'healthcare': ['healthcare', 'medical', 'pharma', 'biotech', 'hospital', 'clinic', 'health tech'],
    'tourism': ['tourism', 'hospitality', 'hotel', 'travel', 'entertainment', 'events'],
    'trade_logistics': ['logistics', 'supply chain', 'trade', 'shipping', 'freight', 'warehouse', 'port']
}


class AIServiceUnavailableError(Exception):
    """Raised when the AI matching service is unavailable"""
    def __init__(self, message="AI matching service is not available. Please try again later.", retry_after=30):
        self.message = message
        self.retry_after = retry_after
        super().__init__(self.message)


class AIJobMatchingService:
    """AI-powered job matching service using Google Gemini for semantic analysis"""
    
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds
    
    def __init__(self):
        self._client = None
        self._client_initialized = False
        self._initialization_error = None
        # Use Qwen / DashScope (more reliable with safety settings)
        # Qwen / DashScope has stricter built-in filters that cannot be disabled
        self._model_name = 'qwen-turbo'  # Qwen model via DashScope
    
    def _initialize_client(self):
        """Initialize Qwen / DashScope client"""
        if self._client_initialized:
            return
        
        self._client_initialized = True
        try:
            from backend.services.qwen_client import chat_completion
            from backend.config.qwen_config import DASHSCOPE_API_KEY
            
            if not DASHSCOPE_API_KEY:
                self._initialization_error = "DASHSCOPE_API_KEY environment variable not set"
                logger.error(self._initialization_error)
                return
            
            self._client = chat_completion  # Store the function reference
            logger.info(f"Qwen/DashScope client initialized successfully (model: {self._model_name})")
            
        except ImportError:
            self._initialization_error = "qwen_client not available. Check backend/services/qwen_client.py"
            logger.error(self._initialization_error)
        except Exception as e:
            self._initialization_error = f"Failed to initialize Qwen client: {str(e)}"
            logger.error(self._initialization_error)
    
    @property
    def client(self):
        """Get the Qwen chat_completion function, initializing if needed"""
        if not self._client_initialized:
            self._initialize_client()
        return self._client
    
    def check_service_available(self) -> Tuple[bool, Optional[str]]:
        """Check if the AI service is available"""
        if not self._client_initialized:
            self._initialize_client()
        
        if self._client is None:
            return False, self._initialization_error or "AI service not initialized"
        
        return True, None
    
    def extract_cv_profile(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured profile from CV data"""
        profile = {
            'name': '',
            'current_title': '',
            'experience_years': 0,
            'experience_level': 'trainee',
            'skills': [],
            'education': [],
            'location': '',
            'industries': [],
            'summary': ''
        }
        
        if not cv_data:
            return profile
        
        # Extract personal info
        personal_info = cv_data.get('personalInfo') or cv_data.get('personal_info') or {}
        profile['name'] = (personal_info.get('firstName', '') + ' ' + personal_info.get('lastName', '')).strip() or \
                         personal_info.get('first_name', '') + ' ' + personal_info.get('last_name', '') or \
                         personal_info.get('name', '') or personal_info.get('fullName', '')
        profile['current_title'] = personal_info.get('jobTitle') or personal_info.get('job_title') or \
                                   personal_info.get('currentRole') or personal_info.get('current_role') or ''
        profile['location'] = personal_info.get('location') or personal_info.get('city') or \
                             personal_info.get('emirate') or ''
        
        # Extract skills
        skills = set()
        skills_section = cv_data.get('skills') or cv_data.get('technicalSkills') or cv_data.get('technical_skills') or []
        if isinstance(skills_section, dict):
            for key in ['technical', 'soft', 'languages', 'tools', 'frameworks']:
                if key in skills_section:
                    for skill in skills_section[key]:
                        if isinstance(skill, str):
                            skills.add(skill.strip())
                        elif isinstance(skill, dict):
                            skill_name = skill.get('name') or skill.get('skill_name') or ''
                            if skill_name:
                                skills.add(skill_name.strip())
        elif isinstance(skills_section, list):
            for skill in skills_section:
                if isinstance(skill, str):
                    skills.add(skill.strip())
                elif isinstance(skill, dict):
                    skill_name = skill.get('name') or skill.get('skill_name') or ''
                    if skill_name:
                        skills.add(skill_name.strip())
        
        # Add soft skills
        soft_skills = cv_data.get('softSkills') or cv_data.get('soft_skills') or []
        if isinstance(soft_skills, list):
            for skill in soft_skills:
                if isinstance(skill, str):
                    skills.add(skill.strip())
        
        profile['skills'] = list(skills)
        
        # Calculate experience years
        experience = cv_data.get('experience') or cv_data.get('work_experience') or []
        total_years = 0
        industries = set()
        
        for exp in experience:
            # Calculate years
            start_date = exp.get('startDate') or exp.get('start_date') or ''
            end_date = exp.get('endDate') or exp.get('end_date') or ''
            is_current = exp.get('current') or exp.get('is_current') or False
            
            try:
                if start_date:
                    start_year = int(start_date.split('-')[0]) if '-' in start_date else int(start_date[:4])
                    if is_current or not end_date or end_date.lower() == 'present':
                        end_year = datetime.now().year
                    else:
                        end_year = int(end_date.split('-')[0]) if '-' in end_date else int(end_date[:4])
                    total_years += max(0, end_year - start_year)
            except (ValueError, IndexError):
                pass
            
            # Extract industry from company/description
            company = exp.get('company') or exp.get('employer_admin') or ''
            description = exp.get('description') or exp.get('responsibilities') or ''
            combined = f"{company} {description}".lower()
            
            for sector, keywords in D33_SECTORS.items():
                if any(kw in combined for kw in keywords):
                    industries.add(sector)
        
        profile['experience_years'] = total_years
        profile['industries'] = list(industries)
        
        # Determine experience level
        if total_years == 0:
            profile['experience_level'] = 'trainee'
        elif total_years <= 2:
            profile['experience_level'] = 'junior'
        elif total_years <= 5:
            profile['experience_level'] = 'mid'
        elif total_years <= 10:
            profile['experience_level'] = 'senior'
        else:
            profile['experience_level'] = 'executive'
        
        # Extract education
        education = cv_data.get('education') or []
        for edu in education:
            degree = edu.get('degree') or edu.get('qualification') or ''
            institution = edu.get('institution') or edu.get('school') or edu.get('university') or ''
            field = edu.get('field') or edu.get('major') or edu.get('fieldOfStudy') or ''
            if degree or institution:
                profile['education'].append({
                    'degree': degree,
                    'institution': institution,
                    'field': field
                })
        
        # Extract summary
        profile['summary'] = cv_data.get('professionalSummary') or cv_data.get('professional_summary') or \
                            cv_data.get('summary') or cv_data.get('objective') or ''
        
        return profile
    
    def extract_job_requirements(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured requirements from job posting"""
        requirements = {
            'title': job.get('title', ''),
            'company': job.get('company', ''),
            'location': job.get('location', ''),
            'description': job.get('description', ''),
            'required_skills': [],
            'experience_level': 'mid',
            'min_experience_years': 0,
            'industry': '',
            'd33_alignment': []
        }
        
        # Extract required skills
        job_requirements = job.get('requirements') or []
        if isinstance(job_requirements, str):
            job_requirements = [r.strip() for r in job_requirements.split(',')]
        
        for req in job_requirements:
            if isinstance(req, str):
                requirements['required_skills'].append(req.strip())
        
        # Determine experience level from title and description
        title_lower = requirements['title'].lower()
        desc_lower = requirements['description'].lower()
        combined = f"{title_lower} {desc_lower}"
        
        # Check for experience level keywords
        for level, config in EXPERIENCE_LEVELS.items():
            if any(kw in combined for kw in config['keywords']):
                requirements['experience_level'] = level
                requirements['min_experience_years'] = config['min_years']
                break
        
        # Extract years from description
        years_match = re.search(r'(\d+)\+?\s*years?', combined)
        if years_match:
            years = int(years_match.group(1))
            requirements['min_experience_years'] = years
            # Adjust experience level based on years
            if years == 0:
                requirements['experience_level'] = 'trainee'
            elif years <= 2:
                requirements['experience_level'] = 'junior'
            elif years <= 5:
                requirements['experience_level'] = 'mid'
            elif years <= 10:
                requirements['experience_level'] = 'senior'
            else:
                requirements['experience_level'] = 'executive'
        
        # Determine D33 alignment
        for sector, keywords in D33_SECTORS.items():
            if any(kw in combined for kw in keywords):
                requirements['d33_alignment'].append(sector)
        
        return requirements
    
    def calculate_ai_match_score(self, cv_profile: Dict[str, Any], job_requirements: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        """Calculate match score using Google Gemini for semantic analysis with retries"""
        
        # Check if service is available
        is_available, error_msg = self.check_service_available()
        if not is_available:
            raise AIServiceUnavailableError(
                f"AI matching service is not available: {error_msg}. Please try again later.",
                retry_after=60
            )
        
        last_error = None
        
        for attempt in range(self.MAX_RETRIES):
            try:
                prompt = f"""Analyze the match between this candidate profile and job posting. 
Return a JSON object with match score and detailed breakdown.

CANDIDATE PROFILE:
- Name: {cv_profile.get('name', 'Not specified')}
- Current Title: {cv_profile.get('current_title', 'Not specified')}
- Experience Level: {cv_profile.get('experience_level', 'trainee')} ({cv_profile.get('experience_years', 0)} years)
- Skills: {', '.join(cv_profile.get('skills', [])[:30]) or 'Not specified'}
- Education: {json.dumps(cv_profile.get('education', [])[:3])}
- Location: {cv_profile.get('location', 'Not specified')}
- Summary: {cv_profile.get('summary', 'Not specified')[:500]}
- Industries: {', '.join(cv_profile.get('industries', []))}

JOB REQUIREMENTS:
- Title: {job_requirements.get('title', 'Not specified')}
- Company: {job_requirements.get('company', 'Not specified')}
- Experience Level: {job_requirements.get('experience_level', 'mid')} (min {job_requirements.get('min_experience_years', 0)} years)
- Required Skills: {', '.join(job_requirements.get('required_skills', [])[:20]) or 'Not specified'}
- Location: {job_requirements.get('location', 'Not specified')}
- Industry: {job_requirements.get('industry', 'Not specified')}
- D33 Sectors: {', '.join(job_requirements.get('d33_alignment', []))}
- Description: {job_requirements.get('description', 'Not specified')[:500]}

SCORING CRITERIA:
1. Skills Match (0-40 points): Semantic match of skills. deeply understand transferable skills.
2. Experience Match (0-25 points):
   - Trainee/Intern applying to Senior/Lead roles = 0 points (FAIL)
   - Senior applying to Junior roles = 10-15 points (Overqualified)
   - Exact level match = 25 points
3. Title/Role Match (0-20 points): Relevance of current and past roles.
4. Location Match (0-10 points): Proximity or willingness to relocate (if implied).
5. D33/Strategic Alignment (0-5 points): Alignment with UAE strategic sectors.

CRITICAL RULES:
- BE STRICT on experience years. 0 years cannot match 5+ years.
- BE LENIENT on skill names (e.g., "React" matches "ReactJS", "Frontend" matches "Web Dev").

Return ONLY a valid JSON object in this format:
{{
  "total_score": <int 0-100>,
  "breakdown": {{
    "skills_match": <int 0-40>,
    "experience_match": <int 0-25>,
    "title_match": <int 0-20>,
    "location_match": <int 0-10>,
    "d33_alignment": <int 0-5>
  }},
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "pros": ["Key strength 1", "Key strength 2"],
  "cons": ["Key weakness 1", "Key weakness 2"],
  "recommendation": " actionable advice for candidate...",
  "fit_assessment": "excellent|good|moderate|poor|not_suitable"
}}"""

                # Use Qwen / DashScope for semantic matching
                messages = [
                    {
                        "role": "system",
                        "content": (
                            "You are an expert UAE job market analyst. Analyze candidate-job fit "
                            "and return ONLY raw, valid JSON. No markdown, no code fences."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ]

                result = self.client(
                    task_type="match",
                    messages=messages,
                    response_format={"type": "json_object"},
                )

                if isinstance(result, dict):
                    score = min(100, max(0, result.get('total_score', 50)))
                    breakdown = {
                        'skills_match': result.get('breakdown', {}).get('skills_match', 0),
                        'experience_match': result.get('breakdown', {}).get('experience_match', 0),
                        'title_match': result.get('breakdown', {}).get('title_match', 0),
                        'location_match': result.get('breakdown', {}).get('location_match', 0),
                        'd33_alignment': result.get('breakdown', {}).get('d33_alignment', 0),
                        'details': {
                            'matching_skills': result.get('matching_skills', []),
                            'missing_skills': result.get('missing_skills', []),
                            'pros': result.get('pros', []),
                            'cons': result.get('cons', []),
                            'recommendation': result.get('recommendation', ''),
                            'fit_assessment': result.get('fit_assessment', 'moderate'),
                            'ai_analyzed': True,
                            'ai_model': 'qwen-plus'
                        }
                    }
                    return score, breakdown
                else:
                    raise ValueError("Could not parse JSON from AI response")
                    
            except AIServiceUnavailableError:
                raise  # Don't retry initialization errors
            except Exception as e:
                last_error = str(e)
                logger.warning(f"AI matching attempt {attempt + 1}/{self.MAX_RETRIES} failed: {e}")
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_DELAY * (attempt + 1))  # Exponential backoff
        
        # All retries failed
        raise AIServiceUnavailableError(
            f"AI matching service temporarily unavailable after {self.MAX_RETRIES} attempts. Please try again later. Last error: {last_error}",
            retry_after=30
        )
    
    def match_cv_to_jobs(self, cv_data: Dict[str, Any], jobs: List[Dict[str, Any]], use_ai: bool = True) -> List[Dict[str, Any]]:
        """Match CV to multiple jobs and return sorted results
        
        Raises:
            AIServiceUnavailableError: If AI service is not available
        """
        # First check if service is available
        is_available, error_msg = self.check_service_available()
        if not is_available:
            raise AIServiceUnavailableError(
                f"AI matching service is not available: {error_msg}. Please try again later.",
                retry_after=60
            )
        
        cv_profile = self.extract_cv_profile(cv_data)
        logger.info(f"Matching CV for: {cv_profile.get('name', 'Unknown')} ({cv_profile.get('experience_level')} - {cv_profile.get('experience_years')} years)")
        
        matched_jobs = []
        
        for job in jobs:
            job_requirements = self.extract_job_requirements(job)
            
            # Use AI matching - will raise exception if unavailable
            score, breakdown = self.calculate_ai_match_score(cv_profile, job_requirements)
            
            matched_job = {
                **job,
                'matchScore': score,
                'matchBreakdown': breakdown,
                'candidateLevel': cv_profile.get('experience_level'),
                'jobLevel': job_requirements.get('experience_level'),
                'fitAssessment': breakdown.get('details', {}).get('fit_assessment', 'moderate')
            }
            matched_jobs.append(matched_job)
        
        # Sort by match score (highest first)
        matched_jobs.sort(key=lambda x: x['matchScore'], reverse=True)
        
        return matched_jobs
    
    def filter_jobs_by_experience_level(self, jobs: List[Dict[str, Any]], candidate_level: str) -> List[Dict[str, Any]]:
        """Filter jobs to only show appropriate experience levels"""
        if not candidate_level:
            return jobs
        
        level_order = ['trainee', 'junior', 'mid', 'senior', 'executive']
        candidate_idx = level_order.index(candidate_level) if candidate_level in level_order else 0
        
        # Allow jobs at same level, one level above, or one level below
        allowed_indices = {candidate_idx, candidate_idx - 1, candidate_idx + 1}
        allowed_levels = {level_order[i] for i in allowed_indices if 0 <= i < len(level_order)}
        
        filtered = []
        for job in jobs:
            job_level = job.get('jobLevel') or 'mid'
            if job_level in allowed_levels:
                filtered.append(job)
        
        return filtered


# Singleton instance - lazy initialization
ai_matching_service = AIJobMatchingService()
