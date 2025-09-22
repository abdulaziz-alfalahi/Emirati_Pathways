#!/usr/bin/env python3
"""
Test Endpoints for Development and Testing
Emirati Journey Platform - No Authentication Required
"""

from flask import Blueprint, request, jsonify
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
test_bp = Blueprint('test', __name__, url_prefix='/api/test')

@test_bp.route('/health', methods=['GET'])
def test_health():
    """Test health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'Test Endpoints',
        'timestamp': datetime.utcnow().isoformat(),
        'message': 'Test endpoints are working'
    })

@test_bp.route('/cv/parse-text', methods=['POST'])
def test_parse_cv_text():
    """Test CV parsing without authentication"""
    try:
        # Import CV parser here to avoid circular imports
        from cv_parser import CVParser
        cv_parser = CVParser()
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No JSON data provided'
            }), 400
        
        # Check for different possible field names
        text = data.get('text') or data.get('cv_text') or data.get('content')
        
        if not text:
            return jsonify({
                'success': False,
                'message': 'No text provided. Expected field: "text", "cv_text", or "content"'
            }), 400
        
        logger.info(f"🔄 Test CV parsing - text length: {len(text)}")
        
        # Parse CV text with test user ID
        result = cv_parser.parse_cv_text(text, user_id='test-user-123')
        
        if result['success']:
            logger.info(f"✅ Test CV parsing successful - CV ID: {result['cv_id']}")
            return jsonify({
                'success': True,
                'cv_id': result['cv_id'],
                'data': result['data'],
                'analysis': result.get('analysis', {}),
                'metadata': result.get('metadata', {}),
                'message': 'CV text parsed successfully (TEST MODE)'
            })
        else:
            logger.error(f"❌ Test CV parsing failed: {result['message']}")
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"❌ Test CV parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'CV parsing failed: {str(e)}'
        }), 500

@test_bp.route('/cv/parse', methods=['POST'])
def test_parse_cv_file():
    """Test CV file parsing without authentication"""
    try:
        # Import CV parser here to avoid circular imports
        from cv_parser import CVParser
        cv_parser = CVParser()
        
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file uploaded'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        logger.info(f"🔄 Test CV file parsing - filename: {file.filename}")
        
        # Parse CV file with test user ID
        result = cv_parser.parse_cv_file(file, user_id='test-user-123')
        
        if result['success']:
            logger.info(f"✅ Test CV file parsing successful - CV ID: {result['cv_id']}")
            return jsonify({
                'success': True,
                'cv_id': result['cv_id'],
                'data': result['data'],
                'analysis': result.get('analysis', {}),
                'metadata': result.get('metadata', {}),
                'message': 'CV file parsed successfully (TEST MODE)'
            })
        else:
            logger.error(f"❌ Test CV file parsing failed: {result['message']}")
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"❌ Test CV file parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'CV file parsing failed: {str(e)}'
        }), 500

@test_bp.route('/gemini/status', methods=['GET'])
def test_gemini_status():
    """Test Gemini API connection"""
    try:
        import os
        import google.generativeai as genai
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({
                'success': False,
                'message': 'GEMINI_API_KEY not found in environment'
            }), 500
        
        # Configure and test Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Simple test prompt
        response = model.generate_content("Say 'Hello from Gemini 2.5 Pro!'")
        
        return jsonify({
            'success': True,
            'message': 'Gemini API is working',
            'api_key_present': bool(api_key),
            'api_key_length': len(api_key) if api_key else 0,
            'test_response': response.text if response else 'No response',
            'model': 'gemini-2.0-flash-exp'
        })
        
    except Exception as e:
        logger.error(f"❌ Gemini test error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Gemini API test failed: {str(e)}'
        }), 500

@test_bp.route('/sample-cv', methods=['GET'])
def get_sample_cv():
    """Get sample CV text for testing"""
    sample_cv = """Ahmed Al Mansouri
Senior Software Engineer
ahmed.almansouri@email.com
+971501234567
Dubai, UAE

PROFESSIONAL SUMMARY
Experienced software engineer with 8+ years in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record in leading development teams and delivering scalable solutions for UAE enterprises.

WORK EXPERIENCE

Senior Software Engineer | Emirates Technology Solutions | 2020 - Present
• Led development of digital transformation initiatives for government sector
• Managed team of 5 developers across multiple projects
• Implemented microservices architecture using AWS and Docker
• Reduced system response time by 40% through optimization
• Technologies: React, Node.js, AWS, Docker, PostgreSQL

Software Engineer | ADNOC Digital | 2018 - 2020
• Developed web applications for oil & gas operations
• Collaborated with international teams on digital transformation projects
• Built RESTful APIs serving 10,000+ daily users
• Technologies: Angular, Python, MongoDB, Azure

Junior Developer | Etisalat Digital | 2016 - 2018
• Developed mobile applications for telecommunications services
• Participated in agile development processes
• Technologies: React Native, Java, MySQL

EDUCATION

Bachelor of Computer Science | American University of Sharjah | 2016
• Graduated Magna Cum Laude (GPA: 3.8/4.0)
• Relevant Coursework: Software Engineering, Database Systems, Web Development

TECHNICAL SKILLS

Programming Languages: JavaScript, Python, Java, TypeScript, C++
Frontend: React, Angular, Vue.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express.js, Django, Flask, Spring Boot
Databases: PostgreSQL, MongoDB, MySQL, Redis
Cloud & DevOps: AWS, Azure, Docker, Kubernetes, Jenkins
Tools: Git, JIRA, Figma, Postman

LANGUAGES
• Arabic (Native)
• English (Fluent)
• Hindi (Conversational)

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2022)
• Google Cloud Professional Developer (2021)
• Scrum Master Certification (2020)

ACHIEVEMENTS
• Led team that won "Best Digital Innovation" award at UAE Tech Summit 2023
• Published research paper on "Microservices in Government Systems" (2022)
• Mentored 15+ junior developers through company mentorship program

PROJECTS

UAE Government Portal Redesign | 2023
• Led frontend development for new citizen services portal
• Improved user satisfaction by 60% based on user feedback
• Technologies: React, TypeScript, AWS

Smart City Dashboard | 2022
• Developed real-time analytics dashboard for Dubai Smart City initiative
• Processed 1M+ data points daily with 99.9% uptime
• Technologies: Vue.js, Python, PostgreSQL, Redis

E-commerce Platform | 2021
• Built scalable e-commerce solution for local UAE businesses
• Handled 50,000+ transactions during peak periods
• Technologies: Angular, Node.js, MongoDB, Stripe API"""

    return jsonify({
        'success': True,
        'sample_cv': sample_cv,
        'message': 'Sample CV text for testing'
    })
