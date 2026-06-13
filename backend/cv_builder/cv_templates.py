#!/usr/bin/env python3
"""
CV Template Management System
Handles CV templates with UAE-specific designs and layouts
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
from pathlib import Path
from dataclasses import dataclass, asdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TemplateSection:
    """Template section configuration"""
    name: str
    display_name: str
    required: bool = False
    order: int = 0
    max_items: Optional[int] = None
    fields: List[str] = None
    
    def __post_init__(self):
        if self.fields is None:
            self.fields = []

@dataclass
class TemplateStyle:
    """Template styling configuration"""
    font_family: str = "Arial, sans-serif"
    font_size: int = 11
    line_height: float = 1.4
    color_primary: str = "#2C3E50"
    color_secondary: str = "#34495E"
    color_accent: str = "#3498DB"
    background_color: str = "#FFFFFF"
    header_style: str = "modern"
    layout_type: str = "single_column"
    spacing: str = "normal"
    border_style: str = "none"

@dataclass
class CVTemplate:
    """Complete CV template definition"""
    id: str
    name: str
    display_name: str
    description: str
    category: str
    industry: str = "general"
    language: str = "english"
    is_premium: bool = False
    is_active: bool = True
    preview_image: str = ""
    sections: List[TemplateSection] = None
    style: TemplateStyle = None
    metadata: Dict[str, Any] = None
    created_at: str = ""
    updated_at: str = ""
    
    def __post_init__(self):
        if self.sections is None:
            self.sections = []
        if self.style is None:
            self.style = TemplateStyle()
        if self.metadata is None:
            self.metadata = {}
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.updated_at:
            self.updated_at = datetime.now().isoformat()

class CVTemplateManager:
    """
    CV Template Management System
    """
    
    def __init__(self):
        """Initialize the template manager"""
        self.templates_dir = Path(__file__).parent.parent / "templates"
        self.templates_dir.mkdir(exist_ok=True)
        
        # UAE-specific configurations
        self.uae_colors = {
            'flag_red': '#C41E3A',
            'flag_green': '#00732F',
            'flag_white': '#FFFFFF',
            'flag_black': '#000000',
            'gold': '#FFD700',
            'corporate_blue': '#1B4F72',
            'modern_teal': '#17A2B8'
        }
        
        self.uae_industries = {
            'finance': 'Banking & Financial Services',
            'healthcare': 'Healthcare & Medical Services',
            'technology': 'Information Technology',
            'education': 'Education & Training',
            'compliance_auditor': 'Government & Public Sector',
            'energy': 'Energy & Utilities',
            'tourism': 'Tourism & Hospitality',
            'real_estate': 'Real Estate & Construction',
            'logistics': 'Logistics & Transportation',
            'retail': 'Retail & Consumer Goods'
        }
        
        # Initialize default templates
        self._create_default_templates()
        
        logger.info("CV Template Manager initialized with UAE-specific templates")
    
    def _create_default_templates(self):
        """Create default UAE-optimized templates"""
        
        # Standard sections for all templates
        standard_sections = [
            TemplateSection("personal_info", "Personal Information", required=True, order=1, fields=[
                "full_name", "email", "phone", "emirate", "city", "nationality", "visa_status"
            ]),
            TemplateSection("professional_summary", "Professional Summary", required=True, order=2),
            TemplateSection("experience", "Work Experience", required=True, order=3, fields=[
                "job_title", "company", "location", "start_date", "end_date", "description", "achievements"
            ]),
            TemplateSection("education", "Education", required=True, order=4, fields=[
                "degree", "institution", "graduation_year", "gpa", "honors"
            ]),
            TemplateSection("skills", "Skills", required=True, order=5, fields=[
                "name", "category", "proficiency", "years_experience"
            ]),
            TemplateSection("languages", "Languages", required=False, order=6, fields=[
                "language", "proficiency", "certification"
            ]),
            TemplateSection("certifications", "Certifications", required=False, order=7),
            TemplateSection("projects", "Projects", required=False, order=8),
            TemplateSection("awards", "Awards & Achievements", required=False, order=9),
            TemplateSection("volunteer_work", "Volunteer Work", required=False, order=10)
        ]
        
        # Template 1: UAE Professional
        uae_professional = CVTemplate(
            id="uae_professional",
            name="uae_professional",
            display_name="UAE Professional",
            description="Clean, professional template optimized for UAE corporate environment",
            category="professional",
            industry="general",
            language="english",
            sections=standard_sections.copy(),
            style=TemplateStyle(
                font_family="Arial, sans-serif",
                font_size=11,
                color_primary=self.uae_colors['corporate_blue'],
                color_secondary="#34495E",
                color_accent=self.uae_colors['gold'],
                header_style="professional",
                layout_type="single_column"
            ),
            metadata={
                "target_audience": "UAE professionals",
                "best_for": ["Corporate roles", "Government positions", "Traditional industries"],
                "features": ["ATS-friendly", "UAE phone validation", "Emirates integration"]
            }
        )
        
        # Template 2: UAE Executive
        uae_executive = CVTemplate(
            id="uae_executive",
            name="uae_executive",
            display_name="UAE Executive",
            description="Premium template for senior executives and leadership roles",
            category="executive",
            industry="general",
            language="english",
            is_premium=True,
            sections=standard_sections.copy(),
            style=TemplateStyle(
                font_family="Georgia, serif",
                font_size=12,
                color_primary=self.uae_colors['flag_red'],
                color_secondary=self.uae_colors['flag_green'],
                color_accent=self.uae_colors['gold'],
                header_style="executive",
                layout_type="two_column",
                spacing="generous"
            ),
            metadata={
                "target_audience": "Senior executives",
                "best_for": ["C-level positions", "Board roles", "Strategic leadership"],
                "features": ["Premium design", "Two-column layout", "Executive summary focus"]
            }
        )
        
        # Template 3: UAE Technology
        uae_technology = CVTemplate(
            id="uae_technology",
            name="uae_technology",
            display_name="UAE Technology",
            description="Modern template for IT and technology professionals",
            category="modern",
            industry="technology",
            language="english",
            sections=standard_sections + [
                TemplateSection("technical_skills", "Technical Skills", required=True, order=5.5, fields=[
                    "programming_languages", "frameworks", "tools", "platforms"
                ]),
                TemplateSection("github_projects", "GitHub Projects", required=False, order=8.5)
            ],
            style=TemplateStyle(
                font_family="Roboto, sans-serif",
                font_size=10,
                color_primary=self.uae_colors['modern_teal'],
                color_secondary="#2C3E50",
                color_accent="#E74C3C",
                header_style="modern",
                layout_type="single_column",
                border_style="subtle"
            ),
            metadata={
                "target_audience": "IT professionals",
                "best_for": ["Software engineers", "Data scientists", "Tech leads"],
                "features": ["GitHub integration", "Technical skills focus", "Modern design"]
            }
        )
        
        # Template 4: UAE Healthcare
        uae_healthcare = CVTemplate(
            id="uae_healthcare",
            name="uae_healthcare",
            display_name="UAE Healthcare",
            description="Professional template for healthcare and medical professionals",
            category="professional",
            industry="healthcare",
            language="english",
            sections=standard_sections + [
                TemplateSection("medical_licenses", "Medical Licenses", required=True, order=4.5, fields=[
                    "license_type", "issuing_authority", "license_number", "expiry_date"
                ]),
                TemplateSection("clinical_experience", "Clinical Experience", required=True, order=3.5),
                TemplateSection("publications", "Publications & Research", required=False, order=8.5)
            ],
            style=TemplateStyle(
                font_family="Times New Roman, serif",
                font_size=11,
                color_primary="#2E8B57",
                color_secondary="#4682B4",
                color_accent="#DC143C",
                header_style="formal",
                layout_type="single_column"
            ),
            metadata={
                "target_audience": "Healthcare professionals",
                "best_for": ["Doctors", "Nurses", "Medical specialists"],
                "features": ["Medical license tracking", "Clinical experience focus", "Publication support"]
            }
        )
        
        # Template 5: UAE Government
        uae_government = CVTemplate(
            id="uae_government",
            name="uae_government",
            display_name="UAE Government",
            description="Formal template for government and public sector roles",
            category='compliance_auditor',
            industry='compliance_auditor',
            language="english",
            sections=standard_sections + [
                TemplateSection("security_clearance", "Security Clearance", required=False, order=4.5),
                TemplateSection("government_experience", "Government Experience", required=True, order=3.5),
                TemplateSection("public_service", "Public Service", required=False, order=9.5)
            ],
            style=TemplateStyle(
                font_family="Arial, sans-serif",
                font_size=11,
                color_primary=self.uae_colors['flag_red'],
                color_secondary=self.uae_colors['corporate_blue'],
                color_accent=self.uae_colors['gold'],
                header_style="formal",
                layout_type="single_column",
                spacing="formal"
            ),
            metadata={
                "target_audience": "Government employees",
                "best_for": ["Civil service", "Public sector", "Government contractors"],
                "features": ["Security clearance section", "Government experience focus", "Formal styling"]
            }
        )
        
        # Template 6: UAE Creative
        uae_creative = CVTemplate(
            id="uae_creative",
            name="uae_creative",
            display_name="UAE Creative",
            description="Creative template for design and media professionals",
            category="creative",
            industry="media",
            language="english",
            sections=standard_sections + [
                TemplateSection("portfolio", "Portfolio", required=True, order=3.5, fields=[
                    "project_name", "description", "url", "technologies", "role"
                ]),
                TemplateSection("creative_skills", "Creative Skills", required=True, order=5.5),
                TemplateSection("exhibitions", "Exhibitions & Shows", required=False, order=8.5)
            ],
            style=TemplateStyle(
                font_family="Helvetica, sans-serif",
                font_size=10,
                color_primary="#8E44AD",
                color_secondary="#E67E22",
                color_accent="#F39C12",
                header_style="creative",
                layout_type="two_column",
                border_style="creative"
            ),
            metadata={
                "target_audience": "Creative professionals",
                "best_for": ["Designers", "Artists", "Media professionals"],
                "features": ["Portfolio showcase", "Creative layout", "Visual emphasis"]
            }
        )
        
        # Store templates
        self.templates = {
            "uae_professional": uae_professional,
            "uae_executive": uae_executive,
            "uae_technology": uae_technology,
            "uae_healthcare": uae_healthcare,
            "uae_government": uae_government,
            "uae_creative": uae_creative
        }
        
        # Save templates to files
        for template_id, template in self.templates.items():
            self._save_template(template)
    
    def get_available_templates(self) -> List[Dict[str, Any]]:
        """Get list of available templates"""
        try:
            templates_list = []
            
            for template_id, template in self.templates.items():
                if template.is_active:
                    templates_list.append({
                        'id': template.id,
                        'name': template.name,
                        'display_name': template.display_name,
                        'description': template.description,
                        'category': template.category,
                        'industry': template.industry,
                        'language': template.language,
                        'is_premium': template.is_premium,
                        'preview_image': template.preview_image,
                        'metadata': template.metadata
                    })
            
            return templates_list
            
        except Exception as e:
            logger.error(f"Error getting available templates: {str(e)}")
            return []
    
    def get_template(self, template_id: str) -> Optional[CVTemplate]:
        """Get specific template by ID"""
        try:
            return self.templates.get(template_id)
        except Exception as e:
            logger.error(f"Error getting template {template_id}: {str(e)}")
            return None
    
    def get_template_preview(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get template preview data"""
        try:
            template = self.get_template(template_id)
            if not template:
                return None
            
            return {
                'template_id': template.id,
                'display_name': template.display_name,
                'description': template.description,
                'style': asdict(template.style),
                'sections': [asdict(section) for section in template.sections],
                'sample_data': self._generate_sample_data(template),
                'preview_html': self._generate_preview_html(template)
            }
            
        except Exception as e:
            logger.error(f"Error getting template preview for {template_id}: {str(e)}")
            return None
    
    def get_templates_by_industry(self, industry: str) -> List[Dict[str, Any]]:
        """Get templates filtered by industry"""
        try:
            filtered_templates = []
            
            for template_id, template in self.templates.items():
                if template.is_active and (template.industry == industry or template.industry == "general"):
                    filtered_templates.append({
                        'id': template.id,
                        'name': template.name,
                        'display_name': template.display_name,
                        'description': template.description,
                        'category': template.category,
                        'industry': template.industry,
                        'is_premium': template.is_premium,
                        'metadata': template.metadata
                    })
            
            return filtered_templates
            
        except Exception as e:
            logger.error(f"Error getting templates by industry {industry}: {str(e)}")
            return []
    
    def get_template_sections(self, template_id: str) -> List[Dict[str, Any]]:
        """Get template sections configuration"""
        try:
            template = self.get_template(template_id)
            if not template:
                return []
            
            return [asdict(section) for section in template.sections]
            
        except Exception as e:
            logger.error(f"Error getting template sections for {template_id}: {str(e)}")
            return []
    
    def _save_template(self, template: CVTemplate):
        """Save template to file"""
        try:
            template_file = self.templates_dir / f"{template.id}.json"
            template_data = asdict(template)
            
            with open(template_file, 'w', encoding='utf-8') as f:
                json.dump(template_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved template {template.id} to {template_file}")
            
        except Exception as e:
            logger.error(f"Error saving template {template.id}: {str(e)}")
    
    def _generate_sample_data(self, template: CVTemplate) -> Dict[str, Any]:
        """Generate sample data for template preview"""
        return {
            'personal_info': {
                'full_name': 'Ahmed Al Mansouri',
                'email': 'ahmed.almansouri@email.com',
                'phone': '+971 50 123 4567',
                'emirate': 'Dubai',
                'city': 'Dubai',
                'nationality': 'UAE'
            },
            'professional_summary': 'Experienced professional with 8+ years in the UAE market, specializing in driving innovation and excellence in dynamic environments.',
            'experience': [
                {
                    'job_title': 'Senior Manager',
                    'company': 'Emirates Group',
                    'location': 'Dubai, UAE',
                    'start_date': '2020-01',
                    'end_date': '',
                    'is_current': True,
                    'description': ['Led cross-functional teams', 'Implemented strategic initiatives'],
                    'achievements': ['Increased efficiency by 30%', 'Managed $2M budget']
                }
            ],
            'education': [
                {
                    'degree': 'Master of Business Administration',
                    'institution': 'American University of Sharjah',
                    'graduation_year': '2018',
                    'gpa': '3.8'
                }
            ],
            'skills': [
                {'name': 'Leadership', 'category': 'Soft Skills', 'proficiency': 'Expert'},
                {'name': 'Project Management', 'category': 'Professional', 'proficiency': 'Advanced'},
                {'name': 'Data Analysis', 'category': 'Technical', 'proficiency': 'Intermediate'}
            ],
            'languages': [
                {'language': 'Arabic', 'proficiency': 'Native'},
                {'language': 'English', 'proficiency': 'Fluent'}
            ]
        }
    
    def _generate_preview_html(self, template: CVTemplate) -> str:
        """Generate HTML preview of template"""
        style = template.style
        
        html = f"""
        <div class="cv-preview" style="
            font-family: {style.font_family};
            font-size: {style.font_size}px;
            line-height: {style.line_height};
            color: {style.color_primary};
            background-color: {style.background_color};
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
        ">
            <div class="header" style="
                text-align: center;
                border-bottom: 2px solid {style.color_accent};
                padding-bottom: 15px;
                margin-bottom: 20px;
            ">
                <h1 style="
                    color: {style.color_primary};
                    margin: 0;
                    font-size: 24px;
                ">Ahmed Al Mansouri</h1>
                <p style="
                    color: {style.color_secondary};
                    margin: 5px 0;
                ">ahmed.almansouri@email.com | +971 50 123 4567 | Dubai, UAE</p>
            </div>
            
            <div class="section" style="margin-bottom: 20px;">
                <h2 style="
                    color: {style.color_accent};
                    font-size: 16px;
                    margin-bottom: 10px;
                    border-left: 4px solid {style.color_accent};
                    padding-left: 10px;
                ">Professional Summary</h2>
                <p style="margin: 0;">Experienced professional with 8+ years in the UAE market...</p>
            </div>
            
            <div class="section" style="margin-bottom: 20px;">
                <h2 style="
                    color: {style.color_accent};
                    font-size: 16px;
                    margin-bottom: 10px;
                    border-left: 4px solid {style.color_accent};
                    padding-left: 10px;
                ">Work Experience</h2>
                <div style="margin-bottom: 15px;">
                    <h3 style="
                        color: {style.color_primary};
                        font-size: 14px;
                        margin: 0;
                    ">Senior Manager at Emirates Group</h3>
                    <p style="
                        color: {style.color_secondary};
                        font-size: 12px;
                        margin: 2px 0;
                    ">2020 - Present | Dubai, UAE</p>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Led cross-functional teams</li>
                        <li>Implemented strategic initiatives</li>
                    </ul>
                </div>
            </div>
            
            <div class="section">
                <h2 style="
                    color: {style.color_accent};
                    font-size: 16px;
                    margin-bottom: 10px;
                    border-left: 4px solid {style.color_accent};
                    padding-left: 10px;
                ">Skills</h2>
                <p style="margin: 0;">
                    <strong>Leadership:</strong> Expert | 
                    <strong>Project Management:</strong> Advanced | 
                    <strong>Data Analysis:</strong> Intermediate
                </p>
            </div>
        </div>
        """
        
        return html

# Global template manager instance
template_manager = CVTemplateManager()

def get_template_manager() -> CVTemplateManager:
    """Get the global template manager instance"""
    return template_manager

if __name__ == "__main__":
    # Test the template manager
    manager = CVTemplateManager()
    
    # Get available templates
    templates = manager.get_available_templates()
    print(f"Available templates: {len(templates)}")
    
    for template in templates:
        print(f"- {template['display_name']} ({template['category']}) - {template['industry']}")
    
    # Get template preview
    preview = manager.get_template_preview('uae_professional')
    if preview:
        print(f"\nPreview for UAE Professional template:")
        print(f"Sections: {len(preview['sections'])}")
        print(f"Sample data keys: {list(preview['sample_data'].keys())}")
    
    logger.info("CV Template Manager test completed")

