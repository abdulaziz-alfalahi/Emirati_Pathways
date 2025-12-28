"""
AI-Powered Job Matching Service
Uses OpenAI-compatible API for semantic matching between CVs and job postings
Supports experience level filtering and D33/Talent33 alignment
"""

import os
import json
import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client (uses OPENAI_API_KEY from environment)
client = OpenAI()

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


class AIJobMatchingService:
    """AI-powered job matching service using semantic analysis"""
    
    def __init__(self):
        self.client = client
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4.1-mini')
    
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
            company = exp.get('company') or exp.get('employer') or ''
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
    
    def calculate_basic_match_score(self, cv_profile: Dict[str, Any], job_requirements: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        """Calculate basic match score without AI (fallback)"""
        score = 0
        breakdown = {
            'skills_match': 0,
            'experience_match': 0,
            'title_match': 0,
            'location_match': 0,
            'd33_alignment': 0,
            'details': {}
        }
        
        # 1. Skills Match (40 points)
        cv_skills = set(s.lower() for s in cv_profile.get('skills', []))
        job_skills = set(s.lower() for s in job_requirements.get('required_skills', []))
        
        if job_skills:
            matching_skills = cv_skills.intersection(job_skills)
            skill_ratio = len(matching_skills) / len(job_skills)
            breakdown['skills_match'] = int(skill_ratio * 40)
            breakdown['details']['matching_skills'] = list(matching_skills)
            breakdown['details']['missing_skills'] = list(job_skills - cv_skills)
        else:
            breakdown['skills_match'] = 20  # Partial credit if no specific skills listed
        
        score += breakdown['skills_match']
        
        # 2. Experience Level Match (25 points)
        cv_level = cv_profile.get('experience_level', 'trainee')
        job_level = job_requirements.get('experience_level', 'mid')
        cv_years = cv_profile.get('experience_years', 0)
        job_min_years = job_requirements.get('min_experience_years', 0)
        
        level_order = ['trainee', 'junior', 'mid', 'senior', 'executive']
        cv_level_idx = level_order.index(cv_level) if cv_level in level_order else 0
        job_level_idx = level_order.index(job_level) if job_level in level_order else 2
        
        # Perfect match or one level above
        if cv_level_idx == job_level_idx:
            breakdown['experience_match'] = 25
        elif cv_level_idx == job_level_idx + 1:
            breakdown['experience_match'] = 20  # Slightly overqualified
        elif cv_level_idx == job_level_idx - 1:
            breakdown['experience_match'] = 15  # Slightly underqualified but close
        elif cv_level_idx > job_level_idx:
            breakdown['experience_match'] = 10  # Overqualified
        else:
            breakdown['experience_match'] = 5  # Underqualified
        
        # Penalty for trainee applying to senior roles
        if cv_level == 'trainee' and job_level in ['senior', 'executive']:
            breakdown['experience_match'] = 0
        
        breakdown['details']['cv_level'] = cv_level
        breakdown['details']['job_level'] = job_level
        breakdown['details']['cv_years'] = cv_years
        breakdown['details']['job_min_years'] = job_min_years
        
        score += breakdown['experience_match']
        
        # 3. Title/Role Match (20 points)
        cv_title = cv_profile.get('current_title', '').lower()
        job_title = job_requirements.get('title', '').lower()
        
        if cv_title and job_title:
            cv_words = set(cv_title.split())
            job_words = set(job_title.split())
            
            # Remove common words
            common_words = {'the', 'a', 'an', 'and', 'or', 'of', 'in', 'at', 'to', 'for'}
            cv_words -= common_words
            job_words -= common_words
            
            if cv_words and job_words:
                overlap = cv_words.intersection(job_words)
                title_ratio = len(overlap) / max(len(cv_words), len(job_words))
                breakdown['title_match'] = int(title_ratio * 20)
        
        score += breakdown['title_match']
        
        # 4. Location Match (10 points)
        cv_location = cv_profile.get('location', '').lower()
        job_location = job_requirements.get('location', '').lower()
        
        uae_cities = ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain', 'uae']
        cv_in_uae = any(city in cv_location for city in uae_cities)
        job_in_uae = any(city in job_location for city in uae_cities)
        
        if cv_location and job_location:
            if cv_location in job_location or job_location in cv_location:
                breakdown['location_match'] = 10
            elif cv_in_uae and job_in_uae:
                breakdown['location_match'] = 7
            elif cv_in_uae or job_in_uae:
                breakdown['location_match'] = 3
        else:
            breakdown['location_match'] = 5  # Partial credit if location not specified
        
        score += breakdown['location_match']
        
        # 5. D33 Alignment (5 points)
        cv_industries = set(cv_profile.get('industries', []))
        job_d33 = set(job_requirements.get('d33_alignment', []))
        
        if cv_industries and job_d33:
            if cv_industries.intersection(job_d33):
                breakdown['d33_alignment'] = 5
        
        score += breakdown['d33_alignment']
        
        return min(100, score), breakdown
    
    def calculate_ai_match_score(self, cv_profile: Dict[str, Any], job_requirements: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        """Calculate match score using AI for semantic analysis"""
        try:
            prompt = f"""Analyze the match between this candidate profile and job posting. 
Return a JSON object with match score and detailed breakdown.

CANDIDATE PROFILE:
- Name: {cv_profile.get('name', 'Not specified')}
- Current Title: {cv_profile.get('current_title', 'Not specified')}
- Experience Level: {cv_profile.get('experience_level', 'trainee')} ({cv_profile.get('experience_years', 0)} years)
- Skills: {', '.join(cv_profile.get('skills', [])[:20]) or 'Not specified'}
- Education: {json.dumps(cv_profile.get('education', [])[:3])}
- Location: {cv_profile.get('location', 'Not specified')}
- Summary: {cv_profile.get('summary', 'Not specified')[:500]}

JOB REQUIREMENTS:
- Title: {job_requirements.get('title', 'Not specified')}
- Company: {job_requirements.get('company', 'Not specified')}
- Experience Level: {job_requirements.get('experience_level', 'mid')} (min {job_requirements.get('min_experience_years', 0)} years)
- Required Skills: {', '.join(job_requirements.get('required_skills', [])[:15]) or 'Not specified'}
- Location: {job_requirements.get('location', 'Not specified')}
- Description: {job_requirements.get('description', 'Not specified')[:500]}

SCORING CRITERIA:
1. Skills Match (0-40 points): How well do the candidate's skills match the job requirements?
2. Experience Match (0-25 points): Is the candidate's experience level appropriate? 
   - Trainee/intern should match trainee/entry-level jobs
   - Senior candidates are overqualified for trainee positions
3. Title/Role Match (0-20 points): Is the candidate's current role similar to the job?
4. Location Match (0-10 points): Is the candidate in or near the job location?
5. D33 Alignment (0-5 points): Does the candidate's background align with UAE's D33 priority sectors?

IMPORTANT: 
- A trainee with 0 years experience should NOT get high scores for senior positions requiring 5+ years
- Match the experience level appropriately
- Be realistic about skill gaps

Return ONLY a valid JSON object in this exact format:
{{
  "total_score": <0-100>,
  "breakdown": {{
    "skills_match": <0-40>,
    "experience_match": <0-25>,
    "title_match": <0-20>,
    "location_match": <0-10>,
    "d33_alignment": <0-5>
  }},
  "matching_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "recommendation": "Brief recommendation for the candidate",
  "fit_assessment": "excellent|good|moderate|poor|not_suitable"
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert job matching AI. Analyze candidate-job fit accurately and return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', result_text)
            if json_match:
                result = json.loads(json_match.group())
                
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
                        'recommendation': result.get('recommendation', ''),
                        'fit_assessment': result.get('fit_assessment', 'moderate'),
                        'ai_analyzed': True
                    }
                }
                
                return score, breakdown
            
        except Exception as e:
            logger.error(f"AI matching failed: {e}")
        
        # Fallback to basic matching
        return self.calculate_basic_match_score(cv_profile, job_requirements)
    
    def match_cv_to_jobs(self, cv_data: Dict[str, Any], jobs: List[Dict[str, Any]], use_ai: bool = True) -> List[Dict[str, Any]]:
        """Match CV to multiple jobs and return sorted results"""
        cv_profile = self.extract_cv_profile(cv_data)
        logger.info(f"Matching CV for: {cv_profile.get('name', 'Unknown')} ({cv_profile.get('experience_level')} - {cv_profile.get('experience_years')} years)")
        
        matched_jobs = []
        
        for job in jobs:
            job_requirements = self.extract_job_requirements(job)
            
            # Use AI matching for better accuracy, with fallback
            if use_ai:
                score, breakdown = self.calculate_ai_match_score(cv_profile, job_requirements)
            else:
                score, breakdown = self.calculate_basic_match_score(cv_profile, job_requirements)
            
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


# Singleton instance
ai_matching_service = AIJobMatchingService()
