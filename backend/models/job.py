"""
Job Model for Emirati Journey Platform
Comprehensive job posting and management system
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass, asdict
import json

class JobStatus(Enum):
    """Job Posting Status"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    PUBLISHED = "published"
    PAUSED = "paused"
    CLOSED = "closed"
    EXPIRED = "expired"

class EmploymentType(Enum):
    """Employment and Educational Opportunity Types"""
    # Traditional Employment
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    TEMPORARY = "temporary"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"
    
    # Educational Opportunities
    SUMMER_CAMP = "summer_camp"
    WINTER_CAMP = "winter_camp"
    SCHOLARSHIP = "scholarship"
    VOCATIONAL_TRAINING = "vocational_training"
    APPRENTICESHIP = "apprenticeship"
    CERTIFICATION_PROGRAM = "certification_program"
    WORKSHOP = "workshop"
    SEMINAR = "seminar"
    MENTORSHIP_PROGRAM = "mentorship_program"
    BOOTCAMP = "bootcamp"
    EXCHANGE_PROGRAM = "exchange_program"

class ExperienceLevel(Enum):
    """Experience Level Requirements"""
    ENTRY_LEVEL = "entry_level"
    JUNIOR = "junior"
    MID_LEVEL = "mid_level"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"
    EXECUTIVE = "executive"

