#!/usr/bin/env python3
"""
CV Integration Module
Integrates CV Builder with Job Matching and Analytics Systems
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import asyncio
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CVAnalytics:
    """CV analytics data structure"""
    cv_id: str
    user_id: str
    completion_score: int
    sections_completed: List[str]
    skills_count: int
    experience_years: float
    education_level: str
    languages_count: int
    certifications_count: int
    last_updated: str
    view_count: int = 0
    download_count: int = 0
    match_score_avg: float = 0.0

@dataclass
class JobMatchResult:
    """Job match result with CV context"""
    job_id: str
    cv_id: str
    match_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    experience_match: float
    location_match: bool
    salary_match: bool
    recommendations: List[str]

class CVJobMatcher:
    """
    CV-Job Matching Integration
    """
    
    def __init__(self):
        """Initialize the CV-Job matcher"""
        self.skill_weights = {
            'technical': 0.4,
            'soft': 0.2,
            'language': 0.15,
            'professional': 0.25
        }
        
        self.experience_weights = {
            'exact_match': 1.0,
            'overqualified': 0.8,
            'underqualified': 0.6,
            'entry_level': 0.9
        }
        
        logger.info("CV-Job Matcher initialized")
    
    def analyze_cv_for_matching(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze CV data for job matching
        
        Args:
            cv_data: Complete CV data structure
            
        Returns:
            Analysis results for matching
        """
        try:
            analysis = {
                'skills_profile': self._extract_skills_profile(cv_data),
                'experience_profile': self._extract_experience_profile(cv_data),
                'education_profile': self._extract_education_profile(cv_data),
                'location_profile': self._extract_location_profile(cv_data),
                'language_profile': self._extract_language_profile(cv_data),
                'career_level': self._determine_career_level(cv_data),
                'industry_experience': self._extract_industry_experience(cv_data),
                'salary_expectations': self._estimate_salary_range(cv_data)
            }
            
            logger.info(f"CV analysis completed for matching")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing CV for matching: {str(e)}")
            return {}
    
    def _extract_skills_profile(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and categorize skills from CV"""
        skills = cv_data.get('skills', [])
        
        profile = {
            'technical': [],
            'soft': [],
            'language': [],
            'professional': [],
            'total_count': len(skills)
        }
        
        for skill in skills:
            category = skill.get('category', 'other').lower()
            skill_data = {
                'name': skill.get('name', ''),
                'proficiency': skill.get('proficiency', 'Intermediate'),
                'years_experience': skill.get('years_experience', 0)
            }
            
            if 'technical' in category or 'tech' in category:
                profile['technical'].append(skill_data)
            elif 'soft' in category or 'interpersonal' in category:
                profile['soft'].append(skill_data)
            elif 'language' in category:
                profile['language'].append(skill_data)
            else:
                profile['professional'].append(skill_data)
        
        return profile
    
    def _extract_experience_profile(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract experience profile from CV"""
        experience = cv_data.get('experience', [])
        
        if not experience:
            return {
                'total_years': 0,
                'current_level': 'entry',
                'industries': [],
                'job_titles': [],
                'companies': [],
                'management_experience': False
            }
        
        # Calculate total years of experience
        total_years = 0
        industries = set()
        job_titles = []
        companies = []
        management_experience = False
        
        for exp in experience:
            # Calculate years for this position
            start_date = exp.get('start_date', '')
            end_date = exp.get('end_date', '')
            is_current = exp.get('is_current', False)
            
            if start_date:
                try:
                    start_year = int(start_date.split('-')[0])
                    if is_current or not end_date:
                        end_year = datetime.now().year
                    else:
                        end_year = int(end_date.split('-')[0])
                    
                    years = max(0, end_year - start_year)
                    total_years += years
                except:
                    pass
            
            # Extract other information
            job_title = exp.get('job_title', '').lower()
            job_titles.append(exp.get('job_title', ''))
            companies.append(exp.get('company', ''))
            
            # Check for management experience
            if any(keyword in job_title for keyword in ['manager', 'director', 'head', 'lead', 'supervisor', 'chief']):
                management_experience = True
            
            # Extract industry (would need industry classification logic)
            # For now, use company name as proxy
            company = exp.get('company', '')
            if company:
                industries.add(self._classify_company_industry(company))
        
        # Determine career level
        if total_years < 2:
            level = 'entry'
        elif total_years < 5:
            level = 'mid'
        elif total_years < 10:
            level = 'senior'
        else:
            level = 'executive'
        
        return {
            'total_years': total_years,
            'current_level': level,
            'industries': list(industries),
            'job_titles': job_titles,
            'companies': companies,
            'management_experience': management_experience
        }
    
    def _extract_education_profile(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract education profile from CV"""
        education = cv_data.get('education', [])
        
        if not education:
            return {
                'highest_degree': 'none',
                'field_of_study': [],
                'institutions': [],
                'graduation_years': []
            }
        
        degrees = []
        fields = []
        institutions = []
        years = []
        
        degree_hierarchy = {
            'phd': 6, 'doctorate': 6, 'doctoral': 6,
            'master': 5, 'mba': 5, 'ms': 5, 'ma': 5,
            'bachelor': 4, 'bs': 4, 'ba': 4, 'bsc': 4,
            'associate': 3, 'diploma': 2, 'certificate': 1
        }
        
        highest_level = 0
        highest_degree = 'none'
        
        for edu in education:
            degree = edu.get('degree', '').lower()
            institution = edu.get('institution', '')
            year = edu.get('graduation_year', '')
            
            institutions.append(institution)
            if year:
                years.append(year)
            
            # Determine degree level
            for key, level in degree_hierarchy.items():
                if key in degree:
                    if level > highest_level:
                        highest_level = level
                        highest_degree = key
                    break
            
            # Extract field of study (simplified)
            if 'computer' in degree or 'software' in degree or 'it' in degree:
                fields.append('Computer Science/IT')
            elif 'business' in degree or 'management' in degree or 'mba' in degree:
                fields.append('Business/Management')
            elif 'engineering' in degree:
                fields.append('Engineering')
            elif 'finance' in degree or 'accounting' in degree:
                fields.append('Finance/Accounting')
            else:
                fields.append('Other')
        
        return {
            'highest_degree': highest_degree,
            'field_of_study': list(set(fields)),
            'institutions': institutions,
            'graduation_years': years
        }
    
    def _extract_location_profile(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract location profile from CV"""
        personal_info = cv_data.get('personal_info', {})
        
        return {
            'emirate': personal_info.get('emirate', ''),
            'city': personal_info.get('city', ''),
            'nationality': personal_info.get('nationality', ''),
            'visa_status': personal_info.get('visa_status', ''),
            'willing_to_relocate': True  # Default assumption
        }
    
    def _extract_language_profile(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract language profile from CV"""
        languages = cv_data.get('languages', [])
        
        profile = {
            'languages': [],
            'arabic_proficiency': 'none',
            'english_proficiency': 'none',
            'total_languages': len(languages)
        }
        
        for lang in languages:
            lang_name = lang.get('language', '').lower()
            proficiency = lang.get('proficiency', 'Basic')
            
            profile['languages'].append({
                'language': lang.get('language', ''),
                'proficiency': proficiency
            })
            
            if 'arabic' in lang_name:
                profile['arabic_proficiency'] = proficiency.lower()
            elif 'english' in lang_name:
                profile['english_proficiency'] = proficiency.lower()
        
        return profile
    
    def _determine_career_level(self, cv_data: Dict[str, Any]) -> str:
        """Determine career level based on CV data"""
        experience_profile = self._extract_experience_profile(cv_data)
        education_profile = self._extract_education_profile(cv_data)
        
        years = experience_profile['total_years']
        management = experience_profile['management_experience']
        degree_level = education_profile['highest_degree']
        
        if years < 2:
            return 'entry'
        elif years < 5:
            return 'mid'
        elif years < 10 or (years < 15 and not management):
            return 'senior'
        else:
            return 'executive'
    
    def _extract_industry_experience(self, cv_data: Dict[str, Any]) -> List[str]:
        """Extract industry experience from CV"""
        experience = cv_data.get('experience', [])
        industries = set()
        
        for exp in experience:
            company = exp.get('company', '')
            industry = self._classify_company_industry(company)
            if industry:
                industries.add(industry)
        
        return list(industries)
    
    def _classify_company_industry(self, company_name: str) -> str:
        """Classify company industry based on name (simplified)"""
        company = company_name.lower()
        
        if any(keyword in company for keyword in ['bank', 'financial', 'finance', 'capital', 'investment']):
            return 'Banking & Finance'
        elif any(keyword in company for keyword in ['tech', 'software', 'digital', 'it', 'systems']):
            return 'Technology'
        elif any(keyword in company for keyword in ['hospital', 'medical', 'health', 'clinic']):
            return 'Healthcare'
        elif any(keyword in company for keyword in ['compliance_auditor', 'ministry', 'authority', 'municipality']):
            return 'Government'
        elif any(keyword in company for keyword in ['hotel', 'tourism', 'travel', 'hospitality']):
            return 'Tourism & Hospitality'
        elif any(keyword in company for keyword in ['construction', 'real estate', 'property', 'development']):
            return 'Real Estate & Construction'
        elif any(keyword in company for keyword in ['energy', 'oil', 'gas', 'petroleum', 'adnoc', 'enoc']):
            return 'Energy'
        elif any(keyword in company for keyword in ['education', 'university', 'school', 'training']):
            return 'Education'
        elif any(keyword in company for keyword in ['retail', 'mall', 'shopping', 'store']):
            return 'Retail'
        else:
            return 'Other'
    
    def _estimate_salary_range(self, cv_data: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate salary range based on CV data"""
        experience_profile = self._extract_experience_profile(cv_data)
        education_profile = self._extract_education_profile(cv_data)
        location_profile = self._extract_location_profile(cv_data)
        
        years = experience_profile['total_years']
        level = experience_profile['current_level']
        management = experience_profile['management_experience']
        degree = education_profile['highest_degree']
        emirate = location_profile['emirate']
        
        # Base salary ranges for UAE (in AED per month)
        base_ranges = {
            'entry': (3000, 8000),
            'mid': (8000, 15000),
            'senior': (15000, 25000),
            'executive': (25000, 50000)
        }
        
        min_salary, max_salary = base_ranges.get(level, (3000, 8000))
        
        # Adjustments
        if management:
            min_salary *= 1.3
            max_salary *= 1.5
        
        if degree in ['master', 'mba', 'phd']:
            min_salary *= 1.2
            max_salary *= 1.3
        
        if emirate in ['Dubai', 'Abu Dhabi']:
            min_salary *= 1.1
            max_salary *= 1.2
        
        return {
            'min_monthly': int(min_salary),
            'max_monthly': int(max_salary),
            'currency': 'AED',
            'confidence': 0.7
        }
    
    def match_cv_to_job(self, cv_analysis: Dict[str, Any], job_requirements: Dict[str, Any]) -> JobMatchResult:
        """
        Match CV to specific job requirements
        
        Args:
            cv_analysis: CV analysis results
            job_requirements: Job requirements and details
            
        Returns:
            Job match result
        """
        try:
            # Extract job details
            job_id = job_requirements.get('job_id', '')
            required_skills = job_requirements.get('required_skills', [])
            preferred_skills = job_requirements.get('preferred_skills', [])
            min_experience = job_requirements.get('min_experience_years', 0)
            max_experience = job_requirements.get('max_experience_years', 100)
            job_location = job_requirements.get('location', {})
            salary_range = job_requirements.get('salary_range', {})
            
            # Calculate skill match
            skill_match = self._calculate_skill_match(
                cv_analysis.get('skills_profile', {}),
                required_skills,
                preferred_skills
            )
            
            # Calculate experience match
            experience_match = self._calculate_experience_match(
                cv_analysis.get('experience_profile', {}),
                min_experience,
                max_experience
            )
            
            # Calculate location match
            location_match = self._calculate_location_match(
                cv_analysis.get('location_profile', {}),
                job_location
            )
            
            # Calculate salary match
            salary_match = self._calculate_salary_match(
                cv_analysis.get('salary_expectations', {}),
                salary_range
            )
            
            # Calculate overall match score
            overall_score = (
                skill_match['score'] * 0.4 +
                experience_match * 0.3 +
                (1.0 if location_match else 0.5) * 0.2 +
                (1.0 if salary_match else 0.8) * 0.1
            )
            
            # Generate recommendations
            recommendations = self._generate_match_recommendations(
                skill_match,
                experience_match,
                location_match,
                salary_match,
                cv_analysis
            )
            
            return JobMatchResult(
                job_id=job_id,
                cv_id=cv_analysis.get('cv_id', ''),
                match_score=round(overall_score * 100, 1),
                matching_skills=skill_match['matching'],
                missing_skills=skill_match['missing'],
                experience_match=experience_match,
                location_match=location_match,
                salary_match=salary_match,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Error matching CV to job: {str(e)}")
            return JobMatchResult(
                job_id=job_requirements.get('job_id', ''),
                cv_id=cv_analysis.get('cv_id', ''),
                match_score=0.0,
                matching_skills=[],
                missing_skills=[],
                experience_match=0.0,
                location_match=False,
                salary_match=False,
                recommendations=['Error occurred during matching']
            )
    
    def _calculate_skill_match(self, cv_skills: Dict[str, Any], required_skills: List[str], preferred_skills: List[str]) -> Dict[str, Any]:
        """Calculate skill matching score"""
        all_cv_skills = []
        
        # Collect all CV skills
        for category in ['technical', 'soft', 'professional', 'language']:
            skills = cv_skills.get(category, [])
            for skill in skills:
                all_cv_skills.append(skill.get('name', '').lower())
        
        # Normalize skill names
        required_normalized = [skill.lower() for skill in required_skills]
        preferred_normalized = [skill.lower() for skill in preferred_skills]
        
        # Find matches
        matching_required = []
        missing_required = []
        
        for skill in required_normalized:
            if any(skill in cv_skill or cv_skill in skill for cv_skill in all_cv_skills):
                matching_required.append(skill)
            else:
                missing_required.append(skill)
        
        matching_preferred = []
        for skill in preferred_normalized:
            if any(skill in cv_skill or cv_skill in skill for cv_skill in all_cv_skills):
                matching_preferred.append(skill)
        
        # Calculate score
        required_score = len(matching_required) / max(len(required_normalized), 1)
        preferred_score = len(matching_preferred) / max(len(preferred_normalized), 1) if preferred_normalized else 0
        
        overall_score = required_score * 0.8 + preferred_score * 0.2
        
        return {
            'score': overall_score,
            'matching': matching_required + matching_preferred,
            'missing': missing_required,
            'required_match_rate': required_score,
            'preferred_match_rate': preferred_score
        }
    
    def _calculate_experience_match(self, cv_experience: Dict[str, Any], min_years: int, max_years: int) -> float:
        """Calculate experience matching score"""
        cv_years = cv_experience.get('total_years', 0)
        
        if cv_years < min_years:
            # Underqualified
            return max(0.0, cv_years / min_years)
        elif cv_years > max_years:
            # Overqualified
            return max(0.7, 1.0 - (cv_years - max_years) / max_years)
        else:
            # Perfect match
            return 1.0
    
    def _calculate_location_match(self, cv_location: Dict[str, Any], job_location: Dict[str, Any]) -> bool:
        """Calculate location matching"""
        cv_emirate = cv_location.get('emirate', '').lower()
        cv_city = cv_location.get('city', '').lower()
        
        job_emirate = job_location.get('emirate', '').lower()
        job_city = job_location.get('city', '').lower()
        
        # Exact match
        if cv_emirate == job_emirate and cv_city == job_city:
            return True
        
        # Same emirate
        if cv_emirate == job_emirate:
            return True
        
        # Major emirates (Dubai/Abu Dhabi) are considered close
        major_emirates = ['dubai', 'abu dhabi']
        if cv_emirate in major_emirates and job_emirate in major_emirates:
            return True
        
        return False
    
    def _calculate_salary_match(self, cv_salary: Dict[str, Any], job_salary: Dict[str, Any]) -> bool:
        """Calculate salary matching"""
        cv_min = cv_salary.get('min_monthly', 0)
        cv_max = cv_salary.get('max_monthly', 0)
        
        job_min = job_salary.get('min_monthly', 0)
        job_max = job_salary.get('max_monthly', 0)
        
        if not job_min or not job_max:
            return True  # No salary info provided
        
        # Check for overlap
        return not (cv_min > job_max or cv_max < job_min)
    
    def _generate_match_recommendations(self, skill_match: Dict[str, Any], experience_match: float, 
                                      location_match: bool, salary_match: bool, cv_analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations for improving match"""
        recommendations = []
        
        if skill_match['required_match_rate'] < 0.8:
            missing_skills = skill_match['missing'][:3]  # Top 3 missing skills
            recommendations.append(f"Consider developing skills in: {', '.join(missing_skills)}")
        
        if experience_match < 0.8:
            cv_years = cv_analysis.get('experience_profile', {}).get('total_years', 0)
            recommendations.append(f"Highlight relevant experience and transferable skills")
        
        if not location_match:
            recommendations.append("Consider mentioning willingness to relocate or work remotely")
        
        if not salary_match:
            recommendations.append("Review salary expectations to align with market rates")
        
        if skill_match['score'] > 0.8 and experience_match > 0.8:
            recommendations.append("Strong match! Consider applying immediately")
        
        return recommendations

class CVAnalyticsTracker:
    """
    CV Analytics and Performance Tracking
    """
    
    def __init__(self):
        """Initialize analytics tracker"""
        self.analytics_data = {}
        logger.info("CV Analytics Tracker initialized")
    
    def track_cv_creation(self, cv_id: str, user_id: str, template: str):
        """Track CV creation event"""
        try:
            self.analytics_data[cv_id] = CVAnalytics(
                cv_id=cv_id,
                user_id=user_id,
                completion_score=0,
                sections_completed=[],
                skills_count=0,
                experience_years=0.0,
                education_level='none',
                languages_count=0,
                certifications_count=0,
                last_updated=datetime.now().isoformat()
            )
            
            logger.info(f"Tracked CV creation: {cv_id}")
            
        except Exception as e:
            logger.error(f"Error tracking CV creation: {str(e)}")
    
    def track_cv_update(self, cv_id: str, cv_data: Dict[str, Any]):
        """Track CV update event"""
        try:
            if cv_id not in self.analytics_data:
                return
            
            analytics = self.analytics_data[cv_id]
            
            # Update analytics
            analytics.completion_score = self._calculate_completion_score(cv_data)
            analytics.sections_completed = self._get_completed_sections(cv_data)
            analytics.skills_count = len(cv_data.get('skills', []))
            analytics.experience_years = self._calculate_total_experience(cv_data)
            analytics.education_level = self._get_highest_education(cv_data)
            analytics.languages_count = len(cv_data.get('languages', []))
            analytics.certifications_count = len(cv_data.get('certifications', []))
            analytics.last_updated = datetime.now().isoformat()
            
            logger.info(f"Tracked CV update: {cv_id}")
            
        except Exception as e:
            logger.error(f"Error tracking CV update: {str(e)}")
    
    def track_cv_view(self, cv_id: str):
        """Track CV view event"""
        try:
            if cv_id in self.analytics_data:
                self.analytics_data[cv_id].view_count += 1
                logger.info(f"Tracked CV view: {cv_id}")
                
        except Exception as e:
            logger.error(f"Error tracking CV view: {str(e)}")
    
    def track_cv_download(self, cv_id: str, format: str):
        """Track CV download event"""
        try:
            if cv_id in self.analytics_data:
                self.analytics_data[cv_id].download_count += 1
                logger.info(f"Tracked CV download: {cv_id} ({format})")
                
        except Exception as e:
            logger.error(f"Error tracking CV download: {str(e)}")
    
    def get_cv_analytics(self, cv_id: str) -> Optional[CVAnalytics]:
        """Get analytics for specific CV"""
        return self.analytics_data.get(cv_id)
    
    def get_user_analytics(self, user_id: str) -> List[CVAnalytics]:
        """Get analytics for all user CVs"""
        return [analytics for analytics in self.analytics_data.values() 
                if analytics.user_id == user_id]
    
    def _calculate_completion_score(self, cv_data: Dict[str, Any]) -> int:
        """Calculate CV completion score"""
        score = 0
        
        # Personal info (20 points)
        personal_info = cv_data.get('personal_info', {})
        if personal_info.get('full_name'):
            score += 5
        if personal_info.get('email'):
            score += 5
        if personal_info.get('phone'):
            score += 5
        if personal_info.get('emirate') and personal_info.get('city'):
            score += 5
        
        # Professional summary (15 points)
        if cv_data.get('professional_summary'):
            score += 15
        
        # Experience (25 points)
        experience = cv_data.get('experience', [])
        if experience:
            score += 15
            if len(experience) >= 2:
                score += 5
            if any(exp.get('achievements') for exp in experience):
                score += 5
        
        # Education (15 points)
        education = cv_data.get('education', [])
        if education:
            score += 15
        
        # Skills (15 points)
        skills = cv_data.get('skills', [])
        if skills:
            score += 10
            if len(skills) >= 5:
                score += 5
        
        # Languages (5 points)
        if cv_data.get('languages'):
            score += 5
        
        # Additional sections (5 points)
        if cv_data.get('certifications') or cv_data.get('projects') or cv_data.get('awards'):
            score += 5
        
        return min(score, 100)
    
    def _get_completed_sections(self, cv_data: Dict[str, Any]) -> List[str]:
        """Get list of completed sections"""
        completed = []
        
        personal_info = cv_data.get('personal_info', {})
        if personal_info.get('full_name') and personal_info.get('email'):
            completed.append('personal_info')
        
        if cv_data.get('professional_summary'):
            completed.append('professional_summary')
        
        if cv_data.get('experience'):
            completed.append('experience')
        
        if cv_data.get('education'):
            completed.append('education')
        
        if cv_data.get('skills'):
            completed.append('skills')
        
        if cv_data.get('languages'):
            completed.append('languages')
        
        if cv_data.get('projects'):
            completed.append('projects')
        
        if cv_data.get('certifications'):
            completed.append('certifications')
        
        return completed
    
    def _calculate_total_experience(self, cv_data: Dict[str, Any]) -> float:
        """Calculate total years of experience"""
        experience = cv_data.get('experience', [])
        total_years = 0.0
        
        for exp in experience:
            start_date = exp.get('start_date', '')
            end_date = exp.get('end_date', '')
            is_current = exp.get('is_current', False)
            
            if start_date:
                try:
                    start_year = int(start_date.split('-')[0])
                    if is_current or not end_date:
                        end_year = datetime.now().year
                    else:
                        end_year = int(end_date.split('-')[0])
                    
                    years = max(0, end_year - start_year)
                    total_years += years
                except:
                    pass
        
        return total_years
    
    def _get_highest_education(self, cv_data: Dict[str, Any]) -> str:
        """Get highest education level"""
        education = cv_data.get('education', [])
        
        if not education:
            return 'none'
        
        degree_hierarchy = {
            'phd': 6, 'doctorate': 6, 'doctoral': 6,
            'master': 5, 'mba': 5, 'ms': 5, 'ma': 5,
            'bachelor': 4, 'bs': 4, 'ba': 4, 'bsc': 4,
            'associate': 3, 'diploma': 2, 'certificate': 1
        }
        
        highest_level = 0
        highest_degree = 'none'
        
        for edu in education:
            degree = edu.get('degree', '').lower()
            
            for key, level in degree_hierarchy.items():
                if key in degree:
                    if level > highest_level:
                        highest_level = level
                        highest_degree = key
                    break
        
        return highest_degree

# Global instances
cv_job_matcher = CVJobMatcher()
cv_analytics_tracker = CVAnalyticsTracker()

def get_cv_job_matcher() -> CVJobMatcher:
    """Get the global CV-Job matcher instance"""
    return cv_job_matcher

def get_cv_analytics_tracker() -> CVAnalyticsTracker:
    """Get the global CV analytics tracker instance"""
    return cv_analytics_tracker

if __name__ == "__main__":
    # Test the integration modules
    matcher = CVJobMatcher()
    tracker = CVAnalyticsTracker()
    
    # Test CV analysis
    test_cv_data = {
        'personal_info': {
            'full_name': 'Ahmed Al Mansouri',
            'email': 'ahmed@example.com',
            'phone': '+971501234567',
            'emirate': 'Dubai',
            'city': 'Dubai'
        },
        'professional_summary': 'Experienced software engineer with 5 years in the UAE market.',
        'experience': [
            {
                'job_title': 'Senior Software Engineer',
                'company': 'Emirates NBD',
                'start_date': '2020-01',
                'end_date': '',
                'is_current': True
            }
        ],
        'education': [
            {
                'degree': 'Bachelor of Computer Science',
                'institution': 'American University of Sharjah',
                'graduation_year': '2019'
            }
        ],
        'skills': [
            {'name': 'Python', 'category': 'Technical', 'proficiency': 'Expert'},
            {'name': 'React', 'category': 'Technical', 'proficiency': 'Advanced'},
            {'name': 'Leadership', 'category': 'Soft Skills', 'proficiency': 'Advanced'}
        ],
        'languages': [
            {'language': 'Arabic', 'proficiency': 'Native'},
            {'language': 'English', 'proficiency': 'Fluent'}
        ]
    }
    
    # Test analysis
    analysis = matcher.analyze_cv_for_matching(test_cv_data)
    print(f"CV Analysis completed: {len(analysis)} components analyzed")
    
    # Test analytics tracking
    tracker.track_cv_creation('test_cv_123', 'test_user', 'uae_professional')
    tracker.track_cv_update('test_cv_123', test_cv_data)
    
    analytics = tracker.get_cv_analytics('test_cv_123')
    if analytics:
        print(f"CV Analytics: {analytics.completion_score}% complete, {analytics.skills_count} skills")
    
    logger.info("CV Integration modules test completed")

