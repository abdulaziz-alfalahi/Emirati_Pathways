"""
CV Builder Engine - Core CV building logic with UAE-specific features
Emirati Journey Platform - Step 6 Implementation
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CVLanguage(Enum):
    ENGLISH = "en"
    ARABIC = "ar"
    BILINGUAL = "bilingual"

class CVTemplate(Enum):
    PROFESSIONAL = "professional"
    MODERN = "modern"
    EXECUTIVE = "executive"
    CREATIVE = "creative"
    ACADEMIC = "academic"
    UAE_CORPORATE = "uae_corporate"
    GOVERNMENT = 'compliance_auditor'

class Industry(Enum):
    FINANCE = "finance"
    HEALTHCARE = "healthcare"
    TECHNOLOGY = "technology"
    EDUCATION = "education"
    GOVERNMENT = 'compliance_auditor'
    ENERGY = "energy"
    TOURISM = "tourism"
    REAL_ESTATE = "real_estate"
    LOGISTICS = "logistics"
    RETAIL = "retail"

@dataclass
class PersonalInfo:
    """Personal information section with UAE-specific fields"""
    full_name: str
    arabic_name: Optional[str] = None
    email: str = ""
    phone: str = ""
    emirates_id: Optional[str] = None
    nationality: str = "UAE"
    emirate: str = ""
    city: str = ""
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    photo_url: Optional[str] = None
    visa_status: Optional[str] = None  # For non-UAE nationals if needed
    
    def validate_uae_phone(self) -> bool:
        """Validate UAE phone number format"""
        uae_prefixes = ['050', '052', '053', '054', '055', '056', '058']
        if self.phone.startswith('+971'):
            prefix = self.phone[4:7]
            return prefix in uae_prefixes
        return False
    
    def format_arabic_name(self) -> str:
        """Format Arabic name with proper RTL markers"""
        if self.arabic_name:
            return f"\u202B{self.arabic_name}\u202C"
        return ""

@dataclass
class Experience:
    """Work experience entry"""
    job_title: str
    company: str
    company_arabic: Optional[str] = None
    location: str = ""
    emirate: str = ""
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    description: List[str] = None
    achievements: List[str] = None
    skills_used: List[str] = None
    
    def __post_init__(self):
        if self.description is None:
            self.description = []
        if self.achievements is None:
            self.achievements = []
        if self.skills_used is None:
            self.skills_used = []

@dataclass
class Education:
    """Education entry"""
    degree: str
    institution: str
    institution_arabic: Optional[str] = None
    location: str = ""
    emirate: str = ""
    graduation_year: str = ""
    gpa: Optional[str] = None
    honors: Optional[str] = None
    relevant_coursework: List[str] = None
    
    def __post_init__(self):
        if self.relevant_coursework is None:
            self.relevant_coursework = []

@dataclass
class Skill:
    """Skill with proficiency level"""
    name: str
    category: str = "technical"  # technical, soft, language, certification
    proficiency: str = "intermediate"  # beginner, intermediate, advanced, expert
    years_experience: Optional[int] = None
    certified: bool = False
    certification_body: Optional[str] = None

@dataclass
class Language:
    """Language proficiency"""
    language: str
    proficiency: str = "intermediate"  # native, fluent, advanced, intermediate, basic
    reading: str = "intermediate"
    writing: str = "intermediate"
    speaking: str = "intermediate"
    certification: Optional[str] = None

@dataclass
class CVData:
    """Complete CV data structure"""
    personal_info: PersonalInfo
    professional_summary: str = ""
    experience: List[Experience] = None
    education: List[Education] = None
    skills: List[Skill] = None
    languages: List[Language] = None
    certifications: List[str] = None
    projects: List[Dict] = None
    awards: List[str] = None
    volunteer_work: List[Dict] = None
    references: List[Dict] = None
    custom_sections: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.experience is None:
            self.experience = []
        if self.education is None:
            self.education = []
        if self.skills is None:
            self.skills = []
        if self.languages is None:
            self.languages = []
        if self.certifications is None:
            self.certifications = []
        if self.projects is None:
            self.projects = []
        if self.awards is None:
            self.awards = []
        if self.volunteer_work is None:
            self.volunteer_work = []
        if self.references is None:
            self.references = []
        if self.custom_sections is None:
            self.custom_sections = {}

class CVBuilderEngine:
    """Core CV building engine with UAE-specific features"""
    
    def __init__(self):
        self.uae_emirates = [
            "Abu Dhabi", "Dubai", "Sharjah", "Ajman", 
            "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"
        ]
        self.uae_industries = {
            "finance": "Banking & Financial Services",
            "healthcare": "Healthcare & Medical Services",
            "technology": "Information Technology",
            "education": "Education & Training",
            'compliance_auditor': "Government & Public Sector",
            "energy": "Energy & Utilities",
            "tourism": "Tourism & Hospitality",
            "real_estate": "Real Estate & Construction",
            "logistics": "Logistics & Transportation",
            "retail": "Retail & Consumer Goods"
        }
        logger.info("CV Builder Engine initialized with UAE-specific features")
    
    def create_cv(self, user_id: str, template: CVTemplate, language: CVLanguage) -> Dict[str, Any]:
        """Create a new CV with specified template and language"""
        cv_id = str(uuid.uuid4())
        
        # Initialize with UAE-specific defaults
        personal_info = PersonalInfo(
            full_name="",
            nationality="UAE",
            emirate="Dubai"  # Default to Dubai
        )
        
        cv_data = CVData(personal_info=personal_info)
        
        # Add default Arabic language for UAE nationals
        if language in [CVLanguage.ARABIC, CVLanguage.BILINGUAL]:
            arabic_lang = Language(
                language="Arabic",
                proficiency="native",
                reading="native",
                writing="native",
                speaking="native"
            )
            cv_data.languages.append(arabic_lang)
        
        # Add default English language
        if language in [CVLanguage.ENGLISH, CVLanguage.BILINGUAL]:
            english_lang = Language(
                language="English",
                proficiency="fluent",
                reading="fluent",
                writing="fluent",
                speaking="fluent"
            )
            cv_data.languages.append(english_lang)
        
        cv_metadata = {
            "cv_id": cv_id,
            "user_id": user_id,
            "template": template.value,
            "language": language.value,
            "version": 1,
            "created_at": datetime.now().isoformat(),
            "last_modified": datetime.now().isoformat(),
            "completion_score": 0,
            "is_active": True
        }
        
        result = {
            "metadata": cv_metadata,
            "data": asdict(cv_data),
            "template_config": self._get_template_config(template, language)
        }
        
        logger.info(f"Created new CV {cv_id} for user {user_id}")
        return result
    
    def update_personal_info(self, cv_data: Dict, personal_info: Dict) -> Dict:
        """Update personal information with validation"""
        try:
            # Validate UAE phone number if provided
            if personal_info.get('phone'):
                phone = personal_info['phone']
                if not self._validate_uae_phone(phone):
                    logger.warning(f"Invalid UAE phone number format: {phone}")
            
            # Validate Emirates ID if provided
            if personal_info.get('emirates_id'):
                emirates_id = personal_info['emirates_id']
                if not self._validate_emirates_id(emirates_id):
                    logger.warning(f"Invalid Emirates ID format: {emirates_id}")
            
            # Update the personal info
            cv_data['data']['personal_info'].update(personal_info)
            cv_data['metadata']['last_modified'] = datetime.now().isoformat()
            
            # Recalculate completion score
            cv_data['metadata']['completion_score'] = self._calculate_completion_score(cv_data['data'])
            
            logger.info(f"Updated personal info for CV {cv_data['metadata']['cv_id']}")
            return cv_data
            
        except Exception as e:
            logger.error(f"Error updating personal info: {str(e)}")
            raise
    
    def add_experience(self, cv_data: Dict, experience: Dict) -> Dict:
        """Add work experience entry"""
        try:
            # Validate required fields
            required_fields = ['job_title', 'company', 'start_date']
            for field in required_fields:
                if not experience.get(field):
                    raise ValueError(f"Missing required field: {field}")
            
            # Add UAE-specific validations
            if experience.get('emirate') and experience['emirate'] not in self.uae_emirates:
                logger.warning(f"Emirate not in UAE list: {experience['emirate']}")
            
            # Ensure lists are initialized
            for list_field in ['description', 'achievements', 'skills_used']:
                if list_field not in experience:
                    experience[list_field] = []
            
            cv_data['data']['experience'].append(experience)
            cv_data['metadata']['last_modified'] = datetime.now().isoformat()
            cv_data['metadata']['completion_score'] = self._calculate_completion_score(cv_data['data'])
            
            logger.info(f"Added experience entry to CV {cv_data['metadata']['cv_id']}")
            return cv_data
            
        except Exception as e:
            logger.error(f"Error adding experience: {str(e)}")
            raise
    
    def add_education(self, cv_data: Dict, education: Dict) -> Dict:
        """Add education entry"""
        try:
            # Validate required fields
            required_fields = ['degree', 'institution']
            for field in required_fields:
                if not education.get(field):
                    raise ValueError(f"Missing required field: {field}")
            
            # Ensure lists are initialized
            if 'relevant_coursework' not in education:
                education['relevant_coursework'] = []
            
            cv_data['data']['education'].append(education)
            cv_data['metadata']['last_modified'] = datetime.now().isoformat()
            cv_data['metadata']['completion_score'] = self._calculate_completion_score(cv_data['data'])
            
            logger.info(f"Added education entry to CV {cv_data['metadata']['cv_id']}")
            return cv_data
            
        except Exception as e:
            logger.error(f"Error adding education: {str(e)}")
            raise
    
    def add_skill(self, cv_data: Dict, skill: Dict) -> Dict:
        """Add skill entry"""
        try:
            if not skill.get('name'):
                raise ValueError("Skill name is required")
            
            # Set defaults
            skill.setdefault('category', 'technical')
            skill.setdefault('proficiency', 'intermediate')
            skill.setdefault('certified', False)
            
            cv_data['data']['skills'].append(skill)
            cv_data['metadata']['last_modified'] = datetime.now().isoformat()
            cv_data['metadata']['completion_score'] = self._calculate_completion_score(cv_data['data'])
            
            logger.info(f"Added skill to CV {cv_data['metadata']['cv_id']}")
            return cv_data
            
        except Exception as e:
            logger.error(f"Error adding skill: {str(e)}")
            raise
    
    def generate_professional_summary(self, cv_data: Dict, industry: Optional[str] = None) -> str:
        """Generate AI-powered professional summary based on CV data"""
        try:
            experience_years = self._calculate_total_experience(cv_data['data']['experience'])
            skills = [skill['name'] for skill in cv_data['data']['skills']]
            education_level = self._get_highest_education(cv_data['data']['education'])
            
            # UAE-specific summary templates
            if industry and industry in self.uae_industries:
                industry_name = self.uae_industries[industry]
                summary_template = f"Experienced {industry_name} professional with {experience_years} years of expertise in the UAE market."
            else:
                summary_template = f"Accomplished professional with {experience_years} years of experience in the UAE."
            
            # Add skills and education context
            if skills:
                top_skills = skills[:5]  # Top 5 skills
                skills_text = ", ".join(top_skills)
                summary_template += f" Skilled in {skills_text}."
            
            if education_level:
                summary_template += f" Holds {education_level} degree."
            
            # Add UAE market context
            summary_template += " Committed to contributing to the UAE's vision for economic diversification and innovation."
            
            return summary_template
            
        except Exception as e:
            logger.error(f"Error generating professional summary: {str(e)}")
            return "Dedicated professional committed to excellence and contributing to the UAE's continued growth and success."
    
    def _validate_uae_phone(self, phone: str) -> bool:
        """Validate UAE phone number format"""
        uae_prefixes = ['050', '052', '053', '054', '055', '056', '058']
        
        # Remove spaces and special characters
        clean_phone = re.sub(r'[^\d+]', '', phone)
        
        # Check for +971 prefix
        if clean_phone.startswith('+971'):
            prefix = clean_phone[4:7]
            return prefix in uae_prefixes and len(clean_phone) == 13
        
        # Check for 971 prefix without +
        if clean_phone.startswith('971'):
            prefix = clean_phone[3:6]
            return prefix in uae_prefixes and len(clean_phone) == 12
        
        # Check for local format (9 digits starting with valid prefix)
        if len(clean_phone) == 9:
            prefix = clean_phone[:3]
            return prefix in uae_prefixes
        
        return False
    
    def _validate_emirates_id(self, emirates_id: str) -> bool:
        """Validate Emirates ID format (784-YYYY-XXXXXXX-X)"""
        # Remove spaces and hyphens
        clean_id = re.sub(r'[-\s]', '', emirates_id)
        
        # Check if it's 15 digits starting with 784
        if len(clean_id) == 15 and clean_id.startswith('784'):
            return clean_id.isdigit()
        
        return False
    
    def _calculate_completion_score(self, cv_data: Dict) -> int:
        """Calculate CV completion score (0-100)"""
        score = 0
        
        # Personal info (30 points)
        personal_info = cv_data.get('personal_info', {})
        if personal_info.get('full_name'): score += 5
        if personal_info.get('email'): score += 5
        if personal_info.get('phone'): score += 5
        if personal_info.get('emirate'): score += 5
        if personal_info.get('city'): score += 5
        if personal_info.get('linkedin'): score += 5
        
        # Professional summary (10 points)
        if cv_data.get('professional_summary'): score += 10
        
        # Experience (25 points)
        experience = cv_data.get('experience', [])
        if experience:
            score += 15  # Base points for having experience
            if len(experience) >= 2: score += 5  # Multiple positions
            if any(exp.get('achievements') for exp in experience): score += 5  # Achievements
        
        # Education (15 points)
        education = cv_data.get('education', [])
        if education:
            score += 10  # Base points for education
            if len(education) >= 2: score += 5  # Multiple degrees
        
        # Skills (10 points)
        skills = cv_data.get('skills', [])
        if skills:
            score += 5  # Base points for skills
            if len(skills) >= 5: score += 5  # Multiple skills
        
        # Languages (5 points)
        languages = cv_data.get('languages', [])
        if languages: score += 5
        
        # Additional sections (5 points)
        if cv_data.get('certifications'): score += 2
        if cv_data.get('projects'): score += 2
        if cv_data.get('volunteer_work'): score += 1
        
        return min(score, 100)  # Cap at 100
    
    def _calculate_total_experience(self, experience: List[Dict]) -> int:
        """Calculate total years of experience"""
        total_months = 0
        
        for exp in experience:
            start_date = exp.get('start_date', '')
            end_date = exp.get('end_date', '')
            
            if start_date:
                try:
                    start = datetime.strptime(start_date, '%Y-%m')
                    if end_date and not exp.get('is_current', False):
                        end = datetime.strptime(end_date, '%Y-%m')
                    else:
                        end = datetime.now()
                    
                    months = (end.year - start.year) * 12 + (end.month - start.month)
                    total_months += max(months, 0)
                    
                except ValueError:
                    continue
        
        return max(total_months // 12, 0)
    
    def _get_highest_education(self, education: List[Dict]) -> str:
        """Get the highest level of education"""
        education_levels = {
            'phd': 5, 'doctorate': 5, 'doctoral': 5,
            'master': 4, 'masters': 4, 'mba': 4,
            'bachelor': 3, 'bachelors': 3,
            'associate': 2, 'diploma': 2,
            'certificate': 1, 'high school': 1
        }
        
        highest_level = 0
        highest_degree = ""
        
        for edu in education:
            degree = edu.get('degree', '').lower()
            for level_name, level_value in education_levels.items():
                if level_name in degree and level_value > highest_level:
                    highest_level = level_value
                    highest_degree = edu.get('degree', '')
        
        return highest_degree
    
    def _get_template_config(self, template: CVTemplate, language: CVLanguage) -> Dict:
        """Get template configuration based on template type and language"""
        base_config = {
            "font_family": "Arial, sans-serif",
            "font_size": 11,
            "line_height": 1.4,
            "margin": "2cm",
            "color_scheme": "professional"
        }
        
        # Template-specific configurations
        template_configs = {
            CVTemplate.PROFESSIONAL: {
                "color_primary": "#2C3E50",
                "color_secondary": "#34495E",
                "layout": "traditional"
            },
            CVTemplate.MODERN: {
                "color_primary": "#3498DB",
                "color_secondary": "#2980B9",
                "layout": "modern"
            },
            CVTemplate.EXECUTIVE: {
                "color_primary": "#8E44AD",
                "color_secondary": "#9B59B6",
                "layout": "executive"
            },
            CVTemplate.UAE_CORPORATE: {
                "color_primary": "#C41E3A",  # UAE flag red
                "color_secondary": "#00732F",  # UAE flag green
                "layout": "corporate",
                "header_style": "formal"
            },
            CVTemplate.GOVERNMENT: {
                "color_primary": "#1B4F72",
                "color_secondary": "#2E86AB",
                "layout": 'compliance_auditor',
                "header_style": "official"
            }
        }
        
        # Language-specific configurations
        if language == CVLanguage.ARABIC:
            base_config.update({
                "font_family": "Amiri, Arial, sans-serif",
                "text_direction": "rtl",
                "text_align": "right"
            })
        elif language == CVLanguage.BILINGUAL:
            base_config.update({
                "font_family": "Amiri, Arial, sans-serif",
                "supports_rtl": True,
                "bilingual_layout": True
            })
        
        # Merge configurations
        config = {**base_config, **template_configs.get(template, {})}
        
        return config

# Initialize the CV Builder Engine
cv_builder_engine = CVBuilderEngine()

def get_cv_builder_engine():
    """Get the CV builder engine instance"""
    return cv_builder_engine

