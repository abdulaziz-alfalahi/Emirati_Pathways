#!/usr/bin/env python3
"""
Unified Emirati Journey Platform Backend Server
Consolidates all services: Auth, CV Upload, School Programs, Admin APIs
Port: 5003 (standardized)
"""

from flask import Flask, request, jsonify, g, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import json
import time
import logging
import os
import sys
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
from pathlib import Path
from werkzeug.utils import secure_filename
import hashlib
import secrets
from functools import wraps
from typing import Dict, List, Optional, Any
import uuid as uuidlib
import google.generativeai as genai
import PyPDF2
from docx import Document
import io
import traceback
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from flask import send_file
import weasyprint
from jinja2 import Template

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize JWT Manager
jwt = JWTManager(app)

# CORS Configuration (allow localhost, env-defined, and ngrok domains)
allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '').strip()
allowed_origin_list = [o for o in (x.strip() for x in allowed_origins_env.split(',')) if o]

cors_origins = [
    # Local development
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:3000",
    # Common dev wildcard domains (Flask-CORS supports regex strings)
    r"https?://.*\.ngrok\.io",
    r"https?://.*\.ngrok\.app",
    r"https?://.*\.ngrok-free\.app",
]

# Include any user-provided origins via ALLOWED_ORIGINS
cors_origins.extend(allowed_origin_list)

CORS(app, resources={
    r"/api/*": {
        "origins": cors_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
        "supports_credentials": True,
        "expose_headers": ["Authorization"]
    },
    r"/health": {
        "origins": ["*"],
        "methods": ["GET", "OPTIONS"]
    }
})

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

# CV Upload Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
UPLOAD_FOLDER = Path('uploads/cv_uploads')
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

# Admin provider templates (from admin_api_server.py)
PROVIDER_TEMPLATES = {
    'google-gemini': {
        'id': 'google-gemini',
        'name': 'Google Gemini 2.5',
        'category': 'LLM',
        'description': 'Advanced multimodal AI with superior reasoning capabilities',
        'endpoint': 'https://generativelanguage.googleapis.com/v1beta',
        'models': ['gemini-2.0-flash-exp', 'gemini-1.5-pro'],
        'default_model': 'gemini-2.0-flash-exp',
        'config_schema': {
            'api_key': {'type': 'string', 'required': True, 'sensitive': True},
            'endpoint': {'type': 'string', 'required': True},
            'model': {'type': 'string', 'required': True},
            'temperature': {'type': 'float', 'default': 0.7, 'min': 0.0, 'max': 2.0},
            'max_output_tokens': {'type': 'integer', 'default': 8192, 'min': 1, 'max': 32768}
        }
    }
}

# Mock admin data storage
admin_providers = {}
admin_configurations = {}
admin_audit_logs = []
admin_health_metrics = {}

# Admin roles
ADMIN_ROLES = ['platform_administrator', 'super_user']

# =====================================================
# DATABASE UTILITIES
# =====================================================

def get_db():
    """Get database connection"""
    if 'db' not in g:
        try:
            g.db = psycopg2.connect(**DATABASE_CONFIG)
        except psycopg2.Error as e:
            logger.error(f"Database connection error: {e}")
            return None
    return g.db

def close_db(e=None):
    """Close database connection"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db_teardown(error):
    close_db()

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """Execute database query with error handling"""
    try:
        db = get_db()
        if not db:
            return None
            
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query, params)
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = None
            
        db.commit()
        cursor.close()
        return result
    except psycopg2.Error as e:
        logger.error(f"Database query error: {e}")
        if db:
            db.rollback()
        return None

# =====================================================
# UTILITY FUNCTIONS
# =====================================================

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def require_admin_auth(f):
    """Decorator to require admin authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Mock authentication - in production, integrate with your auth system
        auth_header = request.headers.get('Authorization')
        user_email = request.headers.get('X-User-Email', 'admin@emiratijourney.ae')
        user_roles = request.headers.get('X-User-Roles', 'platform_administrator').split(',')
        
        # Check if user has admin role
        if not any(role.strip() in ADMIN_ROLES for role in user_roles):
            return jsonify({
                'success': False,
                'error': 'Insufficient privileges. Admin access required.'
            }), 403
        
        # Add user info to request context
        request.admin_user = {
            'email': user_email,
            'roles': user_roles
        }
        
        return f(*args, **kwargs)
    return decorated_function

def log_admin_action(action: str, provider_id: str, details: str, status: str = 'success'):
    """Log administrative actions for audit trail."""
    log_entry = {
        'id': f"log_{int(time.time())}_{secrets.token_hex(4)}",
        'timestamp': datetime.now().isoformat(),
        'user': getattr(request, 'admin_user', {}).get('email', 'unknown'),
        'action': action,
        'provider_id': provider_id,
        'details': details,
        'status': status,
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', 'unknown')
    }
    
    admin_audit_logs.append(log_entry)
    
    # Keep only last 1000 logs in memory
    if len(admin_audit_logs) > 1000:
        admin_audit_logs.pop(0)
    
    logger.info(f"Admin action logged: {action} on {provider_id}")

def ensure_fallback_schools_exist():
    """Ensure fallback schools exist in database for form functionality"""
    try:
        fallback_schools = [
            {
                'id': '550e8400-e29b-41d4-a716-446655440001',
                'name_en': 'Dubai International Academy',
                'name_ar': 'أكاديمية دبي الدولية',
                'code': 'DIA001',
                'location': 'Dubai'
            },
            {
                'id': '550e8400-e29b-41d4-a716-446655440002',
                'name_en': 'GEMS Wellington Academy',
                'name_ar': 'أكاديمية جيمس ويلينغتون',
                'code': 'GWA002',
                'location': 'Dubai'
            },
            {
                'id': '550e8400-e29b-41d4-a716-446655440003',
                'name_en': 'American School of Dubai',
                'name_ar': 'المدرسة الأمريكية في دبي',
                'code': 'ASD003',
                'location': 'Dubai'
            }
        ]
        
        for school in fallback_schools:
            # Check if school exists
            check_query = "SELECT id FROM schools WHERE id = %s"
            existing = execute_query(check_query, (school['id'],), fetch_one=True)
            
            if not existing:
                # Insert school if it doesn't exist
                insert_query = """
                    INSERT INTO schools (id, name_en, name_ar, code, location, district, is_active)
                    VALUES (%s::uuid, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """
                execute_query(insert_query, (
                    school['id'], school['name_en'], school['name_ar'], 
                    school['code'], school['location'], school['location'], True
                ))
                logger.info(f"Inserted fallback school: {school['name_en']}")
                
    except Exception as e:
        logger.error(f"Error ensuring fallback schools: {e}")

# =====================================================
# CV TABLE INITIALIZATION
# =====================================================

def ensure_cv_tables_exist():
    """Create required tables/indexes for CV persistence if they don't exist"""
    try:
        # user_cvs table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS user_cvs (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                title TEXT NOT NULL,
                template_name TEXT,
                personal_info JSONB,
                professional_summary TEXT,
                technical_skills JSONB,
                soft_skills JSONB,
                work_experience JSONB,
                education JSONB,
                cv_score INTEGER DEFAULT 0,
                ats_score INTEGER DEFAULT 0,
                status TEXT DEFAULT 'draft',
                is_visible BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                last_accessed_at TIMESTAMPTZ
            )
            """,
            fetch_all=False
        )

        # cv_versions table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS cv_versions (
                id UUID PRIMARY KEY,
                cv_id UUID REFERENCES user_cvs(id) ON DELETE CASCADE,
                version_number INTEGER,
                cv_data JSONB,
                change_summary TEXT,
                created_by UUID,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
            """,
            fetch_all=False
        )

        # cv_analytics table
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS cv_analytics (
                analytics_id UUID PRIMARY KEY,
                cv_id UUID REFERENCES user_cvs(id) ON DELETE CASCADE,
                user_id UUID,
                event_type TEXT,
                event_data JSONB,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
            """,
            fetch_all=False
        )

        # indexes
        execute_query(
            """
            CREATE INDEX IF NOT EXISTS idx_user_cvs_user_id ON user_cvs (user_id);
            """,
            fetch_all=False
        )
        # unique visible per user (partial index)
        execute_query(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_user_visible_cv_unique ON user_cvs (user_id) WHERE is_visible = TRUE;
            """,
            fetch_all=False
        )
        logger.info("✅ CV tables ensured")
    except Exception as e:
        logger.error(f"Error ensuring CV tables: {e}")

# =====================================================
# VACANCY TABLE INITIALIZATION
# =====================================================

