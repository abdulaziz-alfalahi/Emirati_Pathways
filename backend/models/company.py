"""
Company Model for Emirati Journey Platform
Comprehensive company profile and management system
"""

from datetime import datetime, date
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass, asdict
import json

class CompanySize(Enum):
    """Company Size Categories"""
    STARTUP = "startup"  # 1-10 employees
    SMALL = "small"      # 11-50 employees
    MEDIUM = "medium"    # 51-200 employees
    LARGE = "large"      # 201-1000 employees
    ENTERPRISE = "enterprise"  # 1000+ employees

class CompanyType(Enum):
    """Company Type Categories"""
    GOVERNMENT = 'compliance_auditor'
    SEMI_GOVERNMENT = "semi_government"
    PRIVATE = "private"
    MULTINATIONAL = "multinational"
    STARTUP = "startup"
    NON_PROFIT = "non_profit"
    FREELANCE = "freelance"

class SubscriptionTier(Enum):
    """Subscription Tiers"""
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"
    GOVERNMENT = 'compliance_auditor'

class CompanyStatus(Enum):
    """Company Account Status"""
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"

@dataclass
class CompanyLocation:
    """Company location details"""
    emirate: str
    city: str
    area: Optional[str] = None
    street_address: Optional[str] = None
    po_box: Optional[str] = None
    postal_code: Optional[str] = None
    is_headquarters: bool = True

@dataclass
class CompanyContact:
    """Company contact information"""
    primary_email: str
    secondary_email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    fax: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None

@dataclass
class EmiratiZationInfo:
    """Emiratization compliance information"""
    current_emiratization_rate: Optional[float] = None  # Percentage
    target_emiratization_rate: Optional[float] = None   # Percentage
    total_employees: Optional[int] = None
    emirati_employees: Optional[int] = None
    compliance_status: str = "unknown"  # compliant, non_compliant, exempt, unknown
    last_updated: Optional[datetime] = None

@dataclass
class CompanyVerification:
    """Company verification details"""
    is_verified: bool = False
    verification_date: Optional[datetime] = None
    verified_by: Optional[str] = None  # Admin user ID
    trade_license_verified: bool = False
    documents_verified: bool = False
    contact_verified: bool = False
    verification_notes: Optional[str] = None

