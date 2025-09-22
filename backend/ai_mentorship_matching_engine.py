"""
AI-Powered Mentorship Matching Engine for Emirati Journey Platform
Advanced compatibility analysis using Gemini 2.5 Pro for optimal mentor-mentee pairing
"""

import logging
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import google.generativeai as genai
from collections import defaultdict
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini AI
try:
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    logger.info("✅ Gemini 2.5 Pro configured successfully")
except Exception as e:
    logger.error(f"❌ Failed to configure Gemini: {e}")
    model = None

class MatchingCriteria(Enum):
    """Mentorship matching criteria"""
    EXPERTISE_ALIGNMENT = "expertise_alignment"
    CAREER_GOALS = "career_goals"
    INDUSTRY_EXPERIENCE = "industry_experience"
    CULTURAL_FIT = "cultural_fit"
    COMMUNICATION_STYLE = "communication_style"
    AVAILABILITY_COMPATIBILITY = "availability_compatibility"
    LEARNING_STYLE = "learning_style"
    PERSONALITY_MATCH = "personality_match"
    UAE_CULTURAL_INTELLIGENCE = "uae_cultural_intelligence"
    EMIRATIZATION_ALIGNMENT = "emiratization_alignment"

class MatchingPriority(Enum):
    """Priority levels for matching criteria"""
    CRITICAL = "critical"      # Must match (90%+ compatibility)
    HIGH = "high"             # Should match (70%+ compatibility)
    MEDIUM = "medium"         # Nice to match (50%+ compatibility)
    LOW = "low"              # Optional match (30%+ compatibility)

@dataclass
class MenteeProfile:
    """Mentee profile for matching"""
    mentee_id: str
    full_name: str
    email: str
    age: int
    education_level: str
    field_of_study: str
    current_position: Optional[str]
    career_goals: List[str]
    desired_expertise_areas: List[str]
    preferred_mentorship_types: List[str]
    learning_style: str
    communication_preferences: List[str]
    availability: Dict[str, Any]
    languages: List[str]
    is_uae_national: bool
    cultural_background: str
    personality_traits: List[str]
    challenges_faced: List[str]
    success_metrics: List[str]
    previous_mentorship_experience: bool
    preferred_mentor_characteristics: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class CompatibilityScore:
    """Compatibility score between mentor and mentee"""
    mentor_id: str
    mentee_id: str
    overall_score: float
    criteria_scores: Dict[MatchingCriteria, float]
    strengths: List[str]
    potential_challenges: List[str]
    recommendations: List[str]
    confidence_level: float
    cultural_intelligence_bonus: float
    emiratization_bonus: float
    ai_analysis: str
    match_reasoning: str
    success_probability: float
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'mentor_id': self.mentor_id,
            'mentee_id': self.mentee_id,
            'overall_score': self.overall_score,
            'criteria_scores': {criteria.value: score for criteria, score in self.criteria_scores.items()},
            'strengths': self.strengths,
            'potential_challenges': self.potential_challenges,
            'recommendations': self.recommendations,
            'confidence_level': self.confidence_level,
            'cultural_intelligence_bonus': self.cultural_intelligence_bonus,
            'emiratization_bonus': self.emiratization_bonus,
            'ai_analysis': self.ai_analysis,
            'match_reasoning': self.match_reasoning,
            'success_probability': self.success_probability
        }

@dataclass
class MatchingRecommendation:
    """Mentorship matching recommendation"""
    mentor_id: str
    mentee_id: str
    compatibility_score: CompatibilityScore
    recommended_mentorship_plan: Dict[str, Any]
    session_frequency: str
    duration_recommendation: str
    focus_areas: List[str]
    success_milestones: List[str]
    risk_factors: List[str]
    mitigation_strategies: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'mentor_id': self.mentor_id,
            'mentee_id': self.mentee_id,
            'compatibility_score': self.compatibility_score.to_dict(),
            'recommended_mentorship_plan': self.recommended_mentorship_plan,
            'session_frequency': self.session_frequency,
            'duration_recommendation': self.duration_recommendation,
            'focus_areas': self.focus_areas,
            'success_milestones': self.success_milestones,
            'risk_factors': self.risk_factors,
            'mitigation_strategies': self.mitigation_strategies
        }