def ensure_vacancy_tables_exist():
    """Create recruiter vacancies table for matching."""
    try:
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS recruiter_vacancies (
                id UUID PRIMARY KEY,
                title TEXT NOT NULL,
                employer TEXT,
                location TEXT,
                description TEXT,
                requirements JSONB,
                tags JSONB,
                posted_by UUID,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
            """,
            fetch_all=False
        )
        execute_query(
            """
            CREATE INDEX IF NOT EXISTS idx_vacancies_created ON recruiter_vacancies (created_at DESC);
            """,
            fetch_all=False
        )
        # Seed mock vacancies if table is empty
        count = execute_query("SELECT COUNT(*) AS cnt FROM recruiter_vacancies", fetch_one=True)
        if not count or int(count.get('cnt', 0)) == 0:
            import random
            samples = [
                {
                    'title': 'Software Engineer',
                    'employer': 'Emirates Tech',
                    'location': 'Dubai, UAE',
                    'description': 'Build and maintain web applications in React and Node.js.',
                    'requirements': ['react', 'node', 'typescript', 'api'],
                    'tags': ['tech', 'web']
                },
                {
                    'title': 'Data Analyst',
                    'employer': 'Dubai Analytics Lab',
                    'location': 'Dubai, UAE',
                    'description': 'Analyze datasets and build BI dashboards.',
                    'requirements': ['sql', 'python', 'excel'],
                    'tags': ['analytics']
                },
                {
                    'title': 'IT Security Specialist',
                    'employer': 'Zayed University',
                    'location': 'Abu Dhabi, UAE',
                    'description': 'Implement security policies and monitor incidents.',
                    'requirements': ['security', 'siem', 'network'],
                    'tags': ['security']
                },
                {
                    'title': 'Project Manager',
                    'employer': 'ADNOC',
                    'location': 'Abu Dhabi, UAE',
                    'description': 'Lead cross-functional projects and deliver on time.',
                    'requirements': ['project management', 'communications'],
                    'tags': ['management']
                },
                {
                    'title': 'Mobile App Developer',
                    'employer': 'Careem',
                    'location': 'Dubai, UAE',
                    'description': 'Develop and maintain mobile applications.',
                    'requirements': ['flutter', 'kotlin', 'swift'],
                    'tags': ['mobile']
                },
                {
                    'title': 'Cloud Engineer',
                    'employer': 'Etisalat',
                    'location': 'Abu Dhabi, UAE',
                    'description': 'Manage cloud infrastructure and CI/CD.',
                    'requirements': ['aws', 'docker', 'kubernetes'],
                    'tags': ['cloud']
                },
                {
                    'title': 'Business Analyst',
                    'employer': 'Dubai Tourism',
                    'location': 'Dubai, UAE',
                    'description': 'Gather requirements and document business processes.',
                    'requirements': ['requirements', 'process mapping'],
                    'tags': ['business']
                },
                {
                    'title': 'AI Researcher',
                    'employer': 'Mohammed bin Zayed University of AI',
                    'location': 'Abu Dhabi, UAE',
                    'description': 'Research AI models and publish results.',
                    'requirements': ['python', 'ml', 'deep learning'],
                    'tags': ['ai']
                },
                {
                    'title': 'Frontend Developer',
                    'employer': 'Noon',
                    'location': 'Dubai, UAE',
                    'description': 'Build responsive UIs in React/Vue.',
                    'requirements': ['react', 'html', 'css'],
                    'tags': ['frontend']
                },
                {
                    'title': 'Backend Developer',
                    'employer': 'Talabat',
                    'location': 'Dubai, UAE',
                    'description': 'Design REST APIs and microservices.',
                    'requirements': ['node', 'java', 'rest'],
                    'tags': ['backend']
                }
            ]
            # generate 20 by repeating with slight variations
            to_insert = []
            for i in range(20):
                base = samples[i % len(samples)].copy()
                base['title'] = f"{base['title']} ({i+1})"
                base['id'] = str(uuidlib.uuid4())
                to_insert.append(base)
            for v in to_insert:
                execute_query(
                    """
                    INSERT INTO recruiter_vacancies (id, title, employer, location, description, requirements, tags)
                    VALUES (%s::uuid, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
                    """,
                    (
                        v['id'], v['title'], v.get('employer'), v.get('location'), v.get('description'),
                        json.dumps(v.get('requirements', [])), json.dumps(v.get('tags', []))
                    ),
                    fetch_all=False
                )
            logger.info("✅ Seeded 20 mock vacancies")

        logger.info("✅ Vacancy tables ensured")
    except Exception as e:
        logger.error(f"Error ensuring vacancy tables: {e}")

# =====================================================
# CV PARSING UTILITIES
# =====================================================

def extract_text_from_pdf(file_stream):
    """Extract text from PDF file with improved encoding handling"""
    try:
        # Reset stream position
        file_stream.seek(0)
        pdf_reader = PyPDF2.PdfReader(file_stream)
        
        if len(pdf_reader.pages) == 0:
            logger.error("PDF has no pages")
            return ""
        
        text = ""
        for i, page in enumerate(pdf_reader.pages):
            try:
                # Try different extraction methods for better encoding
                page_text = page.extract_text()
                
                # Clean up common encoding issues
                if page_text:
                    # Fix common encoding problems
                    page_text = fix_encoding_issues(page_text)
                    text += page_text + "\n"
                    logger.debug(f"Page {i+1}: extracted {len(page_text)} characters")
                
            except Exception as page_error:
                logger.warning(f"Error extracting page {i+1}: {page_error}")
                continue
        
        extracted_text = text.strip()
        logger.info(f"PDF extraction complete: {len(extracted_text)} total characters from {len(pdf_reader.pages)} pages")
        return extracted_text
        
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        import traceback
        logger.error(f"PDF extraction traceback: {traceback.format_exc()}")
        return ""

def fix_encoding_issues(text):
    """Fix common PDF encoding issues and strange characters"""
    if not text:
        return text
    
    # Common encoding fixes
    encoding_fixes = {
        # Fix common PDF encoding issues
        'Ø=Üç': '',  # Remove these strange character sequences
        'Ø=Üñ': '',
        'Ø=ÜÍ': '',
        'Ø=Ü': '',
        'Üç': '',
        'Üñ': '',
        'ÜÍ': '',
        # Fix bullet points and symbols
        '•': '•',
        '–': '-',
        '—': '-',
        # Fix quotes
        '"': '"',
        '"': '"',
        ''': "'",
        ''': "'",
        # Fix common Arabic/English mixed encoding issues
        'Ø': '',
        'Ü': '',
        'ç': '',
        'ñ': '',
        'Í': '',
    }
    
    # Apply fixes
    for old_char, new_char in encoding_fixes.items():
        text = text.replace(old_char, new_char)
    
    # Clean up multiple spaces and newlines
    import re
    text = re.sub(r'\s+', ' ', text)  # Replace multiple whitespace with single space
    text = re.sub(r'\n\s*\n', '\n', text)  # Remove empty lines
    
    return text.strip()

def extract_text_from_docx(file_stream):
    """Extract text from DOCX file"""
    try:
        doc = Document(file_stream)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting DOCX text: {e}")
        return ""

def extract_text_from_file(file):
    """Extract text from uploaded file based on type"""
    try:
        # Read file content into memory
        file_content = file.read()
        file.seek(0)  # Reset file pointer for saving
        
        if not file_content:
            logger.error("File is empty or could not be read")
            return ""
        
        file_stream = io.BytesIO(file_content)
        
        if file.content_type == 'application/pdf':
            return extract_text_from_pdf(file_stream)
        elif file.content_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
            return extract_text_from_docx(file_stream)
        elif file.content_type == 'text/plain':
            return file_content.decode('utf-8')
        else:
            logger.warning(f"Unsupported file type: {file.content_type}")
            return ""
    except Exception as e:
        logger.error(f"Error in extract_text_from_file: {e}")
        return ""

def parse_cv_with_gemini(cv_text: str) -> dict:
    """Parse CV text using Gemini 2.5 Pro"""
    try:
        # Initialize Gemini
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not gemini_api_key:
            logger.warning("GEMINI_API_KEY not found, using mock data")
            return None
            
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Enhanced prompt for UAE job market
        prompt = f"""
Analyze this CV/Resume text and extract structured information for the UAE job market. 
Focus on UAE-specific context, Arabic names, local companies, and regional experience.

CV Text:
{cv_text}

Please extract and return a JSON object with the following structure:
{{
  "personal_info": {{
    "name": "Full name (preserve Arabic if present)",
    "email": "email address",
    "phone": "phone number (UAE format preferred)",
    "location": "city, country",
    "nationality": "nationality if mentioned",
    "visa_status": "visa status if mentioned"
  }},
  "professional_summary": "Brief professional summary",
  "experience_years": "total years of experience (number)",
  "skills": {{
    "technical": ["list of technical skills"],
    "soft": ["list of soft skills"],
    "languages": ["list of languages with proficiency"]
  }},
  "experience": [
    {{
      "job_title": "position title",
      "company": "company name",
      "location": "work location",
      "start_date": "start date",
      "end_date": "end date or current",
      "duration": "duration in months",
      "responsibilities": "key responsibilities"
    }}
  ],
  "education": [
    {{
      "degree": "degree name",
      "institution": "institution name",
      "location": "education location",
      "graduation_year": "year",
      "field": "field of study"
    }}
  ],
  "certifications": ["list of certifications"],
  "job_matches": [
    {{
      "title": "suggested job title",
      "company_type": "type of company (government/private/startup)",
      "match_score": "match percentage (0-100)",
      "alignment": "D33/Talent33 alignment",
      "salary_range": "AED salary range",
      "location": "UAE location"
    }}
  ],
  "recommendations": [
    "specific recommendations for UAE job market",
    "suggestions for skill enhancement",
    "cultural fit improvements"
  ],
  "uae_context": {{
    "local_experience": "years of UAE experience",
    "arabic_proficiency": "Arabic language level",
    "cultural_alignment": "cultural fit score (0-100)",
    "government_sector_fit": "fit for government roles (0-100)",
    "private_sector_fit": "fit for private sector (0-100)"
  }}
}}

Return only the JSON object, no additional text.
"""
        
        response = model.generate_content(prompt)
        
        # Parse JSON response
        try:
            # Clean the response text
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            parsed_data = json.loads(response_text)
            logger.info("✅ Gemini CV parsing successful")
            return parsed_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response: {e}")
            logger.error(f"Raw response: {response.text[:500]}...")
            return None
            
    except Exception as e:
        logger.error(f"Gemini CV parsing error: {e}")
        return None

# =====================================================
# MATCHING UTILITIES
# =====================================================

def _tokenize(text: str) -> set:
    try:
        import re
        words = re.findall(r"[A-Za-z0-9_\-\+]+", (text or '').lower())
        return set(words)
    except Exception:
        return set()

def _collect_cv_keywords(cv_row: dict) -> dict:
    personal_info = cv_row.get('personal_info') or {}
    prof = cv_row.get('professional_summary') or ''
    tech = cv_row.get('technical_skills') or []
    soft = cv_row.get('soft_skills') or []
    experience = cv_row.get('work_experience') or []
    edu = cv_row.get('education') or []

    skill_words = set([s.lower() for s in tech + soft if isinstance(s, str)])
    summary_words = _tokenize(prof)
    exp_words = set()
    for e in experience:
        exp_words |= _tokenize((e.get('responsibilities') or '') + ' ' + (e.get('jobTitle') or e.get('job_title') or ''))
    edu_words = set()
    for e in edu:
        edu_words |= _tokenize((e.get('degree') or '') + ' ' + (e.get('field') or e.get('field_of_study') or ''))

    return {
        'skills': skill_words,
        'text': summary_words | exp_words | edu_words,
        'location': (personal_info.get('location') or '').lower()
    }

def _vacancy_keywords(v: dict) -> dict:
    desc = (v.get('description') or '')
    title = (v.get('title') or '')
    tags = v.get('tags') or []
    req = v.get('requirements') or []
    return {
        'text': _tokenize(desc + ' ' + title) | set([t.lower() for t in tags if isinstance(t, str)]),
        'skills': set([r.lower() for r in req if isinstance(r, str)]),
        'location': (v.get('location') or '').lower()
    }

def _compute_match_score(cvk: dict, vk: dict) -> int:
    # Simple heuristic: skills 50, text 40, location 10
    skill_overlap = len(cvk['skills'] & vk['skills'])
    skill_total = max(1, len(vk['skills']))
    skill_score = 50 * (skill_overlap / skill_total)

    text_overlap = len(cvk['text'] & vk['text'])
    text_total = max(1, len(vk['text']))
    text_score = 40 * (text_overlap / text_total)

    loc_score = 10 if (cvk['location'] and cvk['location'] in vk['location']) else 0

    return int(round(min(100, skill_score + text_score + loc_score)))

# =====================================================
# PDF GENERATION UTILITIES
# =====================================================

def get_template_styles(template_style: str):
    """Get template-specific styles and colors"""
    templates = {
        'government-executive': {
            'primary_color': '#1e40af',  # Blue
            'secondary_color': '#374151',  # Gray
            'accent_color': '#059669',  # Green
            'font_size_title': 26,
            'font_size_heading': 18,
            'layout': 'traditional'
        },
        'tech-innovator': {
            'primary_color': '#7c3aed',  # Purple
            'secondary_color': '#1f2937',  # Dark gray
            'accent_color': '#0891b2',  # Cyan
            'font_size_title': 24,
            'font_size_heading': 16,
            'layout': 'modern'
        },
        'business-leader': {
            'primary_color': '#059669',  # Green
            'secondary_color': '#374151',  # Gray
            'accent_color': '#dc2626',  # Red
            'font_size_title': 25,
            'font_size_heading': 17,
            'layout': 'executive'
        },
        'professional': {
            'primary_color': '#1e40af',  # Blue
            'secondary_color': '#374151',  # Gray
            'accent_color': '#059669',  # Green
            'font_size_title': 24,
            'font_size_heading': 16,
            'layout': 'standard'
        }
    }
    
    return templates.get(template_style, templates['professional'])

def generate_cv_pdf(cv_data: dict, template_style: str = 'professional') -> str:
    """Generate PDF from CV data using ReportLab"""
    try:
        # Create PDF file path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"cv_{timestamp}.pdf"
        pdf_path = UPLOAD_FOLDER / pdf_filename
        
        # Create PDF document
        doc = SimpleDocTemplate(str(pdf_path), pagesize=A4, 
                               rightMargin=72, leftMargin=72, 
                               topMargin=72, bottomMargin=18)
        
        # Get template-specific styles
        template_config = get_template_styles(template_style)
        logger.info(f"🎨 Generating PDF with template: {template_style}")
        logger.info(f"🎨 Template config: {template_config}")
        styles = getSampleStyleSheet()
        
        # Custom styles based on template
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=template_config['font_size_title'],
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor(template_config['primary_color']),
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=template_config['font_size_heading'],
            spaceAfter=6,
            spaceBefore=12,
            textColor=colors.HexColor(template_config['secondary_color']),
            fontName='Helvetica-Bold'
        )
        
        # Add accent style for highlights
        accent_style = ParagraphStyle(
            'AccentStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor(template_config['accent_color']),
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            alignment=TA_LEFT
        )
        
        # Build PDF content
        content = []
        
        # Header - Personal Information
        personal_info = cv_data.get('personalInfo', {})
        name = f"{personal_info.get('firstName', '')} {personal_info.get('lastName', '')}"
        content.append(Paragraph(name, title_style))
        
        # Contact information with template-specific styling
        contact_info = []
        if personal_info.get('email'):
            contact_info.append(f"📧 {personal_info['email']}")
        if personal_info.get('phone'):
            contact_info.append(f"📱 {personal_info['phone']}")
        if personal_info.get('location'):
            contact_info.append(f"📍 {personal_info['location']}")
            
        if contact_info:
            contact_style = ParagraphStyle(
                'ContactStyle',
                parent=body_style,
                alignment=TA_CENTER,
                textColor=colors.HexColor(template_config['secondary_color'])
            )
            content.append(Paragraph(" • ".join(contact_info), contact_style))
        
        content.append(Spacer(1, 12))
        
        # Professional Summary
        if cv_data.get('professionalSummary'):
            content.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
            content.append(Paragraph(cv_data['professionalSummary'], body_style))
            content.append(Spacer(1, 12))
        
        # Technical Skills
        if cv_data.get('technicalSkills'):
            content.append(Paragraph("TECHNICAL SKILLS", heading_style))
            skills_text = " • ".join(cv_data['technicalSkills'])
            content.append(Paragraph(skills_text, body_style))
            content.append(Spacer(1, 12))
        
        # Soft Skills
        if cv_data.get('softSkills'):
            content.append(Paragraph("SOFT SKILLS", heading_style))
            skills_text = " • ".join(cv_data['softSkills'])
            content.append(Paragraph(skills_text, body_style))
            content.append(Spacer(1, 12))
        
        # Work Experience with template-specific styling
        if cv_data.get('experience'):
            content.append(Paragraph("WORK EXPERIENCE", heading_style))
            for exp in cv_data['experience']:
                # Job title and company with accent color
                job_title_style = ParagraphStyle(
                    'JobTitleStyle',
                    parent=body_style,
                    fontSize=12,
                    textColor=colors.HexColor(template_config['primary_color']),
                    fontName='Helvetica-Bold'
                )
                job_header = f"<b>{exp.get('jobTitle', '')}</b>"
                content.append(Paragraph(job_header, job_title_style))
                
                # Company with secondary color
                company_style = ParagraphStyle(
                    'CompanyStyle',
                    parent=body_style,
                    fontSize=11,
                    textColor=colors.HexColor(template_config['secondary_color']),
                    fontName='Helvetica-Bold'
                )
                content.append(Paragraph(exp.get('company', ''), company_style))
                
                # Dates and location with accent color
                date_location = f"{exp.get('startDate', '')} - {exp.get('endDate', '')} • {exp.get('location', '')}"
                content.append(Paragraph(date_location, accent_style))
                
                # Responsibilities
                if exp.get('responsibilities'):
                    content.append(Paragraph(exp['responsibilities'], body_style))
                
                content.append(Spacer(1, 8))
        
        # Education with template-specific styling
        if cv_data.get('education'):
            content.append(Paragraph("EDUCATION", heading_style))
            for edu in cv_data['education']:
                # Degree with primary color
                degree_style = ParagraphStyle(
                    'DegreeStyle',
                    parent=body_style,
                    fontSize=12,
                    textColor=colors.HexColor(template_config['primary_color']),
                    fontName='Helvetica-Bold'
                )
                content.append(Paragraph(f"<b>{edu.get('degree', '')}</b>", degree_style))
                
                # Institution with secondary color
                institution_style = ParagraphStyle(
                    'InstitutionStyle',
                    parent=body_style,
                    fontSize=11,
                    textColor=colors.HexColor(template_config['secondary_color']),
                    fontName='Helvetica-Bold'
                )
                content.append(Paragraph(edu.get('institution', ''), institution_style))
                
                # Field and year with accent color
                field_year = f"{edu.get('field', '')} • Graduated: {edu.get('graduationYear', '')}"
                content.append(Paragraph(field_year, accent_style))
                content.append(Spacer(1, 8))
        
        # Build PDF
        doc.build(content)
        
        logger.info(f"✅ PDF generated successfully: {pdf_path}")
        return pdf_filename
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        import traceback
        logger.error(f"PDF generation traceback: {traceback.format_exc()}")
        return None

# Initialize default providers
def initialize_default_providers():
    """Initialize default provider configurations."""
    for provider_id, template in PROVIDER_TEMPLATES.items():
        if provider_id not in admin_providers:
            admin_providers[provider_id] = {
                'id': provider_id,
                'name': template['name'],
                'category': template['category'],
                'description': template['description'],
                'status': 'inactive',
                'is_default': provider_id == 'google-gemini',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Initialize empty configuration
            admin_configurations[provider_id] = {
                'provider_id': provider_id,
                'config': {},
                'is_active': False,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }

# =====================================================
# HEALTH CHECK ENDPOINT
# =====================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Unified health check endpoint"""
    try:
        db = get_db()
        db_status = 'connected' if db else 'disconnected'
        
        return jsonify({
            'status': 'healthy',
            'service': 'emirati-journey-unified',
            'version': '1.0.0',
            'database': db_status,
            'features': {
                'authentication': True,
                'cv_upload': True,
                'school_programs': True,
                'admin_management': True
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy', 
            'error': str(e)
        }), 500

# =====================================================
# AUTHENTICATION ROUTES
# =====================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user login"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400
        
        # Import and use authentication manager
        from auth.auth_manager_fixed import AuthenticationManager
        auth_manager = AuthenticationManager()
        
        # Authenticate user
        success, message, result_data = auth_manager.authenticate_user(email, password)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'data': result_data
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 401
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Authentication failed due to system error'
        }), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new UAE National user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'emirate']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Import and use authentication manager
        from auth.auth_manager_fixed import AuthenticationManager
        auth_manager = AuthenticationManager()
        
        # Set UAE nationality by default
        data['nationality'] = 'UAE'
        
        # Register user
        success, message, result_data = auth_manager.register_user(data)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'data': {
                    'user_id': result_data['user_data']['id'] if 'user_data' in result_data else None,
                    'email_verification_required': True,
                    'phone_verification_required': True
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Registration failed due to system error'
        }), 500

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile information"""
    try:
        user_id = get_jwt_identity()
        
        # Import user profile
        from models.user_profile import UserProfile
        profile = UserProfile(user_id)
        profile_data = profile.to_dict()
        
        # Add UAE-specific configuration
        profile_data.update({
            'working_days': os.getenv('UAE_WORKING_DAYS', 'Monday,Tuesday,Wednesday,Thursday,Friday').split(','),
            'weekend_days': os.getenv('UAE_WEEKEND_DAYS', 'Saturday,Sunday').split(','),
            'timezone': os.getenv('TIMEZONE', 'Asia/Dubai'),
            'locale': os.getenv('LOCALE', 'en_AE'),
            'currency': os.getenv('CURRENCY', 'AED'),
            'nationality': 'UAE'
        })
        
        return jsonify({
            'success': True,
            'message': 'Profile retrieved successfully',
            'data': profile_data
        }), 200
        
    except Exception as e:
        logger.error(f"Profile retrieval error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Profile retrieval failed'
        }), 500

# =====================================================
# CV UPLOAD ROUTES
# =====================================================

@app.route('/api/cv/upload', methods=['POST', 'OPTIONS'])
@app.route('/api/candidate/cv/upload', methods=['POST', 'OPTIONS'])
def upload_cv():
    """Upload and process CV file"""
    try:
        # CORS preflight support
        if request.method == 'OPTIONS':
            return ('', 204)

        # For development: accept mock tokens or use fallback user_id
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'
        logger.info(f"CV upload request from user: {user_id}")
        
        # Check if file is present
        if 'cv_file' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files['cv_file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Validate file
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'File type not allowed. Please upload PDF, DOCX, DOC, or TXT files.'
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'message': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.'
            }), 400
        
        # Extract text from file BEFORE saving (to avoid file pointer issues)
        logger.info(f"File details: name={file.filename}, type={file.content_type}, size={file.content_length}")
        cv_text = extract_text_from_file(file)
        logger.info(f"Extracted {len(cv_text)} characters from CV")
        
        # Save file after text extraction
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{user_id}_{timestamp}_{filename}"
        file_path = UPLOAD_FOLDER / safe_filename
        
        file.save(str(file_path))
        logger.info(f"File saved: {file_path}")
        
        # Debug: log first 200 characters if extraction worked
        if cv_text:
            logger.info(f"CV text preview: {cv_text[:200]}...")
        else:
            logger.warning("No text extracted from CV file")
        
        # Parse CV with Gemini AI
        gemini_analysis = parse_cv_with_gemini(cv_text) if cv_text else None
        
        # Use Gemini analysis or fallback to enhanced mock data
        if gemini_analysis:
            analysis_result = gemini_analysis
            logger.info("✅ Using real Gemini CV analysis")
        else:
            # Enhanced mock data with UAE context
            analysis_result = {
                'personal_info': {
                    'name': 'Ahmed Al Mansouri',
                    'email': 'ahmed.almansouri@gmail.com',
                    'phone': '+971 50 123 4567',
                    'location': 'Dubai, UAE',
                    'nationality': 'UAE',
                    'visa_status': 'UAE National'
                },
                'professional_summary': 'Experienced software engineer with expertise in modern web technologies and UAE market knowledge.',
                'experience_years': 5,
                'skills': {
                    'technical': ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
                    'soft': ['Leadership', 'Communication', 'Problem Solving', 'Team Management'],
                    'languages': ['Arabic (Native)', 'English (Fluent)']
                },
                'experience': [
                    {
                        'job_title': 'Senior Software Engineer',
                        'company': 'Emirates NBD',
                        'location': 'Dubai, UAE',
                        'start_date': '2020-01',
                        'end_date': 'current',
                        'duration': '48 months',
                        'responsibilities': 'Led development of digital banking solutions'
                    }
                ],
                'education': [
                    {
                        'degree': 'Bachelor of Computer Science',
                        'institution': 'American University of Sharjah',
                        'location': 'Sharjah, UAE',
                        'graduation_year': '2019',
                        'field': 'Computer Science'
                    }
                ],
                'certifications': ['AWS Solutions Architect', 'React Developer Certification'],
                'job_matches': [
                    {
                        'title': 'Lead Software Engineer',
                        'company_type': 'Government',
                        'match_score': 95,
                        'alignment': 'D33 Digital Transformation',
                        'salary_range': 'AED 25,000 - 35,000',
                        'location': 'Dubai'
                    },
                    {
                        'title': 'Technical Lead',
                        'company_type': 'Private',
                        'match_score': 88,
                        'alignment': 'Talent33 Initiative',
                        'salary_range': 'AED 22,000 - 30,000',
                        'location': 'Abu Dhabi'
                    }
                ],
                'recommendations': [
                    'Consider obtaining cloud certifications (AWS/Azure) to align with UAE digital transformation',
                    'Highlight Arabic language skills for government sector opportunities',
                    'Emphasize UAE-specific project experience and cultural understanding'
                ],
                'uae_context': {
                    'local_experience': '5 years',
                    'arabic_proficiency': 'Native',
                    'cultural_alignment': 95,
                    'government_sector_fit': 90,
                    'private_sector_fit': 85
                }
            }
            logger.info("⚠️ Using enhanced mock data (Gemini unavailable)")
        
        return jsonify({
            'success': True,
            'message': 'CV uploaded and analyzed successfully',
            'data': {
                'file_id': safe_filename,
                'file_size': file_size,
                'analysis': analysis_result,
                'upload_time': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"CV upload error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Upload failed due to system error'
        }), 500

@app.route('/api/cv/list-mock', methods=['GET'])
@jwt_required()
def list_cvs_mock():
    """List user's uploaded CVs"""
    try:
        user_id = get_jwt_identity()
        
        # Mock CV list
        cvs = [
            {
                'id': 'cv_001',
                'filename': 'Ahmed_Al_Mansouri_CV.pdf',
                'upload_date': '2025-09-22T15:20:00Z',
                'status': 'analyzed',
                'match_score': 95
            }
        ]
        
        return jsonify({
            'success': True,
            'data': cvs
        }), 200
        
    except Exception as e:
        logger.error(f"List CVs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve CVs'
        }), 500

