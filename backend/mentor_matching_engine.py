"""
Mentor-Mentee Matching Engine
Advanced AI-powered matching system for the Emirati Journey Platform
"""

import json
import math
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MentorProfile:
    """Mentor profile data structure"""
    id: str
    user_id: str
    industry: str
    expertise_areas: List[str]
    skills: List[str]
    years_of_experience: int
    rating: float
    hourly_rate: float
    max_mentees: int
    current_mentees: int
    is_available: bool
    is_verified: bool
    location: str
    languages: List[str]
    mentoring_style: str
    availability_schedule: Dict
    bio: str
    achievements: List[str]

@dataclass
class MenteeProfile:
    """Mentee profile data structure"""
    id: str
    user_id: str
    current_industry: str
    target_industry: str
    current_role: str
    target_role: str
    skills: List[str]
    skill_gaps: List[str]
    years_of_experience: int
    career_goals: List[str]
    learning_preferences: str
    location: str
    languages: List[str]
    availability_schedule: Dict
    budget_range: Tuple[float, float]
    preferred_mentoring_style: str

@dataclass
class MatchResult:
    """Matching result data structure"""
    mentor_id: str
    mentee_id: str
    overall_score: float
    industry_score: float
    skill_score: float
    experience_score: float
    location_score: float
    language_score: float
    availability_score: float
    personality_score: float
    goals_score: float
    confidence_level: str
    match_reasons: List[str]

