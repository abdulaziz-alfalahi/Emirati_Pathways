"""
Enhanced AI-Powered Matching Service for Emirati Journey Platform
Advanced job-candidate matching with UAE-specific criteria and machine learning
"""

import json
import logging
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import re

# Initialize logger
logger = logging.getLogger(__name__)

class MatchingCriteria(Enum):
    SKILLS = "skills"
    EXPERIENCE = "experience"
    EDUCATION = "education"
    LOCATION = "location"
    SALARY = "salary"
    EMIRATIZATION = "emiratization"
    LANGUAGE = "language"
    INDUSTRY = "industry"
    COMPANY_SIZE = "company_size"
    CAREER_LEVEL = "career_level"

@dataclass
class MatchScore:
    overall_score: float
    criteria_scores: Dict[str, float]
    confidence_level: float
    match_reasons: List[str]
    improvement_suggestions: List[str]
    emiratization_bonus: float = 0.0

@dataclass
class CandidateProfile:
    id: str
    skills: List[str]
    experience_years: int
    education_level: str
    location: Dict[str, str]
    salary_expectation: Optional[Dict[str, Any]]
    languages: List[str]
    industry_experience: List[str]
    career_level: str
    is_uae_national: bool = False
    preferences: Dict[str, Any] = None

@dataclass
class JobRequirements:
    id: str
    required_skills: List[str]
    preferred_skills: List[str]
    min_experience: int
    max_experience: Optional[int]
    education_requirements: List[str]
    location: Dict[str, str]
    salary_range: Optional[Dict[str, Any]]
    languages: List[str]
    industry: str
    company_size: str
    career_level: str
    emiratization_priority: bool = False
    visa_sponsorship: bool = True