@app.route('/api/cv/export', methods=['POST'])
def export_cv():
    """Export CV as PDF"""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No CV data provided'
            }), 400
        
        cv_data = data.get('cvData')
        template_style = data.get('template', 'professional')
        
        if not cv_data:
            return jsonify({
                'success': False,
                'message': 'CV data is required'
            }), 400
        
        # Import and use the new HTML-based PDF generator
        from cv_pdf_generator import generate_cv_pdf_html
        pdf_filename = generate_cv_pdf_html(cv_data, template_style)
        
        if not pdf_filename:
            return jsonify({
                'success': False,
                'message': 'Failed to generate PDF'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'CV exported successfully',
            'data': {
                'filename': pdf_filename,
                'download_url': f'/api/cv/download/{pdf_filename}',
                'generated_at': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"CV export error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Export failed due to system error'
        }), 500

@app.route('/api/cv/download/<filename>', methods=['GET'])
def download_cv(filename: str):
    """Download generated CV PDF"""
    try:
        # Security: validate filename
        if not filename.endswith('.pdf') or '..' in filename:
            return jsonify({'error': 'Invalid filename'}), 400
        
        file_path = UPLOAD_FOLDER / filename
        
        if not file_path.exists():
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(
            str(file_path),
            as_attachment=True,
            download_name=f"CV_{filename}",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        logger.error(f"CV download error: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500

# =====================================================
# CV STORAGE AND MANAGEMENT ROUTES
# =====================================================

@app.route('/api/cv/save', methods=['POST'])
def save_cv():
    """Save CV to database"""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No CV data provided'
            }), 400
        
        cv_data = data.get('cvData')
        title = data.get('title', 'My CV')
        template_name = data.get('templateId', 'government-executive')
        
        if not cv_data:
            return jsonify({
                'success': False,
                'message': 'CV data is required'
            }), 400
        
        # Convert mock user_id to UUID for development
        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        else:
            user_uuid = user_id

        # Enforce limit: max 3 active CVs (non-archived)
        count_query = "SELECT COUNT(*) as cnt FROM user_cvs WHERE user_id = %s::uuid AND COALESCE(status,'draft') <> 'archived'"
        count_row = execute_query(count_query, (user_uuid,), fetch_one=True)
        if count_row and int(count_row.get('cnt', 0)) >= 3:
            return jsonify({
                'success': False,
                'message': 'You have reached the maximum of 3 saved CVs. Please delete or archive one before creating another.'
            }), 400

        # Insert CV into database
        cv_id = str(uuidlib.uuid4())
        insert_query = """
            INSERT INTO user_cvs (
                id, user_id, title, template_name, personal_info, professional_summary,
                technical_skills, soft_skills, work_experience, education,
                cv_score, ats_score, status
            ) VALUES (
                %s::uuid, %s::uuid, %s, %s,
                %s::jsonb, %s, %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb,
                %s, %s, 'draft'
            ) RETURNING id, created_at
        """

        params = (
            cv_id,
            user_uuid,
            title,
            template_name,
            json.dumps(cv_data.get('personalInfo', {})),
            cv_data.get('professionalSummary', ''),
            json.dumps(cv_data.get('technicalSkills', [])),
            json.dumps(cv_data.get('softSkills', [])),
            json.dumps(cv_data.get('experience', [])),
            json.dumps(cv_data.get('education', [])),
            data.get('cvScore', 0),
            data.get('atsScore', 0)
        )

        result = execute_query(insert_query, params, fetch_one=True)
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'Failed to save CV'
            }), 500
        
        cv_id = result['id']
        
        # Create initial analytics record
        analytics_query = """
            INSERT INTO cv_analytics (analytics_id, cv_id, user_id, event_type, event_data)
            VALUES (%s::uuid, %s::uuid, %s::uuid, %s, %s::jsonb)
        """
        execute_query(analytics_query, (
            str(uuidlib.uuid4()), cv_id, user_uuid, 'cv_stored', json.dumps({'cv_score': data.get('cvScore', 0)})
        ))
        
        logger.info(f"✅ CV saved successfully: {cv_id}")
        
        return jsonify({
            'success': True,
            'message': 'CV saved successfully',
            'data': {
                'cv_id': str(result['id']),
                'created_at': result['created_at'].isoformat() if isinstance(result['created_at'], datetime) else str(result['created_at'])
            }
        }), 201
        
    except Exception as e:
        logger.error(f"CV save error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to save CV due to system error'
        }), 500