class MentorMatchingEngine:
    """Advanced AI-powered mentor-mentee matching engine"""
    
    def __init__(self, db_config: Dict):
        """Initialize the matching engine with database configuration"""
        self.db_config = db_config
        self.tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        
        # UAE-specific industry mappings
        self.uae_industries = {
            'oil_gas': ['petroleum', 'energy', 'oil', 'gas', 'adnoc', 'emirates gas'],
            'finance': ['banking', 'finance', 'investment', 'islamic banking', 'fintech'],
            'technology': ['it', 'software', 'ai', 'blockchain', 'cybersecurity', 'digital'],
            'healthcare': ['medical', 'healthcare', 'pharmaceutical', 'biotechnology'],
            'education': ['education', 'training', 'academic', 'university', 'school'],
            'tourism': ['hospitality', 'tourism', 'hotel', 'travel', 'aviation'],
            'construction': ['construction', 'real estate', 'engineering', 'architecture'],
            'compliance_auditor': ['compliance_auditor', 'public sector', 'civil service', 'municipality'],
            'logistics': ['logistics', 'supply chain', 'shipping', 'transportation'],
            'retail': ['retail', 'e-commerce', 'consumer goods', 'fashion']
        }
        
        # Emirates and their characteristics
        self.emirates_proximity = {
            'Dubai': {'Abu Dhabi': 0.8, 'Sharjah': 0.9, 'Ajman': 0.7, 'Umm Al Quwain': 0.6, 'Ras Al Khaimah': 0.5, 'Fujairah': 0.4},
            'Abu Dhabi': {'Dubai': 0.8, 'Sharjah': 0.6, 'Ajman': 0.5, 'Umm Al Quwain': 0.4, 'Ras Al Khaimah': 0.3, 'Fujairah': 0.3},
            'Sharjah': {'Dubai': 0.9, 'Abu Dhabi': 0.6, 'Ajman': 0.8, 'Umm Al Quwain': 0.7, 'Ras Al Khaimah': 0.6, 'Fujairah': 0.5},
            'Ajman': {'Dubai': 0.7, 'Abu Dhabi': 0.5, 'Sharjah': 0.8, 'Umm Al Quwain': 0.9, 'Ras Al Khaimah': 0.7, 'Fujairah': 0.6},
            'Umm Al Quwain': {'Dubai': 0.6, 'Abu Dhabi': 0.4, 'Sharjah': 0.7, 'Ajman': 0.9, 'Ras Al Khaimah': 0.8, 'Fujairah': 0.7},
            'Ras Al Khaimah': {'Dubai': 0.5, 'Abu Dhabi': 0.3, 'Sharjah': 0.6, 'Ajman': 0.7, 'Umm Al Quwain': 0.8, 'Fujairah': 0.9},
            'Fujairah': {'Dubai': 0.4, 'Abu Dhabi': 0.3, 'Sharjah': 0.5, 'Ajman': 0.6, 'Umm Al Quwain': 0.7, 'Ras Al Khaimah': 0.9}
        }

    def get_database_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def fetch_mentor_profiles(self, limit: int = 100) -> List[MentorProfile]:
        """Fetch mentor profiles from database"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT mp.*, u.full_name, u.email, u.emirate, u.nationality
                        FROM mentor_profiles mp
                        JOIN users u ON mp.user_id = u.id
                        WHERE mp.is_available = true AND mp.is_verified = true
                        ORDER BY mp.rating DESC, mp.years_of_experience DESC
                        LIMIT %s
                    """, (limit,))
                    
                    mentors = []
                    for row in cursor.fetchall():
                        mentor = MentorProfile(
                            id=str(row['id']),
                            user_id=str(row['user_id']),
                            industry=row.get('industry', ''),
                            expertise_areas=row.get('expertise_areas', []),
                            skills=row.get('skills', []),
                            years_of_experience=row.get('years_of_experience', 0),
                            rating=float(row.get('rating', 0)),
                            hourly_rate=float(row.get('hourly_rate', 0)),
                            max_mentees=row.get('max_mentees', 5),
                            current_mentees=row.get('current_mentees', 0),
                            is_available=row.get('is_available', False),
                            is_verified=row.get('is_verified', False),
                            location=row.get('emirate', ''),
                            languages=row.get('languages', ['English']),
                            mentoring_style=row.get('mentoring_style', 'collaborative'),
                            availability_schedule=row.get('availability_schedule', {}),
                            bio=row.get('bio', ''),
                            achievements=row.get('achievements', [])
                        )
                        mentors.append(mentor)
                    
                    return mentors
                    
        except Exception as e:
            logger.error(f"Error fetching mentor profiles: {e}")
            return []

    def fetch_mentee_profile(self, user_id: str) -> Optional[MenteeProfile]:
        """Fetch mentee profile from database"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT cp.*, u.full_name, u.email, u.emirate, u.nationality
                        FROM candidate_profiles cp
                        JOIN users u ON cp.user_id = u.id
                        WHERE cp.user_id = %s
                    """, (user_id,))
                    
                    row = cursor.fetchone()
                    if not row:
                        return None
                    
                    mentee = MenteeProfile(
                        id=str(row['id']),
                        user_id=str(row['user_id']),
                        current_industry=row.get('current_industry', ''),
                        target_industry=row.get('preferred_industry', ''),
                        current_role=row.get('current_role', ''),
                        target_role=row.get('preferred_job_title', ''),
                        skills=row.get('skills', []),
                        skill_gaps=row.get('skill_gaps', []),
                        years_of_experience=row.get('experience_years', 0),
                        career_goals=row.get('career_goals', []),
                        learning_preferences=row.get('learning_preferences', 'structured'),
                        location=row.get('emirate', ''),
                        languages=row.get('languages', ['English']),
                        availability_schedule=row.get('availability_schedule', {}),
                        budget_range=(0, 500),  # Default budget range
                        preferred_mentoring_style=row.get('preferred_mentoring_style', 'collaborative')
                    )
                    
                    return mentee
                    
        except Exception as e:
            logger.error(f"Error fetching mentee profile: {e}")
            return None

    def calculate_industry_alignment(self, mentor_industry: str, mentee_target_industry: str) -> float:
        """Calculate industry alignment score"""
        if not mentor_industry or not mentee_target_industry:
            return 0.0
        
        # Direct match
        if mentor_industry.lower() == mentee_target_industry.lower():
            return 1.0
        
        # Check UAE industry mappings for related industries
        mentor_category = None
        mentee_category = None
        
        for category, industries in self.uae_industries.items():
            if any(industry in mentor_industry.lower() for industry in industries):
                mentor_category = category
            if any(industry in mentee_target_industry.lower() for industry in industries):
                mentee_category = category
        
        if mentor_category and mentee_category:
            if mentor_category == mentee_category:
                return 0.8
            # Related industries (e.g., finance and fintech)
            related_pairs = [
                ('finance', 'technology'),
                ('oil_gas', 'technology'),
                ('healthcare', 'technology'),
                ('education', 'technology'),
                ('compliance_auditor', 'technology')
            ]
            if (mentor_category, mentee_category) in related_pairs or (mentee_category, mentor_category) in related_pairs:
                return 0.6
        
        return 0.2  # Minimal score for cross-industry mentoring

    def calculate_skill_compatibility(self, mentor_skills: List[str], mentee_skill_gaps: List[str]) -> float:
        """Calculate skill compatibility score using TF-IDF similarity"""
        if not mentor_skills or not mentee_skill_gaps:
            return 0.0
        
        try:
            # Combine skills into text documents
            mentor_text = ' '.join(mentor_skills)
            mentee_text = ' '.join(mentee_skill_gaps)
            
            # Calculate TF-IDF similarity
            documents = [mentor_text, mentee_text]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(documents)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating skill compatibility: {e}")
            # Fallback to simple overlap calculation
            mentor_set = set(skill.lower() for skill in mentor_skills)
            mentee_set = set(skill.lower() for skill in mentee_skill_gaps)
            overlap = len(mentor_set.intersection(mentee_set))
            return min(overlap / len(mentee_set), 1.0) if mentee_set else 0.0

    def calculate_experience_gap_score(self, mentor_experience: int, mentee_experience: int) -> float:
        """Calculate optimal experience gap score"""
        if mentor_experience <= mentee_experience:
            return 0.1  # Mentor should have more experience
        
        gap = mentor_experience - mentee_experience
        
        # Optimal gap is 5-15 years
        if 5 <= gap <= 15:
            return 1.0
        elif 3 <= gap < 5 or 15 < gap <= 20:
            return 0.8
        elif 1 <= gap < 3 or 20 < gap <= 25:
            return 0.6
        else:
            return 0.3

    def calculate_geographic_proximity(self, mentor_location: str, mentee_location: str) -> float:
        """Calculate geographic proximity score"""
        if not mentor_location or not mentee_location:
            return 0.5  # Neutral score for missing location data
        
        if mentor_location == mentee_location:
            return 1.0
        
        # Use emirates proximity mapping
        if mentor_location in self.emirates_proximity and mentee_location in self.emirates_proximity[mentor_location]:
            return self.emirates_proximity[mentor_location][mentee_location]
        
        return 0.3  # Low score for distant locations

    def calculate_language_compatibility(self, mentor_languages: List[str], mentee_languages: List[str]) -> float:
        """Calculate language compatibility score"""
        if not mentor_languages or not mentee_languages:
            return 0.5  # Neutral score for missing language data
        
        mentor_set = set(lang.lower() for lang in mentor_languages)
        mentee_set = set(lang.lower() for lang in mentee_languages)
        
        overlap = len(mentor_set.intersection(mentee_set))
        total_unique = len(mentor_set.union(mentee_set))
        
        return overlap / total_unique if total_unique > 0 else 0.0

    def calculate_availability_alignment(self, mentor_schedule: Dict, mentee_schedule: Dict) -> float:
        """Calculate availability alignment score"""
        if not mentor_schedule or not mentee_schedule:
            return 0.7  # Neutral score for missing schedule data
        
        # Simple overlap calculation based on available days/times
        # This would be more sophisticated in a real implementation
        return 0.8  # Placeholder for now

    def calculate_personality_compatibility(self, mentor_style: str, mentee_preferences: str) -> float:
        """Calculate personality compatibility score"""
        if not mentor_style or not mentee_preferences:
            return 0.7  # Neutral score for missing data
        
        # Style compatibility mapping
        compatibility_matrix = {
            'collaborative': {'collaborative': 1.0, 'structured': 0.8, 'flexible': 0.9, 'directive': 0.6},
            'structured': {'collaborative': 0.8, 'structured': 1.0, 'flexible': 0.6, 'directive': 0.9},
            'flexible': {'collaborative': 0.9, 'structured': 0.6, 'flexible': 1.0, 'directive': 0.7},
            'directive': {'collaborative': 0.6, 'structured': 0.9, 'flexible': 0.7, 'directive': 1.0}
        }
        
        return compatibility_matrix.get(mentor_style, {}).get(mentee_preferences, 0.7)

    def calculate_goals_alignment(self, mentor_expertise: List[str], mentee_goals: List[str]) -> float:
        """Calculate goals alignment score"""
        if not mentor_expertise or not mentee_goals:
            return 0.5  # Neutral score for missing data
        
        try:
            # Use TF-IDF similarity for goals alignment
            mentor_text = ' '.join(mentor_expertise)
            mentee_text = ' '.join(mentee_goals)
            
            documents = [mentor_text, mentee_text]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(documents)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating goals alignment: {e}")
            return 0.5

    def calculate_match_score(self, mentor: MentorProfile, mentee: MenteeProfile) -> MatchResult:
        """Calculate comprehensive match score between mentor and mentee"""
        
        # Primary factors (60%)
        industry_score = self.calculate_industry_alignment(mentor.industry, mentee.target_industry)
        skill_score = self.calculate_skill_compatibility(mentor.skills, mentee.skill_gaps)
        experience_score = self.calculate_experience_gap_score(mentor.years_of_experience, mentee.years_of_experience)
        
        primary_score = (industry_score * 0.2 + skill_score * 0.2 + experience_score * 0.2) * 0.6
        
        # Secondary factors (30%)
        location_score = self.calculate_geographic_proximity(mentor.location, mentee.location)
        language_score = self.calculate_language_compatibility(mentor.languages, mentee.languages)
        availability_score = self.calculate_availability_alignment(mentor.availability_schedule, mentee.availability_schedule)
        
        secondary_score = (location_score * 0.1 + language_score * 0.1 + availability_score * 0.1) * 0.3
        
        # Tertiary factors (10%)
        personality_score = self.calculate_personality_compatibility(mentor.mentoring_style, mentee.preferred_mentoring_style)
        goals_score = self.calculate_goals_alignment(mentor.expertise_areas, mentee.career_goals)
        
        tertiary_score = (personality_score * 0.05 + goals_score * 0.05) * 0.1
        
        # Calculate overall score
        overall_score = primary_score + secondary_score + tertiary_score
        
        # Determine confidence level
        if overall_score >= 0.8:
            confidence_level = "High"
        elif overall_score >= 0.6:
            confidence_level = "Medium"
        else:
            confidence_level = "Low"
        
        # Generate match reasons
        match_reasons = []
        if industry_score > 0.7:
            match_reasons.append("Strong industry alignment")
        if skill_score > 0.7:
            match_reasons.append("Excellent skill compatibility")
        if experience_score > 0.8:
            match_reasons.append("Optimal experience gap")
        if location_score > 0.8:
            match_reasons.append("Geographic proximity")
        if language_score > 0.8:
            match_reasons.append("Language compatibility")
        
        return MatchResult(
            mentor_id=mentor.id,
            mentee_id=mentee.id,
            overall_score=overall_score,
            industry_score=industry_score,
            skill_score=skill_score,
            experience_score=experience_score,
            location_score=location_score,
            language_score=language_score,
            availability_score=availability_score,
            personality_score=personality_score,
            goals_score=goals_score,
            confidence_level=confidence_level,
            match_reasons=match_reasons
        )

    def find_mentor_matches(self, mentee_user_id: str, limit: int = 10) -> List[MatchResult]:
        """Find best mentor matches for a mentee"""
        try:
            # Fetch mentee profile
            mentee = self.fetch_mentee_profile(mentee_user_id)
            if not mentee:
                logger.error(f"Mentee profile not found for user_id: {mentee_user_id}")
                return []
            
            # Fetch available mentors
            mentors = self.fetch_mentor_profiles()
            if not mentors:
                logger.error("No mentor profiles found")
                return []
            
            # Calculate match scores
            matches = []
            for mentor in mentors:
                # Skip if mentor is at capacity
                if mentor.current_mentees >= mentor.max_mentees:
                    continue
                
                match_result = self.calculate_match_score(mentor, mentee)
                matches.append(match_result)
            
            # Sort by overall score and return top matches
            matches.sort(key=lambda x: x.overall_score, reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Error finding mentor matches: {e}")
            return []

    def save_match_result(self, match_result: MatchResult) -> bool:
        """Save match result to database"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO mentorship_matching 
                        (mentor_id, mentee_user_id, match_score, match_details, match_status, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (mentor_id, mentee_user_id) 
                        DO UPDATE SET 
                            match_score = EXCLUDED.match_score,
                            match_details = EXCLUDED.match_details,
                            updated_at = CURRENT_TIMESTAMP
                    """, (
                        match_result.mentor_id,
                        match_result.mentee_id,
                        match_result.overall_score,
                        json.dumps({
                            'industry_score': match_result.industry_score,
                            'skill_score': match_result.skill_score,
                            'experience_score': match_result.experience_score,
                            'location_score': match_result.location_score,
                            'language_score': match_result.language_score,
                            'availability_score': match_result.availability_score,
                            'personality_score': match_result.personality_score,
                            'goals_score': match_result.goals_score,
                            'confidence_level': match_result.confidence_level,
                            'match_reasons': match_result.match_reasons
                        }),
                        'pending',
                        datetime.now()
                    ))
                    
                conn.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error saving match result: {e}")
            return False

    def get_match_analytics(self, mentor_id: str = None, mentee_id: str = None) -> Dict:
        """Get matching analytics"""
        try:
            with self.get_database_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    # Base query
                    where_clause = "WHERE 1=1"
                    params = []
                    
                    if mentor_id:
                        where_clause += " AND mentor_id = %s"
                        params.append(mentor_id)
                    
                    if mentee_id:
                        where_clause += " AND mentee_user_id = %s"
                        params.append(mentee_id)
                    
                    cursor.execute(f"""
                        SELECT 
                            COUNT(*) as total_matches,
                            AVG(match_score) as avg_match_score,
                            COUNT(CASE WHEN match_status = 'active' THEN 1 END) as active_matches,
                            COUNT(CASE WHEN match_status = 'pending' THEN 1 END) as pending_matches,
                            COUNT(CASE WHEN match_status = 'rejected' THEN 1 END) as rejected_matches
                        FROM mentorship_matching
                        {where_clause}
                    """, params)
                    
                    result = cursor.fetchone()
                    return dict(result) if result else {}
                    
        except Exception as e:
            logger.error(f"Error getting match analytics: {e}")
            return {}
