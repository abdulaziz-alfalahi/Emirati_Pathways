"""
Mentor System for Emirati Journey Platform
Comprehensive mentor profile management with expertise tracking and authentication
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import json
import uuid
import hashlib
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MentorshipLevel(Enum):
    """Mentorship experience levels"""
    EMERGING = "emerging"           # 1-3 years experience
    EXPERIENCED = "experienced"     # 4-7 years experience
    SENIOR = "senior"              # 8-15 years experience
    EXECUTIVE = "executive"        # 15+ years experience
    THOUGHT_LEADER = "thought_leader"  # Industry recognized expert

class ExpertiseArea(Enum):
    """Areas of professional expertise"""
    TECHNOLOGY = "technology"
    FINANCE = "finance"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    GOVERNMENT = "government"
    ENERGY = "energy"
    TOURISM = "tourism"
    REAL_ESTATE = "real_estate"
    LOGISTICS = "logistics"
    MANUFACTURING = "manufacturing"
    CONSULTING = "consulting"
    ENTREPRENEURSHIP = "entrepreneurship"
    LEADERSHIP = "leadership"
    INNOVATION = "innovation"
    SUSTAINABILITY = "sustainability"

class MentorshipType(Enum):
    """Types of mentorship offered"""
    CAREER_GUIDANCE = "career_guidance"
    SKILL_DEVELOPMENT = "skill_development"
    LEADERSHIP_COACHING = "leadership_coaching"
    INDUSTRY_INSIGHTS = "industry_insights"
    NETWORK_BUILDING = "network_building"
    ENTREPRENEURSHIP = "entrepreneurship"
    CULTURAL_INTEGRATION = "cultural_integration"
    EMIRATIZATION_SUPPORT = "emiratization_support"

class AvailabilityStatus(Enum):
    """Mentor availability status"""
    AVAILABLE = "available"
    BUSY = "busy"
    LIMITED = "limited"
    UNAVAILABLE = "unavailable"

class CertificationLevel(Enum):
    """Professional certification levels"""
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"
    MASTER = "master"

@dataclass
class MentorExpertise:
    """Mentor expertise information"""
    area: ExpertiseArea
    level: MentorshipLevel
    years_experience: int
    certifications: List[str]
    skills: List[str]
    achievements: List[str]
    industry_recognition: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'area': self.area.value,
            'level': self.level.value,
            'years_experience': self.years_experience,
            'certifications': self.certifications,
            'skills': self.skills,
            'achievements': self.achievements,
            'industry_recognition': self.industry_recognition
        }

@dataclass
class MentorAvailability:
    """Mentor availability information"""
    status: AvailabilityStatus
    hours_per_week: int
    preferred_times: List[str]
    time_zone: str
    languages: List[str]
    session_duration_preferences: List[int]  # in minutes
    max_mentees: int
    current_mentees: int
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'status': self.status.value,
            'hours_per_week': self.hours_per_week,
            'preferred_times': self.preferred_times,
            'time_zone': self.time_zone,
            'languages': self.languages,
            'session_duration_preferences': self.session_duration_preferences,
            'max_mentees': self.max_mentees,
            'current_mentees': self.current_mentees
        }

@dataclass
class MentorProfile:
    """Comprehensive mentor profile"""
    mentor_id: str
    user_id: str
    full_name: str
    email: str
    phone: Optional[str]
    profile_image: Optional[str]
    
    # Professional Information
    current_position: str
    company: str
    industry: str
    total_experience_years: int
    
    # Expertise Areas
    primary_expertise: List[MentorExpertise]
    secondary_expertise: List[MentorExpertise]
    mentorship_types: List[MentorshipType]
    
    # UAE-Specific Information
    is_uae_national: bool
    uae_experience_years: int
    arabic_proficiency: str
    cultural_intelligence_score: float
    emiratization_experience: bool
    
    # Availability and Preferences
    availability: MentorAvailability
    mentorship_philosophy: str
    success_stories: List[str]
    testimonials: List[Dict[str, Any]]
    
    # Performance Metrics
    rating: float
    total_mentees: int
    successful_placements: int
    session_completion_rate: float
    response_time_hours: float
    
    # Platform Information
    verification_status: str
    background_check_status: str
    created_at: datetime
    updated_at: datetime
    last_active: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'mentor_id': self.mentor_id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'profile_image': self.profile_image,
            'current_position': self.current_position,
            'company': self.company,
            'industry': self.industry,
            'total_experience_years': self.total_experience_years,
            'primary_expertise': [exp.to_dict() for exp in self.primary_expertise],
            'secondary_expertise': [exp.to_dict() for exp in self.secondary_expertise],
            'mentorship_types': [mt.value for mt in self.mentorship_types],
            'is_uae_national': self.is_uae_national,
            'uae_experience_years': self.uae_experience_years,
            'arabic_proficiency': self.arabic_proficiency,
            'cultural_intelligence_score': self.cultural_intelligence_score,
            'emiratization_experience': self.emiratization_experience,
            'availability': self.availability.to_dict(),
            'mentorship_philosophy': self.mentorship_philosophy,
            'success_stories': self.success_stories,
            'testimonials': self.testimonials,
            'rating': self.rating,
            'total_mentees': self.total_mentees,
            'successful_placements': self.successful_placements,
            'session_completion_rate': self.session_completion_rate,
            'response_time_hours': self.response_time_hours,
            'verification_status': self.verification_status,
            'background_check_status': self.background_check_status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_active': self.last_active.isoformat()
        }

class MentorSystem:
    """Comprehensive mentor management system"""
    
    def __init__(self):
        """Initialize the mentor system"""
        self.mentor_profiles: Dict[str, MentorProfile] = {}
        self.expertise_index: Dict[ExpertiseArea, List[str]] = defaultdict(list)
        self.industry_index: Dict[str, List[str]] = defaultdict(list)
        self.availability_index: Dict[AvailabilityStatus, List[str]] = defaultdict(list)
        self.uae_national_mentors: List[str] = []
        
        # Initialize sample data
        self._initialize_sample_data()
        
        logger.info("✅ Mentor System initialized successfully")
    
    def _initialize_sample_data(self):
        """Initialize sample mentor data"""
        try:
            # Sample mentor profiles
            sample_mentors = [
                {
                    'full_name': 'Dr. Ahmed Al Mansouri',
                    'email': 'ahmed.almansouri@emiratijourney.ae',
                    'current_position': 'Chief Technology Officer',
                    'company': 'Dubai Future Foundation',
                    'industry': 'Technology',
                    'total_experience_years': 15,
                    'is_uae_national': True,
                    'uae_experience_years': 15,
                    'arabic_proficiency': 'native',
                    'cultural_intelligence_score': 9.5,
                    'emiratization_experience': True,
                    'primary_expertise': [ExpertiseArea.TECHNOLOGY, ExpertiseArea.INNOVATION],
                    'mentorship_types': [MentorshipType.CAREER_GUIDANCE, MentorshipType.LEADERSHIP_COACHING],
                    'mentorship_philosophy': 'Empowering the next generation of UAE tech leaders through innovation and cultural intelligence.',
                    'rating': 4.9
                },
                {
                    'full_name': 'Fatima Al Zahra',
                    'email': 'fatima.alzahra@emiratijourney.ae',
                    'current_position': 'Senior Vice President',
                    'company': 'Emirates NBD',
                    'industry': 'Finance',
                    'total_experience_years': 12,
                    'is_uae_national': True,
                    'uae_experience_years': 12,
                    'arabic_proficiency': 'native',
                    'cultural_intelligence_score': 9.2,
                    'emiratization_experience': True,
                    'primary_expertise': [ExpertiseArea.FINANCE, ExpertiseArea.LEADERSHIP],
                    'mentorship_types': [MentorshipType.CAREER_GUIDANCE, MentorshipType.EMIRATIZATION_SUPPORT],
                    'mentorship_philosophy': 'Building strong financial leaders who contribute to UAE\'s economic vision.',
                    'rating': 4.8
                }
            ]
            
            for mentor_data in sample_mentors:
                self._create_sample_mentor(mentor_data)
            
            logger.info("✅ Sample mentor data initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Error initializing sample data: {str(e)}")
    
    def _create_sample_mentor(self, data: Dict[str, Any]) -> str:
        """Create a sample mentor profile"""
        mentor_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Create expertise objects
        primary_expertise = []
        for area in data['primary_expertise']:
            expertise = MentorExpertise(
                area=area,
                level=MentorshipLevel.SENIOR,
                years_experience=data['total_experience_years'],
                certifications=['Professional Certification', 'Leadership Certificate'],
                skills=['Strategic Planning', 'Team Leadership', 'Innovation Management'],
                achievements=['Industry Award 2023', 'Best Mentor Award 2022'],
                industry_recognition=['Featured Speaker', 'Industry Expert Panel']
            )
            primary_expertise.append(expertise)
        
        # Create availability
        availability = MentorAvailability(
            status=AvailabilityStatus.AVAILABLE,
            hours_per_week=10,
            preferred_times=['09:00-12:00', '14:00-17:00'],
            time_zone='Asia/Dubai',
            languages=['Arabic', 'English'],
            session_duration_preferences=[30, 60, 90],
            max_mentees=5,
            current_mentees=2
        )
        
        # Create mentor profile
        mentor_profile = MentorProfile(
            mentor_id=mentor_id,
            user_id=user_id,
            full_name=data['full_name'],
            email=data['email'],
            phone='+971501234567',
            profile_image=None,
            current_position=data['current_position'],
            company=data['company'],
            industry=data['industry'],
            total_experience_years=data['total_experience_years'],
            primary_expertise=primary_expertise,
            secondary_expertise=[],
            mentorship_types=data['mentorship_types'],
            is_uae_national=data['is_uae_national'],
            uae_experience_years=data['uae_experience_years'],
            arabic_proficiency=data['arabic_proficiency'],
            cultural_intelligence_score=data['cultural_intelligence_score'],
            emiratization_experience=data['emiratization_experience'],
            availability=availability,
            mentorship_philosophy=data['mentorship_philosophy'],
            success_stories=['Helped 15 professionals advance to leadership roles'],
            testimonials=[
                {
                    'mentee_name': 'Sarah Ahmed',
                    'rating': 5,
                    'comment': 'Exceptional mentor who provided invaluable career guidance.',
                    'date': '2024-08-15'
                }
            ],
            rating=data['rating'],
            total_mentees=25,
            successful_placements=20,
            session_completion_rate=0.95,
            response_time_hours=2.5,
            verification_status='verified',
            background_check_status='approved',
            created_at=datetime.now(),
            updated_at=datetime.now(),
            last_active=datetime.now()
        )
        
        # Store mentor profile
        self.mentor_profiles[mentor_id] = mentor_profile
        
        # Update indexes
        self._update_indexes(mentor_profile)
        
        return mentor_id
    
    def create_mentor_profile(self, profile_data: Dict[str, Any]) -> str:
        """Create a new mentor profile"""
        try:
            mentor_id = str(uuid.uuid4())
            
            # Parse expertise areas
            primary_expertise = []
            for exp_data in profile_data.get('primary_expertise', []):
                expertise = MentorExpertise(
                    area=ExpertiseArea(exp_data['area']),
                    level=MentorshipLevel(exp_data['level']),
                    years_experience=exp_data['years_experience'],
                    certifications=exp_data.get('certifications', []),
                    skills=exp_data.get('skills', []),
                    achievements=exp_data.get('achievements', []),
                    industry_recognition=exp_data.get('industry_recognition', [])
                )
                primary_expertise.append(expertise)
            
            # Parse availability
            availability_data = profile_data.get('availability', {})
            availability = MentorAvailability(
                status=AvailabilityStatus(availability_data.get('status', 'available')),
                hours_per_week=availability_data.get('hours_per_week', 5),
                preferred_times=availability_data.get('preferred_times', []),
                time_zone=availability_data.get('time_zone', 'Asia/Dubai'),
                languages=availability_data.get('languages', ['English']),
                session_duration_preferences=availability_data.get('session_duration_preferences', [60]),
                max_mentees=availability_data.get('max_mentees', 3),
                current_mentees=0
            )
            
            # Parse mentorship types
            mentorship_types = [MentorshipType(mt) for mt in profile_data.get('mentorship_types', [])]
            
            # Create mentor profile
            mentor_profile = MentorProfile(
                mentor_id=mentor_id,
                user_id=profile_data['user_id'],
                full_name=profile_data['full_name'],
                email=profile_data['email'],
                phone=profile_data.get('phone'),
                profile_image=profile_data.get('profile_image'),
                current_position=profile_data['current_position'],
                company=profile_data['company'],
                industry=profile_data['industry'],
                total_experience_years=profile_data['total_experience_years'],
                primary_expertise=primary_expertise,
                secondary_expertise=[],
                mentorship_types=mentorship_types,
                is_uae_national=profile_data.get('is_uae_national', False),
                uae_experience_years=profile_data.get('uae_experience_years', 0),
                arabic_proficiency=profile_data.get('arabic_proficiency', 'none'),
                cultural_intelligence_score=profile_data.get('cultural_intelligence_score', 5.0),
                emiratization_experience=profile_data.get('emiratization_experience', False),
                availability=availability,
                mentorship_philosophy=profile_data.get('mentorship_philosophy', ''),
                success_stories=profile_data.get('success_stories', []),
                testimonials=profile_data.get('testimonials', []),
                rating=0.0,
                total_mentees=0,
                successful_placements=0,
                session_completion_rate=0.0,
                response_time_hours=0.0,
                verification_status='pending',
                background_check_status='pending',
                created_at=datetime.now(),
                updated_at=datetime.now(),
                last_active=datetime.now()
            )
            
            # Store mentor profile
            self.mentor_profiles[mentor_id] = mentor_profile
            
            # Update indexes
            self._update_indexes(mentor_profile)
            
            logger.info(f"✅ Mentor profile created successfully: {mentor_id}")
            return mentor_id
            
        except Exception as e:
            logger.error(f"❌ Error creating mentor profile: {str(e)}")
            raise
    
    def get_mentor_profile(self, mentor_id: str) -> Optional[MentorProfile]:
        """Get mentor profile by ID"""
        return self.mentor_profiles.get(mentor_id)
    
    def update_mentor_profile(self, mentor_id: str, updates: Dict[str, Any]) -> bool:
        """Update mentor profile"""
        try:
            if mentor_id not in self.mentor_profiles:
                return False
            
            mentor = self.mentor_profiles[mentor_id]
            
            # Update fields
            for field, value in updates.items():
                if hasattr(mentor, field):
                    setattr(mentor, field, value)
            
            mentor.updated_at = datetime.now()
            
            # Update indexes
            self._update_indexes(mentor)
            
            logger.info(f"✅ Mentor profile updated successfully: {mentor_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error updating mentor profile: {str(e)}")
            return False
    
    def search_mentors(self, criteria: Dict[str, Any]) -> List[MentorProfile]:
        """Search mentors based on criteria"""
        try:
            results = []
            
            for mentor in self.mentor_profiles.values():
                if self._matches_criteria(mentor, criteria):
                    results.append(mentor)
            
            # Sort by rating and availability
            results.sort(key=lambda m: (m.rating, m.availability.status == AvailabilityStatus.AVAILABLE), reverse=True)
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Error searching mentors: {str(e)}")
            return []
    
    def get_available_mentors(self, expertise_area: Optional[ExpertiseArea] = None) -> List[MentorProfile]:
        """Get available mentors, optionally filtered by expertise"""
        try:
            available_mentors = []
            
            for mentor in self.mentor_profiles.values():
                if mentor.availability.status == AvailabilityStatus.AVAILABLE:
                    if mentor.availability.current_mentees < mentor.availability.max_mentees:
                        if expertise_area is None:
                            available_mentors.append(mentor)
                        else:
                            # Check if mentor has the required expertise
                            for exp in mentor.primary_expertise:
                                if exp.area == expertise_area:
                                    available_mentors.append(mentor)
                                    break
            
            # Sort by rating
            available_mentors.sort(key=lambda m: m.rating, reverse=True)
            
            return available_mentors
            
        except Exception as e:
            logger.error(f"❌ Error getting available mentors: {str(e)}")
            return []
    
    def get_uae_national_mentors(self) -> List[MentorProfile]:
        """Get UAE national mentors for Emiratization support"""
        try:
            uae_mentors = []
            
            for mentor in self.mentor_profiles.values():
                if mentor.is_uae_national and mentor.emiratization_experience:
                    uae_mentors.append(mentor)
            
            # Sort by cultural intelligence score and rating
            uae_mentors.sort(key=lambda m: (m.cultural_intelligence_score, m.rating), reverse=True)
            
            return uae_mentors
            
        except Exception as e:
            logger.error(f"❌ Error getting UAE national mentors: {str(e)}")
            return []
    
    def get_mentor_statistics(self) -> Dict[str, Any]:
        """Get comprehensive mentor statistics"""
        try:
            total_mentors = len(self.mentor_profiles)
            available_mentors = len([m for m in self.mentor_profiles.values() 
                                   if m.availability.status == AvailabilityStatus.AVAILABLE])
            uae_national_count = len([m for m in self.mentor_profiles.values() if m.is_uae_national])
            
            # Expertise distribution
            expertise_distribution = defaultdict(int)
            for mentor in self.mentor_profiles.values():
                for exp in mentor.primary_expertise:
                    expertise_distribution[exp.area.value] += 1
            
            # Average ratings
            ratings = [m.rating for m in self.mentor_profiles.values() if m.rating > 0]
            avg_rating = sum(ratings) / len(ratings) if ratings else 0
            
            # Industry distribution
            industry_distribution = defaultdict(int)
            for mentor in self.mentor_profiles.values():
                industry_distribution[mentor.industry] += 1
            
            return {
                'total_mentors': total_mentors,
                'available_mentors': available_mentors,
                'uae_national_mentors': uae_national_count,
                'average_rating': round(avg_rating, 2),
                'expertise_distribution': dict(expertise_distribution),
                'industry_distribution': dict(industry_distribution),
                'availability_distribution': {
                    status.value: len([m for m in self.mentor_profiles.values() 
                                     if m.availability.status == status])
                    for status in AvailabilityStatus
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting mentor statistics: {str(e)}")
            return {}
    
    def _update_indexes(self, mentor: MentorProfile):
        """Update search indexes"""
        try:
            # Update expertise index
            for exp in mentor.primary_expertise:
                if mentor.mentor_id not in self.expertise_index[exp.area]:
                    self.expertise_index[exp.area].append(mentor.mentor_id)
            
            # Update industry index
            if mentor.mentor_id not in self.industry_index[mentor.industry]:
                self.industry_index[mentor.industry].append(mentor.mentor_id)
            
            # Update availability index
            if mentor.mentor_id not in self.availability_index[mentor.availability.status]:
                self.availability_index[mentor.availability.status].append(mentor.mentor_id)
            
            # Update UAE national index
            if mentor.is_uae_national and mentor.mentor_id not in self.uae_national_mentors:
                self.uae_national_mentors.append(mentor.mentor_id)
            
        except Exception as e:
            logger.error(f"❌ Error updating indexes: {str(e)}")
    
    def _matches_criteria(self, mentor: MentorProfile, criteria: Dict[str, Any]) -> bool:
        """Check if mentor matches search criteria"""
        try:
            # Check expertise area
            if 'expertise_area' in criteria:
                expertise_match = False
                for exp in mentor.primary_expertise:
                    if exp.area.value == criteria['expertise_area']:
                        expertise_match = True
                        break
                if not expertise_match:
                    return False
            
            # Check industry
            if 'industry' in criteria:
                if mentor.industry.lower() != criteria['industry'].lower():
                    return False
            
            # Check availability
            if 'availability_status' in criteria:
                if mentor.availability.status.value != criteria['availability_status']:
                    return False
            
            # Check UAE national
            if 'uae_national' in criteria:
                if mentor.is_uae_national != criteria['uae_national']:
                    return False
            
            # Check minimum rating
            if 'min_rating' in criteria:
                if mentor.rating < criteria['min_rating']:
                    return False
            
            # Check languages
            if 'languages' in criteria:
                required_languages = set(criteria['languages'])
                mentor_languages = set(mentor.availability.languages)
                if not required_languages.issubset(mentor_languages):
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error matching criteria: {str(e)}")
            return False

# Initialize global mentor system
mentor_system = MentorSystem()

logger.info("✅ Mentor System module loaded successfully")