@app.route('/api/recruiter/vacancies', methods=['GET'])
def list_vacancies():
    """List recruiter-uploaded vacancies (basic fields)."""
    try:
        rows = execute_query("SELECT id, title, employer, location, description, requirements, tags, created_at FROM recruiter_vacancies ORDER BY created_at DESC")
        result = []
        for r in rows or []:
            d = dict(r)
            # ensure json serializable
            if isinstance(d.get('created_at'), datetime):
                d['created_at'] = d['created_at'].isoformat()
            result.append(d)
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        logger.error(f"List vacancies error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to list vacancies'}), 500

@app.route('/api/matching/cv/<cv_id>/top-vacancies', methods=['GET'])
def match_cv_top_vacancies(cv_id: str):
    """Return top-N matching vacancies for a specific CV."""
    try:
        limit = int(request.args.get('limit', 10))
        cv = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not cv:
            return jsonify({'success': False, 'message': 'CV not found'}), 404

        cvk = _collect_cv_keywords(dict(cv))
        vacancies = execute_query("SELECT * FROM recruiter_vacancies ORDER BY created_at DESC") or []

        scored = []
        for v in vacancies:
            vd = dict(v)
            vk = _vacancy_keywords(vd)
            score = _compute_match_score(cvk, vk)
            vd['match_score'] = score
            vd['snippet'] = (vd.get('description') or '')[:200]
            scored.append(vd)

        scored.sort(key=lambda x: x['match_score'], reverse=True)
        return jsonify({'success': True, 'matches': scored[:limit]}), 200
    except Exception as e:
        logger.error(f"Match CV error: {str(e)}")
        return jsonify({'success': False, 'message': 'Matching failed'}), 500

@app.route('/api/matching/visible/top-vacancies', methods=['GET'])
def match_visible_cv_top_vacancies():
    """Return top-N matches for the user's visible CV."""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'

        user_uuid = '550e8400-e29b-41d4-a716-446655440000' if user_id == 'mock_user_candidate' else user_id
        cv = execute_query("SELECT * FROM user_cvs WHERE user_id = %s::uuid AND is_visible = TRUE LIMIT 1", (user_uuid,), fetch_one=True)
        if not cv:
            return jsonify({'success': False, 'message': 'No visible CV set'}), 404
        return match_cv_top_vacancies(cv['id'])
    except Exception as e:
        logger.error(f"Match visible CV error: {str(e)}")
        return jsonify({'success': False, 'message': 'Matching failed'}), 500

@app.route('/api/cv/list', methods=['GET'])
def list_user_cvs():
    """List user's saved CVs"""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'
        
        # Convert mock user_id to UUID for development
        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        else:
            user_uuid = user_id
        
        query = """
            SELECT 
                id,
                title,
                status,
                cv_score,
                ats_score,
                created_at,
                updated_at,
                last_accessed_at,
                template_name,
                (personal_info->>'firstName') || ' ' || (personal_info->>'lastName') as full_name,
                is_visible
            FROM user_cvs
            WHERE user_id = %s::uuid
              AND COALESCE(status, 'draft') <> 'archived'
            ORDER BY updated_at DESC NULLS LAST, created_at DESC
        """

        cvs = execute_query(query, (user_uuid,))
        
        if cvs is None:
            return jsonify({
                'success': False,
                'message': 'Database error'
            }), 500
        
        # Convert to JSON-serializable format
        result = []
        for cv in cvs:
            cv_dict = dict(cv)
            # Convert dates to ISO format
            for date_field in ['created_at', 'updated_at', 'last_accessed_at']:
                if cv_dict.get(date_field):
                    if isinstance(cv_dict[date_field], datetime):
                        cv_dict[date_field] = cv_dict[date_field].isoformat()
            result.append(cv_dict)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"List CVs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve CVs'
        }), 500

