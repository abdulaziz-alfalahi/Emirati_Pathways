#!/usr/bin/env python3
"""
Recruiter Engine - Core Business Logic
Emirati Journey Platform - Recruiter Services

Provides core data structures and business logic for recruiter operations.
"""

import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JobType(Enum):
    """Job type enumeration"""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    TEMPORARY = "temporary"


class JobLevel(Enum):
    """Job level enumeration"""
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    EXECUTIVE = "executive"
    MANAGER = "manager"
    DIRECTOR = "director"


class EmploymentStatus(Enum):
    """Employment status for job postings"""
    DRAFT = "draft"
    ACTIVE = "active"
    FILLED = "filled"
    CLOSED = "closed"
    ON_HOLD = "on_hold"


class CandidateEmploymentStatus(Enum):
    """Candidate employment status for filtering"""
    EMPLOYED = "employed"
    JOB_SEEKER = 'candidate'
    OPEN_TO_OPPORTUNITIES = "open_to_opportunities"
    NOT_LOOKING = "not_looking"


class InterviewType(Enum):
    """Interview type enumeration"""
    PHONE = "phone"
    VIDEO = "video"
    IN_PERSON = "in_person"
    PANEL = "panel"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"


class InterviewStatus(Enum):
    """Interview status enumeration"""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"


class OfferStatus(Enum):
    """Offer status enumeration"""
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    WITHDRAWN = "withdrawn"


@dataclass
class CompanyProfile:
    """Company profile information"""
    company_id: str
    company_name: str
    company_name_arabic: Optional[str] = None
    industry: str = ""
    size: str = ""
    website: Optional[str] = None
    description: str = ""
    description_arabic: Optional[str] = None
    logo_url: Optional[str] = None
    emirate: str = ""
    city: str = ""
    address: str = ""
    contact_email: str = ""
    contact_phone: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class RecruiterProfile:
    """Recruiter profile information"""
    recruiter_id: str
    user_id: str
    company_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    position: str = ""
    department: str = ""
    is_active: bool = True
    created_at: str = ""
    last_login: Optional[str] = None
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class JobPosting:
    """Job posting data structure"""
    job_id: str
    recruiter_id: str
    company_id: str
    title: str
    title_arabic: Optional[str] = None
    department: str = ""
    job_type: str = "full_time"
    job_level: str = "mid"
    emirate: str = ""
    city: str = ""
    remote_option: bool = False
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "AED"
    visa_sponsorship: bool = False
    status: str = "draft"
    created_at: str = ""
    updated_at: str = ""
    published_at: Optional[str] = None
    expires_at: Optional[str] = None
    views_count: int = 0
    applications_count: int = 0
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.updated_at:
            self.updated_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class Candidate:
    """Candidate information"""
    candidate_id: str
    user_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    emirate: str = ""
    nationality: str = ""
    is_uae_national: bool = False
    education_level: str = ""
    experience_years: int = 0
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    employment_status: str = 'candidate'
    skills: List[str] = field(default_factory=list)
    preferred_salary_min: Optional[float] = None
    preferred_salary_max: Optional[float] = None
    cv_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    match_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class Interview:
    """Interview data structure"""
    interview_id: str
    job_id: str
    candidate_id: str
    recruiter_id: str
    interview_type: str = "video"
    status: str = "scheduled"
    scheduled_at: Optional[str] = None
    duration_minutes: int = 60
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    interviewer_ids: List[str] = field(default_factory=list)
    notes: str = ""
    feedback: Optional[Dict[str, Any]] = None
    score: Optional[float] = None
    created_at: str = ""
    updated_at: str = ""
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.updated_at:
            self.updated_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class Offer:
    """Offer data structure"""
    offer_id: str
    job_id: str
    candidate_id: str
    recruiter_id: str
    position_title: str
    salary: float
    salary_currency: str = "AED"
    benefits: List[str] = field(default_factory=list)
    start_date: Optional[str] = None
    contract_type: str = "full_time"
    probation_period_months: int = 3
    status: str = "draft"
    sent_at: Optional[str] = None
    responded_at: Optional[str] = None
    expires_at: Optional[str] = None
    offer_letter_url: Optional[str] = None
    notes: str = ""
    created_at: str = ""
    updated_at: str = ""
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.updated_at:
            self.updated_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


