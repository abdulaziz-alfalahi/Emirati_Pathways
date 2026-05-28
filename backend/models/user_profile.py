"""
Enhanced User Profile Model for Emirati Journey Platform
UAE-specific fields and comprehensive profile management
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass, asdict
import json

class VisaStatus(Enum):
    """UAE Visa Status Types"""
    UAE_NATIONAL = "uae_national"
    RESIDENT = "resident"
    VISIT_VISA = "visit_visa"
    WORK_PERMIT = "work_permit"
    STUDENT_VISA = "student_visa"
    INVESTOR_VISA = "investor_visa"
    GOLDEN_VISA = "golden_visa"
    OTHER = "other"

class EducationLevel(Enum):
    """Education Levels"""
    HIGH_SCHOOL = "high_school"
    DIPLOMA = "diploma"
    BACHELOR = "bachelor"
    MASTER = "master"
    PHD = "phd"
    PROFESSIONAL_CERT = "professional_certification"
    OTHER = "other"

class ExperienceLevel(Enum):
    """Professional Experience Levels"""
    ENTRY_LEVEL = "entry_level"
    JUNIOR = "junior"
    MID_LEVEL = "mid_level"
    SENIOR = "senior"
    LEAD = "lead"
    MANAGER = "manager"
    DIRECTOR = "director"
    EXECUTIVE = "executive"

class EmploymentStatus(Enum):
    """Current Employment Status"""
    EMPLOYED = "employed"
    UNEMPLOYED = "unemployed"
    STUDENT = "student"
    FREELANCER = "freelancer"
    ENTREPRENEUR = "entrepreneur"
    RETIRED = "retired"
    OTHER = "other"

@dataclass
class PersonalInfo:
    """Personal Information Section"""
    first_name: str
    last_name: str
    arabic_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    emirate: Optional[str] = None
    city: Optional[str] = None
    visa_status: Optional[VisaStatus] = None
    emirates_id: Optional[str] = None
    passport_number: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        if self.date_of_birth:
            if hasattr(self.date_of_birth, 'isoformat'):
                data['date_of_birth'] = self.date_of_birth.isoformat()
            else:
                 data['date_of_birth'] = str(self.date_of_birth)
        if self.visa_status:
            data['visa_status'] = self.visa_status.value if hasattr(self.visa_status, 'value') else self.visa_status
        return data

@dataclass
class ContactInfo:
    """Contact Information Section"""
    email: str
    phone: str
    whatsapp: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    po_box: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class ProfessionalInfo:
    """Professional Information Section"""
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    industry: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    years_of_experience: Optional[int] = None
    employment_status: Optional[EmploymentStatus] = None
    salary_expectation: Optional[int] = None
    currency: str = "AED"
    availability: Optional[str] = None
    notice_period: Optional[str] = None
    willing_to_relocate: bool = False
    preferred_work_type: Optional[str] = None  # remote, onsite, hybrid
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        if self.experience_level:
            data['experience_level'] = self.experience_level.value if hasattr(self.experience_level, 'value') else self.experience_level
        if self.employment_status:
            data['employment_status'] = self.employment_status.value if hasattr(self.employment_status, 'value') else self.employment_status
        return data

@dataclass
class EducationRecord:
    """Individual Education Record"""
    institution: str
    degree: str
    field_of_study: str
    level: EducationLevel
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    grade: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        if self.start_date:
            if hasattr(self.start_date, 'isoformat'):
                data['start_date'] = self.start_date.isoformat()
            else:
                data['start_date'] = str(self.start_date)
        if self.end_date:
            if hasattr(self.end_date, 'isoformat'):
                data['end_date'] = self.end_date.isoformat()
            else:
                data['end_date'] = str(self.end_date)
        if self.level:
            data['level'] = self.level.value if hasattr(self.level, 'value') else self.level
        return data

@dataclass
class WorkExperience:
    """Individual Work Experience Record"""
    company: str
    position: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    current: bool = False
    location: Optional[str] = None
    description: Optional[str] = None
    achievements: Optional[List[str]] = None
    skills_used: Optional[List[str]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        if self.start_date:
            data['start_date'] = self.start_date.isoformat()
        if self.end_date:
            data['end_date'] = self.end_date.isoformat()
        return data

@dataclass
class Skill:
    """Individual Skill Record"""
    name: str
    level: str  # beginner, intermediate, advanced, expert
    category: Optional[str] = None
    years_of_experience: Optional[int] = None
    certified: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class Language:
    """Language Proficiency Record"""
    language: str
    proficiency: str  # native, fluent, conversational, basic
    reading: Optional[str] = None
    writing: Optional[str] = None
    speaking: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class Certification:
    """Professional Certification Record"""
    name: str
    issuing_organization: str
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        if self.issue_date:
            data['issue_date'] = self.issue_date.isoformat()
        if self.expiry_date:
            data['expiry_date'] = self.expiry_date.isoformat()
        return data

@dataclass
class Preferences:
    """User Preferences and Settings"""
    preferred_language: str = "en"
    timezone: str = "Asia/Dubai"
    currency: str = "AED"
    date_format: str = "DD/MM/YYYY"
    privacy_level: str = "standard"  # minimal, standard, full
    job_alerts: bool = True
    marketing_emails: bool = False
    profile_visibility: str = "public"  # private, connections, public
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class UserProfile:
    """
    Comprehensive User Profile Management
    UAE-specific and internationally compliant
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.personal_info: Optional[PersonalInfo] = None
        self.contact_info: Optional[ContactInfo] = None
        self.professional_info: Optional[ProfessionalInfo] = None
        self.education: List[EducationRecord] = []
        self.work_experience: List[WorkExperience] = []
        self.skills: List[Skill] = []
        self.languages: List[Language] = []
        self.certifications: List[Certification] = []
        self.preferences: Preferences = Preferences()
        
        # Metadata
        self.created_at: datetime = datetime.utcnow()
        self.updated_at: datetime = datetime.utcnow()
        self.profile_completion: float = 0.0
        self.verification_status: Dict[str, bool] = {
            'email': False,
            'phone': False,
            'identity': False,
            'education': False,
            'employment': False
        }
    
    def update_personal_info(self, data: Dict[str, Any]) -> bool:
        """Update personal information section"""
        try:
            # Handle date conversion
            if 'date_of_birth' in data and isinstance(data['date_of_birth'], str):
                data['date_of_birth'] = datetime.fromisoformat(data['date_of_birth']).date()
            
            # Handle visa status enum
            if 'visa_status' in data and isinstance(data['visa_status'], str):
                data['visa_status'] = VisaStatus(data['visa_status'])
            
            self.personal_info = PersonalInfo(**data)
            self._update_completion_score()
            return True
        except Exception as e:
            print(f"Error updating personal info: {e}")
            return False
    
    def update_contact_info(self, data: Dict[str, Any]) -> bool:
        """Update contact information section"""
        try:
            self.contact_info = ContactInfo(**data)
            self._update_completion_score()
            return True
        except Exception as e:
            print(f"Error updating contact info: {e}")
            return False
    
    def update_professional_info(self, data: Dict[str, Any]) -> bool:
        """Update professional information section"""
        try:
            # Handle enum conversions
            if 'experience_level' in data and isinstance(data['experience_level'], str):
                data['experience_level'] = ExperienceLevel(data['experience_level'])
            
            if 'employment_status' in data and isinstance(data['employment_status'], str):
                data['employment_status'] = EmploymentStatus(data['employment_status'])
            
            self.professional_info = ProfessionalInfo(**data)
            self._update_completion_score()
            return True
        except Exception as e:
            print(f"Error updating professional info: {e}")
            return False
    
    def add_education(self, education_data: Dict[str, Any]) -> bool:
        """Add education record"""
        try:
            # Handle date conversions
            for date_field in ['start_date', 'end_date']:
                if date_field in education_data and isinstance(education_data[date_field], str):
                    education_data[date_field] = datetime.fromisoformat(education_data[date_field]).date()
            
            # Handle level enum
            if 'level' in education_data and isinstance(education_data['level'], str):
                education_data['level'] = EducationLevel(education_data['level'])
            
            education = EducationRecord(**education_data)
            self.education.append(education)
            self._update_completion_score()
            return True
        except Exception as e:
            print(f"Error adding education: {e}")
            return False
    
    def add_work_experience(self, experience_data: Dict[str, Any]) -> bool:
        """Add work experience record"""
        try:
            # Handle date conversions
            for date_field in ['start_date', 'end_date']:
                if date_field in experience_data and isinstance(experience_data[date_field], str):
                    experience_data[date_field] = datetime.fromisoformat(experience_data[date_field]).date()
            
            experience = WorkExperience(**experience_data)
            self.work_experience.append(experience)
            self._update_completion_score()
            return True
        except Exception as e:
            print(f"Error adding work experience: {e}")
            return False
    
    def add_skill(self, skill_data: Dict[str, Any]) -> bool:
        """Add skill record"""
        try:
            skill = Skill(**skill_data)
            # Check if skill already exists
            existing_skill = next((s for s in self.skills if s.name.lower() == skill.name.lower()), None)
            if existing_skill:
                # Update existing skill
                existing_skill.level = skill.level
                existing_skill.years_of_experience = skill.years_of_experience
                existing_skill.certified = skill.certified
            else:
                self.skills.append(skill)
            
            self._update_completion_score()
            return True
        except Exception as e:
            print(f"Error adding skill: {e}")
            return False
    
    def add_language(self, language_data: Dict[str, Any]) -> bool:
        """Add language proficiency record"""
        try:
            language = Language(**language_data)
            # Check if language already exists
            existing_lang = next((l for l in self.languages if l.language.lower() == language.language.lower()), None)
            if existing_lang:
                # Update existing language
                existing_lang.proficiency = language.proficiency
                existing_lang.reading = language.reading
                existing_lang.writing = language.writing
                existing_lang.speaking = language.speaking
            else:
                self.languages.append(language)
            
            self._update_completion_score()
            return True
        except Exception as e:
            print(f"Error adding language: {e}")
            return False
    
    def add_certification(self, cert_data: Dict[str, Any]) -> bool:
        """Add certification record"""
        try:
            # Handle date conversions
            for date_field in ['issue_date', 'expiry_date']:
                if date_field in cert_data and isinstance(cert_data[date_field], str):
                    cert_data[date_field] = datetime.fromisoformat(cert_data[date_field]).date()
            
            certification = Certification(**cert_data)
            self.certifications.append(certification)
            self._update_completion_score()
            return True
        except Exception as e:
            print(f"Error adding certification: {e}")
            return False
    
    def _update_completion_score(self):
        """Calculate profile completion percentage"""
        score = 0
        total_sections = 8
        
        # Personal info (20%)
        if self.personal_info:
            personal_fields = ['first_name', 'last_name', 'nationality', 'emirate']
            filled_fields = sum(1 for field in personal_fields if getattr(self.personal_info, field))
            score += (filled_fields / len(personal_fields)) * 20
        
        # Contact info (15%)
        if self.contact_info:
            contact_fields = ['email', 'phone']
            filled_fields = sum(1 for field in contact_fields if getattr(self.contact_info, field))
            score += (filled_fields / len(contact_fields)) * 15
        
        # Professional info (20%)
        if self.professional_info:
            prof_fields = ['current_job_title', 'industry', 'experience_level', 'years_of_experience']
            filled_fields = sum(1 for field in prof_fields if getattr(self.professional_info, field))
            score += (filled_fields / len(prof_fields)) * 20
        
        # Education (15%)
        if self.education:
            score += min(len(self.education) * 7.5, 15)
        
        # Work experience (15%)
        if self.work_experience:
            score += min(len(self.work_experience) * 5, 15)
        
        # Skills (10%)
        if self.skills:
            score += min(len(self.skills) * 2, 10)
        
        # Languages (3%)
        if self.languages:
            score += min(len(self.languages) * 1.5, 3)
        
        # Certifications (2%)
        if self.certifications:
            score += min(len(self.certifications) * 1, 2)
        
        self.profile_completion = min(score, 100.0)
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert profile to dictionary for JSON serialization"""
        return {
            'user_id': self.user_id,
            'personal_info': self.personal_info.to_dict() if self.personal_info else None,
            'contact_info': self.contact_info.to_dict() if self.contact_info else None,
            'professional_info': self.professional_info.to_dict() if self.professional_info else None,
            'education': [edu.to_dict() for edu in self.education],
            'work_experience': [exp.to_dict() for exp in self.work_experience],
            'skills': [skill.to_dict() for skill in self.skills],
            'languages': [lang.to_dict() for lang in self.languages],
            'certifications': [cert.to_dict() for cert in self.certifications],
            'preferences': self.preferences.to_dict(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'profile_completion': self.profile_completion,
            'verification_status': self.verification_status
        }
    
    def get_profile_summary(self) -> Dict[str, Any]:
        """Get a summary of the profile for display purposes"""
        return {
            'name': f"{self.personal_info.first_name} {self.personal_info.last_name}" if self.personal_info else "Unknown",
            'current_position': self.professional_info.current_job_title if self.professional_info else None,
            'current_company': self.professional_info.current_company if self.professional_info else None,
            'location': f"{self.personal_info.city}, {self.personal_info.emirate}" if self.personal_info and self.personal_info.city else None,
            'experience_years': self.professional_info.years_of_experience if self.professional_info else 0,
            'education_level': max([edu.level.value for edu in self.education], default='unknown') if self.education else 'unknown',
            'skills_count': len(self.skills),
            'languages_count': len(self.languages),
            'completion_percentage': self.profile_completion,
            'verified': all(self.verification_status.values())
        }

