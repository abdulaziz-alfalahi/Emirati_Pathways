#!/usr/bin/env python3
"""
CV Export Module
Handles exporting CVs to various formats (PDF, DOCX, JSON)
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
from pathlib import Path
import tempfile

# Import libraries for document generation
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logging.warning("ReportLab not available. PDF export will be limited.")

try:
    from docx import Document
    from docx.shared import Inches, Pt
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.style import WD_STYLE_TYPE
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logging.warning("python-docx not available. DOCX export will be limited.")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CVExporter:
    """
    CV Export engine supporting multiple formats
    """
    
    def __init__(self):
        """Initialize the CV Exporter"""
        self.exports_dir = Path(__file__).parent.parent / "exports"
        self.exports_dir.mkdir(exist_ok=True)
        
        # UAE-specific styling
        self.uae_colors = {
            'primary': '#C41E3A',    # UAE flag red
            'secondary': '#00732F',  # UAE flag green
            'accent': '#FFD700',     # Gold
            'text': '#2C3E50',       # Dark blue-gray
            'light_gray': '#F8F9FA'
        }
        
        logger.info("CV Exporter initialized")
    
    def export_cv(self, cv_data: Dict[str, Any], format: str) -> Optional[str]:
        """
        Export CV to specified format
        
        Args:
            cv_data: Complete CV data structure
            format: Export format ('pdf', 'docx', 'json')
            
        Returns:
            Path to exported file or None if failed
        """
        try:
            cv_id = cv_data['metadata']['cv_id']
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            if format == 'json':
                return self._export_json(cv_data, cv_id, timestamp)
            elif format == 'pdf':
                return self._export_pdf(cv_data, cv_id, timestamp)
            elif format == 'docx':
                return self._export_docx(cv_data, cv_id, timestamp)
            else:
                raise ValueError(f"Unsupported export format: {format}")
                
        except Exception as e:
            logger.error(f"Error exporting CV to {format}: {str(e)}")
            return None
    
    def _export_json(self, cv_data: Dict[str, Any], cv_id: str, timestamp: str) -> str:
        """Export CV as JSON file"""
        try:
            filename = f"cv_{cv_id}_{timestamp}.json"
            file_path = self.exports_dir / filename
            
            # Clean and format the data
            export_data = {
                'metadata': cv_data['metadata'],
                'data': cv_data['data'],
                'exported_at': datetime.now().isoformat(),
                'export_format': 'json',
                'version': '1.0'
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Exported CV {cv_id} to JSON: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error exporting JSON: {str(e)}")
            raise
    
    def _export_pdf(self, cv_data: Dict[str, Any], cv_id: str, timestamp: str) -> str:
        """Export CV as PDF file"""
        if not REPORTLAB_AVAILABLE:
            return self._export_simple_pdf(cv_data, cv_id, timestamp)
        
        try:
            filename = f"cv_{cv_id}_{timestamp}.pdf"
            file_path = self.exports_dir / filename
            
            # Create PDF document
            doc = SimpleDocTemplate(
                str(file_path),
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            
            # Get styles
            styles = getSampleStyleSheet()
            story = []
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                textColor=colors.HexColor(self.uae_colors['primary']),
                alignment=TA_CENTER
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=12,
                textColor=colors.HexColor(self.uae_colors['secondary']),
                borderWidth=1,
                borderColor=colors.HexColor(self.uae_colors['secondary']),
                borderPadding=5
            )
            
            # Add content
            data = cv_data['data']
            personal_info = data.get('personal_info', {})
            
            # Header with name
            if personal_info.get('full_name'):
                story.append(Paragraph(personal_info['full_name'], title_style))
                story.append(Spacer(1, 12))
            
            # Contact information
            contact_info = []
            if personal_info.get('email'):
                contact_info.append(f"Email: {personal_info['email']}")
            if personal_info.get('phone'):
                contact_info.append(f"Phone: {personal_info['phone']}")
            if personal_info.get('emirate') and personal_info.get('city'):
                contact_info.append(f"Location: {personal_info['city']}, {personal_info['emirate']}")
            
            if contact_info:
                contact_text = " | ".join(contact_info)
                story.append(Paragraph(contact_text, styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Professional Summary
            if data.get('professional_summary'):
                story.append(Paragraph("Professional Summary", heading_style))
                story.append(Paragraph(data['professional_summary'], styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Experience
            if data.get('experience'):
                story.append(Paragraph("Work Experience", heading_style))
                for exp in data['experience']:
                    # Job title and company
                    job_title = f"<b>{exp.get('job_title', '')}</b> at {exp.get('company', '')}"
                    story.append(Paragraph(job_title, styles['Normal']))
                    
                    # Dates and location
                    date_info = []
                    if exp.get('start_date'):
                        end_date = exp.get('end_date', 'Present' if exp.get('is_current') else '')
                        date_info.append(f"{exp['start_date']} - {end_date}")
                    if exp.get('location'):
                        date_info.append(exp['location'])
                    
                    if date_info:
                        story.append(Paragraph(" | ".join(date_info), styles['Normal']))
                    
                    # Description and achievements
                    if exp.get('description'):
                        for desc in exp['description']:
                            story.append(Paragraph(f"• {desc}", styles['Normal']))
                    
                    if exp.get('achievements'):
                        for achievement in exp['achievements']:
                            story.append(Paragraph(f"• {achievement}", styles['Normal']))
                    
                    story.append(Spacer(1, 12))
            
            # Education
            if data.get('education'):
                story.append(Paragraph("Education", heading_style))
                for edu in data['education']:
                    edu_text = f"<b>{edu.get('degree', '')}</b> - {edu.get('institution', '')}"
                    story.append(Paragraph(edu_text, styles['Normal']))
                    
                    if edu.get('graduation_year'):
                        story.append(Paragraph(f"Graduated: {edu['graduation_year']}", styles['Normal']))
                    
                    if edu.get('gpa'):
                        story.append(Paragraph(f"GPA: {edu['gpa']}", styles['Normal']))
                    
                    story.append(Spacer(1, 12))
            
            # Skills
            if data.get('skills'):
                story.append(Paragraph("Skills", heading_style))
                skills_by_category = {}
                
                for skill in data['skills']:
                    category = skill.get('category', 'Other')
                    if category not in skills_by_category:
                        skills_by_category[category] = []
                    skills_by_category[category].append(skill['name'])
                
                for category, skills in skills_by_category.items():
                    story.append(Paragraph(f"<b>{category}:</b> {', '.join(skills)}", styles['Normal']))
                
                story.append(Spacer(1, 20))
            
            # Languages
            if data.get('languages'):
                story.append(Paragraph("Languages", heading_style))
                for lang in data['languages']:
                    lang_text = f"{lang.get('language', '')} - {lang.get('proficiency', '')}"
                    story.append(Paragraph(lang_text, styles['Normal']))
                story.append(Spacer(1, 20))
            
            # Build PDF
            doc.build(story)
            
            logger.info(f"Exported CV {cv_id} to PDF: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error exporting PDF: {str(e)}")
            raise
    
    def _export_simple_pdf(self, cv_data: Dict[str, Any], cv_id: str, timestamp: str) -> str:
        """Export CV as simple text-based PDF when ReportLab is not available"""
        try:
            filename = f"cv_{cv_id}_{timestamp}.txt"
            file_path = self.exports_dir / filename
            
            data = cv_data['data']
            personal_info = data.get('personal_info', {})
            
            content = []
            content.append("=" * 60)
            content.append("CURRICULUM VITAE")
            content.append("=" * 60)
            content.append("")
            
            # Personal Information
            if personal_info.get('full_name'):
                content.append(f"Name: {personal_info['full_name']}")
            if personal_info.get('email'):
                content.append(f"Email: {personal_info['email']}")
            if personal_info.get('phone'):
                content.append(f"Phone: {personal_info['phone']}")
            if personal_info.get('emirate'):
                content.append(f"Location: {personal_info.get('city', '')}, {personal_info['emirate']}")
            content.append("")
            
            # Professional Summary
            if data.get('professional_summary'):
                content.append("PROFESSIONAL SUMMARY")
                content.append("-" * 20)
                content.append(data['professional_summary'])
                content.append("")
            
            # Experience
            if data.get('experience'):
                content.append("WORK EXPERIENCE")
                content.append("-" * 15)
                for exp in data['experience']:
                    content.append(f"{exp.get('job_title', '')} at {exp.get('company', '')}")
                    if exp.get('start_date'):
                        end_date = exp.get('end_date', 'Present' if exp.get('is_current') else '')
                        content.append(f"{exp['start_date']} - {end_date}")
                    if exp.get('location'):
                        content.append(f"Location: {exp['location']}")
                    
                    if exp.get('description'):
                        for desc in exp['description']:
                            content.append(f"• {desc}")
                    content.append("")
            
            # Write to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(content))
            
            logger.info(f"Exported CV {cv_id} to text file: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error exporting simple PDF: {str(e)}")
            raise
    
    def _export_docx(self, cv_data: Dict[str, Any], cv_id: str, timestamp: str) -> str:
        """Export CV as Word document"""
        if not DOCX_AVAILABLE:
            return self._export_simple_pdf(cv_data, cv_id, timestamp)
        
        try:
            filename = f"cv_{cv_id}_{timestamp}.docx"
            file_path = self.exports_dir / filename
            
            # Create document
            doc = Document()
            
            # Set document margins
            sections = doc.sections
            for section in sections:
                section.top_margin = Inches(1)
                section.bottom_margin = Inches(1)
                section.left_margin = Inches(1)
                section.right_margin = Inches(1)
            
            data = cv_data['data']
            personal_info = data.get('personal_info', {})
            
            # Header with name
            if personal_info.get('full_name'):
                title = doc.add_heading(personal_info['full_name'], 0)
                title.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
            # Contact information
            contact_info = []
            if personal_info.get('email'):
                contact_info.append(f"Email: {personal_info['email']}")
            if personal_info.get('phone'):
                contact_info.append(f"Phone: {personal_info['phone']}")
            if personal_info.get('emirate') and personal_info.get('city'):
                contact_info.append(f"Location: {personal_info['city']}, {personal_info['emirate']}")
            
            if contact_info:
                contact_para = doc.add_paragraph(" | ".join(contact_info))
                contact_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
            # Professional Summary
            if data.get('professional_summary'):
                doc.add_heading('Professional Summary', level=1)
                doc.add_paragraph(data['professional_summary'])
            
            # Experience
            if data.get('experience'):
                doc.add_heading('Work Experience', level=1)
                for exp in data['experience']:
                    # Job title and company
                    job_para = doc.add_paragraph()
                    job_run = job_para.add_run(f"{exp.get('job_title', '')} at {exp.get('company', '')}")
                    job_run.bold = True
                    
                    # Dates and location
                    date_info = []
                    if exp.get('start_date'):
                        end_date = exp.get('end_date', 'Present' if exp.get('is_current') else '')
                        date_info.append(f"{exp['start_date']} - {end_date}")
                    if exp.get('location'):
                        date_info.append(exp['location'])
                    
                    if date_info:
                        doc.add_paragraph(" | ".join(date_info))
                    
                    # Description and achievements
                    if exp.get('description'):
                        for desc in exp['description']:
                            doc.add_paragraph(desc, style='List Bullet')
                    
                    if exp.get('achievements'):
                        for achievement in exp['achievements']:
                            doc.add_paragraph(achievement, style='List Bullet')
            
            # Education
            if data.get('education'):
                doc.add_heading('Education', level=1)
                for edu in data['education']:
                    edu_para = doc.add_paragraph()
                    edu_run = edu_para.add_run(f"{edu.get('degree', '')} - {edu.get('institution', '')}")
                    edu_run.bold = True
                    
                    if edu.get('graduation_year'):
                        doc.add_paragraph(f"Graduated: {edu['graduation_year']}")
                    
                    if edu.get('gpa'):
                        doc.add_paragraph(f"GPA: {edu['gpa']}")
            
            # Skills
            if data.get('skills'):
                doc.add_heading('Skills', level=1)
                skills_by_category = {}
                
                for skill in data['skills']:
                    category = skill.get('category', 'Other')
                    if category not in skills_by_category:
                        skills_by_category[category] = []
                    skills_by_category[category].append(skill['name'])
                
                for category, skills in skills_by_category.items():
                    skill_para = doc.add_paragraph()
                    skill_para.add_run(f"{category}: ").bold = True
                    skill_para.add_run(", ".join(skills))
            
            # Languages
            if data.get('languages'):
                doc.add_heading('Languages', level=1)
                for lang in data['languages']:
                    doc.add_paragraph(f"{lang.get('language', '')} - {lang.get('proficiency', '')}")
            
            # Save document
            doc.save(str(file_path))
            
            logger.info(f"Exported CV {cv_id} to DOCX: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error exporting DOCX: {str(e)}")
            raise
    
    def get_export_formats(self) -> List[Dict[str, Any]]:
        """Get available export formats"""
        formats = [
            {
                'format': 'json',
                'name': 'JSON Data',
                'description': 'Machine-readable JSON format',
                'available': True,
                'file_extension': '.json'
            }
        ]
        
        if REPORTLAB_AVAILABLE:
            formats.append({
                'format': 'pdf',
                'name': 'PDF Document',
                'description': 'Professional PDF format',
                'available': True,
                'file_extension': '.pdf'
            })
        else:
            formats.append({
                'format': 'pdf',
                'name': 'PDF Document',
                'description': 'Text-based PDF (limited formatting)',
                'available': True,
                'file_extension': '.txt'
            })
        
        if DOCX_AVAILABLE:
            formats.append({
                'format': 'docx',
                'name': 'Word Document',
                'description': 'Microsoft Word format',
                'available': True,
                'file_extension': '.docx'
            })
        else:
            formats.append({
                'format': 'docx',
                'name': 'Word Document',
                'description': 'Not available (python-docx not installed)',
                'available': False,
                'file_extension': '.docx'
            })
        
        return formats
    
    def cleanup_old_exports(self, days_old: int = 7) -> int:
        """Clean up old export files"""
        try:
            count = 0
            cutoff_time = datetime.now().timestamp() - (days_old * 24 * 60 * 60)
            
            for file_path in self.exports_dir.iterdir():
                if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                    file_path.unlink()
                    count += 1
            
            logger.info(f"Cleaned up {count} old export files")
            return count
            
        except Exception as e:
            logger.error(f"Error cleaning up exports: {str(e)}")
            return 0

# Global CV Exporter instance
cv_exporter = CVExporter()

def get_cv_exporter() -> CVExporter:
    """Get the global CV Exporter instance"""
    return cv_exporter

if __name__ == "__main__":
    # Test the CV Exporter
    exporter = CVExporter()
    
    # Test data
    test_cv_data = {
        'metadata': {
            'cv_id': 'test_cv_123',
            'user_id': 'test_user',
            'template': 'professional',
            'language': 'english',
            'created_at': datetime.now().isoformat()
        },
        'data': {
            'personal_info': {
                'full_name': 'Ahmed Al Mansouri',
                'email': 'ahmed@example.com',
                'phone': '+971501234567',
                'emirate': 'Dubai',
                'city': 'Dubai'
            },
            'professional_summary': 'Experienced software engineer with 5 years in the UAE market.',
            'experience': [
                {
                    'job_title': 'Senior Software Engineer',
                    'company': 'Emirates NBD',
                    'start_date': '2022-01',
                    'end_date': '',
                    'is_current': True,
                    'location': 'Dubai, UAE',
                    'description': ['Developed banking applications'],
                    'achievements': ['Improved performance by 40%']
                }
            ],
            'education': [
                {
                    'degree': 'Bachelor of Computer Science',
                    'institution': 'American University of Sharjah',
                    'graduation_year': '2019'
                }
            ],
            'skills': [
                {'name': 'Python', 'category': 'Technical'},
                {'name': 'React', 'category': 'Technical'},
                {'name': 'Leadership', 'category': 'Soft Skills'}
            ],
            'languages': [
                {'language': 'Arabic', 'proficiency': 'Native'},
                {'language': 'English', 'proficiency': 'Fluent'}
            ]
        }
    }
    
    # Test exports
    formats = exporter.get_export_formats()
    print(f"Available formats: {[f['format'] for f in formats]}")
    
    for format_info in formats:
        if format_info['available']:
            try:
                file_path = exporter.export_cv(test_cv_data, format_info['format'])
                print(f"Exported {format_info['format']}: {file_path}")
            except Exception as e:
                print(f"Failed to export {format_info['format']}: {e}")
    
    logger.info("CV Exporter test completed")

