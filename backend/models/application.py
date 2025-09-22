"""
Application Model for Emirati Journey Platform
Comprehensive job application tracking and management system
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass, asdict
import json

class ApplicationStatus(Enum):
    """Application Status Types"""
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    REFERENCE_CHECK = "reference_check"
    OFFER_MADE = "offer_made"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    ON_HOLD = "on_hold"

class InterviewType(Enum):
    """Interview Types"""
    PHONE = "phone"
    VIDEO = "video"
    IN_PERSON = "in_person"
    PANEL = "panel"
    TECHNICAL = "technical"
    HR_SCREENING = "hr_screening"

class ApplicationSource(Enum):
    """Application Source"""
    DIRECT = "direct"
    REFERRAL = "referral"
    LINKEDIN = "linkedin"
    JOB_BOARD = "job_board"
    COMPANY_WEBSITE = "company_website"
    RECRUITMENT_AGENCY = "recruitment_agency"
    CAREER_FAIR = "career_fair"
    OTHER = "other"

@dataclass
class InterviewDetails:
    """Interview information"""
    interview_type: InterviewType
    scheduled_date: datetime
    duration_minutes: int = 60
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    interviewer_name: Optional[str] = None
    interviewer_email: Optional[str] = None
    notes: Optional[str] = None
    completed: bool = False
    feedback: Optional[str] = None
    rating: Optional[int] = None  # 1-5 scale

@dataclass
class OfferDetails:
    """Job offer information"""
    salary_offered: int
    currency: str = "AED"
    benefits: List[str] = None
    start_date: Optional[date] = None
    offer_expiry_date: Optional[date] = None
    contract_type: str = "permanent"  # permanent, contract, temporary
    probation_period_months: Optional[int] = None
    notice_period: Optional[str] = None
    additional_terms: Optional[str] = None
    
    def __post_init__(self):
        if self.benefits is None:
            self.benefits = []

@dataclass
class ApplicationStatusHistory:
    """Status change history"""
    old_status: Optional[ApplicationStatus]
    new_status: ApplicationStatus
    changed_by: str  # User ID
    changed_at: datetime
    notes: Optional[str] = None
    reason: Optional[str] = None

@dataclass
class Application:
    """Comprehensive Application Model"""
    
    # Basic Information
    id: Optional[str] = None
    job_id: str = ""
    candidate_id: str = ""
    
    # Application Details
    status: ApplicationStatus = ApplicationStatus.SUBMITTED
    cover_letter: Optional[str] = None
    expected_salary: Optional[int] = None
    salary_currency: str = "AED"
    available_from: Optional[date] = None
    notice_period: Optional[str] = None
    
    # Source and Referral
    source: ApplicationSource = ApplicationSource.DIRECT
    referral_source: Optional[str] = None
    referrer_id: Optional[str] = None
    
    # Interview Information
    interviews: List[InterviewDetails] = None
    
    # Offer Information
    offer: Optional[OfferDetails] = None
    
    # Feedback and Notes
    recruiter_notes: Optional[str] = None
    candidate_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    internal_notes: Optional[str] = None
    
    # Scoring and Matching
    match_score: Optional[float] = None  # 0-100 percentage
    recruiter_rating: Optional[int] = None  # 1-5 scale
    skills_match_percentage: Optional[float] = None
    experience_match_percentage: Optional[float] = None
    
    # Tracking
    status_history: List[ApplicationStatusHistory] = None
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    shortlisted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    offer_made_at: Optional[datetime] = None
    offer_responded_at: Optional[datetime] = None
    
    # Metadata
    reviewed_by: Optional[str] = None  # User ID
    hiring_manager_id: Optional[str] = None
    hr_contact_id: Optional[str] = None
    
    def __post_init__(self):
        """Initialize default values"""
        if self.interviews is None:
            self.interviews = []
        if self.status_history is None:
            self.status_history = []
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
    
    def update_status(self, new_status: ApplicationStatus, updated_by: str, 
                     notes: Optional[str] = None, reason: Optional[str] = None):
        """Update application status and create history record"""
        old_status = self.status
        self.status = new_status
        self.updated_at = datetime.utcnow()
        
        # Update specific timestamps
        if new_status == ApplicationStatus.REVIEWED and not self.reviewed_at:
            self.reviewed_at = datetime.utcnow()
        elif new_status == ApplicationStatus.SHORTLISTED and not self.shortlisted_at:
            self.shortlisted_at = datetime.utcnow()
        elif new_status == ApplicationStatus.REJECTED and not self.rejected_at:
            self.rejected_at = datetime.utcnow()
        elif new_status == ApplicationStatus.OFFER_MADE and not self.offer_made_at:
            self.offer_made_at = datetime.utcnow()
        elif new_status in [ApplicationStatus.OFFER_ACCEPTED, ApplicationStatus.OFFER_DECLINED] and not self.offer_responded_at:
            self.offer_responded_at = datetime.utcnow()
        
        # Create status history record
        history_entry = ApplicationStatusHistory(
            old_status=old_status,
            new_status=new_status,
            changed_by=updated_by,
            changed_at=datetime.utcnow(),
            notes=notes,
            reason=reason
        )
        self.status_history.append(history_entry)
    
    def schedule_interview(self, interview_details: InterviewDetails):
        """Schedule an interview"""
        self.interviews.append(interview_details)
        if self.status == ApplicationStatus.SHORTLISTED:
            self.update_status(ApplicationStatus.INTERVIEW_SCHEDULED, 
                             interview_details.interviewer_name or "system")
    
    def complete_interview(self, interview_index: int, feedback: str, rating: int):
        """Mark interview as completed with feedback"""
        if 0 <= interview_index < len(self.interviews):
            self.interviews[interview_index].completed = True
            self.interviews[interview_index].feedback = feedback
            self.interviews[interview_index].rating = rating
            
            # Update status if all interviews are completed
            if all(interview.completed for interview in self.interviews):
                self.update_status(ApplicationStatus.INTERVIEW_COMPLETED, 
                                 self.interviews[interview_index].interviewer_name or "system")
    
    def make_offer(self, offer_details: OfferDetails, made_by: str):
        """Make a job offer"""
        self.offer = offer_details
        self.update_status(ApplicationStatus.OFFER_MADE, made_by)
    
    def respond_to_offer(self, accepted: bool, response_by: str, notes: Optional[str] = None):
        """Respond to job offer"""
        if accepted:
            self.update_status(ApplicationStatus.OFFER_ACCEPTED, response_by, notes)
        else:
            self.update_status(ApplicationStatus.OFFER_DECLINED, response_by, notes)
    
    def reject(self, rejected_by: str, reason: str):
        """Reject the application"""
        self.rejection_reason = reason
        self.update_status(ApplicationStatus.REJECTED, rejected_by, reason=reason)
    
    def withdraw(self, withdrawn_by: str, reason: Optional[str] = None):
        """Withdraw the application"""
        self.update_status(ApplicationStatus.WITHDRAWN, withdrawn_by, reason=reason)
    
    def get_progress_percentage(self) -> int:
        """Calculate application progress as percentage"""
        status_progress = {
            ApplicationStatus.SUBMITTED: 10,
            ApplicationStatus.REVIEWED: 25,
            ApplicationStatus.SHORTLISTED: 40,
            ApplicationStatus.INTERVIEW_SCHEDULED: 55,
            ApplicationStatus.INTERVIEW_COMPLETED: 70,
            ApplicationStatus.REFERENCE_CHECK: 80,
            ApplicationStatus.OFFER_MADE: 90,
            ApplicationStatus.OFFER_ACCEPTED: 100,
            ApplicationStatus.OFFER_DECLINED: 100,
            ApplicationStatus.REJECTED: 100,
            ApplicationStatus.WITHDRAWN: 100,
            ApplicationStatus.ON_HOLD: 50
        }
        return status_progress.get(self.status, 0)
    
    def get_next_step(self) -> str:
        """Get the next step description based on current status"""
        next_steps = {
            ApplicationStatus.SUBMITTED: "Initial screening by recruiter",
            ApplicationStatus.REVIEWED: "Awaiting shortlisting decision",
            ApplicationStatus.SHORTLISTED: "Interview scheduling in progress",
            ApplicationStatus.INTERVIEW_SCHEDULED: f"Interview scheduled for {self.get_next_interview_date()}",
            ApplicationStatus.INTERVIEW_COMPLETED: "Interview feedback under review",
            ApplicationStatus.REFERENCE_CHECK: "Reference verification in progress",
            ApplicationStatus.OFFER_MADE: "Awaiting candidate response to offer",
            ApplicationStatus.OFFER_ACCEPTED: "Offer accepted - onboarding process",
            ApplicationStatus.OFFER_DECLINED: "Offer declined by candidate",
            ApplicationStatus.REJECTED: "Application unsuccessful",
            ApplicationStatus.WITHDRAWN: "Application withdrawn by candidate",
            ApplicationStatus.ON_HOLD: "Application on hold"
        }
        return next_steps.get(self.status, "Status unknown")
    
    def get_next_interview_date(self) -> str:
        """Get the next scheduled interview date"""
        upcoming_interviews = [
            interview for interview in self.interviews 
            if not interview.completed and interview.scheduled_date > datetime.utcnow()
        ]
        if upcoming_interviews:
            next_interview = min(upcoming_interviews, key=lambda x: x.scheduled_date)
            return next_interview.scheduled_date.strftime("%B %d, %Y at %I:%M %p")
        return "TBD"
    
    def get_status_color(self) -> str:
        """Get color code for status display"""
        status_colors = {
            ApplicationStatus.SUBMITTED: "blue",
            ApplicationStatus.REVIEWED: "yellow",
            ApplicationStatus.SHORTLISTED: "purple",
            ApplicationStatus.INTERVIEW_SCHEDULED: "orange",
            ApplicationStatus.INTERVIEW_COMPLETED: "indigo",
            ApplicationStatus.REFERENCE_CHECK: "pink",
            ApplicationStatus.OFFER_MADE: "green",
            ApplicationStatus.OFFER_ACCEPTED: "emerald",
            ApplicationStatus.OFFER_DECLINED: "red",
            ApplicationStatus.REJECTED: "red",
            ApplicationStatus.WITHDRAWN: "gray",
            ApplicationStatus.ON_HOLD: "yellow"
        }
        return status_colors.get(self.status, "gray")
    
    def is_active(self) -> bool:
        """Check if application is still active"""
        inactive_statuses = [
            ApplicationStatus.OFFER_ACCEPTED,
            ApplicationStatus.OFFER_DECLINED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.WITHDRAWN
        ]
        return self.status not in inactive_statuses
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        
        # Convert datetime objects to ISO strings
        datetime_fields = ['created_at', 'updated_at', 'reviewed_at', 'shortlisted_at', 
                          'rejected_at', 'offer_made_at', 'offer_responded_at']
        for field in datetime_fields:
            if getattr(self, field):
                data[field] = getattr(self, field).isoformat()
        
        # Convert date objects to ISO strings
        if self.available_from:
            data['available_from'] = self.available_from.isoformat()
        
        # Convert enums to values
        data['status'] = self.status.value
        data['source'] = self.source.value
        
        # Handle nested objects
        if self.interviews:
            data['interviews'] = [
                {
                    **asdict(interview),
                    'interview_type': interview.interview_type.value,
                    'scheduled_date': interview.scheduled_date.isoformat()
                }
                for interview in self.interviews
            ]
        
        if self.offer:
            offer_dict = asdict(self.offer)
            if self.offer.start_date:
                offer_dict['start_date'] = self.offer.start_date.isoformat()
            if self.offer.offer_expiry_date:
                offer_dict['offer_expiry_date'] = self.offer.offer_expiry_date.isoformat()
            data['offer'] = offer_dict
        
        if self.status_history:
            data['status_history'] = [
                {
                    **asdict(history),
                    'old_status': history.old_status.value if history.old_status else None,
                    'new_status': history.new_status.value,
                    'changed_at': history.changed_at.isoformat()
                }
                for history in self.status_history
            ]
        
        # Add computed fields
        data['progress_percentage'] = self.get_progress_percentage()
        data['next_step'] = self.get_next_step()
        data['status_color'] = self.get_status_color()
        data['is_active'] = self.is_active()
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Application':
        """Create Application instance from dictionary"""
        # Convert string dates back to datetime objects
        datetime_fields = ['created_at', 'updated_at', 'reviewed_at', 'shortlisted_at', 
                          'rejected_at', 'offer_made_at', 'offer_responded_at']
        for field in datetime_fields:
            if field in data and isinstance(data[field], str):
                data[field] = datetime.fromisoformat(data[field])
        
        if 'available_from' in data and isinstance(data['available_from'], str):
            data['available_from'] = date.fromisoformat(data['available_from'])
        
        # Convert enum strings back to enums
        if 'status' in data and isinstance(data['status'], str):
            data['status'] = ApplicationStatus(data['status'])
        if 'source' in data and isinstance(data['source'], str):
            data['source'] = ApplicationSource(data['source'])
        
        # Handle nested objects
        if 'interviews' in data and isinstance(data['interviews'], list):
            interviews = []
            for interview_data in data['interviews']:
                if isinstance(interview_data, dict):
                    interview_data['interview_type'] = InterviewType(interview_data['interview_type'])
                    interview_data['scheduled_date'] = datetime.fromisoformat(interview_data['scheduled_date'])
                    interviews.append(InterviewDetails(**interview_data))
            data['interviews'] = interviews
        
        if 'offer' in data and isinstance(data['offer'], dict):
            offer_data = data['offer']
            if 'start_date' in offer_data and isinstance(offer_data['start_date'], str):
                offer_data['start_date'] = date.fromisoformat(offer_data['start_date'])
            if 'offer_expiry_date' in offer_data and isinstance(offer_data['offer_expiry_date'], str):
                offer_data['offer_expiry_date'] = date.fromisoformat(offer_data['offer_expiry_date'])
            data['offer'] = OfferDetails(**offer_data)
        
        if 'status_history' in data and isinstance(data['status_history'], list):
            history = []
            for history_data in data['status_history']:
                if isinstance(history_data, dict):
                    history_data['old_status'] = ApplicationStatus(history_data['old_status']) if history_data['old_status'] else None
                    history_data['new_status'] = ApplicationStatus(history_data['new_status'])
                    history_data['changed_at'] = datetime.fromisoformat(history_data['changed_at'])
                    history.append(ApplicationStatusHistory(**history_data))
            data['status_history'] = history
        
        # Remove computed fields that shouldn't be in constructor
        computed_fields = ['progress_percentage', 'next_step', 'status_color', 'is_active']
        for field in computed_fields:
            data.pop(field, None)
        
        return cls(**data)

# Database storage functions (to be integrated with existing database system)
class ApplicationDatabase:
    """Application database operations"""
    
    @staticmethod
    def save_application(application: Application) -> str:
        """Save application to database and return application ID"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def get_application(application_id: str) -> Optional[Application]:
        """Get application by ID"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def get_applications_by_job(job_id: str) -> List[Application]:
        """Get all applications for a job"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def get_applications_by_candidate(candidate_id: str) -> List[Application]:
        """Get all applications by a candidate"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def get_applications_by_company(company_id: str) -> List[Application]:
        """Get all applications for a company"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def update_application(application: Application) -> bool:
        """Update existing application"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def delete_application(application_id: str) -> bool:
        """Delete application"""
        # This will be integrated with the existing database system
        pass

