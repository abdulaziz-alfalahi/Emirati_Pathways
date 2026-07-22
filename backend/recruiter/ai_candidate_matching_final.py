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
logger = logging.getLogger(__name__)

# Only write verbose scoring debug logs in non-production environments
_DEBUG_SCORING = os.getenv('FLASK_ENV', 'production') != 'production'

if _DEBUG_SCORING:
    try:
        fh = logging.FileHandler('matching_debug.log')
        fh.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        logger.addHandler(fh)
    except Exception:
        pass  # Don't fail startup over debug log file


class AICandidateMatchingEngineFinal:
    """
    AI-powered candidate matching engine for recruiters.
    Finds top 10 candidates for a job posting with employment status filtering.
    """
    
    def __init__(self):
        """Initialize AI candidate matching engine"""
        self.logger = logging.getLogger(__name__)
        self.logger.info("AICandidateMatchingEngineFinal initialized")
        
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
        
        self.logger.info("AICandidateMatchingEngineFinal initialized")
        
    def _get_candidate_skills(self, candidate: Dict[str, Any]) -> List[str]:
        skills_raw = candidate.get('skills')
        if isinstance(skills_raw, list):
            return [s for s in skills_raw if isinstance(s, str)]
        elif isinstance(skills_raw, str):
            return [s.strip() for s in skills_raw.replace('{','').replace('}','').split(',') if s.strip()]
        return []
    
    # Cap on how many candidates get the expensive AI pass. The AI scorer
    # makes one Qwen LLM call per candidate, so scoring the full pool
    # (~4k live) took minutes and stalled the worker (issue #124). We
    # rule-score everyone cheaply, then AI-score only this many top rule
    # matches — env-overridable for tuning.
    AI_SHORTLIST_CAP = int(os.getenv('MATCH_AI_SHORTLIST_CAP', '40'))

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
                                     ('employed', 'candidate', 'open_to_opportunities', None for all)
            top_n: Number of top candidates to return (default: 10)
        
        Returns:
            Dictionary with matched candidates and metadata
        """
        try:
            if _DEBUG_SCORING:
                self.logger.debug(
                    "Match called: %d candidates for JD '%s'",
                    len(candidates), jd_data.get('basic_info', {}).get('title'),
                )
            
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

            # ── Stage 1: cheap rule-based pre-filter (no LLM) ──────────────
            # Rank everyone by the fast rules scorer, then only the top
            # AI_SHORTLIST_CAP get the expensive AI pass. Below the cap this
            # is a no-op, so small pools behave exactly as before (#124).
            shortlist = filtered_candidates
            if self.matching_engine and len(filtered_candidates) > self.AI_SHORTLIST_CAP:
                prelim = []
                for candidate in filtered_candidates:
                    try:
                        rule_data = self._score_with_rules(jd_data, candidate)
                        prelim.append((rule_data['overall_score'], candidate))
                    except Exception as e:
                        self.logger.error(f"Rule pre-score failed for {candidate.get('candidate_id')}: {e}")
                # Stable: preserve the SQL ordering (skills-first) within ties.
                prelim.sort(key=lambda x: x[0], reverse=True)
                shortlist = [c for _, c in prelim[:self.AI_SHORTLIST_CAP]]
                self.logger.info(
                    f"Pre-filtered {len(filtered_candidates)} → {len(shortlist)} "
                    f"for AI scoring (cap={self.AI_SHORTLIST_CAP})"
                )

            # ── Stage 2: full scoring (AI if available) on the shortlist ──
            scored_candidates = []
            for candidate in shortlist:
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
                'ai_scored_candidates': len(scored_candidates),
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
            candidate_status = candidate.get('employment_status', 'candidate').lower()
            
            # Handle different status values
            if status_filter.lower() == 'employed':
                if candidate_status in ['employed', 'currently_employed']:
                    filtered.append(candidate)
            
            elif status_filter.lower() == 'candidate':
                if candidate_status in ['candidate', 'unemployed', 'actively_looking']:
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
                self.logger.info(f"Scoring candidate {candidate.get('candidate_id')} with AI engine")
                return self._score_with_ai(jd_data, candidate)
            else:
                self.logger.info(f"Scoring candidate {candidate.get('candidate_id')} with rules")
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
            cleaned_skills = self._get_candidate_skills(candidate)
            # Prepare data for matching engine
            cv_data = {
                'personal_info': {
                    'full_name': f"{candidate.get('first_name') or ''} {candidate.get('last_name') or ''}".strip(),
                    'email': candidate.get('email') or '',
                    'phone': candidate.get('phone') or '',
                    'emirate': candidate.get('emirate') or '',
                    'nationality': candidate.get('nationality') or ''
                },
                'experience': candidate.get('experience') or [],
                'education': candidate.get('education') or [],
                'skills': cleaned_skills,
                'experience_years': candidate.get('experience_years') or 0,
                'english_proficiency': candidate.get('english_proficiency') or 'conversational',
                'preferences': {
                    'target_roles': candidate.get('compass_target_roles') or [],
                    'willing_to_relocate': bool(candidate.get('compass_willing_to_relocate')),
                    'expected_salary_range': candidate.get('compass_expected_salary_range') or '',
                    'notice_period': candidate.get('compass_notice_period') or '',
                    'preferred_location': candidate.get('compass_preferred_location') or '',
                    'english_proficiency': candidate.get('english_proficiency') or 'conversational'
                }
            }
            
            # Convert JD to format expected by matching engine
            # Handle requirements that may be a dict or list
            raw_reqs = jd_data.get('requirements', [])
            if isinstance(raw_reqs, dict):
                # Flatten dict values: {"skills": ["Python", "React"]} -> ["Python", "React"]
                formatted_reqs = []
                for key, values in raw_reqs.items():
                    if isinstance(values, list):
                        for item in values:
                            formatted_reqs.append(str(item) if not isinstance(item, dict) else item.get('description', str(item)))
                    elif isinstance(values, str):
                        formatted_reqs.append(values)
            else:
                formatted_reqs = [req.get('description', '') if isinstance(req, dict) else str(req) for req in raw_reqs]
            
            raw_resps = jd_data.get('responsibilities', [])
            if isinstance(raw_resps, dict):
                formatted_resps = []
                for key, values in raw_resps.items():
                    if isinstance(values, list):
                        for item in values:
                            formatted_resps.append(str(item) if not isinstance(item, dict) else item.get('description', str(item)))
            else:
                formatted_resps = [resp.get('description', '') if isinstance(resp, dict) else str(resp) for resp in raw_resps]
            
            jd_formatted = {
                'title': jd_data.get('basic_info', {}).get('title', ''),
                'description': jd_data.get('description', ''),
                'requirements': formatted_reqs,
                'responsibilities': formatted_resps,
                'location': jd_data.get('basic_info', {}).get('emirate', ''),
                'job_type': jd_data.get('basic_info', {}).get('job_type', ''),
                'experience_required': self._extract_experience_requirement(jd_data)
            }
            
            # Perform matching
            match_result = self.matching_engine.enhanced_single_match(cv_data, jd_formatted)
            
            # Extract score - handle nested structure
            extracted_score = 0.0
            
            if 'enhanced_scoring' in match_result:
                enhanced = match_result['enhanced_scoring']
                # Try to get overall compatibility score
                if 'overall_compatibility' in enhanced:
                    extracted_score = float(enhanced['overall_compatibility'])
                elif 'overall_score' in enhanced:
                    extracted_score = float(enhanced['overall_score'])
            elif 'overall_score' in match_result:
                extracted_score = float(match_result['overall_score'])
            
            # Calculate rule-based score as a baseline/fallback
            rule_result = self._score_with_rules(jd_data, candidate)
            rule_score = rule_result['overall_score']
            
            # Use the higher of the two scores
            final_score = max(extracted_score, rule_score)
            
            # Merge details
            breakdown = match_result.get('enhanced_scoring', {})
            if rule_score > extracted_score:
                # If rule score is higher, merge rule breakdown
                breakdown.update(rule_result['breakdown'])
            
            if _DEBUG_SCORING:
                self.logger.debug("Final Score for %s: %.1f (AI: %.1f, Rule: %.1f)", candidate.get('candidate_id'), final_score, extracted_score, rule_score)
                
            return {
                'overall_score': final_score,
                'breakdown': breakdown,
                'matching_skills': list(set(match_result.get('matching_skills', []) + rule_result.get('matching_skills', []))),
                'missing_skills': [s for s in match_result.get('missing_skills', []) if s not in rule_result.get('matching_skills', [])],
                'strengths': list(set(match_result.get('strengths', []) + rule_result.get('strengths', []))),
                'concerns': match_result.get('concerns', [])
            }
        except Exception as e:
            self.logger.error(f"Error in AI scoring: {e}")
            self.logger.error("Exception in _score_with_ai: %s", e)
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
            
            if _DEBUG_SCORING:
                self.logger.debug("JD Requirements: %s", json.dumps(jd_requirements))
            
            self.logger.info(f"JD Requirements count: {len(jd_requirements) if isinstance(jd_requirements, list) else 'dict'}")
            required_skills = []
            
            # Handle dict format: {"skills": ["Python", "React"], "experience": [...]}
            if isinstance(jd_requirements, dict):
                # Only extract actual skills for skill matching
                # Experience and education are handled by their own scoring functions
                skills_list = jd_requirements.get('skills', [])
                if isinstance(skills_list, list):
                    for item in skills_list:
                        if isinstance(item, str):
                            required_skills.append(item.lower())
                        elif isinstance(item, dict):
                            desc = item.get('description', item.get('name', ''))
                            if desc:
                                required_skills.append(desc.lower())
                elif isinstance(skills_list, str):
                    required_skills.append(skills_list.lower())
            elif isinstance(jd_requirements, list):
                for req in jd_requirements:
                    if isinstance(req, dict):
                        if req.get('category') == 'skills':
                            required_skills.append(req.get('description', '').lower())
                    elif isinstance(req, str):
                        required_skills.append(req.lower())
            
            if _DEBUG_SCORING:
                self.logger.debug("Required Skills: %s | Candidate Skills: %s", required_skills, candidate.get('skills', []))

            self.logger.info(f"Required skills: {required_skills}")
            candidate_skills = [s.lower() for s in self._get_candidate_skills(candidate)]
            self.logger.info(f"Candidate skills: {candidate_skills}")
            
            if required_skills:
                matched = 0
                for skill_req in required_skills:
                    # Check if any candidate skill matches this requirement
                    # Either exact match, or candidate skill is in requirement string, or requirement string is in candidate skill
                    matched_this_req = False
                    for cand_skill in candidate_skills:
                        if cand_skill in skill_req or skill_req in cand_skill:
                            matched_this_req = True
                            matching_skills.append(skill_req) # Add the requirement as matched
                            break
                    
                    if matched_this_req:
                        matched += 1
                    else:
                        missing_skills.append(skill_req)
                
                skills_score = (matched / len(required_skills)) * 40
                score += skills_score
                breakdown['skills'] = skills_score
                
                if skills_score >= 30:
                    strengths.append("Strong skills match")
                elif skills_score < 15:
                    concerns.append("Limited skills match")
            
            # Experience matching (30 points)
            required_exp = self._extract_experience_requirement(jd_data)
            candidate_exp = candidate.get('experience_years') or 0
            
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
            candidate_education = (candidate.get('education_level') or '').lower()
            
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
            
            # (Location/emirate intentionally NOT scored — geography is informational
            # only; residence must not change the score. See issue #12. Commute/
            # distance is surfaced in the UI for humans to weigh, never a score input.)

            # Career Compass Preferences (Salary, Target Roles)
            # 1. Salary Check
            expected_salary = candidate.get('compass_expected_salary_range')
            comp = jd_data.get('compensation', {})
            jd_max = comp.get('salary_max')
            
            if expected_salary and jd_max:
                try:
                    # Clean and parse expected minimum salary
                    s_txt = str(expected_salary).lower().replace(',', '').replace('aed', '').strip()
                    min_expected = 0
                    if '-' in s_txt:
                        min_expected = int(float(s_txt.split('-')[0].strip()))
                    elif '+' in s_txt:
                        min_expected = int(float(s_txt.replace('+', '').strip()))
                    elif s_txt.isdigit():
                        min_expected = int(s_txt)
                        
                    if min_expected > 0:
                        if min_expected <= jd_max:
                            strengths.append("Salary expectations align with vacancy budget")
                        else:
                            # Mismatch penalty: reduce score and flag concern
                            score -= 10
                            concerns.append(f"Expected salary ({expected_salary}) exceeds vacancy maximum budget ({jd_max} AED)")
                except Exception as sal_err:
                    self.logger.warning(f"Error parsing expected salary in rule match: {sal_err}")
            
            # 2. Target Roles Check
            target_roles = candidate.get('compass_target_roles', [])
            jd_title = jd_data.get('basic_info', {}).get('title', '').lower()
            if target_roles and jd_title:
                matched_role = None
                for role in target_roles:
                    if isinstance(role, str):
                        role_clean = role.lower().strip()
                        if role_clean and (role_clean in jd_title or jd_title in role_clean):
                            matched_role = role
                            break
                if matched_role:
                    score += 5  # Bonus points for aligned target role
                    strengths.append(f"Target role aligns with vacancy ({matched_role})")
            
            # (No flat UAE-national bonus — the pool is all-Emirati, so a constant
            # bonus doesn't differentiate and only inflates scores. National-
            # development priority is a separate, disclosed axis. See issue #12.)

            return {
                'overall_score': max(0.0, min(score, 100)),
                'breakdown': breakdown,
                'matching_skills': matching_skills,
                'missing_skills': missing_skills,
                'strengths': strengths,
                'concerns': concerns
            }
            
        except Exception as e:
            self.logger.error(f"Error in rule-based scoring: {e}")
            self.logger.error("Exception in _score_with_rules: %s", e)
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
        import re
        requirements = jd_data.get('requirements', [])
        
        # Flatten requirements to a list of strings
        items = []
        if isinstance(requirements, dict):
            for key, values in requirements.items():
                if isinstance(values, list):
                    items.extend([str(v) for v in values])
                elif isinstance(values, str):
                    items.append(values)
        elif isinstance(requirements, list):
            for req in requirements:
                if isinstance(req, dict):
                    if req.get('category') == 'experience':
                        items.append(req.get('description', ''))
                elif isinstance(req, str):
                    items.append(req)
        
        for desc in items:
            match = re.search(r'(\d+)\s*(?:years?|yrs?)', desc.lower())
            if match:
                return int(match.group(1))
        return 0
    
    def _extract_education_requirement(self, jd_data: Dict[str, Any]) -> str:
        """Extract education requirement from JD"""
        requirements = jd_data.get('requirements', [])
        
        # Flatten requirements to a list of strings
        items = []
        if isinstance(requirements, dict):
            for key, values in requirements.items():
                if isinstance(values, list):
                    items.extend([str(v) for v in values])
                elif isinstance(values, str):
                    items.append(values)
        elif isinstance(requirements, list):
            for req in requirements:
                if isinstance(req, dict):
                    if req.get('category') == 'education':
                        items.append(req.get('description', ''))
                elif isinstance(req, str):
                    items.append(req)
        
        for desc in items:
            desc_lower = desc.lower()
            if 'phd' in desc_lower or 'doctorate' in desc_lower:
                return 'phd'
            elif 'master' in desc_lower:
                return 'master'
            elif 'bachelor' in desc_lower:
                return 'bachelor'
            elif 'diploma' in desc_lower:
                return 'diploma'
        return ''


# Singleton instance
_ai_matching_engine_instance = None


def get_ai_matching_engine_final() -> AICandidateMatchingEngineFinal:
    """Get singleton instance of AICandidateMatchingEngineFinal"""
    global _ai_matching_engine_instance
    if _ai_matching_engine_instance is None:
        _ai_matching_engine_instance = AICandidateMatchingEngineFinal()
    return _ai_matching_engine_instance