class JobPriority(Enum):
    """Job Priority Levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

class OpportunityCategory(Enum):
    """Opportunity Categories"""
    EMPLOYMENT = "employment"
    EDUCATION = "education"
    TRAINING = "training"
    DEVELOPMENT = "development"

class AgeGroup(Enum):
    """Target Age Groups for Educational Opportunities"""
    YOUTH_15_18 = "youth_15_18"
    YOUNG_ADULT_18_25 = "young_adult_18_25"
    ADULT_25_35 = "adult_25_35"
    MID_CAREER_35_45 = "mid_career_35_45"
    SENIOR_45_PLUS = "senior_45_plus"
    ALL_AGES = "all_ages"

@dataclass
class JobRequirement:
    """Individual job requirement"""
    requirement: str
    is_mandatory: bool = True
    category: str = "general"  # technical, soft_skills, education, experience, etc.

@dataclass
class SalaryRange:
    """Salary range information"""
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    currency: str = "AED"
    is_negotiable: bool = True
    includes_benefits: bool = False

@dataclass
class JobLocation:
    """Job location details"""
    emirate: str
    city: str
    area: Optional[str] = None
    is_remote: bool = False
    is_hybrid: bool = False
    remote_percentage: Optional[int] = None  # For hybrid jobs

@dataclass
class EducationalOpportunityDetails:
    """Educational opportunity specific information"""
    # Age and Prerequisites
    target_age_group: Optional[AgeGroup] = None
    age_range_min: Optional[int] = None
    age_range_max: Optional[int] = None
    academic_prerequisites: List[str] = None
    
    # Program Details
    program_duration: Optional[str] = None  # "2 weeks", "3 months", "1 year"
    program_schedule: Optional[str] = None  # "Full-time", "Part-time", "Weekends", "Evenings"
    program_format: Optional[str] = None    # "In-person", "Online", "Hybrid"
    
    # Outcomes and Certification
    certification_offered: Optional[str] = None
    learning_outcomes: List[str] = None
    skills_developed: List[str] = None
    
    # Financial Information
    program_cost: Optional[float] = None
    scholarship_amount: Optional[float] = None
    financial_aid_available: bool = False
    
    # Application Requirements
    application_requirements: List[str] = None
    required_documents: List[str] = None
    application_deadline_extended: Optional[datetime] = None
    
    # Capacity and Logistics
    max_participants: Optional[int] = None
    current_participants: int = 0
    instructor_info: Optional[str] = None
    contact_person: Optional[str] = None
    
    def __post_init__(self):
        """Initialize default values"""
        if self.academic_prerequisites is None:
            self.academic_prerequisites = []
        if self.learning_outcomes is None:
            self.learning_outcomes = []
        if self.skills_developed is None:
            self.skills_developed = []
        if self.application_requirements is None:
            self.application_requirements = []
        if self.required_documents is None:
            self.required_documents = []

@dataclass
class Job:
    """Comprehensive Job Model"""
    
    # Basic Information
    id: Optional[str] = None
    title: str = ""
    description: str = ""
    summary: str = ""
    
    # Company Information
    company_id: str = ""
    company_name: str = ""
    department: Optional[str] = None
    reporting_to: Optional[str] = None
    
    # Job Details
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    experience_level: ExperienceLevel = ExperienceLevel.MID_LEVEL
    experience_years_min: Optional[int] = None
    experience_years_max: Optional[int] = None
    
    # Location
    location: Optional[JobLocation] = None
    
    # Compensation
    salary: Optional[SalaryRange] = None
    benefits: List[str] = None
    
    # Requirements
    requirements: List[JobRequirement] = None
    responsibilities: List[str] = None
    required_skills: List[str] = None
    preferred_skills: List[str] = None
    education_requirements: List[str] = None
    language_requirements: List[str] = None
    
    # UAE Specific
    emiratization_priority: bool = False
    security_clearance_required: bool = False
    visa_sponsorship_available: bool = True
    requires_uae_experience: bool = False
    arabic_language_required: bool = False
    
    # Platform Information
    status: JobStatus = JobStatus.DRAFT
    priority: JobPriority = JobPriority.NORMAL
    application_deadline: Optional[datetime] = None
    start_date: Optional[date] = None
    
    # Tracking
    views_count: int = 0
    applications_count: int = 0
    shortlisted_count: int = 0
    
    # Metadata
    posted_by: str = ""  # User ID who posted the job
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    # Tags and Categories
    industry: Optional[str] = None
    job_category: Optional[str] = None
    tags: List[str] = None
    
    # Educational Opportunity Support
    opportunity_category: OpportunityCategory = OpportunityCategory.EMPLOYMENT
    educational_details: Optional[EducationalOpportunityDetails] = None
    
    def __post_init__(self):
        """Initialize default values"""
        if self.benefits is None:
            self.benefits = []
        if self.requirements is None:
            self.requirements = []
        if self.responsibilities is None:
            self.responsibilities = []
        if self.required_skills is None:
            self.required_skills = []
        if self.preferred_skills is None:
            self.preferred_skills = []
        if self.education_requirements is None:
            self.education_requirements = []
        if self.language_requirements is None:
            self.language_requirements = []
        if self.tags is None:
            self.tags = []
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
    
    def is_active(self) -> bool:
        """Check if job is currently active and accepting applications"""
        if self.status != JobStatus.PUBLISHED:
            return False
        
        if self.application_deadline and self.application_deadline < datetime.utcnow():
            return False
            
        return True
    
    def is_expired(self) -> bool:
        """Check if job has expired"""
        if self.application_deadline and self.application_deadline < datetime.utcnow():
            return True
        return False
    
    def is_educational_opportunity(self) -> bool:
        """Check if this is an educational opportunity"""
        educational_types = [
            EmploymentType.SUMMER_CAMP, EmploymentType.WINTER_CAMP,
            EmploymentType.SCHOLARSHIP, EmploymentType.VOCATIONAL_TRAINING,
            EmploymentType.APPRENTICESHIP, EmploymentType.CERTIFICATION_PROGRAM,
            EmploymentType.WORKSHOP, EmploymentType.SEMINAR,
            EmploymentType.MENTORSHIP_PROGRAM, EmploymentType.BOOTCAMP,
            EmploymentType.EXCHANGE_PROGRAM
        ]
        return self.employment_type in educational_types
    
    def get_opportunity_type_display(self) -> str:
        """Get human-readable opportunity type"""
        type_mapping = {
            EmploymentType.FULL_TIME: "Full-time Job",
            EmploymentType.PART_TIME: "Part-time Job",
            EmploymentType.CONTRACT: "Contract Position",
            EmploymentType.TEMPORARY: "Temporary Position",
            EmploymentType.INTERNSHIP: "Internship",
            EmploymentType.FREELANCE: "Freelance Project",
            EmploymentType.SUMMER_CAMP: "Summer Camp",
            EmploymentType.WINTER_CAMP: "Winter Camp",
            EmploymentType.SCHOLARSHIP: "Scholarship",
            EmploymentType.VOCATIONAL_TRAINING: "Vocational Training",
            EmploymentType.APPRENTICESHIP: "Apprenticeship Program",
            EmploymentType.CERTIFICATION_PROGRAM: "Certification Program",
            EmploymentType.WORKSHOP: "Workshop",
            EmploymentType.SEMINAR: "Seminar",
            EmploymentType.MENTORSHIP_PROGRAM: "Mentorship Program",
            EmploymentType.BOOTCAMP: "Bootcamp",
            EmploymentType.EXCHANGE_PROGRAM: "Exchange Program"
        }
        return type_mapping.get(self.employment_type, self.employment_type.value.replace('_', ' ').title())
    
    def get_age_range_display(self) -> str:
        """Get formatted age range for educational opportunities"""
        if not self.educational_details:
            return "All ages"
        
        if self.educational_details.age_range_min and self.educational_details.age_range_max:
            return f"Ages {self.educational_details.age_range_min}-{self.educational_details.age_range_max}"
        elif self.educational_details.age_range_min:
            return f"Ages {self.educational_details.age_range_min}+"
        elif self.educational_details.target_age_group:
            age_group_mapping = {
                AgeGroup.YOUTH_15_18: "Ages 15-18",
                AgeGroup.YOUNG_ADULT_18_25: "Ages 18-25",
                AgeGroup.ADULT_25_35: "Ages 25-35",
                AgeGroup.MID_CAREER_35_45: "Ages 35-45",
                AgeGroup.SENIOR_45_PLUS: "Ages 45+",
                AgeGroup.ALL_AGES: "All ages"
            }
            return age_group_mapping.get(self.educational_details.target_age_group, "All ages")
        
        return "All ages"
    
    def get_salary_display(self) -> str:
        """Get formatted salary range for display"""
        if not self.salary:
            return "Salary not specified"
        
        if self.salary.min_salary and self.salary.max_salary:
            return f"{self.salary.currency} {self.salary.min_salary:,} - {self.salary.max_salary:,}"
        elif self.salary.min_salary:
            return f"{self.salary.currency} {self.salary.min_salary:,}+"
        elif self.salary.max_salary:
            return f"Up to {self.salary.currency} {self.salary.max_salary:,}"
        else:
            return "Competitive salary"
    
    def get_location_display(self) -> str:
        """Get formatted location for display"""
        if not self.location:
            return "Location not specified"
        
        location_str = f"{self.location.city}, {self.location.emirate}"
        
        if self.location.is_remote:
            location_str += " (Remote)"
        elif self.location.is_hybrid:
            location_str += f" (Hybrid - {self.location.remote_percentage}% remote)"
        
        return location_str
    
    def increment_views(self):
        """Increment view count"""
        self.views_count += 1
        self.updated_at = datetime.utcnow()
    
    def increment_applications(self):
        """Increment application count"""
        self.applications_count += 1
        self.updated_at = datetime.utcnow()
    
    def publish(self, published_by: str):
        """Publish the job"""
        self.status = JobStatus.PUBLISHED
        self.published_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def close(self, closed_by: str, reason: Optional[str] = None):
        """Close the job"""
        self.status = JobStatus.CLOSED
        self.closed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        
        # Convert datetime objects to ISO strings
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        if self.updated_at:
            data['updated_at'] = self.updated_at.isoformat()
        if self.published_at:
            data['published_at'] = self.published_at.isoformat()
        if self.closed_at:
            data['closed_at'] = self.closed_at.isoformat()
        if self.application_deadline:
            data['application_deadline'] = self.application_deadline.isoformat()
        if self.start_date:
            data['start_date'] = self.start_date.isoformat()
        
        # Convert enums to values
        data['status'] = self.status.value
        data['employment_type'] = self.employment_type.value
        data['experience_level'] = self.experience_level.value
        data['priority'] = self.priority.value
        
        # Add computed fields
        data['is_active'] = self.is_active()
        data['is_expired'] = self.is_expired()
        data['salary_display'] = self.get_salary_display()
        data['location_display'] = self.get_location_display()
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Job':
        """Create Job instance from dictionary"""
        # Convert string dates back to datetime objects
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'])
        if 'published_at' in data and isinstance(data['published_at'], str):
            data['published_at'] = datetime.fromisoformat(data['published_at'])
        if 'closed_at' in data and isinstance(data['closed_at'], str):
            data['closed_at'] = datetime.fromisoformat(data['closed_at'])
        if 'application_deadline' in data and isinstance(data['application_deadline'], str):
            data['application_deadline'] = datetime.fromisoformat(data['application_deadline'])
        if 'start_date' in data and isinstance(data['start_date'], str):
            data['start_date'] = date.fromisoformat(data['start_date'])
        
        # Convert enum strings back to enums
        if 'status' in data and isinstance(data['status'], str):
            data['status'] = JobStatus(data['status'])
        if 'employment_type' in data and isinstance(data['employment_type'], str):
            data['employment_type'] = EmploymentType(data['employment_type'])
        if 'experience_level' in data and isinstance(data['experience_level'], str):
            data['experience_level'] = ExperienceLevel(data['experience_level'])
        if 'priority' in data and isinstance(data['priority'], str):
            data['priority'] = JobPriority(data['priority'])
        
        # Convert nested objects
        if 'location' in data and isinstance(data['location'], dict):
            data['location'] = JobLocation(**data['location'])
        if 'salary' in data and isinstance(data['salary'], dict):
            data['salary'] = SalaryRange(**data['salary'])
        if 'requirements' in data and isinstance(data['requirements'], list):
            data['requirements'] = [
                JobRequirement(**req) if isinstance(req, dict) else req 
                for req in data['requirements']
            ]
        
        # Remove computed fields that shouldn't be in constructor
        computed_fields = ['is_active', 'is_expired', 'salary_display', 'location_display']
        for field in computed_fields:
            data.pop(field, None)
        
        return cls(**data)

# Database storage functions (to be integrated with existing database system)
class JobDatabase:
    """Job database operations"""
    
    @staticmethod
    def save_job(job: Job) -> str:
        """Save job to database and return job ID"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def get_job(job_id: str) -> Optional[Job]:
        """Get job by ID"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def get_jobs_by_company(company_id: str) -> List[Job]:
        """Get all jobs for a company"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def search_jobs(filters: Dict[str, Any]) -> List[Job]:
        """Search jobs with filters"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def update_job(job: Job) -> bool:
        """Update existing job"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def delete_job(job_id: str) -> bool:
        """Delete job"""
        # This will be integrated with the existing database system
        pass