@app.route('/api/cv/<cv_id>', methods=['GET'])
def get_cv(cv_id: str):
    """Get specific CV by ID"""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'
        
        # Convert mock user_id to UUID for development
        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        else:
            user_uuid = user_id
        
        query = """
            SELECT * FROM user_cvs WHERE id = %s::uuid AND user_id = %s::uuid
        """

        cv = execute_query(query, (cv_id, user_uuid), fetch_one=True)
        
        if not cv:
            return jsonify({
                'success': False,
                'message': 'CV not found'
            }), 404
        
        # Update last accessed time
        update_query = "UPDATE user_cvs SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = %s::uuid"
        execute_query(update_query, (cv_id,))
        
        # Convert to JSON-serializable format
        cv_dict = dict(cv)
        for date_field in ['created_at', 'updated_at', 'last_accessed_at', 'last_analyzed_at']:
            if cv_dict.get(date_field):
                if isinstance(cv_dict[date_field], datetime):
                    cv_dict[date_field] = cv_dict[date_field].isoformat()
        
        return jsonify({
            'success': True,
            'data': cv_dict
        }), 200
        
    except Exception as e:
        logger.error(f"Get CV error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve CV'
        }), 500

@app.route('/api/cv/<cv_id>/export/<fmt>', methods=['GET', 'OPTIONS'], endpoint='export_cv_api')
def export_cv_api(cv_id: str, fmt: str):
    """Export a saved CV as PDF/DOCX/JSON.
    - Handles CORS preflight
    - Generates a minimal but clean RTL-friendly PDF when requested
    """
    try:
        # CORS preflight
        if request.method == 'OPTIONS':
            return ('', 204)

        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'

        # Convert mock user_id to UUID for development
        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        else:
            user_uuid = user_id

        # Fetch CV row
        row = execute_query(
            "SELECT * FROM user_cvs WHERE id = %s::uuid AND user_id = %s::uuid AND COALESCE(status,'draft') <> 'archived'",
            (cv_id, user_uuid),
            fetch_one=True
        )
        if not row:
            return jsonify({'success': False, 'message': 'CV not found'}), 404

        cv = dict(row)
        personal = cv.get('personal_info') or {}
        full_name = f"{personal.get('firstName','')} {personal.get('lastName','')}".strip()
        email = personal.get('email', '')
        phone = personal.get('phone', '')
        location = personal.get('location', '')
        tech_skills = cv.get('technical_skills') or []
        soft_skills = cv.get('soft_skills') or []
        summary = cv.get('professional_summary') or ''

        if fmt == 'json':
            return jsonify({'success': True, 'data': cv}), 200

        export_dir = (UPLOAD_FOLDER / 'exports')
        export_dir.mkdir(parents=True, exist_ok=True)

        # DOCX export
        if fmt == 'docx':
            try:
                docx_path = export_dir / f"cv_{cv_id}.docx"
                doc = Document()
                doc.add_heading(full_name or 'Curriculum Vitae', 0)
                contact = " | ".join([p for p in [email and f"Email: {email}", phone and f"Phone: {phone}", location and f"Location: {location}"] if p])
                if contact:
                    doc.add_paragraph(contact)
                if summary:
                    doc.add_heading('Professional Summary', level=1)
                    doc.add_paragraph(summary)
                if tech_skills:
                    doc.add_heading('Technical Skills', level=1)
                    doc.add_paragraph(", ".join(tech_skills))
                if soft_skills:
                    doc.add_heading('Soft Skills', level=1)
                    doc.add_paragraph(", ".join(soft_skills))
                # Minimal experience/education if present
                for exp in (cv.get('work_experience') or []):
                    doc.add_heading('Experience', level=1)
                    doc.add_paragraph(f"{exp.get('jobTitle','')} - {exp.get('company','')}")
                    doc.add_paragraph(f"{exp.get('startDate','')} - {exp.get('endDate','')} • {exp.get('location','')}")
                    if exp.get('responsibilities'):
                        doc.add_paragraph(exp['responsibilities'])
                for edu in (cv.get('education') or []):
                    doc.add_heading('Education', level=1)
                    doc.add_paragraph(f"{edu.get('degree','')} - {edu.get('institution','')}")
                    extra = " • ".join([p for p in [edu.get('field',''), edu.get('graduationYear','')] if p])
                    if extra:
                        doc.add_paragraph(extra)
                doc.save(str(docx_path))
                return send_file(str(docx_path), mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document', as_attachment=True, download_name=f"cv_{cv_id}.docx")
            except Exception as e:
                logger.error(f"DOCX export error: {e}")
                return jsonify({'success': False, 'message': 'DOCX export failed'}), 500

        # PDF export (WeasyPrint, RTL-safe)
        if fmt == 'pdf':
            try:
                html = f"""
                <!doctype html>
                <html lang='ar' dir='rtl'>
                <meta charset='utf-8'/>
                <style>
                  @page {{ size: A4; margin: 18mm; }}
                  body {{ font-family: 'Amiri','Noto Naskh Arabic','Arial',sans-serif; color:#0f172a; }}
                  h1 {{ color:#0f766e; margin:0 0 8px; }}
                  .meta {{ color:#475569; margin-bottom:14px; }}
                  .sec {{ margin:16px 0; }}
                  .chips {{ display:flex; flex-wrap:wrap; gap:6px; }}
                  .chip {{ background:#ecfeff; color:#0e7490; padding:3px 10px; border-radius:12px; font-size:12px; margin:2px 0; }}
                  .chip.soft {{ background:#f0fdf4; color:#047857; }}
                </style>
                <body>
                  <h1>{full_name or 'السيرة الذاتية'}</h1>
                  <div class='meta'>📧 {email or ''} • 📱 {phone or ''} • 📍 {location or ''}</div>
                  {f"<div class='sec'><b>الملخص المهني</b><div>{summary}</div></div>" if summary else ''}
                  {("<div class='sec'><b>المهارات التقنية</b><div class='chips'>" + ''.join([f"<span class='chip'>{s}</span>" for s in tech_skills]) + "</div></div>") if tech_skills else ''}
                  {("<div class='sec'><b>المهارات السلوكية</b><div class='chips'>" + ''.join([f"<span class='chip soft'>{s}</span>" for s in soft_skills]) + "</div></div>") if soft_skills else ''}
                </body>
                </html>
                """
                out_path = (UPLOAD_FOLDER / 'exports' / f"cv_{cv_id}.pdf")
                out_path.parent.mkdir(parents=True, exist_ok=True)
                weasyprint.HTML(string=html).write_pdf(str(out_path))
                return send_file(str(out_path), mimetype='application/pdf', as_attachment=True, download_name=f"cv_{cv_id}.pdf")
            except Exception as e:
                logger.error(f"PDF export error: {e}")
                logger.error(traceback.format_exc())
                return jsonify({'success': False, 'message': 'PDF export failed'}), 500

        return jsonify({'success': False, 'message': 'Unsupported format'}), 400
    except Exception as e:
        logger.error(f"Export error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'success': False, 'message': 'Export failed'}), 500

@app.route('/api/cv/<cv_id>', methods=['PUT'])
def update_cv(cv_id: str):
    """Update existing CV"""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'
        
        # Convert mock user_id to UUID for development
        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        else:
            user_uuid = user_id
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No update data provided'
            }), 400

        cv_data = data.get('cvData')
        
        # Create version history entry first
        if cv_data is not None:
            version_query = """
                INSERT INTO cv_versions (id, cv_id, version_number, cv_data, change_summary, created_by)
                SELECT %s::uuid, %s::uuid, COALESCE(MAX(version_number), 0) + 1, 
                       %s::jsonb, %s, %s::uuid
                FROM cv_versions
                WHERE cv_id = %s::uuid
                GROUP BY cv_id
            """
            execute_query(version_query, (
                str(uuidlib.uuid4()), cv_id, json.dumps(cv_data), data.get('changeSummary', 'CV updated'), user_uuid, cv_id
            ))
        
        # Update CV
        update_query = """
            UPDATE user_cvs SET
                title = COALESCE(%s, title),
                template_name = COALESCE(%s, template_name),
                personal_info = COALESCE(%s::jsonb, personal_info),
                professional_summary = COALESCE(%s, professional_summary),
                technical_skills = COALESCE(%s::jsonb, technical_skills),
                soft_skills = COALESCE(%s::jsonb, soft_skills),
                work_experience = COALESCE(%s::jsonb, work_experience),
                education = COALESCE(%s::jsonb, education),
                cv_score = COALESCE(%s, cv_score),
                ats_score = COALESCE(%s, ats_score),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s::uuid AND user_id = %s::uuid
            RETURNING id, updated_at
        """

        params = (
            data.get('title'),
            data.get('templateId'),
            json.dumps(cv_data.get('personalInfo')) if cv_data and cv_data.get('personalInfo') else None,
            (cv_data.get('professionalSummary') if cv_data else None),
            (json.dumps(cv_data.get('technicalSkills')) if cv_data and cv_data.get('technicalSkills') else None),
            (json.dumps(cv_data.get('softSkills')) if cv_data and cv_data.get('softSkills') else None),
            (json.dumps(cv_data.get('experience')) if cv_data and cv_data.get('experience') else None),
            (json.dumps(cv_data.get('education')) if cv_data and cv_data.get('education') else None),
            data.get('cvScore'),
            data.get('atsScore'),
            cv_id,
            user_uuid
        )
        
        result = execute_query(update_query, params, fetch_one=True)
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'CV not found or update failed'
            }), 404
        
        logger.info(f"✅ CV updated successfully: {cv_id}")
        
        return jsonify({
            'success': True,
            'message': 'CV updated successfully',
            'data': {
                'cv_id': str(result['id']),
                'updated_at': result['updated_at'].isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"CV update error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update CV due to system error'
        }), 500

@app.route('/api/cv/<cv_id>', methods=['DELETE'])
def delete_cv(cv_id: str):
    """Delete CV"""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'
        
        # Convert mock user_id to UUID for development
        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        else:
            user_uuid = user_id
        
        # Delete CV (cascade will handle versions, analytics, shares)
        # Soft delete by setting status to archived
        delete_query = "UPDATE user_cvs SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = %s::uuid AND user_id = %s::uuid RETURNING id"
        result = execute_query(delete_query, (cv_id, user_uuid), fetch_one=True)
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'CV not found'
            }), 404
        
        logger.info(f"✅ CV deleted successfully: {cv_id}")
        
        return jsonify({
            'success': True,
            'message': 'CV deleted successfully'
        }), 200
    except Exception as e:
        logger.error(f"CV delete error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete CV due to system error'
        }), 500

