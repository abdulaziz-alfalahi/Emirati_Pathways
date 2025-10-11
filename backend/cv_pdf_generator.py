"""
Enhanced CV PDF Generator with HTML Templates
Supports multiple professional templates with proper styling
"""

import os
import logging
from datetime import datetime
from pathlib import Path
import weasyprint
from jinja2 import Template

logger = logging.getLogger(__name__)

def get_html_template(template_style: str) -> str:
    """Get HTML template for the specified style"""
    
    if template_style == 'government-executive':
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 40px; color: #374151; }
                .header { text-align: center; border-bottom: 4px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
                .name { font-size: 28px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
                .contact { color: #6b7280; font-size: 14px; }
                .section-title { font-size: 18px; font-weight: bold; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; margin: 25px 0 15px 0; }
                .job-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
                .company { font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 3px; }
                .date-location { font-size: 12px; color: #059669; margin-bottom: 8px; }
                .responsibilities { font-size: 11px; line-height: 1.4; margin-bottom: 15px; }
                .skills { display: flex; flex-wrap: wrap; gap: 8px; }
                .skill-tag { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 11px; }
                .soft-skill-tag { background: #dcfce7; color: #059669; padding: 4px 12px; border-radius: 20px; font-size: 11px; }
                .degree { font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 3px; }
                .institution { font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 3px; }
                .education-details { font-size: 11px; color: #059669; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">{{ name }}</div>
                <div class="contact">{{ contact_info }}</div>
            </div>
            
            {% if professional_summary %}
            <div class="section-title">PROFESSIONAL SUMMARY</div>
            <p>{{ professional_summary }}</p>
            {% endif %}
            
            {% if technical_skills %}
            <div class="section-title">TECHNICAL SKILLS</div>
            <div class="skills">
                {% for skill in technical_skills %}
                <span class="skill-tag">{{ skill }}</span>
                {% endfor %}
            </div>
            {% endif %}
            
            {% if soft_skills %}
            <div class="section-title">SOFT SKILLS</div>
            <div class="skills">
                {% for skill in soft_skills %}
                <span class="soft-skill-tag">{{ skill }}</span>
                {% endfor %}
            </div>
            {% endif %}
            
            {% if experience %}
            <div class="section-title">WORK EXPERIENCE</div>
            {% for exp in experience %}
            <div style="margin-bottom: 20px;">
                <div class="job-title">{{ exp.jobTitle }}</div>
                <div class="company">{{ exp.company }}</div>
                <div class="date-location">{{ exp.startDate }} - {{ exp.endDate }} • {{ exp.location }}</div>
                <div class="responsibilities">{{ exp.responsibilities }}</div>
            </div>
            {% endfor %}
            {% endif %}
            
            {% if education %}
            <div class="section-title">EDUCATION</div>
            {% for edu in education %}
            <div style="margin-bottom: 15px;">
                <div class="degree">{{ edu.degree }}</div>
                <div class="institution">{{ edu.institution }}</div>
                <div class="education-details">{{ edu.field }} • Graduated: {{ edu.graduationYear }}</div>
            </div>
            {% endfor %}
            {% endif %}
        </body>
        </html>
        """
    
    elif template_style == 'tech-innovator':
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; color: #1f2937; }
                .header { background: linear-gradient(135deg, #7c3aed 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; }
                .name { font-size: 26px; font-weight: bold; margin-bottom: 10px; }
                .contact { font-size: 14px; opacity: 0.9; }
                .content { padding: 30px; }
                .section-title { font-size: 16px; font-weight: bold; color: #7c3aed; margin: 25px 0 15px 0; display: flex; align-items: center; }
                .section-title::before { content: '▶'; margin-right: 8px; color: #0891b2; }
                .job-title { font-size: 15px; font-weight: bold; color: #7c3aed; margin-bottom: 5px; }
                .company { font-size: 13px; font-weight: bold; color: #0891b2; margin-bottom: 3px; }
                .date-location { font-size: 11px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 12px; display: inline-block; margin-bottom: 8px; }
                .responsibilities { font-size: 11px; line-height: 1.5; margin-bottom: 15px; }
                .skills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .skill-tag { background: #ede9fe; color: #7c3aed; padding: 6px 12px; border-radius: 8px; font-size: 10px; text-align: center; }
                .degree { font-size: 14px; font-weight: bold; color: #7c3aed; margin-bottom: 3px; }
                .institution { font-size: 12px; color: #0891b2; margin-bottom: 3px; }
                .education-details { font-size: 11px; color: #6b7280; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">{{ name }}</div>
                <div class="contact">{{ contact_info }}</div>
            </div>
            
            <div class="content">
                {% if professional_summary %}
                <div class="section-title">PROFESSIONAL SUMMARY</div>
                <p>{{ professional_summary }}</p>
                {% endif %}
                
                {% if technical_skills %}
                <div class="section-title">TECHNICAL EXPERTISE</div>
                <div class="skills">
                    {% for skill in technical_skills %}
                    <span class="skill-tag">{{ skill }}</span>
                    {% endfor %}
                </div>
                {% endif %}
                
                {% if experience %}
                <div class="section-title">EXPERIENCE</div>
                {% for exp in experience %}
                <div style="margin-bottom: 20px; border-left: 4px solid #7c3aed; padding-left: 15px;">
                    <div class="job-title">{{ exp.jobTitle }}</div>
                    <div class="company">{{ exp.company }}</div>
                    <div class="date-location">{{ exp.startDate }} - {{ exp.endDate }} • {{ exp.location }}</div>
                    <div class="responsibilities">{{ exp.responsibilities }}</div>
                </div>
                {% endfor %}
                {% endif %}
                
                {% if education %}
                <div class="section-title">EDUCATION</div>
                {% for edu in education %}
                <div style="margin-bottom: 15px; border-left: 4px solid #0891b2; padding-left: 15px;">
                    <div class="degree">{{ edu.degree }}</div>
                    <div class="institution">{{ edu.institution }}</div>
                    <div class="education-details">{{ edu.field }} • {{ edu.graduationYear }}</div>
                </div>
                {% endfor %}
                {% endif %}
            </div>
        </body>
        </html>
        """
    
    elif template_style == 'business-leader':
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 40px; color: #374151; }
                .header { border-bottom: 6px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
                .name { font-size: 26px; font-weight: bold; color: #059669; margin-bottom: 10px; }
                .contact { color: #6b7280; font-size: 14px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                .section-title { font-size: 16px; font-weight: bold; color: white; background: #059669; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 4px; }
                .job-title { font-size: 15px; font-weight: bold; color: #059669; margin-bottom: 5px; }
                .company { font-size: 13px; font-weight: bold; color: #dc2626; margin-bottom: 3px; }
                .date-location { font-size: 11px; color: #6b7280; margin-bottom: 8px; }
                .responsibilities { font-size: 11px; line-height: 1.4; margin-bottom: 15px; }
                .skills { display: flex; flex-wrap: wrap; gap: 6px; }
                .skill-item { background: #f0fdf4; border: 1px solid #059669; color: #059669; padding: 4px 10px; border-radius: 4px; font-size: 10px; }
                .degree { font-size: 14px; font-weight: bold; color: #059669; margin-bottom: 3px; }
                .institution { font-size: 12px; font-weight: bold; color: #dc2626; margin-bottom: 3px; }
                .education-details { font-size: 11px; color: #6b7280; margin-bottom: 10px; }
                .competency-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
                .competency-item { display: flex; align-items: center; font-size: 11px; margin-bottom: 4px; }
                .competency-item::before { content: '●'; color: #059669; margin-right: 8px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">{{ name }}</div>
                <div class="contact">
                    <div>📧 {{ email }}</div>
                    <div>📱 {{ phone }}</div>
                    <div style="grid-column: span 2;">📍 {{ location }}</div>
                </div>
            </div>
            
            {% if professional_summary %}
            <div class="section-title">EXECUTIVE SUMMARY</div>
            <p>{{ professional_summary }}</p>
            {% endif %}
            
            {% if technical_skills or soft_skills %}
            <div class="section-title">CORE COMPETENCIES</div>
            <div class="competency-grid">
                {% for skill in (technical_skills + soft_skills)[:8] %}
                <div class="competency-item">{{ skill }}</div>
                {% endfor %}
            </div>
            {% endif %}
            
            {% if experience %}
            <div class="section-title">PROFESSIONAL EXPERIENCE</div>
            {% for exp in experience %}
            <div style="margin-bottom: 20px; border-left: 3px solid #059669; padding-left: 15px;">
                <div class="job-title">{{ exp.jobTitle }}</div>
                <div class="company">{{ exp.company }}</div>
                <div class="date-location">{{ exp.startDate }} - {{ exp.endDate }} • {{ exp.location }}</div>
                <div class="responsibilities">{{ exp.responsibilities }}</div>
            </div>
            {% endfor %}
            {% endif %}
            
            {% if education %}
            <div class="section-title">EDUCATION & QUALIFICATIONS</div>
            {% for edu in education %}
            <div style="margin-bottom: 15px; border-left: 3px solid #dc2626; padding-left: 15px;">
                <div class="degree">{{ edu.degree }}</div>
                <div class="institution">{{ edu.institution }}</div>
                <div class="education-details">{{ edu.field }} • {{ edu.graduationYear }}</div>
            </div>
            {% endfor %}
            {% endif %}
        </body>
        </html>
        """
    
    elif template_style == 'tech-innovator':
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; color: #1f2937; }
                .header { background: linear-gradient(135deg, #7c3aed 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; }
                .name { font-size: 26px; font-weight: bold; margin-bottom: 10px; }
                .contact { font-size: 14px; opacity: 0.9; }
                .content { padding: 30px; }
                .section-title { font-size: 16px; font-weight: bold; color: #7c3aed; margin: 25px 0 15px 0; }
                .section-title::before { content: '▶'; margin-right: 8px; color: #0891b2; }
                .job-title { font-size: 15px; font-weight: bold; color: #7c3aed; margin-bottom: 5px; }
                .company { font-size: 13px; font-weight: bold; color: #0891b2; margin-bottom: 3px; }
                .date-location { font-size: 11px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 12px; display: inline-block; margin-bottom: 8px; }
                .responsibilities { font-size: 11px; line-height: 1.5; margin-bottom: 15px; }
                .skills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .skill-tag { background: #ede9fe; color: #7c3aed; padding: 6px 12px; border-radius: 8px; font-size: 10px; text-align: center; }
                .degree { font-size: 14px; font-weight: bold; color: #7c3aed; margin-bottom: 3px; }
                .institution { font-size: 12px; color: #0891b2; margin-bottom: 3px; }
                .education-details { font-size: 11px; color: #6b7280; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">{{ name }}</div>
                <div class="contact">{{ contact_info }}</div>
            </div>
            
            <div class="content">
                {% if professional_summary %}
                <div class="section-title">PROFESSIONAL SUMMARY</div>
                <p>{{ professional_summary }}</p>
                {% endif %}
                
                {% if technical_skills %}
                <div class="section-title">TECHNICAL EXPERTISE</div>
                <div class="skills">
                    {% for skill in technical_skills %}
                    <span class="skill-tag">{{ skill }}</span>
                    {% endfor %}
                </div>
                {% endif %}
                
                {% if experience %}
                <div class="section-title">EXPERIENCE</div>
                {% for exp in experience %}
                <div style="margin-bottom: 20px; border-left: 4px solid #7c3aed; padding-left: 15px;">
                    <div class="job-title">{{ exp.jobTitle }}</div>
                    <div class="company">{{ exp.company }}</div>
                    <div class="date-location">{{ exp.startDate }} - {{ exp.endDate }} • {{ exp.location }}</div>
                    <div class="responsibilities">{{ exp.responsibilities }}</div>
                </div>
                {% endfor %}
                {% endif %}
                
                {% if education %}
                <div class="section-title">EDUCATION</div>
                {% for edu in education %}
                <div style="margin-bottom: 15px; border-left: 4px solid #0891b2; padding-left: 15px;">
                    <div class="degree">{{ edu.degree }}</div>
                    <div class="institution">{{ edu.institution }}</div>
                    <div class="education-details">{{ edu.field }} • {{ edu.graduationYear }}</div>
                </div>
                {% endfor %}
                {% endif %}
            </div>
        </body>
        </html>
        """
    
    elif template_style == 'business-leader':
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Arial', sans-serif; margin: 0; padding: 40px; color: #374151; }
                .header { border-bottom: 6px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
                .name { font-size: 26px; font-weight: bold; color: #059669; margin-bottom: 10px; }
                .contact { color: #6b7280; font-size: 14px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
                .section-title { font-size: 16px; font-weight: bold; color: white; background: #059669; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 4px; }
                .job-title { font-size: 15px; font-weight: bold; color: #059669; margin-bottom: 5px; }
                .company { font-size: 13px; font-weight: bold; color: #dc2626; margin-bottom: 3px; }
                .date-location { font-size: 11px; color: #6b7280; margin-bottom: 8px; }
                .responsibilities { font-size: 11px; line-height: 1.4; margin-bottom: 15px; }
                .competency-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
                .competency-item { display: flex; align-items: center; font-size: 11px; margin-bottom: 4px; }
                .competency-item::before { content: '●'; color: #059669; margin-right: 8px; }
                .degree { font-size: 14px; font-weight: bold; color: #059669; margin-bottom: 3px; }
                .institution { font-size: 12px; font-weight: bold; color: #dc2626; margin-bottom: 3px; }
                .education-details { font-size: 11px; color: #6b7280; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">{{ name }}</div>
                <div class="contact">
                    <div>📧 {{ email }}</div>
                    <div>📱 {{ phone }}</div>
                    <div style="grid-column: span 2;">📍 {{ location }}</div>
                </div>
            </div>
            
            {% if professional_summary %}
            <div class="section-title">EXECUTIVE SUMMARY</div>
            <p>{{ professional_summary }}</p>
            {% endif %}
            
            {% if technical_skills or soft_skills %}
            <div class="section-title">CORE COMPETENCIES</div>
            <div class="competency-grid">
                {% for skill in (technical_skills + soft_skills)[:12] %}
                <div class="competency-item">{{ skill }}</div>
                {% endfor %}
            </div>
            {% endif %}
            
            {% if experience %}
            <div class="section-title">PROFESSIONAL EXPERIENCE</div>
            {% for exp in experience %}
            <div style="margin-bottom: 20px; border-left: 3px solid #059669; padding-left: 15px;">
                <div class="job-title">{{ exp.jobTitle }}</div>
                <div class="company">{{ exp.company }}</div>
                <div class="date-location">{{ exp.startDate }} - {{ exp.endDate }} • {{ exp.location }}</div>
                <div class="responsibilities">{{ exp.responsibilities }}</div>
            </div>
            {% endfor %}
            {% endif %}
            
            {% if education %}
            <div class="section-title">EDUCATION & QUALIFICATIONS</div>
            {% for edu in education %}
            <div style="margin-bottom: 15px; border-left: 3px solid #dc2626; padding-left: 15px;">
                <div class="degree">{{ edu.degree }}</div>
                <div class="institution">{{ edu.institution }}</div>
                <div class="education-details">{{ edu.field }} • {{ edu.graduationYear }}</div>
            </div>
            {% endfor %}
            {% endif %}
        </body>
        </html>
        """

def generate_cv_pdf_html(cv_data: dict, template_style: str = 'professional') -> str:
    """Generate PDF from CV data using HTML templates and WeasyPrint"""
    try:
        # Create PDF file path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"cv_{template_style}_{timestamp}.pdf"
        pdf_path = Path('uploads/cv_uploads') / pdf_filename
        
        logger.info(f"🎨 Generating PDF with template: {template_style}")
        
        # Get HTML template
        html_template = get_html_template(template_style)
        template = Template(html_template)
        
        # Prepare template data
        personal_info = cv_data.get('personalInfo', {})
        name = f"{personal_info.get('firstName', '')} {personal_info.get('lastName', '')}"
        
        # Format contact info
        contact_parts = []
        if personal_info.get('email'):
            contact_parts.append(f"📧 {personal_info['email']}")
        if personal_info.get('phone'):
            contact_parts.append(f"📱 {personal_info['phone']}")
        if personal_info.get('location'):
            contact_parts.append(f"📍 {personal_info['location']}")
        
        template_data = {
            'name': name,
            'contact_info': ' • '.join(contact_parts),
            'email': personal_info.get('email', ''),
            'phone': personal_info.get('phone', ''),
            'location': personal_info.get('location', ''),
            'professional_summary': cv_data.get('professionalSummary', ''),
            'technical_skills': cv_data.get('technicalSkills', []),
            'soft_skills': cv_data.get('softSkills', []),
            'experience': cv_data.get('experience', []),
            'education': cv_data.get('education', [])
        }
        
        # Render HTML
        html_content = template.render(**template_data)
        
        # Generate PDF from HTML using WeasyPrint
        weasyprint.HTML(string=html_content).write_pdf(str(pdf_path))
        
        logger.info(f"✅ Professional PDF generated successfully with {template_style} template: {pdf_path}")
        return pdf_filename
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        import traceback
        logger.error(f"PDF generation traceback: {traceback.format_exc()}")
        return None