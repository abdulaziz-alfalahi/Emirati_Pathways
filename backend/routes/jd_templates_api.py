"""
JD Templates API Routes

This module provides API endpoints for job description templates.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
jd_templates_bp = Blueprint('jd_templates_api', __name__, url_prefix='/api/jd')


@jd_templates_bp.route('/templates', methods=['GET'])
def get_jd_templates():
    """Get available JD templates"""
    try:
        templates = [
            {
                'id': 1,
                'name': 'Software Engineer',
                'category': 'Technology',
                'description': 'Standard template for software engineering roles',
                'sections': ['Overview', 'Responsibilities', 'Requirements', 'Benefits'],
                'popularity': 95
            },
            {
                'id': 2,
                'name': 'Product Manager',
                'category': 'Product',
                'description': 'Template for product management positions',
                'sections': ['Overview', 'Responsibilities', 'Requirements', 'Benefits'],
                'popularity': 88
            },
            {
                'id': 3,
                'name': 'Data Analyst',
                'category': 'Data',
                'description': 'Template for data analysis roles',
                'sections': ['Overview', 'Responsibilities', 'Requirements', 'Benefits'],
                'popularity': 82
            },
            {
                'id': 4,
                'name': 'Marketing Manager',
                'category': 'Marketing',
                'description': 'Template for marketing management roles',
                'sections': ['Overview', 'Responsibilities', 'Requirements', 'Benefits'],
                'popularity': 76
            },
            {
                'id': 5,
                'name': 'HR Specialist',
                'category': 'Human Resources',
                'description': 'Template for HR specialist positions',
                'sections': ['Overview', 'Responsibilities', 'Requirements', 'Benefits'],
                'popularity': 70
            },
            {
                'id': 6,
                'name': 'Financial Analyst',
                'category': 'Finance',
                'description': 'Template for financial analysis roles',
                'sections': ['Overview', 'Responsibilities', 'Requirements', 'Benefits'],
                'popularity': 74
            }
        ]
        
        return jsonify({
            'success': True,
            'data': templates
        })
    except Exception as e:
        logger.error(f"Failed to get JD templates: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@jd_templates_bp.route('/templates/<int:template_id>', methods=['GET'])
def get_jd_template(template_id):
    """Get a specific JD template with full content"""
    try:
        templates = {
            1: {
                'id': 1,
                'name': 'Software Engineer',
                'category': 'Technology',
                'content': {
                    'overview': 'We are looking for a talented Software Engineer to join our team...',
                    'responsibilities': [
                        'Design, develop, and maintain software applications',
                        'Write clean, efficient, and well-documented code',
                        'Collaborate with cross-functional teams',
                        'Participate in code reviews and technical discussions',
                        'Troubleshoot and debug applications'
                    ],
                    'requirements': [
                        "Bachelor's degree in Computer Science or related field",
                        '3+ years of software development experience',
                        'Proficiency in Python, JavaScript, or similar languages',
                        'Experience with modern frameworks and tools',
                        'Strong problem-solving skills'
                    ],
                    'benefits': [
                        'Competitive salary and benefits package',
                        'Flexible working arrangements',
                        'Professional development opportunities',
                        'Health insurance',
                        'Annual leave and public holidays'
                    ]
                }
            },
            2: {
                'id': 2,
                'name': 'Product Manager',
                'category': 'Product',
                'content': {
                    'overview': 'We are seeking an experienced Product Manager to lead product strategy...',
                    'responsibilities': [
                        'Define product vision and roadmap',
                        'Gather and prioritize product requirements',
                        'Work closely with engineering and design teams',
                        'Analyze market trends and competition',
                        'Drive product launches and go-to-market strategies'
                    ],
                    'requirements': [
                        "Bachelor's degree in Business, Engineering, or related field",
                        '5+ years of product management experience',
                        'Strong analytical and communication skills',
                        'Experience with agile methodologies',
                        'Track record of successful product launches'
                    ],
                    'benefits': [
                        'Competitive compensation package',
                        'Stock options',
                        'Remote work flexibility',
                        'Health and wellness benefits',
                        'Learning and development budget'
                    ]
                }
            }
        }
        
        template = templates.get(template_id)
        
        if not template:
            return jsonify({
                'success': False,
                'message': 'Template not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': template
        })
    except Exception as e:
        logger.error(f"Failed to get JD template: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