@app.route('/api/cv/<cv_id>/duplicate', methods=['POST'])
def duplicate_cv(cv_id: str):
    """Duplicate an existing CV into a new draft (counts towards limit)."""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'

        user_uuid = '550e8400-e29b-41d4-a716-446655440000' if user_id == 'mock_user_candidate' else user_id

        # Enforce limit
        count_query = "SELECT COUNT(*) as cnt FROM user_cvs WHERE user_id = %s::uuid AND COALESCE(status,'draft') <> 'archived'"
        count_row = execute_query(count_query, (user_uuid,), fetch_one=True)
        if count_row and int(count_row.get('cnt', 0)) >= 3:
            return jsonify({'success': False, 'message': 'Maximum 3 CVs allowed. Please archive one first.'}), 400

        # Fetch source CV
        src = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid AND user_id = %s::uuid", (cv_id, user_uuid), fetch_one=True)
        if not src:
            return jsonify({'success': False, 'message': 'CV not found'}), 404

        new_id = str(uuidlib.uuid4())
        new_title = f"Copy of {src['title']}"

        insert_query = """
            INSERT INTO user_cvs (
                id, user_id, title, template_name, personal_info, professional_summary,
                technical_skills, soft_skills, work_experience, education,
                cv_score, ats_score, status, is_visible
            ) VALUES (
                %s::uuid, %s::uuid, %s, %s,
                %s::jsonb, %s, %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb,
                %s, %s, 'draft', FALSE
            )
        """

        execute_query(insert_query, (
            new_id,
            user_uuid,
            new_title,
            src['template_name'],
            json.dumps(src['personal_info']) if src['personal_info'] else json.dumps({}),
            src['professional_summary'],
            json.dumps(src['technical_skills']) if src['technical_skills'] else json.dumps([]),
            json.dumps(src['soft_skills']) if src['soft_skills'] else json.dumps([]),
            json.dumps(src['work_experience']) if src['work_experience'] else json.dumps([]),
            json.dumps(src['education']) if src['education'] else json.dumps([]),
            src['cv_score'] or 0,
            src['ats_score'] or 0
        ), fetch_all=False)

        return jsonify({'success': True, 'message': 'CV duplicated successfully', 'data': {'cv_id': new_id}}), 201

    except Exception as e:
        logger.error(f"CV duplicate error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to duplicate CV due to system error'}), 500
# =====================================================
# VISIBILITY ROUTE
# =====================================================

@app.route('/api/cv/<cv_id>/visible', methods=['PUT'])
def set_cv_visible(cv_id: str):
    """Set a CV as visible (and unset others for the same user)."""
    try:
        # For development: accept mock tokens
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_id = 'mock_user_candidate'
        else:
            user_id = get_jwt_identity() if auth_header else 'anonymous_user'

        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        else:
            user_uuid = user_id

        # Unset other visible CVs
        execute_query("UPDATE user_cvs SET is_visible = FALSE WHERE user_id = %s::uuid AND is_visible = TRUE", (user_uuid,), fetch_all=False)

        # Set this CV visible
        result = execute_query(
            "UPDATE user_cvs SET is_visible = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = %s::uuid AND user_id = %s::uuid RETURNING id",
            (cv_id, user_uuid), fetch_one=True
        )

        if not result:
            return jsonify({'success': False, 'message': 'CV not found'}), 404

        return jsonify({'success': True, 'message': 'CV set as visible'}), 200

    except Exception as e:
        logger.error(f"Set visible error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to update visibility'}), 500

# =====================================================
# SCHOOL PROGRAMS ROUTES
# =====================================================

@app.route('/api/school-programs', methods=['GET'])
def get_school_programs():
    """Get all school programs with filtering and search"""
    try:
        # Get query parameters
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        status = request.args.get('status', 'published')
        featured = request.args.get('featured', '')
        
        # Build query
        query = """
            SELECT 
                sp.*,
                s.name_en as school_name_en,
                s.name_ar as school_name_ar,
                s.location as school_location,
                s.khda_rating,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'name', pt.tag_name,
                            'type', pt.tag_type
                        )
                    ) FILTER (WHERE pt.tag_name IS NOT NULL), 
                    '[]'::json
                ) as tags
            FROM school_programs sp
            JOIN schools s ON sp.school_id = s.id
            LEFT JOIN program_tags pt ON sp.id = pt.program_id
            WHERE 1=1
        """
        
        params = []
        
        if search:
            query += " AND (sp.title_en ILIKE %s OR sp.description_en ILIKE %s)"
            params.extend([f'%{search}%', f'%{search}%'])
            
        if category:
            query += " AND sp.category = %s"
            params.append(category)
            
        if status:
            query += " AND sp.status = %s"
            params.append(status)
            
        if featured:
            query += " AND sp.featured = %s"
            params.append(featured.lower() == 'true')
            
        query += " GROUP BY sp.id, s.name_en, s.name_ar, s.location, s.khda_rating ORDER BY sp.created_at DESC"
        
        programs = execute_query(query, params)
        
        if programs is None:
            return jsonify({'error': 'Database error'}), 500
            
        # Convert to JSON-serializable format
        result = []
        for program in programs:
            program_dict = dict(program)
            # Convert dates to ISO format
            for date_field in ['created_at', 'updated_at', 'start_date', 'end_date', 'application_deadline']:
                if program_dict.get(date_field):
                    if isinstance(program_dict[date_field], datetime):
                        program_dict[date_field] = program_dict[date_field].isoformat()
            
            # Ensure arrays are properly formatted
            for array_field in ['requirements', 'learning_outcomes', 'assessment_methods', 'language_of_instruction', 'schedule_days', 'equipment_provided', 'prerequisites', 'image_urls', 'video_urls']:
                if program_dict.get(array_field) is None:
                    program_dict[array_field] = []
                    
            result.append(program_dict)
            
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_school_programs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/school-programs', methods=['POST'])
def create_school_program():
    """Create a new school program"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Validate required fields
        required_fields = ['title_en', 'school_id', 'category', 'description_en']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Ensure fallback schools exist in database
        ensure_fallback_schools_exist()
        
        # Insert new program
        insert_query = """
            INSERT INTO school_programs (
                title_en, title_ar, school_id, category, status,
                description_en, description_ar, target_age_min, target_age_max,
                capacity_total, capacity_available, fees_amount, fees_currency,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s::uuid, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id
        """
        
        params = (
            data['title_en'],
            data.get('title_ar', data['title_en']),
            data['school_id'],
            data['category'],
            data.get('status', 'draft'),
            data['description_en'],
            data.get('description_ar', data['description_en']),
            data.get('target_age_min', 5),
            data.get('target_age_max', 18),
            data.get('capacity_total', 50),
            data.get('capacity_available', data.get('capacity_total', 50)),
            data.get('fees_amount', 0),
            data.get('fees_currency', 'AED')
        )
        
        result = execute_query(insert_query, params, fetch_one=True)
        
        if not result:
            logger.error("Failed to insert program - no result returned")
            return jsonify({'error': 'Failed to create program'}), 500
            
        program_id = result['id']
        logger.info(f"Program created successfully with ID: {program_id}")
        
        return jsonify({
            'message': 'Program created successfully',
            'program_id': str(program_id),
            'id': str(program_id),
            'success': True
        }), 201
        
    except Exception as e:
        logger.error(f"Error in create_school_program: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'success': False
        }), 500

@app.route('/api/schools', methods=['GET'])
def get_schools():
    """Get all schools"""
    try:
        query = "SELECT * FROM schools WHERE is_active = true ORDER BY name_en"
        schools = execute_query(query)
        
        if schools is None:
            return jsonify({'error': 'Database error'}), 500
            
        result = []
        for school in schools:
            school_dict = dict(school)
            # Convert dates to ISO format
            for date_field in ['created_at', 'updated_at']:
                if school_dict.get(date_field):
                    if isinstance(school_dict[date_field], datetime):
                        school_dict[date_field] = school_dict[date_field].isoformat()
            result.append(school_dict)
            
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in get_schools: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for admin interface"""
    try:
        # Get total programs
        total_query = "SELECT COUNT(*) as total FROM school_programs"
        total_result = execute_query(total_query, fetch_one=True)
        total_programs = total_result['total'] if total_result else 0
        
        # Get published programs
        published_query = "SELECT COUNT(*) as published FROM school_programs WHERE status = 'published'"
        published_result = execute_query(published_query, fetch_one=True)
        published_programs = published_result['published'] if published_result else 0
        
        # Get pending reviews
        pending_query = "SELECT COUNT(*) as pending FROM school_programs WHERE status = 'under_review'"
        pending_result = execute_query(pending_query, fetch_one=True)
        pending_reviews = pending_result['pending'] if pending_result else 0
        
        # Calculate approval rate
        approval_rate = (published_programs / total_programs * 100) if total_programs > 0 else 0
        
        stats = {
            'totalPrograms': total_programs,
            'publishedPrograms': published_programs,
            'pendingReviews': pending_reviews,
            'approvalRate': round(approval_rate, 1),
            'averageApprovalTime': '18 days'
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# =====================================================
# ADMIN PROVIDER MANAGEMENT ROUTES
# =====================================================

@app.route('/api/admin/health', methods=['GET'])
@require_admin_auth
def admin_health_check():
    """Admin health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'admin_features': {
            'provider_management': True,
            'configuration_management': True,
            'health_monitoring': True,
            'audit_logging': True
        },
        'providers_count': len(admin_providers),
        'version': '1.0.0'
    })

@app.route('/api/admin/providers', methods=['GET'])
@require_admin_auth
def list_providers():
    """List all available providers"""
    try:
        providers_list = []
        
        for provider_id, provider in admin_providers.items():
            config = admin_configurations.get(provider_id, {}).get('config', {})
            template = PROVIDER_TEMPLATES.get(provider_id, {})
            
            provider_data = {
                **provider,
                'config': config,
                'available_models': template.get('models', []),
                'default_model': template.get('default_model'),
                'config_schema': template.get('config_schema', {})
            }
            
            providers_list.append(provider_data)
        
        providers_list.sort(key=lambda x: (x['category'], x['name']))
        
        log_admin_action('List Providers', 'all', f"Retrieved {len(providers_list)} providers")
        
        return jsonify({
            'success': True,
            'providers': providers_list,
            'total_count': len(providers_list),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error listing providers: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to list providers: {str(e)}'
        }), 500

# =====================================================
# ERROR HANDLERS
# =====================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401

# JWT error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'message': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'message': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'message': 'Authorization token is required'}), 401

# =====================================================
# INITIALIZATION AND STARTUP
# =====================================================

def initialize_unified_server():
    """Initialize all components of the unified server"""
    logger.info("🔧 Initializing unified server components...")

    # Initialize admin providers
    initialize_default_providers()
    logger.info("✅ Admin providers initialized")

    # Ensure database tables exist within app context
    try:
        with app.app_context():
            ensure_cv_tables_exist()
            ensure_vacancy_tables_exist()
            ensure_fallback_schools_exist()
            logger.info("✅ Database fallback data ensured")
    except Exception as e:
        logger.error(f"Initialization DB ensure error: {e}")

    logger.info("🚀 Unified server initialization complete")

if __name__ == '__main__':
    # Initialize the unified server
    initialize_unified_server()
    
    port = int(os.getenv('PORT', 5003))
    
    print("="*80)
    print("🇦🇪 EMIRATI JOURNEY PLATFORM - UNIFIED BACKEND SERVER")
    print("="*80)
    print(f"🚀 Server starting on port {port}")
    print(f"🔗 Health check: http://localhost:{port}/health")
    print("")
    print("📋 Available Endpoints:")
    print("  🔐 Authentication:")
    print(f"    POST http://localhost:{port}/api/auth/login")
    print(f"    POST http://localhost:{port}/api/auth/register")
    print(f"    GET  http://localhost:{port}/api/auth/profile")
    print("")
    print("  📄 CV Management:")
    print(f"    POST http://localhost:{port}/api/cv/upload")
    print(f"    GET  http://localhost:{port}/api/cv/list")
    print(f"    GET  http://localhost:{port}/api/cv/<cv_id>/export/<format>")
    print("")
    print("  🏫 School Programs:")
    print(f"    GET  http://localhost:{port}/api/school-programs")
    print(f"    POST http://localhost:{port}/api/school-programs")
    print(f"    GET  http://localhost:{port}/api/schools")
    print(f"    GET  http://localhost:{port}/api/admin/dashboard-stats")
    print("")
    print("  ⚙️  Admin Management:")
    print(f"    GET  http://localhost:{port}/api/admin/health")
    print(f"    GET  http://localhost:{port}/api/admin/providers")
    print("")
    print("🔑 Features: Auth + CV Upload + School Programs + Admin APIs")
    print("🌐 CORS: Configured for frontend origins")
    print("🛡️  Security: JWT authentication with role-based access")
    print("="*80)
    
    # Run the unified Flask app
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)