@dataclass
class Company:
    """Comprehensive Company Model"""
    
    # Basic Information
    id: Optional[str] = None
    name: str = ""
    name_arabic: Optional[str] = None
    description: str = ""
    description_arabic: Optional[str] = None
    
    # Company Details
    company_type: CompanyType = CompanyType.PRIVATE
    company_size: CompanySize = CompanySize.MEDIUM
    industry: Optional[str] = None
    sub_industry: Optional[str] = None
    founded_year: Optional[int] = None
    
    # Legal Information
    trade_license_number: Optional[str] = None
    commercial_registration: Optional[str] = None
    tax_registration_number: Optional[str] = None
    establishment_card: Optional[str] = None
    
    # Location and Contact
    locations: List[CompanyLocation] = None
    contact: Optional[CompanyContact] = None
    
    # Emiratization
    emiratization: Optional[EmiratiZationInfo] = None
    
    # Platform Information
    status: CompanyStatus = CompanyStatus.PENDING_VERIFICATION
    subscription_tier: SubscriptionTier = SubscriptionTier.BASIC
    verification: Optional[CompanyVerification] = None
    
    # Branding
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    brand_colors: List[str] = None  # Hex color codes
    
    # Statistics
    total_jobs_posted: int = 0
    active_jobs_count: int = 0
    total_applications_received: int = 0
    successful_hires: int = 0
    
    # Settings
    auto_approve_jobs: bool = False
    allow_direct_applications: bool = True
    show_salary_ranges: bool = True
    require_cover_letter: bool = False
    
    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    # Relationships
    admin_users: List[str] = None  # User IDs of company admins
    hr_users: List[str] = None     # User IDs of HR personnel
    recruiter_users: List[str] = None  # User IDs of recruiters
    
    def __post_init__(self):
        """Initialize default values"""
        if self.locations is None:
            self.locations = []
        if self.brand_colors is None:
            self.brand_colors = []
        if self.admin_users is None:
            self.admin_users = []
        if self.hr_users is None:
            self.hr_users = []
        if self.recruiter_users is None:
            self.recruiter_users = []
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
        if self.verification is None:
            self.verification = CompanyVerification()
        if self.emiratization is None:
            self.emiratization = EmiratiZationInfo()
    
    def get_primary_location(self) -> Optional[CompanyLocation]:
        """Get the primary/headquarters location"""
        for location in self.locations:
            if location.is_headquarters:
                return location
        return self.locations[0] if self.locations else None
    
    def get_location_display(self) -> str:
        """Get formatted location for display"""
        primary_location = self.get_primary_location()
        if primary_location:
            return f"{primary_location.city}, {primary_location.emirate}"
        return "Location not specified"
    
    def get_size_display(self) -> str:
        """Get human-readable company size"""
        size_display = {
            CompanySize.STARTUP: "Startup (1-10 employees)",
            CompanySize.SMALL: "Small (11-50 employees)",
            CompanySize.MEDIUM: "Medium (51-200 employees)",
            CompanySize.LARGE: "Large (201-1000 employees)",
            CompanySize.ENTERPRISE: "Enterprise (1000+ employees)"
        }
        return size_display.get(self.company_size, "Unknown size")
    
    def calculate_emiratization_rate(self) -> float:
        """Calculate current Emiratization rate"""
        if (self.emiratization and 
            self.emiratization.total_employees and 
            self.emiratization.emirati_employees and
            self.emiratization.total_employees > 0):
            return (self.emiratization.emirati_employees / self.emiratization.total_employees) * 100
        return 0.0
    
    def is_emiratization_compliant(self) -> bool:
        """Check if company meets Emiratization requirements"""
        if not self.emiratization or not self.emiratization.target_emiratization_rate:
            return False
        
        current_rate = self.calculate_emiratization_rate()
        return current_rate >= self.emiratization.target_emiratization_rate
    
    def add_user(self, user_id: str, role: str):
        """Add user to company with specific role"""
        if role == "admin" and user_id not in self.admin_users:
            self.admin_users.append(user_id)
        elif role == 'employer_admin' and user_id not in self.hr_users:
            self.hr_users.append(user_id)
        elif role == "recruiter" and user_id not in self.recruiter_users:
            self.recruiter_users.append(user_id)
        self.updated_at = datetime.utcnow()
    
    def remove_user(self, user_id: str):
        """Remove user from all company roles"""
        if user_id in self.admin_users:
            self.admin_users.remove(user_id)
        if user_id in self.hr_users:
            self.hr_users.remove(user_id)
        if user_id in self.recruiter_users:
            self.recruiter_users.remove(user_id)
        self.updated_at = datetime.utcnow()
    
    def get_all_users(self) -> List[str]:
        """Get all user IDs associated with the company"""
        return list(set(self.admin_users + self.hr_users + self.recruiter_users))
    
    def user_has_access(self, user_id: str) -> bool:
        """Check if user has access to company"""
        return user_id in self.get_all_users()
    
    def user_is_admin(self, user_id: str) -> bool:
        """Check if user is company admin"""
        return user_id in self.admin_users
    
    def verify_company(self, verified_by: str, notes: Optional[str] = None):
        """Mark company as verified"""
        self.verification.is_verified = True
        self.verification.verification_date = datetime.utcnow()
        self.verification.verified_by = verified_by
        self.verification.verification_notes = notes
        self.status = CompanyStatus.ACTIVE
        self.updated_at = datetime.utcnow()
    
    def suspend_company(self, reason: str):
        """Suspend company account"""
        self.status = CompanyStatus.SUSPENDED
        self.updated_at = datetime.utcnow()
    
    def activate_company(self):
        """Activate company account"""
        self.status = CompanyStatus.ACTIVE
        self.updated_at = datetime.utcnow()
    
    def update_job_statistics(self, jobs_posted: int = 0, applications_received: int = 0, 
                            successful_hires: int = 0):
        """Update job-related statistics"""
        self.total_jobs_posted += jobs_posted
        self.total_applications_received += applications_received
        self.successful_hires += successful_hires
        self.updated_at = datetime.utcnow()
    
    def get_subscription_features(self) -> List[str]:
        """Get features available for current subscription tier"""
        features = {
            SubscriptionTier.BASIC: [
                "Post up to 5 jobs per month",
                "Basic candidate search",
                "Email support"
            ],
            SubscriptionTier.PREMIUM: [
                "Post up to 25 jobs per month",
                "Advanced candidate search",
                "Priority support",
                "Analytics dashboard",
                "Custom branding"
            ],
            SubscriptionTier.ENTERPRISE: [
                "Unlimited job postings",
                "Advanced analytics",
                "Dedicated account manager",
                "API access",
                "Custom integrations",
                "Bulk operations"
            ],
            SubscriptionTier.GOVERNMENT: [
                "Unlimited job postings",
                "Emiratization tracking",
                "Government compliance reports",
                "Priority candidate matching",
                "Dedicated support"
            ]
        }
        return features.get(self.subscription_tier, [])
    
    def can_post_job(self) -> bool:
        """Check if company can post new jobs based on subscription"""
        if self.status != CompanyStatus.ACTIVE:
            return False
        
        if self.subscription_tier in [SubscriptionTier.ENTERPRISE, SubscriptionTier.GOVERNMENT]:
            return True
        
        # For basic and premium, check monthly limits (this would need to be implemented)
        return True  # Simplified for now
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        
        # Convert datetime objects to ISO strings
        datetime_fields = ['created_at', 'updated_at', 'last_login']
        for field in datetime_fields:
            if getattr(self, field):
                data[field] = getattr(self, field).isoformat()
        
        # Convert enums to values
        data['company_type'] = self.company_type.value
        data['company_size'] = self.company_size.value
        data['status'] = self.status.value
        data['subscription_tier'] = self.subscription_tier.value
        
        # Handle nested objects
        if self.verification and self.verification.verification_date:
            data['verification']['verification_date'] = self.verification.verification_date.isoformat()
        
        if self.emiratization and self.emiratization.last_updated:
            data['emiratization']['last_updated'] = self.emiratization.last_updated.isoformat()
        
        # Add computed fields
        data['primary_location'] = asdict(self.get_primary_location()) if self.get_primary_location() else None
        data['location_display'] = self.get_location_display()
        data['size_display'] = self.get_size_display()
        data['current_emiratization_rate'] = self.calculate_emiratization_rate()
        data['is_emiratization_compliant'] = self.is_emiratization_compliant()
        data['subscription_features'] = self.get_subscription_features()
        data['can_post_job'] = self.can_post_job()
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Company':
        """Create Company instance from dictionary"""
        # Convert string dates back to datetime objects
        datetime_fields = ['created_at', 'updated_at', 'last_login']
        for field in datetime_fields:
            if field in data and isinstance(data[field], str):
                data[field] = datetime.fromisoformat(data[field])
        
        # Convert enum strings back to enums
        if 'company_type' in data and isinstance(data['company_type'], str):
            data['company_type'] = CompanyType(data['company_type'])
        if 'company_size' in data and isinstance(data['company_size'], str):
            data['company_size'] = CompanySize(data['company_size'])
        if 'status' in data and isinstance(data['status'], str):
            data['status'] = CompanyStatus(data['status'])
        if 'subscription_tier' in data and isinstance(data['subscription_tier'], str):
            data['subscription_tier'] = SubscriptionTier(data['subscription_tier'])
        
        # Handle nested objects
        if 'locations' in data and isinstance(data['locations'], list):
            data['locations'] = [
                CompanyLocation(**loc) if isinstance(loc, dict) else loc 
                for loc in data['locations']
            ]
        
        if 'contact' in data and isinstance(data['contact'], dict):
            data['contact'] = CompanyContact(**data['contact'])
        
        if 'verification' in data and isinstance(data['verification'], dict):
            verification_data = data['verification']
            if 'verification_date' in verification_data and isinstance(verification_data['verification_date'], str):
                verification_data['verification_date'] = datetime.fromisoformat(verification_data['verification_date'])
            data['verification'] = CompanyVerification(**verification_data)
        
        if 'emiratization' in data and isinstance(data['emiratization'], dict):
            emiratization_data = data['emiratization']
            if 'last_updated' in emiratization_data and isinstance(emiratization_data['last_updated'], str):
                emiratization_data['last_updated'] = datetime.fromisoformat(emiratization_data['last_updated'])
            data['emiratization'] = EmiratiZationInfo(**emiratization_data)
        
        # Remove computed fields that shouldn't be in constructor
        computed_fields = ['primary_location', 'location_display', 'size_display', 
                          'current_emiratization_rate', 'is_emiratization_compliant', 
                          'subscription_features', 'can_post_job']
        for field in computed_fields:
            data.pop(field, None)
        
        return cls(**data)

# Database storage functions (to be integrated with existing database system)
class CompanyDatabase:
    """Company database operations"""
    
    @staticmethod
    def save_company(company: Company) -> str:
        """Save company to database and return company ID"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def get_company(company_id: str) -> Optional[Company]:
        """Get company by ID"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def get_companies_by_user(user_id: str) -> List[Company]:
        """Get all companies where user has access"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def search_companies(filters: Dict[str, Any]) -> List[Company]:
        """Search companies with filters"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def update_company(company: Company) -> bool:
        """Update existing company"""
        # This will be integrated with the existing database system
        pass
    
    @staticmethod
    def delete_company(company_id: str) -> bool:
        """Delete company"""
        # This will be integrated with the existing database system
        pass