class EnhancedMatchingEngine:
    """
    Advanced AI-powered matching engine with UAE-specific optimizations
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Matching weights (can be adjusted based on ML training)
        self.criteria_weights = {
            MatchingCriteria.SKILLS: 0.25,
            MatchingCriteria.EXPERIENCE: 0.20,
            MatchingCriteria.EDUCATION: 0.15,
            MatchingCriteria.LOCATION: 0.10,
            MatchingCriteria.SALARY: 0.10,
            MatchingCriteria.EMIRATIZATION: 0.08,
            MatchingCriteria.LANGUAGE: 0.05,
            MatchingCriteria.INDUSTRY: 0.04,
            MatchingCriteria.COMPANY_SIZE: 0.02,
            MatchingCriteria.CAREER_LEVEL: 0.01
        }
        
        # UAE-specific configurations
        self.uae_emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain']
        self.emiratization_bonus_multiplier = 1.15  # 15% bonus for UAE nationals
        
        # Skill similarity mappings (simplified - would use NLP/ML in production)
        self.skill_synonyms = {
            'javascript': ['js', 'node.js', 'nodejs', 'react', 'vue', 'angular'],
            'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
            'data analysis': ['analytics', 'data science', 'statistics', 'sql'],
            'project management': ['pmp', 'agile', 'scrum', 'kanban'],
            'digital marketing': ['seo', 'sem', 'social media', 'content marketing'],
            'finance': ['accounting', 'financial analysis', 'budgeting', 'forecasting']
        }
        
        # Education level hierarchy
        self.education_hierarchy = {
            'high_school': 1,
            'diploma': 2,
            'bachelor': 3,
            'master': 4,
            'phd': 5
        }
        
        # Career level hierarchy
        self.career_hierarchy = {
            'entry_level': 1,
            'junior': 2,
            'mid_level': 3,
            'senior': 4,
            'manager': 5,
            'director': 6,
            'executive': 7
        }
    
    def calculate_match_score(self, candidate: CandidateProfile, job: JobRequirements) -> MatchScore:
        """
        Calculate comprehensive match score between candidate and job
        """
        try:
            criteria_scores = {}
            match_reasons = []
            improvement_suggestions = []
            
            # 1. Skills matching (25% weight)
            skills_score, skills_reasons, skills_suggestions = self._calculate_skills_match(candidate, job)
            criteria_scores[MatchingCriteria.SKILLS.value] = skills_score
            match_reasons.extend(skills_reasons)
            improvement_suggestions.extend(skills_suggestions)
            
            # 2. Experience matching (20% weight)
            exp_score, exp_reasons, exp_suggestions = self._calculate_experience_match(candidate, job)
            criteria_scores[MatchingCriteria.EXPERIENCE.value] = exp_score
            match_reasons.extend(exp_reasons)
            improvement_suggestions.extend(exp_suggestions)
            
            # 3. Education matching (15% weight)
            edu_score, edu_reasons, edu_suggestions = self._calculate_education_match(candidate, job)
            criteria_scores[MatchingCriteria.EDUCATION.value] = edu_score
            match_reasons.extend(edu_reasons)
            improvement_suggestions.extend(edu_suggestions)
            
            # 4. Location matching (10% weight)
            loc_score, loc_reasons, loc_suggestions = self._calculate_location_match(candidate, job)
            criteria_scores[MatchingCriteria.LOCATION.value] = loc_score
            match_reasons.extend(loc_reasons)
            improvement_suggestions.extend(loc_suggestions)
            
            # 5. Salary matching (10% weight)
            sal_score, sal_reasons, sal_suggestions = self._calculate_salary_match(candidate, job)
            criteria_scores[MatchingCriteria.SALARY.value] = sal_score
            match_reasons.extend(sal_reasons)
            improvement_suggestions.extend(sal_suggestions)
            
            # 6. Language matching (5% weight)
            lang_score, lang_reasons, lang_suggestions = self._calculate_language_match(candidate, job)
            criteria_scores[MatchingCriteria.LANGUAGE.value] = lang_score
            match_reasons.extend(lang_reasons)
            improvement_suggestions.extend(lang_suggestions)
            
            # 7. Industry matching (4% weight)
            ind_score, ind_reasons, ind_suggestions = self._calculate_industry_match(candidate, job)
            criteria_scores[MatchingCriteria.INDUSTRY.value] = ind_score
            match_reasons.extend(ind_reasons)
            improvement_suggestions.extend(ind_suggestions)
            
            # 8. Career level matching (1% weight)
            career_score, career_reasons, career_suggestions = self._calculate_career_level_match(candidate, job)
            criteria_scores[MatchingCriteria.CAREER_LEVEL.value] = career_score
            match_reasons.extend(career_reasons)
            improvement_suggestions.extend(career_suggestions)
            
            # Calculate weighted overall score
            overall_score = sum([
                criteria_scores[criteria.value] * self.criteria_weights[criteria]
                for criteria in self.criteria_weights.keys()
                if criteria.value in criteria_scores
            ])
            
            # Apply Emiratization bonus
            emiratization_bonus = 0.0
            if candidate.is_uae_national and job.emiratization_priority:
                emiratization_bonus = overall_score * (self.emiratization_bonus_multiplier - 1)
                overall_score *= self.emiratization_bonus_multiplier
                match_reasons.append("🇦🇪 UAE National with Emiratization priority job")
            
            # Ensure score doesn't exceed 100
            overall_score = min(overall_score, 100.0)
            
            # Calculate confidence level based on data completeness
            confidence_level = self._calculate_confidence_level(candidate, job, criteria_scores)
            
            return MatchScore(
                overall_score=round(overall_score, 2),
                criteria_scores=criteria_scores,
                confidence_level=confidence_level,
                match_reasons=match_reasons[:5],  # Top 5 reasons
                improvement_suggestions=improvement_suggestions[:3],  # Top 3 suggestions
                emiratization_bonus=emiratization_bonus
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating match score: {str(e)}")
            return MatchScore(
                overall_score=0.0,
                criteria_scores={},
                confidence_level=0.0,
                match_reasons=["Error in calculation"],
                improvement_suggestions=["Please try again"]
            )
    
    def _calculate_skills_match(self, candidate: CandidateProfile, job: JobRequirements) -> Tuple[float, List[str], List[str]]:
        """Calculate skills matching score"""
        if not candidate.skills or not job.required_skills:
            return 0.0, [], ["Add more skills to your profile"]
        
        candidate_skills_lower = [skill.lower().strip() for skill in candidate.skills]
        required_skills_lower = [skill.lower().strip() for skill in job.required_skills]
        preferred_skills_lower = [skill.lower().strip() for skill in job.preferred_skills] if job.preferred_skills else []
        
        # Direct matches
        required_matches = []
        preferred_matches = []
        
        for req_skill in required_skills_lower:
            if req_skill in candidate_skills_lower:
                required_matches.append(req_skill)
            else:
                # Check for skill synonyms
                for candidate_skill in candidate_skills_lower:
                    if self._are_skills_similar(candidate_skill, req_skill):
                        required_matches.append(req_skill)
                        break
        
        for pref_skill in preferred_skills_lower:
            if pref_skill in candidate_skills_lower:
                preferred_matches.append(pref_skill)
            else:
                # Check for skill synonyms
                for candidate_skill in candidate_skills_lower:
                    if self._are_skills_similar(candidate_skill, pref_skill):
                        preferred_matches.append(pref_skill)
                        break
        
        # Calculate score
        required_score = (len(required_matches) / len(required_skills_lower)) * 80  # 80% for required skills
        preferred_score = (len(preferred_matches) / max(len(preferred_skills_lower), 1)) * 20  # 20% for preferred skills
        
        total_score = min(required_score + preferred_score, 100.0)
        
        # Generate reasons and suggestions
        reasons = []
        suggestions = []
        
        if required_matches:
            reasons.append(f"Matches {len(required_matches)}/{len(required_skills_lower)} required skills")
        if preferred_matches:
            reasons.append(f"Has {len(preferred_matches)} preferred skills")
        
        missing_required = set(required_skills_lower) - set([m.lower() for m in required_matches])
        if missing_required:
            suggestions.append(f"Consider learning: {', '.join(list(missing_required)[:3])}")
        
        return total_score, reasons, suggestions
    
    def _calculate_experience_match(self, candidate: CandidateProfile, job: JobRequirements) -> Tuple[float, List[str], List[str]]:
        """Calculate experience matching score"""
        if candidate.experience_years is None or job.min_experience is None:
            return 50.0, [], ["Add experience information"]
        
        candidate_exp = candidate.experience_years
        min_exp = job.min_experience
        max_exp = job.max_experience or (min_exp + 10)  # Default max if not specified
        
        reasons = []
        suggestions = []
        
        if candidate_exp < min_exp:
            # Under-qualified
            gap = min_exp - candidate_exp
            score = max(0, 100 - (gap * 15))  # Penalize 15 points per year under
            suggestions.append(f"Gain {gap} more years of experience")
            reasons.append(f"Has {candidate_exp} years experience (requires {min_exp}+)")
        elif candidate_exp > max_exp:
            # Over-qualified
            excess = candidate_exp - max_exp
            score = max(70, 100 - (excess * 5))  # Penalize 5 points per year over, min 70
            reasons.append(f"Highly experienced ({candidate_exp} years)")
            if excess > 5:
                suggestions.append("Consider senior-level positions")
        else:
            # Perfect fit
            score = 100.0
            reasons.append(f"Perfect experience match ({candidate_exp} years)")
        
        return score, reasons, suggestions
    
    def _calculate_education_match(self, candidate: CandidateProfile, job: JobRequirements) -> Tuple[float, List[str], List[str]]:
        """Calculate education matching score"""
        if not candidate.education_level or not job.education_requirements:
            return 50.0, [], ["Add education information"]
        
        candidate_level = self.education_hierarchy.get(candidate.education_level.lower(), 0)
        
        reasons = []
        suggestions = []
        
        # Check if candidate meets any of the education requirements
        meets_requirement = False
        highest_required = 0
        
        for req in job.education_requirements:
            req_level = self.education_hierarchy.get(req.lower(), 0)
            highest_required = max(highest_required, req_level)
            if candidate_level >= req_level:
                meets_requirement = True
                break
        
        if meets_requirement:
            if candidate_level > highest_required:
                score = 100.0
                reasons.append("Exceeds education requirements")
            else:
                score = 90.0
                reasons.append("Meets education requirements")
        else:
            gap = highest_required - candidate_level
            score = max(0, 100 - (gap * 20))  # Penalize 20 points per level
            suggestions.append("Consider pursuing higher education")
            reasons.append("Below required education level")
        
        return score, reasons, suggestions
    
    def _calculate_location_match(self, candidate: CandidateProfile, job: JobRequirements) -> Tuple[float, List[str], List[str]]:
        """Calculate location matching score"""
        if not candidate.location or not job.location:
            return 50.0, [], ["Add location information"]
        
        candidate_emirate = candidate.location.get('emirate', '').strip()
        job_emirate = job.location.get('emirate', '').strip()
        
        reasons = []
        suggestions = []
        
        if candidate_emirate.lower() == job_emirate.lower():
            score = 100.0
            reasons.append(f"Located in {job_emirate}")
        elif candidate_emirate in self.uae_emirates and job_emirate in self.uae_emirates:
            # Different emirates but both in UAE
            score = 70.0
            reasons.append("Within UAE (different emirate)")
            suggestions.append("Consider relocation or remote work options")
        else:
            # International or missing data
            score = 30.0
            suggestions.append("Consider relocation to UAE")
        
        return score, reasons, suggestions
    
    def _calculate_salary_match(self, candidate: CandidateProfile, job: JobRequirements) -> Tuple[float, List[str], List[str]]:
        """Calculate salary matching score"""
        if not candidate.salary_expectation or not job.salary_range:
            return 50.0, [], ["Add salary information"]
        
        candidate_min = candidate.salary_expectation.get('min_salary', 0)
        candidate_max = candidate.salary_expectation.get('max_salary', candidate_min * 1.2)
        
        job_min = job.salary_range.get('min_salary', 0)
        job_max = job.salary_range.get('max_salary', job_min * 1.2)
        
        reasons = []
        suggestions = []
        
        # Check for overlap
        if candidate_min <= job_max and candidate_max >= job_min:
            # There's overlap
            overlap_start = max(candidate_min, job_min)
            overlap_end = min(candidate_max, job_max)
            overlap_size = overlap_end - overlap_start
            
            candidate_range = candidate_max - candidate_min
            job_range = job_max - job_min
            
            # Score based on overlap percentage
            overlap_percentage = overlap_size / max(candidate_range, job_range, 1)
            score = min(100.0, overlap_percentage * 100 + 50)
            
            reasons.append("Salary expectations align")
        elif candidate_min > job_max:
            # Candidate expects too much
            gap = candidate_min - job_max
            gap_percentage = gap / job_max if job_max > 0 else 1
            score = max(0, 100 - (gap_percentage * 100))
            suggestions.append("Consider adjusting salary expectations")
        else:
            # Job offers more than candidate expects
            score = 100.0
            reasons.append("Job offers competitive salary")
        
        return score, reasons, suggestions
    
    def _calculate_language_match(self, candidate: CandidateProfile, job: JobRequirements) -> Tuple[float, List[str], List[str]]:
        """Calculate language matching score"""
        if not job.languages:
            return 100.0, [], []  # No language requirements
        
        if not candidate.languages:
            return 0.0, [], ["Add language skills to profile"]
        
        candidate_langs = [lang.lower().strip() for lang in candidate.languages]
        required_langs = [lang.lower().strip() for lang in job.languages]
        
        matches = [lang for lang in required_langs if lang in candidate_langs]
        score = (len(matches) / len(required_langs)) * 100
        
        reasons = []
        suggestions = []
        
        if matches:
            reasons.append(f"Speaks required languages: {', '.join(matches)}")
        
        missing = set(required_langs) - set(matches)
        if missing:
            suggestions.append(f"Consider learning: {', '.join(list(missing))}")
        
        return score, reasons, suggestions
    
    def _calculate_industry_match(self, candidate: CandidateProfile, job: JobRequirements) -> Tuple[float, List[str], List[str]]:
        """Calculate industry matching score"""
        if not job.industry:
            return 100.0, [], []
        
        if not candidate.industry_experience:
            return 30.0, [], ["Add industry experience"]
        
        candidate_industries = [ind.lower().strip() for ind in candidate.industry_experience]
        job_industry = job.industry.lower().strip()
        
        if job_industry in candidate_industries:
            return 100.0, [f"Experience in {job.industry}"], []
        else:
            # Check for related industries (simplified)
            related_score = 50.0  # Default for different but potentially transferable
            return related_score, [], [f"Consider gaining experience in {job.industry}"]
    
    def _calculate_career_level_match(self, candidate: CandidateProfile, job: JobRequirements) -> Tuple[float, List[str], List[str]]:
        """Calculate career level matching score"""
        if not candidate.career_level or not job.career_level:
            return 50.0, [], []
        
        candidate_level = self.career_hierarchy.get(candidate.career_level.lower(), 0)
        job_level = self.career_hierarchy.get(job.career_level.lower(), 0)
        
        reasons = []
        suggestions = []
        
        if candidate_level == job_level:
            score = 100.0
            reasons.append("Perfect career level match")
        elif abs(candidate_level - job_level) == 1:
            score = 80.0
            if candidate_level > job_level:
                reasons.append("Slightly overqualified")
            else:
                reasons.append("Growth opportunity")
        else:
            gap = abs(candidate_level - job_level)
            score = max(0, 100 - (gap * 15))
            if candidate_level > job_level:
                suggestions.append("Consider senior-level positions")
            else:
                suggestions.append("Gain more experience for this level")
        
        return score, reasons, suggestions
    
    def _are_skills_similar(self, skill1: str, skill2: str) -> bool:
        """Check if two skills are similar using synonym mapping"""
        skill1 = skill1.lower().strip()
        skill2 = skill2.lower().strip()
        
        # Direct match
        if skill1 == skill2:
            return True
        
        # Check synonyms
        for base_skill, synonyms in self.skill_synonyms.items():
            if (skill1 == base_skill and skill2 in synonyms) or \
               (skill2 == base_skill and skill1 in synonyms) or \
               (skill1 in synonyms and skill2 in synonyms):
                return True
        
        # Check partial matches (for compound skills)
        if len(skill1) > 3 and len(skill2) > 3:
            if skill1 in skill2 or skill2 in skill1:
                return True
        
        return False
    
    def _calculate_confidence_level(self, candidate: CandidateProfile, job: JobRequirements, criteria_scores: Dict[str, float]) -> float:
        """Calculate confidence level based on data completeness"""
        data_completeness = 0
        total_fields = 0
        
        # Check candidate data completeness
        candidate_fields = [
            candidate.skills, candidate.experience_years, candidate.education_level,
            candidate.location, candidate.languages, candidate.industry_experience
        ]
        
        for field in candidate_fields:
            total_fields += 1
            if field:
                data_completeness += 1
        
        # Check job data completeness
        job_fields = [
            job.required_skills, job.min_experience, job.education_requirements,
            job.location, job.languages, job.industry
        ]
        
        for field in job_fields:
            total_fields += 1
            if field:
                data_completeness += 1
        
        completeness_ratio = data_completeness / total_fields if total_fields > 0 else 0
        
        # Confidence is based on data completeness and score consistency
        score_variance = self._calculate_score_variance(criteria_scores)
        consistency_factor = max(0, 1 - (score_variance / 100))
        
        confidence = (completeness_ratio * 0.7 + consistency_factor * 0.3) * 100
        
        return round(min(confidence, 100.0), 2)
    
    def _calculate_score_variance(self, scores: Dict[str, float]) -> float:
        """Calculate variance in criteria scores"""
        if len(scores) < 2:
            return 0
        
        values = list(scores.values())
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        
        return math.sqrt(variance)
    
    def find_best_matches(self, candidate: CandidateProfile, jobs: List[JobRequirements], limit: int = 10) -> List[Tuple[JobRequirements, MatchScore]]:
        """Find best job matches for a candidate"""
        matches = []
        
        for job in jobs:
            match_score = self.calculate_match_score(candidate, job)
            matches.append((job, match_score))
        
        # Sort by overall score (descending)
        matches.sort(key=lambda x: x[1].overall_score, reverse=True)
        
        return matches[:limit]
    
    def find_best_candidates(self, job: JobRequirements, candidates: List[CandidateProfile], limit: int = 10) -> List[Tuple[CandidateProfile, MatchScore]]:
        """Find best candidate matches for a job"""
        matches = []
        
        for candidate in candidates:
            match_score = self.calculate_match_score(candidate, job)
            matches.append((candidate, match_score))
        
        # Sort by overall score (descending), with Emiratization priority
        matches.sort(key=lambda x: (x[1].overall_score, x[0].is_uae_national), reverse=True)
        
        return matches[:limit]

# Global enhanced matching engine instance
enhanced_matching_engine = EnhancedMatchingEngine()