class AIMentorshipMatchingEngine:
    """AI-powered mentorship matching engine"""
    
    def __init__(self):
        """Initialize the matching engine"""
        self.matching_history: Dict[str, List[CompatibilityScore]] = defaultdict(list)
        self.successful_matches: Dict[str, float] = {}
        self.matching_criteria_weights = self._initialize_criteria_weights()
        
        # Initialize sample mentee data
        self._initialize_sample_mentees()
        
        logger.info("✅ AI Mentorship Matching Engine initialized successfully")
    
    def _initialize_criteria_weights(self) -> Dict[MatchingCriteria, float]:
        """Initialize matching criteria weights"""
        return {
            MatchingCriteria.EXPERTISE_ALIGNMENT: 0.20,
            MatchingCriteria.CAREER_GOALS: 0.18,
            MatchingCriteria.INDUSTRY_EXPERIENCE: 0.15,
            MatchingCriteria.CULTURAL_FIT: 0.12,
            MatchingCriteria.COMMUNICATION_STYLE: 0.10,
            MatchingCriteria.AVAILABILITY_COMPATIBILITY: 0.08,
            MatchingCriteria.LEARNING_STYLE: 0.07,
            MatchingCriteria.PERSONALITY_MATCH: 0.05,
            MatchingCriteria.UAE_CULTURAL_INTELLIGENCE: 0.03,
            MatchingCriteria.EMIRATIZATION_ALIGNMENT: 0.02
        }
    
    def _initialize_sample_mentees(self):
        """Initialize sample mentee profiles"""
        self.sample_mentees = [
            MenteeProfile(
                mentee_id="mentee_001",
                full_name="Sara Al Ahmed",
                email="sara.ahmed@student.ae",
                age=23,
                education_level="Bachelor's Degree",
                field_of_study="Computer Science",
                current_position="Junior Developer",
                career_goals=["Become a Senior Software Engineer", "Lead technical teams", "Start a tech company"],
                desired_expertise_areas=["technology", "leadership", "entrepreneurship"],
                preferred_mentorship_types=["career_guidance", "skill_development", "leadership_coaching"],
                learning_style="hands-on",
                communication_preferences=["video calls", "in-person meetings"],
                availability={"days": ["Monday", "Wednesday", "Friday"], "times": ["18:00-20:00"]},
                languages=["Arabic", "English"],
                is_uae_national=True,
                cultural_background="Emirati",
                personality_traits=["ambitious", "analytical", "collaborative"],
                challenges_faced=["Technical skill gaps", "Leadership confidence", "Industry networking"],
                success_metrics=["Promotion to senior role", "Technical certification", "Team leadership experience"],
                previous_mentorship_experience=False,
                preferred_mentor_characteristics=["UAE national", "Tech industry experience", "Leadership background"]
            ),
            MenteeProfile(
                mentee_id="mentee_002",
                full_name="Omar Hassan",
                email="omar.hassan@graduate.ae",
                age=25,
                education_level="Master's Degree",
                field_of_study="Finance",
                current_position="Financial Analyst",
                career_goals=["Become an Investment Manager", "Specialize in Islamic Finance", "Work in UAE banking sector"],
                desired_expertise_areas=["finance", "leadership", "cultural_integration"],
                preferred_mentorship_types=["career_guidance", "industry_insights", "cultural_integration"],
                learning_style="structured",
                communication_preferences=["video calls", "email"],
                availability={"days": ["Tuesday", "Thursday", "Saturday"], "times": ["19:00-21:00"]},
                languages=["Arabic", "English", "French"],
                is_uae_national=False,
                cultural_background="Egyptian",
                personality_traits=["detail-oriented", "strategic", "culturally-adaptive"],
                challenges_faced=["UAE market understanding", "Cultural integration", "Professional networking"],
                success_metrics=["UAE banking role", "Islamic finance certification", "Cultural competency"],
                previous_mentorship_experience=True,
                preferred_mentor_characteristics=["UAE banking experience", "Cultural intelligence", "Islamic finance expertise"]
            )
        ]
    
    def calculate_compatibility_score(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> CompatibilityScore:
        """Calculate comprehensive compatibility score between mentor and mentee"""
        try:
            criteria_scores = {}
            
            # Expertise Alignment
            criteria_scores[MatchingCriteria.EXPERTISE_ALIGNMENT] = self._calculate_expertise_alignment(
                mentor_profile, mentee_profile
            )
            
            # Career Goals Alignment
            criteria_scores[MatchingCriteria.CAREER_GOALS] = self._calculate_career_goals_alignment(
                mentor_profile, mentee_profile
            )
            
            # Industry Experience
            criteria_scores[MatchingCriteria.INDUSTRY_EXPERIENCE] = self._calculate_industry_experience(
                mentor_profile, mentee_profile
            )
            
            # Cultural Fit
            criteria_scores[MatchingCriteria.CULTURAL_FIT] = self._calculate_cultural_fit(
                mentor_profile, mentee_profile
            )
            
            # Communication Style
            criteria_scores[MatchingCriteria.COMMUNICATION_STYLE] = self._calculate_communication_compatibility(
                mentor_profile, mentee_profile
            )
            
            # Availability Compatibility
            criteria_scores[MatchingCriteria.AVAILABILITY_COMPATIBILITY] = self._calculate_availability_compatibility(
                mentor_profile, mentee_profile
            )
            
            # Learning Style
            criteria_scores[MatchingCriteria.LEARNING_STYLE] = self._calculate_learning_style_match(
                mentor_profile, mentee_profile
            )
            
            # Personality Match
            criteria_scores[MatchingCriteria.PERSONALITY_MATCH] = self._calculate_personality_match(
                mentor_profile, mentee_profile
            )
            
            # UAE Cultural Intelligence
            criteria_scores[MatchingCriteria.UAE_CULTURAL_INTELLIGENCE] = self._calculate_uae_cultural_intelligence(
                mentor_profile, mentee_profile
            )
            
            # Emiratization Alignment
            criteria_scores[MatchingCriteria.EMIRATIZATION_ALIGNMENT] = self._calculate_emiratization_alignment(
                mentor_profile, mentee_profile
            )
            
            # Calculate weighted overall score
            overall_score = sum(
                score * self.matching_criteria_weights[criteria]
                for criteria, score in criteria_scores.items()
            )
            
            # Calculate bonuses
            cultural_intelligence_bonus = self._calculate_cultural_intelligence_bonus(mentor_profile, mentee_profile)
            emiratization_bonus = self._calculate_emiratization_bonus(mentor_profile, mentee_profile)
            
            # Apply bonuses
            overall_score += cultural_intelligence_bonus + emiratization_bonus
            overall_score = min(overall_score, 100.0)  # Cap at 100%
            
            # Generate AI analysis
            ai_analysis = self._generate_ai_analysis(mentor_profile, mentee_profile, criteria_scores)
            
            # Generate strengths and challenges
            strengths, challenges = self._analyze_match_strengths_challenges(criteria_scores)
            
            # Generate recommendations
            recommendations = self._generate_match_recommendations(mentor_profile, mentee_profile, criteria_scores)
            
            # Calculate success probability
            success_probability = self._calculate_success_probability(overall_score, criteria_scores)
            
            # Calculate confidence level
            confidence_level = self._calculate_confidence_level(criteria_scores)
            
            compatibility_score = CompatibilityScore(
                mentor_id=mentor_profile.mentor_id,
                mentee_id=mentee_profile.mentee_id,
                overall_score=round(overall_score, 2),
                criteria_scores=criteria_scores,
                strengths=strengths,
                potential_challenges=challenges,
                recommendations=recommendations,
                confidence_level=round(confidence_level, 2),
                cultural_intelligence_bonus=round(cultural_intelligence_bonus, 2),
                emiratization_bonus=round(emiratization_bonus, 2),
                ai_analysis=ai_analysis,
                match_reasoning=self._generate_match_reasoning(overall_score, criteria_scores),
                success_probability=round(success_probability, 2)
            )
            
            # Store in history
            self.matching_history[mentee_profile.mentee_id].append(compatibility_score)
            
            return compatibility_score
            
        except Exception as e:
            logger.error(f"❌ Error calculating compatibility score: {str(e)}")
            raise
    
    def find_best_mentors(self, mentee_profile: MenteeProfile, mentor_profiles: List[Any], 
                         top_n: int = 5) -> List[MatchingRecommendation]:
        """Find the best mentor matches for a mentee"""
        try:
            compatibility_scores = []
            
            # Calculate compatibility with each mentor
            for mentor in mentor_profiles:
                score = self.calculate_compatibility_score(mentor, mentee_profile)
                compatibility_scores.append(score)
            
            # Sort by overall score
            compatibility_scores.sort(key=lambda x: x.overall_score, reverse=True)
            
            # Generate recommendations for top matches
            recommendations = []
            for score in compatibility_scores[:top_n]:
                mentor = next(m for m in mentor_profiles if m.mentor_id == score.mentor_id)
                recommendation = self._generate_mentorship_recommendation(mentor, mentee_profile, score)
                recommendations.append(recommendation)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"❌ Error finding best mentors: {str(e)}")
            return []
    
    def _calculate_expertise_alignment(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate expertise alignment score"""
        try:
            mentor_expertise = [exp.area.value for exp in mentor_profile.primary_expertise]
            mentee_desired = mentee_profile.desired_expertise_areas
            
            # Calculate overlap
            overlap = len(set(mentor_expertise) & set(mentee_desired))
            total_desired = len(mentee_desired)
            
            if total_desired == 0:
                return 50.0  # Neutral score if no specific desires
            
            alignment_score = (overlap / total_desired) * 100
            
            # Bonus for senior expertise level
            if any(exp.level.value in ['senior', 'executive', 'thought_leader'] for exp in mentor_profile.primary_expertise):
                alignment_score += 10
            
            return min(alignment_score, 100.0)
            
        except Exception as e:
            logger.error(f"❌ Error calculating expertise alignment: {str(e)}")
            return 0.0
    
    def _calculate_career_goals_alignment(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate career goals alignment score"""
        try:
            # Analyze mentor's experience against mentee's goals
            mentor_position = mentor_profile.current_position.lower()
            mentor_company = mentor_profile.company.lower()
            
            goal_alignment = 0.0
            for goal in mentee_profile.career_goals:
                goal_lower = goal.lower()
                
                # Check for leadership goals
                if 'lead' in goal_lower or 'manager' in goal_lower:
                    if 'cto' in mentor_position or 'director' in mentor_position or 'vp' in mentor_position:
                        goal_alignment += 30
                
                # Check for industry alignment
                if 'tech' in goal_lower and mentor_profile.industry.lower() == 'technology':
                    goal_alignment += 25
                
                if 'finance' in goal_lower and mentor_profile.industry.lower() == 'finance':
                    goal_alignment += 25
                
                # Check for entrepreneurship
                if 'company' in goal_lower or 'startup' in goal_lower:
                    if 'entrepreneurship' in [exp.area.value for exp in mentor_profile.primary_expertise]:
                        goal_alignment += 35
            
            return min(goal_alignment, 100.0)
            
        except Exception as e:
            logger.error(f"❌ Error calculating career goals alignment: {str(e)}")
            return 0.0
    
    def _calculate_industry_experience(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate industry experience relevance"""
        try:
            # Direct industry match
            if mentor_profile.industry.lower() in mentee_profile.field_of_study.lower():
                return 90.0
            
            # Related industry scoring
            industry_relations = {
                'technology': ['computer science', 'engineering', 'data science'],
                'finance': ['finance', 'economics', 'business', 'accounting'],
                'healthcare': ['medicine', 'nursing', 'pharmacy', 'biology'],
                'education': ['education', 'teaching', 'training']
            }
            
            mentor_industry = mentor_profile.industry.lower()
            mentee_field = mentee_profile.field_of_study.lower()
            
            for industry, related_fields in industry_relations.items():
                if mentor_industry == industry:
                    for field in related_fields:
                        if field in mentee_field:
                            return 75.0
            
            # Experience years bonus
            experience_score = min(mentor_profile.total_experience_years * 5, 50)
            
            return experience_score
            
        except Exception as e:
            logger.error(f"❌ Error calculating industry experience: {str(e)}")
            return 0.0
    
    def _calculate_cultural_fit(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate cultural fit score"""
        try:
            cultural_score = 50.0  # Base score
            
            # Language compatibility
            mentor_languages = set(mentor_profile.availability.languages)
            mentee_languages = set(mentee_profile.languages)
            language_overlap = len(mentor_languages & mentee_languages)
            
            if language_overlap > 0:
                cultural_score += 20
            
            # UAE cultural alignment
            if mentor_profile.is_uae_national and mentee_profile.is_uae_national:
                cultural_score += 25
            elif mentor_profile.is_uae_national and not mentee_profile.is_uae_national:
                cultural_score += 15  # Good for cultural integration
            
            # Cultural intelligence bonus
            if mentor_profile.cultural_intelligence_score > 8.0:
                cultural_score += 15
            
            return min(cultural_score, 100.0)
            
        except Exception as e:
            logger.error(f"❌ Error calculating cultural fit: {str(e)}")
            return 0.0
    
    def _calculate_communication_compatibility(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate communication style compatibility"""
        try:
            # Response time factor
            response_score = max(0, 100 - (mentor_profile.response_time_hours * 10))
            
            # Language compatibility
            mentor_languages = set(mentor_profile.availability.languages)
            mentee_languages = set(mentee_profile.languages)
            
            if mentor_languages & mentee_languages:
                language_score = 100
            else:
                language_score = 30  # Some communication possible
            
            # Average the scores
            return (response_score + language_score) / 2
            
        except Exception as e:
            logger.error(f"❌ Error calculating communication compatibility: {str(e)}")
            return 0.0
    
    def _calculate_availability_compatibility(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate availability compatibility"""
        try:
            # Check if mentor has capacity
            if mentor_profile.availability.current_mentees >= mentor_profile.availability.max_mentees:
                return 0.0
            
            # Time zone compatibility (assuming both in UAE)
            timezone_score = 100.0
            
            # Capacity utilization factor
            utilization = mentor_profile.availability.current_mentees / mentor_profile.availability.max_mentees
            capacity_score = (1 - utilization) * 100
            
            return (timezone_score + capacity_score) / 2
            
        except Exception as e:
            logger.error(f"❌ Error calculating availability compatibility: {str(e)}")
            return 0.0
    
    def _calculate_learning_style_match(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate learning style compatibility"""
        try:
            # Based on mentor's mentorship philosophy and mentee's learning style
            mentee_style = mentee_profile.learning_style.lower()
            mentor_philosophy = mentor_profile.mentorship_philosophy.lower()
            
            style_compatibility = {
                'hands-on': ['practical', 'experience', 'doing', 'project'],
                'structured': ['systematic', 'organized', 'step-by-step', 'framework'],
                'collaborative': ['team', 'group', 'collaborative', 'together'],
                'independent': ['self-directed', 'autonomous', 'independent']
            }
            
            if mentee_style in style_compatibility:
                keywords = style_compatibility[mentee_style]
                matches = sum(1 for keyword in keywords if keyword in mentor_philosophy)
                return min(matches * 25, 100.0)
            
            return 60.0  # Default compatibility
            
        except Exception as e:
            logger.error(f"❌ Error calculating learning style match: {str(e)}")
            return 0.0
    
    def _calculate_personality_match(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate personality compatibility"""
        try:
            # Simplified personality matching based on available data
            base_score = 70.0
            
            # High-performing mentors tend to work well with ambitious mentees
            if mentor_profile.rating > 4.5 and 'ambitious' in mentee_profile.personality_traits:
                base_score += 20
            
            # Collaborative mentors work well with collaborative mentees
            if 'collaborative' in mentee_profile.personality_traits:
                base_score += 10
            
            return min(base_score, 100.0)
            
        except Exception as e:
            logger.error(f"❌ Error calculating personality match: {str(e)}")
            return 0.0
    
    def _calculate_uae_cultural_intelligence(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate UAE cultural intelligence alignment"""
        try:
            # Mentor's UAE cultural intelligence score
            mentor_ci = mentor_profile.cultural_intelligence_score * 10  # Convert to percentage
            
            # Bonus for UAE experience
            if mentor_profile.uae_experience_years > 5:
                mentor_ci += 10
            
            # Bonus for Arabic proficiency
            if mentor_profile.arabic_proficiency == 'native':
                mentor_ci += 15
            elif mentor_profile.arabic_proficiency == 'fluent':
                mentor_ci += 10
            
            return min(mentor_ci, 100.0)
            
        except Exception as e:
            logger.error(f"❌ Error calculating UAE cultural intelligence: {str(e)}")
            return 0.0
    
    def _calculate_emiratization_alignment(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate Emiratization alignment score"""
        try:
            score = 50.0  # Base score
            
            # UAE national mentee with UAE national mentor
            if mentee_profile.is_uae_national and mentor_profile.is_uae_national:
                score = 100.0
            
            # UAE national mentee with experienced mentor
            elif mentee_profile.is_uae_national and mentor_profile.emiratization_experience:
                score = 85.0
            
            # Non-UAE mentee with UAE cultural intelligence mentor
            elif not mentee_profile.is_uae_national and mentor_profile.cultural_intelligence_score > 8.0:
                score = 70.0
            
            return score
            
        except Exception as e:
            logger.error(f"❌ Error calculating Emiratization alignment: {str(e)}")
            return 0.0
    
    def _calculate_cultural_intelligence_bonus(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate cultural intelligence bonus"""
        try:
            bonus = 0.0
            
            # High cultural intelligence mentor
            if mentor_profile.cultural_intelligence_score > 9.0:
                bonus += 3.0
            elif mentor_profile.cultural_intelligence_score > 8.0:
                bonus += 2.0
            
            # UAE national mentor with non-UAE mentee (cultural bridge)
            if mentor_profile.is_uae_national and not mentee_profile.is_uae_national:
                bonus += 2.0
            
            return bonus
            
        except Exception as e:
            logger.error(f"❌ Error calculating cultural intelligence bonus: {str(e)}")
            return 0.0
    
    def _calculate_emiratization_bonus(self, mentor_profile: Any, mentee_profile: MenteeProfile) -> float:
        """Calculate Emiratization bonus"""
        try:
            bonus = 0.0
            
            # UAE national mentee gets bonus
            if mentee_profile.is_uae_national:
                bonus += 2.0
                
                # Additional bonus for UAE national mentor
                if mentor_profile.is_uae_national:
                    bonus += 1.0
                
                # Emiratization experience bonus
                if mentor_profile.emiratization_experience:
                    bonus += 1.0
            
            return bonus
            
        except Exception as e:
            logger.error(f"❌ Error calculating Emiratization bonus: {str(e)}")
            return 0.0
    
    def _generate_ai_analysis(self, mentor_profile: Any, mentee_profile: MenteeProfile, 
                            criteria_scores: Dict[MatchingCriteria, float]) -> str:
        """Generate AI-powered analysis of the match"""
        try:
            if not model:
                return "AI analysis unavailable - Gemini not configured"
            
            prompt = f"""
            Analyze this mentor-mentee matching for the UAE professional development context:
            
            MENTOR PROFILE:
            - Name: {mentor_profile.full_name}
            - Position: {mentor_profile.current_position} at {mentor_profile.company}
            - Industry: {mentor_profile.industry}
            - Experience: {mentor_profile.total_experience_years} years
            - UAE National: {mentor_profile.is_uae_national}
            - Cultural Intelligence: {mentor_profile.cultural_intelligence_score}/10
            - Rating: {mentor_profile.rating}/5
            - Expertise: {[exp.area.value for exp in mentor_profile.primary_expertise]}
            
            MENTEE PROFILE:
            - Name: {mentee_profile.full_name}
            - Age: {mentee_profile.age}
            - Education: {mentee_profile.education_level} in {mentee_profile.field_of_study}
            - Current Role: {mentee_profile.current_position}
            - Career Goals: {mentee_profile.career_goals}
            - UAE National: {mentee_profile.is_uae_national}
            - Challenges: {mentee_profile.challenges_faced}
            
            COMPATIBILITY SCORES:
            {json.dumps({k.value: v for k, v in criteria_scores.items()}, indent=2)}
            
            Provide a comprehensive analysis focusing on:
            1. Match strengths and synergies
            2. Potential challenges and how to address them
            3. UAE cultural context and Emiratization impact
            4. Success factors and recommendations
            
            Keep the analysis professional, insightful, and actionable (max 300 words).
            """
            
            response = model.generate_content(prompt)
            return response.text if response.text else "AI analysis could not be generated"
            
        except Exception as e:
            logger.error(f"❌ Error generating AI analysis: {str(e)}")
            return f"AI analysis error: {str(e)}"
    
    def _analyze_match_strengths_challenges(self, criteria_scores: Dict[MatchingCriteria, float]) -> Tuple[List[str], List[str]]:
        """Analyze match strengths and challenges"""
        strengths = []
        challenges = []
        
        for criteria, score in criteria_scores.items():
            criteria_name = criteria.value.replace('_', ' ').title()
            
            if score >= 80:
                strengths.append(f"Excellent {criteria_name} ({score:.1f}%)")
            elif score >= 60:
                strengths.append(f"Good {criteria_name} ({score:.1f}%)")
            elif score < 40:
                challenges.append(f"Low {criteria_name} ({score:.1f}%)")
        
        return strengths, challenges
    
    def _generate_match_recommendations(self, mentor_profile: Any, mentee_profile: MenteeProfile, 
                                      criteria_scores: Dict[MatchingCriteria, float]) -> List[str]:
        """Generate match-specific recommendations"""
        recommendations = []
        
        # Expertise recommendations
        if criteria_scores[MatchingCriteria.EXPERTISE_ALIGNMENT] < 60:
            recommendations.append("Focus on transferable skills and cross-industry insights")
        
        # Cultural recommendations
        if criteria_scores[MatchingCriteria.CULTURAL_FIT] < 70:
            recommendations.append("Include cultural orientation sessions in mentorship plan")
        
        # Communication recommendations
        if criteria_scores[MatchingCriteria.COMMUNICATION_STYLE] < 60:
            recommendations.append("Establish clear communication preferences and schedules")
        
        # UAE-specific recommendations
        if mentee_profile.is_uae_national:
            recommendations.append("Leverage UAE national networks and Emiratization opportunities")
        
        if not mentee_profile.is_uae_national:
            recommendations.append("Include UAE cultural integration and market understanding")
        
        return recommendations
    
    def _calculate_success_probability(self, overall_score: float, 
                                     criteria_scores: Dict[MatchingCriteria, float]) -> float:
        """Calculate probability of successful mentorship"""
        try:
            # Base probability from overall score
            base_probability = overall_score * 0.8
            
            # Critical factors boost
            critical_factors = [
                MatchingCriteria.EXPERTISE_ALIGNMENT,
                MatchingCriteria.CAREER_GOALS,
                MatchingCriteria.AVAILABILITY_COMPATIBILITY
            ]
            
            critical_avg = sum(criteria_scores[factor] for factor in critical_factors) / len(critical_factors)
            critical_boost = (critical_avg - 50) * 0.2
            
            success_probability = base_probability + critical_boost
            return max(0, min(success_probability, 100))
            
        except Exception as e:
            logger.error(f"❌ Error calculating success probability: {str(e)}")
            return overall_score * 0.8
    
    def _calculate_confidence_level(self, criteria_scores: Dict[MatchingCriteria, float]) -> float:
        """Calculate confidence level in the matching"""
        try:
            # Higher confidence when scores are consistent
            scores = list(criteria_scores.values())
            avg_score = sum(scores) / len(scores)
            variance = sum((score - avg_score) ** 2 for score in scores) / len(scores)
            std_dev = math.sqrt(variance)
            
            # Lower standard deviation = higher confidence
            confidence = max(0, 100 - (std_dev * 2))
            return confidence
            
        except Exception as e:
            logger.error(f"❌ Error calculating confidence level: {str(e)}")
            return 75.0
    
    def _generate_match_reasoning(self, overall_score: float, 
                                criteria_scores: Dict[MatchingCriteria, float]) -> str:
        """Generate reasoning for the match score"""
        try:
            if overall_score >= 85:
                return "Exceptional match with strong alignment across all key criteria"
            elif overall_score >= 70:
                return "Strong match with good compatibility in most areas"
            elif overall_score >= 55:
                return "Moderate match with some areas requiring attention"
            else:
                return "Challenging match requiring careful planning and support"
                
        except Exception as e:
            logger.error(f"❌ Error generating match reasoning: {str(e)}")
            return "Match reasoning unavailable"
    
    def _generate_mentorship_recommendation(self, mentor_profile: Any, mentee_profile: MenteeProfile, 
                                          compatibility_score: CompatibilityScore) -> MatchingRecommendation:
        """Generate comprehensive mentorship recommendation"""
        try:
            # Determine session frequency based on compatibility and needs
            if compatibility_score.overall_score >= 80:
                session_frequency = "Weekly"
                duration_recommendation = "6-12 months"
            elif compatibility_score.overall_score >= 60:
                session_frequency = "Bi-weekly"
                duration_recommendation = "8-15 months"
            else:
                session_frequency = "Monthly"
                duration_recommendation = "12-18 months"
            
            # Focus areas based on mentee goals and mentor expertise
            focus_areas = []
            for goal in mentee_profile.career_goals[:3]:  # Top 3 goals
                focus_areas.append(goal)
            
            # Success milestones
            success_milestones = [
                "Complete initial goal-setting session",
                "Achieve first quarterly milestone",
                "Demonstrate skill improvement",
                "Expand professional network",
                "Reach career advancement goal"
            ]
            
            # Risk factors
            risk_factors = []
            if compatibility_score.overall_score < 70:
                risk_factors.append("Lower compatibility score may require extra effort")
            
            if compatibility_score.criteria_scores[MatchingCriteria.AVAILABILITY_COMPATIBILITY] < 60:
                risk_factors.append("Scheduling conflicts may arise")
            
            # Mitigation strategies
            mitigation_strategies = [
                "Regular check-ins to assess progress",
                "Flexible scheduling arrangements",
                "Clear goal setting and expectations",
                "Cultural sensitivity awareness"
            ]
            
            # Recommended mentorship plan
            mentorship_plan = {
                "phase_1": {
                    "duration": "Month 1-2",
                    "focus": "Relationship building and goal setting",
                    "activities": ["Initial assessment", "Goal definition", "Expectation setting"]
                },
                "phase_2": {
                    "duration": "Month 3-6",
                    "focus": "Skill development and guidance",
                    "activities": ["Regular mentoring sessions", "Skill building", "Network introduction"]
                },
                "phase_3": {
                    "duration": "Month 7+",
                    "focus": "Advanced development and independence",
                    "activities": ["Leadership development", "Career planning", "Transition preparation"]
                }
            }
            
            return MatchingRecommendation(
                mentor_id=mentor_profile.mentor_id,
                mentee_id=mentee_profile.mentee_id,
                compatibility_score=compatibility_score,
                recommended_mentorship_plan=mentorship_plan,
                session_frequency=session_frequency,
                duration_recommendation=duration_recommendation,
                focus_areas=focus_areas,
                success_milestones=success_milestones,
                risk_factors=risk_factors,
                mitigation_strategies=mitigation_strategies
            )
            
        except Exception as e:
            logger.error(f"❌ Error generating mentorship recommendation: {str(e)}")
            raise
    
    def get_matching_analytics(self) -> Dict[str, Any]:
        """Get comprehensive matching analytics"""
        try:
            total_matches = sum(len(matches) for matches in self.matching_history.values())
            
            if total_matches == 0:
                return {
                    'total_matches_analyzed': 0,
                    'average_compatibility_score': 0,
                    'success_rate': 0,
                    'top_criteria': [],
                    'matching_trends': {}
                }
            
            # Calculate average scores
            all_scores = []
            criteria_totals = defaultdict(list)
            
            for matches in self.matching_history.values():
                for match in matches:
                    all_scores.append(match.overall_score)
                    for criteria, score in match.criteria_scores.items():
                        criteria_totals[criteria].append(score)
            
            avg_score = sum(all_scores) / len(all_scores)
            
            # Top performing criteria
            criteria_averages = {
                criteria.value: sum(scores) / len(scores)
                for criteria, scores in criteria_totals.items()
            }
            
            top_criteria = sorted(criteria_averages.items(), key=lambda x: x[1], reverse=True)[:5]
            
            return {
                'total_matches_analyzed': total_matches,
                'average_compatibility_score': round(avg_score, 2),
                'success_rate': len(self.successful_matches) / total_matches * 100 if total_matches > 0 else 0,
                'top_criteria': top_criteria,
                'matching_trends': {
                    'high_compatibility_matches': len([s for s in all_scores if s >= 80]),
                    'moderate_compatibility_matches': len([s for s in all_scores if 60 <= s < 80]),
                    'low_compatibility_matches': len([s for s in all_scores if s < 60])
                },
                'criteria_performance': criteria_averages
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting matching analytics: {str(e)}")
            return {}

# Initialize global matching engine
ai_matching_engine = AIMentorshipMatchingEngine()

logger.info("✅ AI Mentorship Matching Engine module loaded successfully")