class RecruiterEngine:
    """Core recruiter business logic engine"""
    
    def __init__(self):
        """Initialize recruiter engine"""
        self.logger = logging.getLogger(__name__)
        self.logger.info("RecruiterEngine initialized")
    
    def create_job_posting(
        self,
        recruiter_id: str,
        company_id: str,
        title: str,
        job_type: JobType = JobType.FULL_TIME,
        job_level: JobLevel = JobLevel.MID
    ) -> Dict[str, Any]:
        """Create a new job posting"""
        try:
            job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
            
            job_posting = JobPosting(
                job_id=job_id,
                recruiter_id=recruiter_id,
                company_id=company_id,
                title=title,
                job_type=job_type.value,
                job_level=job_level.value,
                status=EmploymentStatus.DRAFT.value
            )
            
            self.logger.info(f"Created job posting: {job_id}")
            
            return {
                'job_id': job_id,
                'job_posting': job_posting.to_dict(),
                'metadata': {
                    'created_at': job_posting.created_at,
                    'status': job_posting.status,
                    'completion_score': 0
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error creating job posting: {str(e)}")
            raise
    
    def calculate_job_completion_score(self, job_data: Dict[str, Any]) -> int:
        """Calculate job posting completion score"""
        try:
            score = 0
            max_score = 100
            
            # Basic information (30 points)
            if job_data.get('title'):
                score += 10
            if job_data.get('department'):
                score += 5
            if job_data.get('job_type'):
                score += 5
            if job_data.get('job_level'):
                score += 5
            if job_data.get('emirate') and job_data.get('city'):
                score += 5
            
            # Job description (20 points)
            if job_data.get('description') and len(job_data.get('description', '')) > 100:
                score += 20
            
            # Requirements (20 points)
            requirements = job_data.get('requirements', [])
            if requirements and len(requirements) >= 3:
                score += 20
            elif requirements:
                score += 10
            
            # Responsibilities (15 points)
            responsibilities = job_data.get('responsibilities', [])
            if responsibilities and len(responsibilities) >= 3:
                score += 15
            elif responsibilities:
                score += 7
            
            # Compensation (10 points)
            if job_data.get('salary_min') and job_data.get('salary_max'):
                score += 10
            elif job_data.get('salary_min') or job_data.get('salary_max'):
                score += 5
            
            # Benefits (5 points)
            if job_data.get('benefits') and len(job_data.get('benefits', [])) > 0:
                score += 5
            
            return min(score, max_score)
            
        except Exception as e:
            self.logger.error(f"Error calculating completion score: {str(e)}")
            return 0
    
    def get_completion_recommendations(self, job_data: Dict[str, Any]) -> List[str]:
        """Get recommendations for completing job posting"""
        recommendations = []
        
        if not job_data.get('title'):
            recommendations.append("Add job title")
        
        if not job_data.get('description') or len(job_data.get('description', '')) < 100:
            recommendations.append("Add detailed job description (minimum 100 characters)")
        
        requirements = job_data.get('requirements', [])
        if not requirements or len(requirements) < 3:
            recommendations.append("Add at least 3 job requirements")
        
        responsibilities = job_data.get('responsibilities', [])
        if not responsibilities or len(responsibilities) < 3:
            recommendations.append("Add at least 3 job responsibilities")
        
        if not job_data.get('salary_min') or not job_data.get('salary_max'):
            recommendations.append("Add salary range")
        
        if not job_data.get('benefits') or len(job_data.get('benefits', [])) == 0:
            recommendations.append("Add employee benefits")
        
        if not job_data.get('emirate') or not job_data.get('city'):
            recommendations.append("Add job location (emirate and city)")
        
        return recommendations
    
    def validate_job_posting(self, job_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate job posting before publishing"""
        errors = []
        
        # Required fields
        if not job_data.get('title'):
            errors.append("Job title is required")
        
        if not job_data.get('description'):
            errors.append("Job description is required")
        
        if not job_data.get('requirements'):
            errors.append("Job requirements are required")
        
        if not job_data.get('responsibilities'):
            errors.append("Job responsibilities are required")
        
        if not job_data.get('emirate'):
            errors.append("Job location (emirate) is required")
        
        # Salary validation
        if job_data.get('salary_min') and job_data.get('salary_max'):
            if job_data['salary_min'] > job_data['salary_max']:
                errors.append("Minimum salary cannot be greater than maximum salary")
        
        is_valid = len(errors) == 0
        return is_valid, errors


# Singleton instance
_recruiter_engine_instance = None


def get_recruiter_engine() -> RecruiterEngine:
    """Get singleton instance of RecruiterEngine"""
    global _recruiter_engine_instance
    if _recruiter_engine_instance is None:
        _recruiter_engine_instance = RecruiterEngine()
    return _recruiter_engine_instance

