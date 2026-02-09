from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.extensions import db

class CandidateProfile(db.Model):
    __tablename__ = 'candidate_profiles'

    id = Column(Integer, primary_key=True)
    user_id = Column(String(255), unique=True, nullable=False)
    
    # Identity
    headline = Column(String(255))
    full_name = Column(String(255))  # Added for extracted name
    bio = Column(Text)
    phone = Column(String(50))
    location = Column(String(100))
    latitude = Column(db.Float)
    longitude = Column(db.Float)
    nationality = Column(String(100), default='UAE')
    dob = Column(DateTime, nullable=True)
    
    # Rich Media
    avatar_url = Column(String(500))
    video_intro_url = Column(String(500))
    
    # Career Compass (Future Intent)
    target_roles = Column(JSON)  # List of strings e.g. ["Software Engineer", "Product Manager"]
    willing_to_relocate = Column(Boolean, default=False)
    expected_salary_range = Column(String(100))
    notice_period = Column(String(50))
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    experience = relationship('CandidateExperience', backref='profile', cascade="all, delete-orphan")
    education = relationship('CandidateEducation', backref='profile', cascade="all, delete-orphan")
    skills = relationship('CandidateSkill', backref='profile', cascade="all, delete-orphan")
    certifications = relationship('CandidateCertification', backref='profile', cascade="all, delete-orphan")
    assessments = relationship('CandidateAssessment', backref='profile', cascade="all, delete-orphan")

    def to_dict(self):
        try:
            # Mask sensitive contact info for privacy
            masked_email = None
            masked_phone = None

            # Safely retrieve email - handle missing User relationship
            # Note: We skip the raw SQL query here to avoid transaction aborts (UUID vs Int mismatch)
            email = None
            try:
                # Try standard relationship access first
                user = getattr(self, 'user', None)
                if user and hasattr(user, 'email'):
                    email = user.email
            except Exception as e:
                print(f"Warning: Failed to fetch email for profile {self.id}: {e}")

            if email:
                try:
                    user_part, domain = email.split('@')
                    masked_email = f"{user_part[:2]}***@{domain}"
                except:
                    masked_email = "***@***.com"

            if self.phone:
                try:
                    # Keep last 4 digits
                    masked_phone = f"{self.phone[:-4].replace(self.phone[:-4], '*' * len(self.phone[:-4]))}{self.phone[-4:]}"
                    if len(self.phone) > 10: # Format nicely if possible
                         masked_phone = f"+971 *** **{self.phone[-4:]}"
                except:
                    masked_phone = "+971 *******"

            return {
                'id': self.id,
                'user_id': self.user_id,
                'full_name': self.full_name or 'User', # Fallback to 'User' only if empty
                'headline': self.headline,
                'bio': self.bio,
                'contact': {
                    'phone': masked_phone,
                    'location': self.location,
                    'latitude': self.latitude,
                    'longitude': self.longitude,
                    'email': masked_email
                },
                'media': {
                    'avatar': self.avatar_url,
                    'video_intro': self.video_intro_url
                },
                'career_compass': {
                    'target_roles': self.target_roles or [],
                    'relocation': self.willing_to_relocate,
                    'salary': self.expected_salary_range,
                    'notice_period': self.notice_period
                },
                'experience': [e.to_dict() for e in self.experience],
                'education': [e.to_dict() for e in self.education],
                'skills': [e.to_dict() for e in self.skills],
                'certifications': [e.to_dict() for e in self.certifications],
                'assessments': [e.to_dict() for e in self.assessments]
            }
        except Exception as e:
            print(f"CRITICAL ERROR in CandidateProfile.to_dict: {e}")
            import traceback
            traceback.print_exc()
            # Return minimal safe dict to prevent API 500
            return {
                'id': self.id,
                'user_id': self.user_id,
                'error': 'Serialization Failed'
            }

class CandidateExperience(db.Model):
    __tablename__ = 'candidate_experience_entries'

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey('candidate_profiles.id'), nullable=False)
    
    job_title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255))
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True) # Null = Present
    is_current = Column(Boolean, default=False)
    
    description = Column(Text)
    skills_used = Column(JSON) # List of skill names linked to this job
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_title': self.job_title,
            'company': self.company,
            'location': self.location,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_current': self.is_current,
            'description': self.description,
            'skills_used': self.skills_used or []
        }

class CandidateEducation(db.Model):
    __tablename__ = 'candidate_education_entries'

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey('candidate_profiles.id'), nullable=False)
    
    institution = Column(String(255), nullable=False)
    degree = Column(String(255), nullable=False)
    field_of_study = Column(String(255))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    grade = Column(String(50))
    
    # Verification (Blockchain/Government hooks)
    is_verified = Column(Boolean, default=False)
    verification_source = Column(String(50), default='self_reported') # self_reported, khda_blockchain, moe_attested
    verification_id = Column(String(255)) # Blockchain hash or certificate ID
    
    def to_dict(self):
        return {
            'id': self.id,
            'institution': self.institution,
            'degree': self.degree,
            'field': self.field_of_study,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'grade': self.grade,
            'verification': {
                'is_verified': self.is_verified,
                'source': self.verification_source,
                'id': self.verification_id
            }
        }

class CandidateSkill(db.Model):
    __tablename__ = 'candidate_skills'

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey('candidate_profiles.id'), nullable=False)
    
    name = Column(String(100), nullable=False)
    category = Column(String(50)) # Technical, Soft, Language
    level = Column(String(50)) # Beginner, Intermediate, Expert
    
    # Verification
    is_verified = Column(Boolean, default=False)
    assessment_score = Column(Integer, nullable=True) # Link to internal Assessment Engine
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'level': self.level,
            'verified': self.is_verified,
            'score': self.assessment_score
        }

class CandidateCertification(db.Model):
    __tablename__ = 'candidate_certifications'
    
    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey('candidate_profiles.id'), nullable=False)
    
    name = Column(String(255), nullable=False)
    issuing_organization = Column(String(255), nullable=False)
    issue_date = Column(DateTime)
    expiry_date = Column(DateTime, nullable=True)
    credential_id = Column(String(255))
    credential_url = Column(String(500))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'issuer': self.issuing_organization,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'credential_id': self.credential_id,
            'url': self.credential_url
        }

class CandidateAssessment(db.Model):
    """
    Stores the results of assessments taken by the candidate.
    Linked to D33 Strategic Sectors where applicable.
    """
    __tablename__ = 'candidate_assessments'

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey('candidate_profiles.id'), nullable=False)
    
    assessment_type = Column(String(50)) # technical, cultural, soft_skills, d33_alignment
    title = Column(String(255))
    score = Column(db.Float)
    max_score = Column(db.Float)
    status = Column(String(20), default='completed') # completed, in_progress
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    # D33 Alignment
    d33_sector = Column(String(50), nullable=True) # Enum match from IndustryCategory
    
    def to_dict(self):
        return {
            'id': self.id,
            'assessment_type': self.assessment_type,
            'title': self.title,
            'score': self.score,
            'max_score': self.max_score,
            'status': self.status,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'd33_sector': self.d33_sector
        }
