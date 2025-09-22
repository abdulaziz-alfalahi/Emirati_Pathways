#!/usr/bin/env python3
"""
Job Matching Engine - CV to JD Matching and Ranking System
Comprehensive algorithms for candidate-job matching with scoring
"""

import json
import time
import logging
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MatchingScore:
    """Structured matching score with detailed breakdown."""
    overall_score: float
    skills_score: float
    experience_score: float
    education_score: float
    location_score: float
    language_score: float
    confidence: float
    breakdown: Dict[str, Any]

class JobMatchingEngine:
    """Advanced job matching engine for CV-JD comparison."""
    
    def __init__(self):
        self.skill_synonyms = self._load_skill_synonyms()
        self.experience_weights = {
            'exact_match': 1.0,
            'related_field': 0.8,
            'transferable': 0.6,
            'entry_level': 0.4
        }
        logger.info("SUCCESS: Job Matching Engine initialized")
    
    def _load_skill_synonyms(self) -> Dict[str, List[str]]:
        """Load skill synonyms for better matching."""
        return {
            'javascript': ['js', 'ecmascript', 'node.js', 'nodejs'],
            'python': ['py', 'django', 'flask', 'fastapi'],
            'react': ['reactjs', 'react.js', 'jsx'],
            'angular': ['angularjs', 'angular.js'],
            'vue': ['vuejs', 'vue.js'],
            'sql': ['mysql', 'postgresql', 'sqlite', 'database'],
            'aws': ['amazon web services', 'cloud computing'],
            'docker': ['containerization', 'containers'],
            'kubernetes': ['k8s', 'container orchestration'],
            'machine learning': ['ml', 'ai', 'artificial intelligence'],
            'data science': ['data analysis', 'analytics', 'big data'],
            'project management': ['pm', 'scrum', 'agile'],
            'leadership': ['team lead', 'management', 'supervision'],
            'communication': ['presentation', 'public speaking', 'writing']
        }
    
    def normalize_skill(self, skill: str) -> str:
        """Normalize skill name for better matching."""
        skill_lower = skill.lower().strip()
        
        # Check for synonyms
        for main_skill, synonyms in self.skill_synonyms.items():
            if skill_lower == main_skill or skill_lower in synonyms:
                return main_skill
        
        return skill_lower
    
    def calculate_skills_match(self, cv_skills: List[str], jd_skills: List[str]) -> Dict[str, Any]:
        """Calculate skills matching score with detailed breakdown."""
        if not jd_skills:
            return {
                'score': 1.0,
                'matched_skills': [],
                'missing_skills': [],
                'extra_skills': cv_skills,
                'match_rate': 1.0
            }
        
        # Normalize skills
        cv_normalized = [self.normalize_skill(skill) for skill in cv_skills]
        jd_normalized = [self.normalize_skill(skill) for skill in jd_skills]
        
        # Find matches
        matched_skills = []
        missing_skills = []
        
        for jd_skill in jd_normalized:
            if jd_skill in cv_normalized:
                matched_skills.append(jd_skill)
            else:
                missing_skills.append(jd_skill)
        
        # Calculate score
        match_rate = len(matched_skills) / len(jd_normalized) if jd_normalized else 1.0
        
        # Bonus for extra relevant skills
        extra_skills = [skill for skill in cv_normalized if skill not in jd_normalized]
        bonus = min(len(extra_skills) * 0.05, 0.2)  # Max 20% bonus
        
        final_score = min(match_rate + bonus, 1.0)
        
        return {
            'score': final_score,
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'extra_skills': extra_skills,
            'match_rate': match_rate,
            'bonus': bonus
        }
    
    def calculate_experience_match(self, cv_experience: List[Dict], jd_requirements: List[str]) -> Dict[str, Any]:
        """Calculate experience matching score."""
        if not jd_requirements:
            return {'score': 1.0, 'analysis': 'No specific experience required'}
        
        # Extract years of experience from CV
        total_years = 0
        relevant_years = 0
        
        for exp in cv_experience:
            # Extract duration (simplified parsing)
            duration_text = exp.get('duration', '').lower()
            years = self._extract_years_from_text(duration_text)
            total_years += years
            
            # Check if experience is relevant
            title = exp.get('title', '').lower()
            company = exp.get('company', '').lower()
            description = exp.get('description', '').lower()
            
            if self._is_relevant_experience(title + ' ' + description, jd_requirements):
                relevant_years += years
        
        # Extract required years from JD
        required_years = self._extract_required_years(jd_requirements)
        
        # Calculate score
        if required_years == 0:
            experience_score = 1.0
        elif relevant_years >= required_years:
            experience_score = 1.0
        elif relevant_years >= required_years * 0.7:
            experience_score = 0.8
        elif relevant_years >= required_years * 0.5:
            experience_score = 0.6
        elif total_years >= required_years:
            experience_score = 0.4  # General experience
        else:
            experience_score = total_years / required_years if required_years > 0 else 0.2
        
        return {
            'score': min(experience_score, 1.0),
            'total_years': total_years,
            'relevant_years': relevant_years,
            'required_years': required_years,
            'analysis': f"{relevant_years}/{required_years} years relevant experience"
        }
    
    def _extract_years_from_text(self, text: str) -> float:
        """Extract years from duration text."""
        # Look for patterns like "2 years", "3.5 years", "2020-2023"
        year_patterns = [
            r'(\d+\.?\d*)\s*years?',
            r'(\d+\.?\d*)\s*yrs?',
            r'(\d{4})\s*-\s*(\d{4})',  # Year range
            r'(\d{4})\s*-\s*present',  # Year to present
        ]
        
        for pattern in year_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:  # Year range
                    start_year = int(match.group(1))
                    end_year = int(match.group(2))
                    return end_year - start_year
                elif 'present' in text.lower():
                    start_year = int(match.group(1))
                    current_year = datetime.now().year
                    return current_year - start_year
                else:
                    return float(match.group(1))
        
        return 0.5  # Default if no pattern found
    
    def _extract_required_years(self, requirements: List[str]) -> float:
        """Extract required years from JD requirements."""
        for req in requirements:
            req_lower = req.lower()
            # Look for patterns like "3+ years", "5 years experience"
            patterns = [
                r'(\d+)\+?\s*years?',
                r'(\d+)\+?\s*yrs?',
                r'minimum\s*(\d+)\s*years?',
                r'at least\s*(\d+)\s*years?'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, req_lower)
                if match:
                    return float(match.group(1))
        
        return 0  # No specific requirement
    
    def _is_relevant_experience(self, experience_text: str, jd_requirements: List[str]) -> bool:
        """Check if experience is relevant to JD requirements."""
        exp_lower = experience_text.lower()
        
        # Key terms that indicate relevance
        relevant_terms = [
            'software', 'developer', 'engineer', 'programming', 'coding',
            'web development', 'application', 'system', 'technical',
            'project', 'team', 'leadership', 'management'
        ]
        
        # Check if any relevant terms appear
        for term in relevant_terms:
            if term in exp_lower:
                return True
        
        # Check against JD requirements
        for req in jd_requirements:
            req_words = req.lower().split()
            for word in req_words:
                if len(word) > 3 and word in exp_lower:
                    return True
        
        return False
    
    def calculate_education_match(self, cv_education: List[Dict], jd_education: List[str]) -> Dict[str, Any]:
        """Calculate education matching score."""
        if not jd_education:
            return {'score': 1.0, 'analysis': 'No specific education required'}
        
        # Education level hierarchy
        education_levels = {
            'phd': 5, 'doctorate': 5, 'doctoral': 5,
            'master': 4, 'masters': 4, 'msc': 4, 'mba': 4,
            'bachelor': 3, 'bachelors': 3, 'bsc': 3, 'ba': 3,
            'associate': 2, 'diploma': 2,
            'certificate': 1, 'certification': 1,
            'high school': 0, 'secondary': 0
        }
        
        # Get highest CV education level
        cv_max_level = 0
        cv_degrees = []
        
        for edu in cv_education:
            degree = edu.get('degree', '').lower()
            cv_degrees.append(degree)
            
            for level_name, level_value in education_levels.items():
                if level_name in degree:
                    cv_max_level = max(cv_max_level, level_value)
                    break
        
        # Get required education level
        required_level = 0
        for req in jd_education:
            req_lower = req.lower()
            for level_name, level_value in education_levels.items():
                if level_name in req_lower:
                    required_level = max(required_level, level_value)
                    break
        
        # Calculate score
        if cv_max_level >= required_level:
            education_score = 1.0
        elif cv_max_level >= required_level - 1:
            education_score = 0.8
        elif cv_max_level >= required_level - 2:
            education_score = 0.6
        else:
            education_score = 0.3
        
        return {
            'score': education_score,
            'cv_level': cv_max_level,
            'required_level': required_level,
            'cv_degrees': cv_degrees,
            'analysis': f"CV level {cv_max_level} vs required {required_level}"
        }
    
    def calculate_location_match(self, cv_location: str, jd_location: str) -> Dict[str, Any]:
        """Calculate location matching score."""
        if not jd_location or not cv_location:
            return {'score': 0.8, 'analysis': 'Location not specified'}
        
        cv_loc = cv_location.lower()
        jd_loc = jd_location.lower()
        
        # Exact match
        if cv_loc == jd_loc:
            return {'score': 1.0, 'analysis': 'Exact location match'}
        
        # City/country matching
        cv_parts = cv_loc.split(',')
        jd_parts = jd_loc.split(',')
        
        matches = 0
        total_parts = len(jd_parts)
        
        for jd_part in jd_parts:
            jd_part = jd_part.strip()
            for cv_part in cv_parts:
                cv_part = cv_part.strip()
                if jd_part in cv_part or cv_part in jd_part:
                    matches += 1
                    break
        
        location_score = matches / total_parts if total_parts > 0 else 0.5
        
        # UAE cities bonus
        uae_cities = ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'fujairah', 'ras al khaimah', 'umm al quwain']
        if any(city in cv_loc for city in uae_cities) and any(city in jd_loc for city in uae_cities):
            location_score = max(location_score, 0.8)
        
        return {
            'score': location_score,
            'matches': matches,
            'total_parts': total_parts,
            'analysis': f"{matches}/{total_parts} location components match"
        }
    
    def calculate_language_match(self, cv_languages: List[str], jd_languages: List[str]) -> Dict[str, Any]:
        """Calculate language matching score."""
        if not jd_languages:
            return {'score': 1.0, 'analysis': 'No specific languages required'}
        
        cv_langs = [lang.lower() for lang in cv_languages]
        jd_langs = [lang.lower() for lang in jd_languages]
        
        matched_languages = []
        missing_languages = []
        
        for jd_lang in jd_langs:
            if jd_lang in cv_langs:
                matched_languages.append(jd_lang)
            else:
                missing_languages.append(jd_lang)
        
        # Calculate score
        match_rate = len(matched_languages) / len(jd_langs) if jd_langs else 1.0
        
        # Arabic/English bonus for UAE market
        if 'arabic' in matched_languages and 'english' in matched_languages:
            match_rate = min(match_rate + 0.1, 1.0)
        
        return {
            'score': match_rate,
            'matched_languages': matched_languages,
            'missing_languages': missing_languages,
            'analysis': f"{len(matched_languages)}/{len(jd_langs)} required languages"
        }
    
    def match_cv_to_jd(self, cv_data: Dict[str, Any], jd_data: Dict[str, Any]) -> MatchingScore:
        """
        Main matching function - compares CV with JD and returns comprehensive score.
        """
        start_time = time.time()
        
        # Extract data from CV
        cv_skills = []
        if 'skills' in cv_data:
            if isinstance(cv_data['skills'], dict):
                cv_skills.extend(cv_data['skills'].get('technical', []))
                cv_skills.extend(cv_data['skills'].get('soft', []))
            elif isinstance(cv_data['skills'], list):
                cv_skills.extend(cv_data['skills'])
        
        cv_experience = cv_data.get('experience', [])
        cv_education = cv_data.get('education', [])
        cv_location = cv_data.get('personalInfo', {}).get('location', '')
        cv_languages = cv_data.get('languages', [])
        
        # Extract data from JD
        jd_skills = jd_data.get('requirements', {}).get('skills', [])
        jd_experience = jd_data.get('requirements', {}).get('experience', [])
        jd_education = jd_data.get('requirements', {}).get('education', [])
        jd_location = jd_data.get('location', '')
        jd_languages = jd_data.get('requirements', {}).get('languages', [])
        
        # Calculate individual scores
        skills_match = self.calculate_skills_match(cv_skills, jd_skills)
        experience_match = self.calculate_experience_match(cv_experience, jd_experience)
        education_match = self.calculate_education_match(cv_education, jd_education)
        location_match = self.calculate_location_match(cv_location, jd_location)
        language_match = self.calculate_language_match(cv_languages, jd_languages)
        
        # Weighted overall score
        weights = {
            'skills': 0.35,
            'experience': 0.30,
            'education': 0.15,
            'location': 0.10,
            'language': 0.10
        }
        
        overall_score = (
            skills_match['score'] * weights['skills'] +
            experience_match['score'] * weights['experience'] +
            education_match['score'] * weights['education'] +
            location_match['score'] * weights['location'] +
            language_match['score'] * weights['language']
        )
        
        # Calculate confidence based on data completeness
        cv_completeness = self._calculate_cv_completeness(cv_data)
        jd_completeness = self._calculate_jd_completeness(jd_data)
        confidence = (cv_completeness + jd_completeness) / 2
        
        processing_time = time.time() - start_time
        
        # Create detailed breakdown
        breakdown = {
            'skills': skills_match,
            'experience': experience_match,
            'education': education_match,
            'location': location_match,
            'language': language_match,
            'weights': weights,
            'processing_time': processing_time,
            'cv_completeness': cv_completeness,
            'jd_completeness': jd_completeness
        }
        
        logger.info(f"SUCCESS: CV-JD matching completed in {processing_time:.3f}s")
        logger.info(f"SCORE: Overall {overall_score:.1%}, Skills {skills_match['score']:.1%}, Experience {experience_match['score']:.1%}")
        
        return MatchingScore(
            overall_score=overall_score,
            skills_score=skills_match['score'],
            experience_score=experience_match['score'],
            education_score=education_match['score'],
            location_score=location_match['score'],
            language_score=language_match['score'],
            confidence=confidence,
            breakdown=breakdown
        )
    
    def _calculate_cv_completeness(self, cv_data: Dict[str, Any]) -> float:
        """Calculate CV data completeness score."""
        required_fields = ['personalInfo', 'experience', 'education', 'skills']
        present_fields = 0
        
        for field in required_fields:
            if field in cv_data and cv_data[field]:
                present_fields += 1
        
        return present_fields / len(required_fields)
    
    def _calculate_jd_completeness(self, jd_data: Dict[str, Any]) -> float:
        """Calculate JD data completeness score."""
        required_fields = ['title', 'company', 'requirements', 'responsibilities']
        present_fields = 0
        
        for field in required_fields:
            if field in jd_data and jd_data[field]:
                present_fields += 1
        
        return present_fields / len(required_fields)
    
    def rank_candidates(self, candidates: List[Dict[str, Any]], jd_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Rank multiple candidates against a job description.
        """
        start_time = time.time()
        
        ranked_candidates = []
        
        for i, candidate in enumerate(candidates):
            cv_data = candidate.get('cv_data', {})
            candidate_info = candidate.get('candidate_info', {})
            
            # Calculate matching score
            matching_score = self.match_cv_to_jd(cv_data, jd_data)
            
            # Create ranked candidate entry
            ranked_candidate = {
                'candidate_id': candidate_info.get('id', f'candidate_{i+1}'),
                'candidate_name': cv_data.get('personalInfo', {}).get('name', 'Unknown'),
                'candidate_email': cv_data.get('personalInfo', {}).get('email', ''),
                'overall_score': matching_score.overall_score,
                'skills_score': matching_score.skills_score,
                'experience_score': matching_score.experience_score,
                'education_score': matching_score.education_score,
                'location_score': matching_score.location_score,
                'language_score': matching_score.language_score,
                'confidence': matching_score.confidence,
                'match_breakdown': matching_score.breakdown,
                'recommendation': self._get_recommendation(matching_score.overall_score),
                'ranking_metadata': {
                    'processed_at': datetime.now().isoformat(),
                    'jd_id': jd_data.get('id', 'unknown'),
                    'jd_title': jd_data.get('title', 'Unknown Position')
                }
            }
            
            ranked_candidates.append(ranked_candidate)
        
        # Sort by overall score (descending)
        ranked_candidates.sort(key=lambda x: x['overall_score'], reverse=True)
        
        # Add ranking positions
        for i, candidate in enumerate(ranked_candidates):
            candidate['rank'] = i + 1
        
        processing_time = time.time() - start_time
        
        logger.info(f"SUCCESS: Ranked {len(candidates)} candidates in {processing_time:.3f}s")
        logger.info(f"TOP CANDIDATE: {ranked_candidates[0]['candidate_name']} ({ranked_candidates[0]['overall_score']:.1%})")
        
        return ranked_candidates
    
    def _get_recommendation(self, score: float) -> str:
        """Get hiring recommendation based on score."""
        if score >= 0.8:
            return "Highly Recommended"
        elif score >= 0.6:
            return "Recommended"
        elif score >= 0.4:
            return "Consider with Interview"
        elif score >= 0.2:
            return "Possible with Training"
        else:
            return "Not Recommended"
    
    def bulk_match_candidates(self, candidates: List[Dict], job_descriptions: List[Dict]) -> Dict[str, Any]:
        """
        Bulk matching - match multiple candidates against multiple JDs.
        """
        start_time = time.time()
        
        results = {
            'matches': [],
            'summary': {
                'total_candidates': len(candidates),
                'total_jobs': len(job_descriptions),
                'total_matches': 0,
                'processing_time': 0
            }
        }
        
        for jd in job_descriptions:
            jd_id = jd.get('id', 'unknown')
            jd_title = jd.get('title', 'Unknown Position')
            
            # Rank candidates for this JD
            ranked_candidates = self.rank_candidates(candidates, jd)
            
            # Store results
            jd_results = {
                'jd_id': jd_id,
                'jd_title': jd_title,
                'jd_company': jd.get('company', 'Unknown'),
                'candidates': ranked_candidates,
                'top_candidate': ranked_candidates[0] if ranked_candidates else None,
                'qualified_candidates': [c for c in ranked_candidates if c['overall_score'] >= 0.6],
                'match_statistics': {
                    'total_candidates': len(ranked_candidates),
                    'qualified_count': len([c for c in ranked_candidates if c['overall_score'] >= 0.6]),
                    'highly_qualified_count': len([c for c in ranked_candidates if c['overall_score'] >= 0.8]),
                    'average_score': sum(c['overall_score'] for c in ranked_candidates) / len(ranked_candidates) if ranked_candidates else 0
                }
            }
            
            results['matches'].append(jd_results)
            results['summary']['total_matches'] += len(ranked_candidates)
        
        results['summary']['processing_time'] = time.time() - start_time
        
        logger.info(f"SUCCESS: Bulk matching completed in {results['summary']['processing_time']:.3f}s")
        logger.info(f"STATS: {results['summary']['total_matches']} total matches processed")
        
        return results

# Test function
def test_matching_engine():
    """Test the matching engine with sample data."""
    
    # Sample CV data
    sample_cv = {
        'personalInfo': {
            'name': 'Ahmed Al-Mansouri',
            'email': 'ahmed.almansouri@email.com',
            'phone': '+971-50-123-4567',
            'location': 'Dubai, UAE',
            'summary': 'Experienced software engineer with 5 years in web development'
        },
        'experience': [
            {
                'title': 'Senior Software Engineer',
                'company': 'TechCorp Dubai',
                'duration': '2020-2025',
                'description': 'Led development of web applications using React and Node.js'
            },
            {
                'title': 'Software Developer',
                'company': 'StartupXYZ',
                'duration': '2018-2020',
                'description': 'Developed mobile applications and web services'
            }
        ],
        'education': [
            {
                'degree': 'Bachelor of Computer Science',
                'institution': 'American University of Sharjah',
                'year': '2018'
            }
        ],
        'skills': {
            'technical': ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS'],
            'soft': ['Leadership', 'Communication', 'Problem Solving']
        },
        'languages': ['English', 'Arabic']
    }
    
    # Sample JD data
    sample_jd = {
        'id': 'jd_test_001',
        'title': 'Senior Software Engineer',
        'company': 'InnovateTech UAE',
        'location': 'Dubai, UAE',
        'requirements': {
            'education': ['Bachelor degree in Computer Science'],
            'experience': ['5+ years software development experience'],
            'skills': ['JavaScript', 'React', 'Node.js', 'AWS', 'Docker'],
            'languages': ['English', 'Arabic']
        },
        'responsibilities': [
            'Lead software development projects',
            'Mentor junior developers',
            'Design system architecture'
        ]
    }
    
    # Test matching
    engine = JobMatchingEngine()
    
    print("🧪 Testing Job Matching Engine")
    print("=" * 50)
    
    # Single match test
    print("🔍 Testing single CV-JD match...")
    match_result = engine.match_cv_to_jd(sample_cv, sample_jd)
    
    print(f"✅ Overall Score: {match_result.overall_score:.1%}")
    print(f"📊 Skills: {match_result.skills_score:.1%}")
    print(f"💼 Experience: {match_result.experience_score:.1%}")
    print(f"🎓 Education: {match_result.education_score:.1%}")
    print(f"📍 Location: {match_result.location_score:.1%}")
    print(f"🌐 Language: {match_result.language_score:.1%}")
    print(f"🎯 Confidence: {match_result.confidence:.1%}")
    
    # Ranking test
    print("\n🔍 Testing candidate ranking...")
    candidates = [
        {'candidate_info': {'id': 'c1'}, 'cv_data': sample_cv},
        {'candidate_info': {'id': 'c2'}, 'cv_data': {
            **sample_cv,
            'personalInfo': {**sample_cv['personalInfo'], 'name': 'Sara Al-Zahra'},
            'skills': {'technical': ['Python', 'Django', 'PostgreSQL'], 'soft': ['Communication']}
        }},
        {'candidate_info': {'id': 'c3'}, 'cv_data': {
            **sample_cv,
            'personalInfo': {**sample_cv['personalInfo'], 'name': 'Omar Hassan'},
            'experience': [sample_cv['experience'][1]]  # Less experience
        }}
    ]
    
    ranked = engine.rank_candidates(candidates, sample_jd)
    
    print(f"✅ Ranked {len(ranked)} candidates:")
    for candidate in ranked:
        print(f"  {candidate['rank']}. {candidate['candidate_name']}: {candidate['overall_score']:.1%} - {candidate['recommendation']}")
    
    print("\n🎉 All matching tests passed!")
    return True

if __name__ == "__main__":
    test_matching_engine()

