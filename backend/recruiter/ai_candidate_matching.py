#!/usr/bin/env python3
"""
AI Candidate Matching Engine
Emirati Journey Platform - Recruiter Services

Provides AI-powered candidate matching with employment status filtering.
Finds top 10 candidates for a job posting with option to filter by employment status.
"""

import os
import sys
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import existing matching engine
try:
    from matching.job_matching_engine_optimized import EnhancedJobMatchingEngine
    MATCHING_ENGINE_AVAILABLE = True
except ImportError:
    MATCHING_ENGINE_AVAILABLE = False
    logging.warning("Enhanced matching engine not available")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AICandidateMatchingEngine:
    """
    AI-powered candidate matching engine for recruiters.
    Finds top 10 candidates for a job posting with employment status filtering.
    """
    
    def __init__(self):
        """Initialize AI candidate matching engine"""
        self.logger = logging.getLogger(__name__)
        
        # Initialize enhanced matching engine if available
        if MATCHING_ENGINE_AVAILABLE:
            try:
                self.matching_engine = EnhancedJobMatchingEngine()
                self.logger.info("Enhanced matching engine initialized")
            except Exception as e:
                self.logger.warning(f"Could not initialize enhanced matching engine: {e}")
                self.matching_engine = None
        else:
            self.matching_engine = None
        
        self.logger.info("AICandidateMatchingEngine initialized")
    
    def match_candidates_for_job(
        self,
        jd_data: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        employment_status_filter: Optional[str] = None,
        top_n: int = 10
    ) -> Dict[str, Any]:
        """
        Match candidates to a job description and return top N matches.
        
        Args:
            jd_data: Job description data
            candidates: List of candidate profiles
            employment_status_filter: Filter by employment status 
                                     ('employed', 'job_seeker', 'open_to_opportunities', None for all)
            top_n: Number of top candidates to return (default: 10)
        
        Returns:
            Dictionary with matched candidates and metadata
        """
        try:
            start_time = datetime.now()
            
            # Filter candidates by employment status if specified
            filtered_candidates = self._filter_by_employment_status(
                candidates, 
                employment_status_filter
            )
            
            self.logger.info(
                f"Matching {len(filtered_candidates)} candidates "
                f"(filtered from {len(candidates)}) for job: {jd_data.get('basic_info', {}).get('title', 'Unknown')}"
            )
            
            # Score each candidate
            scored_candidates = []
            for candidate in filtered_candidates:
                try:
                    score_data = self._score_candidate(jd_data, candidate)
                    scored_candidates.append({
                        'candidate': candidate,
                        'match_score': score_data['overall_score'],
                        'score_breakdown': score_data['breakdown'],
                        'matching_skills': score_data.get('matching_skills', []),
                        'missing_skills': score_data.get('missing_skills', []),
                        'strengths': score_data.get('strengths', []),
                        'concerns': score_data.get('concerns', [])
                    })
                except Exception as e:
                    self.logger.error(f"Error scoring candidate {candidate.get('candidate_id')}: {e}")
                    continue
            
            # Sort by match score (descending)
            scored_candidates.sort(key=lambda x: x['match_score'], reverse=True)
            
            # Get top N
            top_candidates = scored_candidates[:top_n]
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                'success': True,
                'job_id': jd_data.get('metadata', {}).get('jd_id'),
                'job_title': jd_data.get('basic_info', {}).get('title'),
                'total_candidates_reviewed': len(candidates),
                'filtered_candidates': len(filtered_candidates),
                'employment_status_filter': employment_status_filter,
                'top_matches': top_candidates,
                'match_count': len(top_candidates),
                'processing_time_seconds': processing_time,
                'timestamp': datetime.now().isoformat()
            }
            
            self.logger.info(
                f"Found {len(top_candidates)} top matches in {processing_time:.2f}s"
            )
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error in match_candidates_for_job: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'top_matches': []
            }
    
    def _filter_by_employment_status(
        self,
        candidates: List[Dict[str, Any]],
        status_filter: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Filter candidates by employment status"""
        if not status_filter:
            return candidates
        
        filtered = []
        for candidate in candidates:
            candidate_status = candidate.get('employment_status', 'job_seeker').lower()
            
            # Handle different status values
            if status_filter.lower() == 'employed':
                if candidate_status in ['employed', 'currently_employed']:
                    filtered.append(candidate)
            
            elif status_filter.lower() == 'job_seeker':
                if candidate_status in ['job_seeker', 'unemployed', 'actively_looking']:
                    filtered.append(candidate)
            
            elif status_filter.lower() == 'open_to_opportunities':
                if candidate_status in ['open_to_opportunities', 'passive', 'open']:
                    filtered.append(candidate)
            
            else:
                # If unknown filter, include all
                filtered.append(candidate)
        
        self.logger.info(
            f"Filtered {len(candidates)} candidates to {len(filtered)} "
            f"with status filter: {status_filter}"
        )
        
        return filtered
    
    def _score_candidate(
        self,
        jd_data: Dict[str, Any],
        candidate: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score a candidate against job description"""
        try:
            # If enhanced matching engine is available, use it
            if self.matching_engine:
                return self._score_with_ai(jd_data, candidate)
            else:
                return self._score_with_rules(jd_data, candidate)
                
        except Exception as e:
            self.logger.error(f"Error scoring candidate: {e}")
            # Return default score
            return {
                'overall_score': 0.0,
                'breakdown': {},
                'matching_skills': [],
                'missing_skills': [],
                'strengths': [],
                'concerns': ['Error during scoring']
            }
    
    def _score_with_ai(
        self,
        jd_data: Dict[str, Any],
        candidate: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score candidate using AI matching engine"""
        try:
            # Prepare data for matching engine
            cv_data = {
                'personal_info': {
                    'full_name': f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}",
                    'email': candidate.get('email', ''),
                    'phone': candidate.get('phone', ''),
                    'emirate': candidate.get('emirate', ''),
                    'nationality': candidate.get('nationality', '')
                },
                'experience': candidate.get('experience', []),
                'education': candidate.get('education', []),
                'skills': candidate.get('skills', []),
                'experience_years': candidate.get('experience_years', 0)
            }
            
            # Convert JD to format expected by matching engine
            jd_formatted = {
                'title': jd_data.get('basic_info', {}).get('title', ''),
                'description': jd_data.get('description', ''),
                'requirements': [req.get('description', '') for req in jd_data.get('requirements', [])],
                'responsibilities': [resp.get('description', '') for resp in jd_data.get('responsibilities', [])],
                'location': jd_data.get('basic_info', {}).get('emirate', ''),
                'job_type': jd_data.get('basic_info', {}).get('job_type', ''),
                'experience_required': self._extract_experience_requirement(jd_data)
            }
            
            # Use matching engine
            match_result = self.matching_engine.match_cv_to_job(cv_data, jd_formatted)
            
            return {
                'overall_score': match_result.get('overall_score', 0.0) * 100,  # Convert to percentage
                'breakdown': match_result.get('breakdown', {}),
                'matching_skills': match_result.get('matching_skills', []),
                'missing_skills': match_result.get('missing_skills', []),
                'strengths': match_result.get('strengths', []),
                'concerns': match_result.get('concerns', [])
            }
            
        except Exception as e:
            self.logger.error(f"Error in AI scoring: {e}")
            # Fallback to rule-based scoring
            return self._score_with_rules(jd_data, candidate)
    
    def _score_with_rules(
        self,
        jd_data: Dict[str, Any],
        candidate: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Score candidate using rule-based system (fallback)"""
        try:
            score = 0.0
            breakdown = {}
            matching_skills = []
            missing_skills = []
            strengths = []
            concerns = []
            
            # Skills matching (40 points)
            jd_requirements = jd_data.get('requirements', [])
            required_skills = []
            for req in jd_requirements:
                if req.get('category') == 'skills':
                    required_skills.append(req.get('description', '').lower())
            
            candidate_skills = [s.lower() for s in candidate.get('skills', [])]
            
            if required_skills:
                matched = 0
                for skill in required_skills:
                    if any(skill in cs for cs in candidate_skills):
                        matched += 1
                        matching_skills.append(skill)
                    else:
                        missing_skills.append(skill)
                
                skills_score = (matched / len(required_skills)) * 40
                score += skills_score
                breakdown['skills'] = skills_score
                
                if skills_score >= 30:
                    strengths.append("Strong skills match")
                elif skills_score < 15:
                    concerns.append("Limited skills match")
            
            # Experience matching (30 points)
            required_exp = self._extract_experience_requirement(jd_data)
            candidate_exp = candidate.get('experience_years', 0)
            
            if required_exp:
                if candidate_exp >= required_exp:
                    exp_score = 30
                    strengths.append(f"{candidate_exp} years of experience (required: {required_exp})")
                elif candidate_exp >= required_exp * 0.7:
                    exp_score = 20
                else:
                    exp_score = 10
                    concerns.append(f"Less experience than required ({candidate_exp} vs {required_exp} years)")
                
                score += exp_score
                breakdown['experience'] = exp_score
            
            # Education matching (15 points)
            required_education = self._extract_education_requirement(jd_data)
            candidate_education = candidate.get('education_level', '').lower()
            
            education_levels = ['high_school', 'diploma', 'bachelor', 'master', 'phd']
            
            if required_education and candidate_education:
                try:
                    req_level = education_levels.index(required_education.lower())
                    cand_level = education_levels.index(candidate_education)
                    
                    if cand_level >= req_level:
                        edu_score = 15
                        strengths.append("Meets education requirements")
                    else:
                        edu_score = 7
                        concerns.append("Education level below requirements")
                    
                    score += edu_score
                    breakdown['education'] = edu_score
                except ValueError:
                    pass
            
            # Location matching (10 points)
            jd_emirate = jd_data.get('basic_info', {}).get('emirate', '').lower()
            candidate_emirate = candidate.get('emirate', '').lower()
            
            if jd_emirate and candidate_emirate:
                if jd_emirate == candidate_emirate:
                    location_score = 10
                    strengths.append("Located in same emirate")
                else:
                    location_score = 5
                
                score += location_score
                breakdown['location'] = location_score
            
            # UAE National preference (5 points)
            if candidate.get('is_uae_national', False):
                score += 5
                breakdown['uae_national'] = 5
                strengths.append("UAE National")
            
            return {
                'overall_score': min(score, 100),
                'breakdown': breakdown,
                'matching_skills': matching_skills,
                'missing_skills': missing_skills,
                'strengths': strengths,
                'concerns': concerns
            }
            
        except Exception as e:
            self.logger.error(f"Error in rule-based scoring: {e}")
            return {
                'overall_score': 0.0,
                'breakdown': {},
                'matching_skills': [],
                'missing_skills': [],
                'strengths': [],
                'concerns': ['Error during scoring']
            }
    
    def _extract_experience_requirement(self, jd_data: Dict[str, Any]) -> int:
        """Extract years of experience required from JD"""
        requirements = jd_data.get('requirements', [])
        for req in requirements:
            if req.get('category') == 'experience':
                desc = req.get('description', '').lower()
                # Try to extract number of years
                import re
                match = re.search(r'(\d+)\s*(?:years?|yrs?)', desc)
                if match:
                    return int(match.group(1))
        return 0
    
    def _extract_education_requirement(self, jd_data: Dict[str, Any]) -> str:
        """Extract education requirement from JD"""
        requirements = jd_data.get('requirements', [])
        for req in requirements:
            if req.get('category') == 'education':
                desc = req.get('description', '').lower()
                if 'phd' in desc or 'doctorate' in desc:
                    return 'phd'
                elif 'master' in desc:
                    return 'master'
                elif 'bachelor' in desc:
                    return 'bachelor'
                elif 'diploma' in desc:
                    return 'diploma'
        return ''


# Singleton instance
_ai_matching_engine_instance = None


def get_ai_matching_engine() -> AICandidateMatchingEngine:
    """Get singleton instance of AICandidateMatchingEngine"""
    global _ai_matching_engine_instance
    if _ai_matching_engine_instance is None:
        _ai_matching_engine_instance = AICandidateMatchingEngine()
    return _ai_matching_engine_instance

