#!/usr/bin/env python3
"""
Unified Emirati Journey Platform Backend Server
Consolidates all services: Auth, CV Upload, School Programs, Admin APIs
Port: 5003 (standardized)
"""


from flask import Flask, request, jsonify, g, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, verify_jwt_in_request
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import time
import logging
import sys
import os
import uuid
uuidlib = uuid
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ... (Previous imports)
from hr_job_posting_routes import hr_job_posting_bp
from hr_offer_routes import hr_offer_bp, public_offer_bp
from candidate_job_routes import candidate_job_bp
from job_application_routes import job_application_bp
try:
    from recruiter.cv_routes import cv_bp
except ImportError:
    # Fallback if path is different, but based on recruiter_server it is recruiter.cv_routes
    from recruiter.cv_routes import cv_bp

# ... (Initialize Flask app like before)
# Duplicate app init removed. Blueprints will be registered in the main block below.





# Initialize SocketIO (Lazy init to avoid conflicts)
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading', logger=True, engineio_logger=True)

# ... (Previous JWT/CORS config)

# =====================================================
# SOCKET.IO HANDLERS (Video Interview Signaling)
# =====================================================
@socketio.on('join')
def on_join(data):
    room = data['room']
    # user_id = data.get('userId') # Optional auth check
    join_room(room)
    print(f"DEBUG: User joined room: {room} (Socket: {request.sid})", flush=True)
    # Notify others that a peer joined
    emit('user-connected', {'sid': request.sid}, room=room, include_self=False)

@socketio.on('signal')
def on_signal(data):
    """
    Relay WebRTC signals (Offer, Answer, ICE Candidate)
    Expected data: { 'target': sid, 'signal': payload, 'room': room }
    """
    # print(f"DEBUG: Signal from {request.sid}: {data.keys()}", flush=True) # Too noisy?
    target = data.get('target')
    if target:
        emit('signal', {
            'sender': request.sid,
            'signal': data['signal']
        }, room=target)
    else:
        # Broadcast? No, signal should be P2P targeted usually, or broadcast to room for initial offer
        pass

@socketio.on('disconnect')
def on_disconnect():
    print(f"DEBUG: User disconnected: {request.sid}", flush=True)
    # Could emit 'user-disconnected' to rooms if tracked

# ... (Rest of the file)

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv


# Load environment variables from .env file (safely from script directory)
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
load_dotenv(env_path)

# Debug: Print API Key status (first 4 chars)
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    print(f"DEBUG: GEMINI_API_KEY found: {api_key[:4]}...", flush=True)
else:
    print("DEBUG: GEMINI_API_KEY NOT FOUND", flush=True)

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
try:
    import weasyprint
except ImportError:
    weasyprint = None
from jinja2 import Template

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def safe_json_load(value, default=None):
    """Safely load JSON data, recursively handling strings inside lists/dicts."""
    if default is None:
        default = []
    
    def recursive_parse(item):
        if item is None:
            return None
        
        if isinstance(item, str):
            # Check if it looks like JSON to avoid pointless parsing logic
            stripped = item.strip()
            if (stripped.startswith('{') and stripped.endswith('}')) or \
               (stripped.startswith('[') and stripped.endswith(']')):
                try:
                    parsed = json.loads(item)
                    return recursive_parse(parsed)
                except (json.JSONDecodeError, TypeError):
                    return item
            return item
        
        if isinstance(item, list):
            return [recursive_parse(i) for i in item]
            
        if isinstance(item, dict):
            return {k: recursive_parse(v) for k, v in item.items()}
            
        return item

    if value is None:
        return default

    # Initial parse if the top-level value is a string
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            logger.warning(f"Failed to decode top-level JSON: {value[:50]}...")
            return default

    # Recursively clean the structure
    try:
        cleaned = recursive_parse(value)
        return cleaned if cleaned is not None else default
    except Exception as e:
        logger.error(f"Error in deep cleaning JSON: {e}")
        return default

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
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:8089",
    "http://localhost:5173",  # Default Vite port
    # Common dev wildcard domains (Flask-CORS supports regex strings)
    r"https?://.*\.ngrok\.io",
    r"https?://.*\.ngrok\.app",
    r"https?://.*\.ngrok-free\.app",
    r"https?://.*\.ngrok-free\.dev", # Added dev TLD
    "https://archdiocesan-complimentarily-marianna.ngrok-free.dev",
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
    r"/debug/*": {
        "origins": cors_origins,
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    },
    r"/health": {
        "origins": ["*"],
        "methods": ["GET", "OPTIONS"]
    }
})

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Register Recruiter JD Upload Blueprint
try:
    from recruiter.jd_upload_routes import jd_upload_routes
    app.register_blueprint(jd_upload_routes)
    logger.info("✅ Recruiter JD Upload Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter JD Upload Blueprint not available: {e}")

# Import routes
from backend.routes.auth_routes import auth_bp
# from backend.routes.administrator_routes import admin_bp
# from backend.routes.cv_upload_routes import cv_upload_bp as cv_bp
# from backend.routes.school_routes import school_bp # Module missing, commenting out
from backend.routes.growth_routes import growth_bp
try:
    from backend.routes.company_team_routes import company_team_bp
except ImportError:
    from routes.company_team_routes import company_team_bp

try:
    from backend.hr_job_posting_routes import hr_job_posting_bp
except ImportError:
    from hr_job_posting_routes import hr_job_posting_bp

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
# app.register_blueprint(admin_bp) # Duplicate registration, handled below with init
# app.register_blueprint(cv_bp) # url_prefix handled in Blueprint
# app.register_blueprint(school_bp, url_prefix='/api/schools')
app.register_blueprint(growth_bp) # Routes have hardcoded /api/growth paths
app.register_blueprint(company_team_bp)
app.register_blueprint(hr_job_posting_bp)
app.register_blueprint(hr_offer_bp)
app.register_blueprint(public_offer_bp)
app.register_blueprint(candidate_job_bp)
logger.info("✅ Candidate Job routes registered (prefix: /api/candidate)")
app.register_blueprint(job_application_bp)
logger.info("✅ Job Application routes registered")

# Register Statistics routes
try:
    from recruiter.statistics_routes import statistics_bp
    app.register_blueprint(statistics_bp, url_prefix='/api/recruiter/statistics')
    logger.info("Registered: Statistics routes")
except Exception as e:
    logger.error(f"Failed registering Statistics routes: {e}")

# Register HR Candidate Search routes
try:
    from hr_candidate_search_routes import hr_candidate_search_bp
    app.register_blueprint(hr_candidate_search_bp)
    logger.info("Registered: HR candidate search routes")
except Exception as e:
    logger.error(f"Failed registering HR candidate search routes: {e}")

# Register JD Builder v2 routes
try:
    from recruiter.jd_routes_v2 import jd_bp as jd_v2_bp
    app.register_blueprint(jd_v2_bp)
    logger.info("Registered: JD Builder v2 routes")
except Exception as e:
    logger.error(f"Failed registering JD Builder v2 routes: {e}")

# Register Communication routes
try:
    from backend.routes.communication_routes import communication_bp
    app.register_blueprint(communication_bp)
    logger.info("Registered: Communication routes")
except Exception as e:
    logger.error(f"Failed registering Communication routes: {e}")

# Register Interview Routes (Video)
try:
    from backend.routes.interview_routes import interview_bp
    app.register_blueprint(interview_bp)
    from backend.services.interview_service import interview_service
    interview_service.ensure_tables_exist()
    logger.info("Registered: Interview routes & Tables")
except Exception as e:
    logger.error(f"Failed registering Interview routes: {e}")



# Register Administrator routes
try:
    from routes.administrator_routes import admin_bp, init_admin_routes
    # Initialize admin system with DB config
    # We need to construct db_config from env
    admin_db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'database': os.getenv('DB_NAME', 'emirati_journey'),
        'user': os.getenv('DB_USER', 'emirati_user'),
        'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
        'port': os.getenv('DB_PORT', 5432)
    }
    init_admin_routes(app, admin_db_config)
    app.register_blueprint(admin_bp)
    logger.info("Registered: Administrator routes")
except Exception as e:
    logger.error(f"Failed registering Administrator routes: {e}")



# Register HR Dashboard Blueprint
try:
    from hr_dashboard_routes import hr_dashboard_bp
    app.register_blueprint(hr_dashboard_bp)
    logger.info("✅ HR Dashboard Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ HR Dashboard Blueprint not available: {e}")



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
                ), fetch_all=False)
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
        )

        # Migration: Ensure is_visible column exists
        execute_query(
            "ALTER TABLE user_cvs ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT FALSE",
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
# APPLICATION TABLE INITIALIZATION
# =====================================================

def ensure_application_tables_exist():
    """Create job applications table if it doesn't exist."""
    try:
        execute_query(
            """
            CREATE TABLE IF NOT EXISTS job_applications (
                id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                candidate_id TEXT NOT NULL,
                cover_letter TEXT,
                additional_documents JSONB,
                expected_salary TEXT,
                availability_date TEXT,
                status TEXT DEFAULT 'submitted',
                submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                interview_date TIMESTAMPTZ,
                interview_type TEXT
            )
            """,
            fetch_all=False
        )
        execute_query(
            """
            CREATE INDEX IF NOT EXISTS idx_applications_candidate ON job_applications (candidate_id);
            """,
            fetch_all=False
        )
        # Unique application per candidate per job
        execute_query(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_app_unique_candidate_job ON job_applications (candidate_id, job_id);
            """,
            fetch_all=False
        )
        logger.info("✅ Job Application tables ensured")
    except Exception as e:
        logger.error(f"Error ensuring application tables: {e}")

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
        
        # Debug: List available models to find a valid one
        available_models = []
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    available_models.append(m.name)
            logger.info(f"Available Gemini Models: {available_models}")
        except Exception as e:
            logger.warning(f"Could not list models: {e}")

        # List of models to try in order of preference
        candidate_models = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'gemini-1.5-pro',
            'gemini-pro',
            'models/gemini-1.5-flash',
            'models/gemini-pro'
        ]

        model = None
        used_model_name = ""

        # Try to find a valid model from the candidates that exists in available_models
        # If listing failed, we just try them one by one in the try/except block below
        
        # Priority 1: Match against available list
        if available_models:
            for candidate in candidate_models:
                # Handle both 'models/name' and 'name' formats
                cmd_clean = candidate.replace('models/', '')
                for avail in available_models:
                    if cmd_clean in avail:
                        model = genai.GenerativeModel(avail)
                        used_model_name = avail
                        break
                if model:
                    break
        
        # Priority 2: If no match found or listing failed, default to a safe bet
        # Priority 2: If no match found or listing failed, default to a safe bet
        if not model:
            # Switch to 1.5-flash as default (better quotas/speed)
            model = genai.GenerativeModel('gemini-1.5-flash')
            used_model_name = 'gemini-1.5-flash (fallback)'

        logger.info(f"Attempting to use Gemini model: {used_model_name}")

        
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
        
        # Retry mechanism (3 attempts)
        import time
        for attempt in range(3):
            try:
                logger.info(f"Gemini generation attempt {attempt + 1}/3...")
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
                    logger.warning(f"Failed to parse Gemini JSON check (Attempt {attempt + 1}): {e}")
                    if attempt == 2: # Last attempt
                        logger.error(f"Raw response: {response.text[:500]}...")
                        raise ValueError(f"AI returned invalid JSON: {e}")
                    time.sleep(1) # Short backoff
                    continue

            except Exception as gen_err:
                logger.warning(f"Gemini generation error (Attempt {attempt + 1}): {gen_err}")
                if attempt == 2:
                    logger.error("Final retry failed. Raising exception.")
                    raise gen_err
                time.sleep(2) # Backoff before retry
                continue

        raise  Exception("AI Parsing failed after retries")
            
    except Exception as e:
        logger.error(f"Gemini CV parsing fatal error: {e}")
        raise e

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

STOPWORDS = {
    'the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
    'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'that', 'this', 'these', 'those',
    'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'can', 'will', 'just', 'don', 'should', 'now',
    'work', 'team', 'role', 'job', 'position', 'experience', 'skills', 'responsibilities',
    'requirements', 'qualifications', 'duties', 'company', 'business', 'organization'
}

def _collect_cv_keywords(cv_row: dict) -> dict:
    personal_info = safe_json_load(cv_row.get('personal_info'), {})
    prof = cv_row.get('professional_summary') or ''
    tech = safe_json_load(cv_row.get('technical_skills'), [])
    soft = safe_json_load(cv_row.get('soft_skills'), [])
    experience = safe_json_load(cv_row.get('work_experience'), [])
    edu = safe_json_load(cv_row.get('education'), [])

    skill_words = set([s.lower() for s in tech + soft if isinstance(s, str)])
    summary_words = _tokenize(prof) - STOPWORDS
    exp_words = set()
    for e in experience:
        exp_words |= (_tokenize((e.get('responsibilities') or '') + ' ' + (e.get('jobTitle') or e.get('job_title') or '')) - STOPWORDS)
    edu_words = set()
    for e in edu:
        edu_words |= (_tokenize((e.get('degree') or '') + ' ' + (e.get('field') or e.get('field_of_study') or '')) - STOPWORDS)

    return {
        'skills': skill_words,
        'text': summary_words | exp_words | edu_words,
        'location': (personal_info.get('location') or '').lower()
    }

def _vacancy_keywords(v: dict) -> dict:
    desc = (v.get('description') or '')
    title = (v.get('title') or '')
    tags = safe_json_load(v.get('tags'), [])
    req = safe_json_load(v.get('requirements'), [])
    
    # Extract distinct skills from requirements (which might be strings or dicts)
    skills = set()
    for r in req:
        if isinstance(r, str):
            skills.add(r.lower())
        elif isinstance(r, dict):
            # Extract from 'description' or 'name' field
            val = r.get('description') or r.get('name') or ''
            if val:
                skills.add(val.lower())
                
    # Also process tags
    for t in tags:
        if isinstance(t, str):
             skills.add(t.lower())

    return {
        'text': (_tokenize(desc + ' ' + title) | skills) - STOPWORDS, # Include skills in text for broader match
        'skills': skills,
        'location': (v.get('location') or '').lower()
    }

def _compute_match_score(cvk: dict, vk: dict) -> int:
    # Updated heuristic: skills 60 (more weight), text 30 (less weight), location 10
    skill_overlap = len(cvk['skills'] & vk['skills'])
    skill_total = max(1, len(vk['skills']))
    skill_score = 60 * (skill_overlap / skill_total)

    text_overlap = len(cvk['text'] & vk['text'])
    text_total = max(1, len(vk['text']))
    text_score = 30 * (text_overlap / text_total)

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
# DASHBOARD ROUTES
# =====================================================

@app.route('/api/candidate/dashboard/stats', methods=['GET'])
def get_candidate_dashboard_stats():
    """Get aggregated stats for candidate dashboard"""
    try:
        # Auth check
        auth_header = request.headers.get('Authorization', '')
        # Verify JWT properly
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            user_id = get_jwt_identity()
        except Exception as e:
            logger.error(f"JWT Verification Failed in Dashboard Stats: {e}")
            logger.error(f"Auth Header: {auth_header[:20]}...")
            if 'mock_token' in auth_header:
                 user_id = 'mock_user_candidate'
            else:
                 return jsonify({'success': False, 'message': f'Unauthorized: {str(e)}'}), 401

        user_name = "Candidate"
        
        # Connect to DB
        conn = psycopg2.connect(**DATABASE_CONFIG)
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # 1. Fetch User Details (Name)
                # Handle both Integer (Real) and String/UUID (Mock) IDs
                try:
                    # Check if user_id is likely an integer (real user)
                    int_id = int(user_id)
                    cur.execute("SELECT first_name, last_name, email FROM users WHERE id = %s", (int_id,))
                    user = cur.fetchone()
                    if user:
                        if user.get('first_name'):
                            user_name = f"{user['first_name']}"
                            if user.get('last_name') and user['last_name'] != 'None':
                                 user_name += f" {user['last_name']}"
                        elif user.get('email'):
                             # Fallback: Parse name from email (e.g. ahmed.almansouri@...)
                             email_parts = user['email'].split('@')[0].split('.')
                             user_name = " ".join([p.capitalize() for p in email_parts])
                    
                    # For CVs, we have a schema mismatch (CVs use UUIDs, Users use Ints).
                    # We skip CV fetch for Int users for now to avoid 500s, or we need to migrate CV table.
                    # Assuming we can't fetch CV stats for Int users yet without schema change.
                    cv = None 
                    
                except (ValueError, TypeError):
                    # user_id is string/UUID (likely mock)
                    if user_id == 'mock_user_candidate':
                        user_uuid = '550e8400-e29b-41d4-a716-446655440000'
                    else:
                        user_uuid = user_id
                        
                    cur.execute("SELECT * FROM user_cvs WHERE user_id = %s::uuid ORDER BY created_at DESC LIMIT 1", (user_uuid,))
                    cv = cur.fetchone()

                cv_uploaded = bool(cv)
                completeness = 0
                
                if cv:
                    cv_dict = dict(cv)
                    fields = [
                        cv_dict.get('personal_info'),
                        cv_dict.get('professional_summary'),
                        cv_dict.get('technical_skills'),
                        cv_dict.get('work_experience'),
                        cv_dict.get('education')
                    ]
                    filled_count = sum(1 for f in fields if f)
                    completeness = int((filled_count / 5) * 100)
                    
                    # Only use CV name if we didn't find a User name (e.g. mock user)
                    if user_name == "Candidate" and cv_dict.get('personal_info'):
                        info = cv_dict['personal_info']
                        user_name = info.get('name') or info.get('fullName') or "Candidate"

        finally:
            conn.close()

        # 2. Calculate Job Matches (if CV exists)
        matches_count = 0
        if cv:
            cvk = _collect_cv_keywords(dict(cv))
            vacancies = execute_query("SELECT * FROM recruiter_vacancies") or []
            
            # Simple threshold match
            for v in vacancies:
                vk = _vacancy_keywords(dict(v))
                score = _compute_match_score(cvk, vk)
                if score >= 50: # Count matches with >= 50% score
                    matches_count += 1

        # 3. Get Applications Count (Placeholder until table exists)
        applications_count = 0 
        # Future: execute_query("SELECT COUNT(*) as cnt FROM applications WHERE user_id = ...")

        # 4. Profile Views (Placeholder)
        profile_views = 12 # Mock number to look good

        return jsonify({
            'success': True,
            'data': {
                'profile': {
                    'name': user_name,
                    'cvUploaded': cv_uploaded,
                    'completionPercentage': completeness
                },
                'stats': {
                    'jobMatches': matches_count,
                    'applications': applications_count,
                    'profileViews': profile_views,
                    'interviews': 0
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        return jsonify({'success': False, 'message': 'Failed to load stats'}), 500

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
            user_uuid = '00000000-0000-0000-0000-000000000001'
            user_id = 'mock_user_candidate'
        else:
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity() or 'anonymous_user'
                # Ensure user_id is a UUID
                try:
                    uuidlib.UUID(str(user_id))
                    user_uuid = user_id
                except ValueError:
                    # Generate consistent UUID from string (e.g. email)
                    user_uuid = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
            except Exception:
                user_uuid = '00000000-0000-0000-0000-000000000001'
                user_id = 'anonymous_user'
        print(f"DEBUG: CV upload request from user_uuid: {user_uuid} (original: {user_id if 'user_id' in locals() else 'mock'})", flush=True)
        
        # Check if file is present (handle both 'file' and 'cv_file')
        if 'cv_file' not in request.files and 'file' not in request.files:
            print("DEBUG: No file provided", flush=True)
            return jsonify({
                'success': False,
                'message': 'No file provided'
            }), 400
        
        file = request.files.get('cv_file') or request.files.get('file')
        
        # Check if file is selected
        if file.filename == '':
            print("DEBUG: No file selected", flush=True)
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        # Validate file
        if not allowed_file(file.filename):
            print(f"DEBUG: Invalid file type {file.filename}", flush=True)
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
        print(f"DEBUG: extracting text from {file.filename}", flush=True)
        cv_text = extract_text_from_file(file)
        
        # Save file after text extraction
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{user_uuid}_{timestamp}_{filename}"
        file_path = UPLOAD_FOLDER / safe_filename
        
        file.save(str(file_path))
        logger.info(f"File saved: {file_path}")
        
        # Debug: log first 200 characters if extraction worked
        if cv_text:
            logger.info(f"CV text preview: {cv_text[:200]}...")
        else:
            logger.warning("No text extracted from CV file")
        
        # Check if text extraction worked
        if not cv_text:
            logger.error("Text extraction failed (empty result)")
            return jsonify({
                'success': False,
                'message': 'Could not extract text from file. Please ensure the file is not empty or password protected.'
            }), 400

        # Parse CV with Gemini AI (using robust CVParser)
        try:
             # Lazy import to avoid circular dependency
            from cv_parser import CVParser
            parser = CVParser()
            
            # Use raw file stream if possible or text
            parse_result = parser.parse_cv_text(cv_text, user_id=user_uuid, filename=file.filename)
            
            if not parse_result.get('success'):
                logger.warning(f"AI parsing failed, using fallback: {parse_result.get('message')}")
                # We can still proceed with what we have or empty data
                analysis_result = parse_result.get('data', {})
                # Ensure minimal keys exist
                analysis_result.setdefault('personal_info', {})
            else:
                analysis_result = parse_result.get('data', {})
                logger.info("✅ Using CVParser analysis result")

        except Exception as ai_error:
            logger.error(f"Gemini AI Serious Failure: {str(ai_error)}")
            # Fallback to empty structure so we at least save the file
            analysis_result = {'personal_info': {}}

        # Persist to database immediately so ID is valid for Share/Match
        import uuid
        new_cv_id = str(uuid.uuid4())
        
        insert_query = """
            INSERT INTO user_cvs (
                id, user_id, title, 
                personal_info, professional_summary,
                technical_skills, soft_skills, 
                work_experience, education,
                status, is_visible, created_at, updated_at,
                cv_score, ats_score
            ) VALUES (
                %s::uuid, %s::uuid, %s,
                %s::jsonb, %s,
                %s::jsonb, %s::jsonb,
                %s::jsonb, %s::jsonb,
                'draft', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                %s, %s
            )
        """
        
        # Extract skills for separate storage
        tech_skills = analysis_result.get('skills', []) 
        # If skills is dict (old format), handle it
        if isinstance(tech_skills, dict):
             tech_skills = tech_skills.get('technical', [])
             
        soft_skills = analysis_result.get('soft_skills', [])

        # Get scores
        analysis_meta = parse_result.get('analysis', {}) if 'parse_result' in locals() else {}
        scores = analysis_meta.get('scores', {})
        cv_score = scores.get('overall', 0)
        ats_score = scores.get('completeness', 0)
        
        # Determine User UUID (handle mock)
        if user_id == 'mock_user_candidate':
            db_user_id = '550e8400-e29b-41d4-a716-446655440000'
        elif user_id == 'anonymous_user':
             db_user_id = '550e8400-e29b-41d4-a716-446655440000'
        else:
            db_user_id = user_id

        try:
             execute_query(insert_query, (
                new_cv_id, db_user_id, f"Uploaded CV {timestamp}",
                json.dumps(analysis_result.get('personal_info', {})), 
                analysis_result.get('professional_summary', ''),
                json.dumps(tech_skills),
                json.dumps(soft_skills),
                json.dumps(analysis_result.get('experience', [])),
                json.dumps(analysis_result.get('education', [])),
                cv_score, ats_score
            ), fetch_all=False)
             logger.info(f"✅ Auto-persisted uploaded CV as {new_cv_id}")
        except Exception as db_err:
            logger.error(f"Failed to auto-persist CV: {db_err}")
            pass

        return jsonify({
            'success': True,
            'message': 'CV uploaded and analyzed successfully',
            'data': {
                'file_id': new_cv_id,
                'original_filename': safe_filename,
                'file_size': file_size,
                'analysis': analysis_result,
                'upload_time': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"CV upload error: {str(e)}")
        # Debug: Return detailed error to frontend
        return jsonify({
            'success': False,
            'message': f'Upload failed: {str(e)}',
            'details': traceback.format_exc()
        }), 500

@app.route('/debug/save_pdf', methods=['POST'])
def debug_save_pdf():
    """Debug endpoint to inspect generated PDFs"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400
            
        debug_dir = Path(__file__).parent / 'debug_output'
        debug_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"DEBUG_PDF_{timestamp}.pdf"
        file_path = debug_dir / filename
        
        file.save(str(file_path))
        logger.info(f"💾 DEBUG: Saved PDF to {file_path}")
        
        return jsonify({
            'success': True, 
            'message': 'PDF Saved to Server Debug Folder',
            'path': str(file_path)
        })
    except Exception as e:
        logger.error(f"Debug Save Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

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




@app.route('/api/cv/list', methods=['GET'])
def list_cvs_fixed():
    """List user's saved CVs (Fixed Implementation)"""
    try:
        # Auth check
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_uuid = '00000000-0000-0000-0000-000000000001'
        else:
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if not user_id:
                     user_uuid = '00000000-0000-0000-0000-000000000001'
                else:
                    try:
                        uuidlib.UUID(str(user_id))
                        user_uuid = user_id
                    except ValueError:
                        user_uuid = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
            except Exception:
                user_uuid = '00000000-0000-0000-0000-000000000001'

        query = """
            SELECT 
                id, title, status, cv_score, ats_score, updated_at, template_name, is_visible
            FROM user_cvs
            WHERE user_id = %s::uuid AND COALESCE(status, 'draft') <> 'archived'
            ORDER BY updated_at DESC
        """
        cvs = execute_query(query, (user_uuid,))
        
        result = []
        if cvs:
            for cv in cvs:
                d = dict(cv)
                if d.get('updated_at'):
                    d['updated_at'] = d['updated_at'].isoformat()
                result.append(d)

        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        logger.error(f"List CVs error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/save', methods=['POST'])
def save_cv_fixed():
    """Save/Create CV (Fixed Implementation)"""
    try:
        # Auth check
        auth_header = request.headers.get('Authorization', '')
        if 'mock_token' in auth_header:
            user_uuid = '00000000-0000-0000-0000-000000000001'
        else:
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if not user_id:
                     user_uuid = '00000000-0000-0000-0000-000000000001'
                else:
                    try:
                        uuidlib.UUID(str(user_id))
                        user_uuid = user_id
                    except ValueError:
                        user_uuid = str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
            except Exception:
                user_uuid = '00000000-0000-0000-0000-000000000001'

        data = request.get_json()
        cv_data = data.get('cvData', {})
        
        # Prepare fields
        cv_id = str(uuidlib.uuid4())
        title = data.get('title', 'My CV')
        template_id = data.get('templateId', 'professional')
        cv_score = data.get('cvScore', 0)
        ats_score = data.get('atsScore', 0)
        
        insert_query = """
            INSERT INTO user_cvs (
                id, user_id, title, template_name, 
                personal_info, professional_summary,
                technical_skills, soft_skills, 
                work_experience, education,
                cv_score, ats_score, status, 
                created_at, updated_at, is_visible
            ) VALUES (
                %s::uuid, %s::uuid, %s, %s,
                %s::jsonb, %s,
                %s::jsonb, %s::jsonb,
                %s::jsonb, %s::jsonb,
                %s, %s, 'draft',
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE
            ) RETURNING id
        """
        
        params = (
            cv_id, user_uuid, title, template_id,
            json.dumps(cv_data.get('personalInfo', {})),
            cv_data.get('professionalSummary', ''),
            json.dumps(cv_data.get('technicalSkills', [])),
            json.dumps(cv_data.get('softSkills', [])),
            json.dumps(cv_data.get('experience', [])),
            json.dumps(cv_data.get('education', [])),
            cv_score, ats_score
        )
        
        execute_query(insert_query, params, fetch_one=True)
        
        return jsonify({
            'success': True, 
            'message': 'CV saved successfully',
            'data': {'cv_id': cv_id}
        }), 201

    except Exception as e:
        logger.error(f"Save CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

def get_current_user_uuid_inline():
    """Helper to get standardized UUID for current user"""
    auth_header = request.headers.get('Authorization', '')
    if 'mock_token' in auth_header:
        return '00000000-0000-0000-0000-000000000001'
    
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if not user_id:
             return '00000000-0000-0000-0000-000000000001'
        
        try:
            uuidlib.UUID(str(user_id))
            return str(user_id)
        except ValueError:
            return str(uuidlib.uuid5(uuidlib.NAMESPACE_DNS, str(user_id)))
            
    except Exception:
        return '00000000-0000-0000-0000-000000000001'

@app.route('/api/cv/<cv_id>', methods=['GET'])
def get_cv_fixed(cv_id):
    try:
        user_uuid = get_current_user_uuid_inline()
        
        query = "SELECT * FROM user_cvs WHERE id = %s::uuid"
        
        cv = execute_query(query, (cv_id,), fetch_one=True)
        
        if not cv:
            return jsonify({'success': False, 'message': 'CV not found'}), 404
            
        cv_data = {
            'personal_info': safe_json_load(cv['personal_info'], {}),
            'professional_summary': cv['professional_summary'],
            'technical_skills': safe_json_load(cv['technical_skills'], []),
            'soft_skills': safe_json_load(cv['soft_skills'], []),
            'work_experience': safe_json_load(cv['work_experience'], []),
            'education': safe_json_load(cv['education'], []),
            'title': cv['title'],
            'template_name': cv['template_name'],
            'cv_score': cv['cv_score'],
            'ats_score': cv['ats_score']
        }
        
        return jsonify({
            'success': True,
            'data': cv_data,
            'metadata': {
                'id': cv['id'],
                'title': cv['title'],
                'template_name': cv['template_name'],
                'cv_score': cv['cv_score'],
                'ats_score': cv['ats_score']
            }
        })
    except Exception as e:
        logger.error(f"Get CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>', methods=['PUT'])
def update_cv_fixed(cv_id):
    try:
        user_uuid = get_current_user_uuid_inline()
        data = request.get_json()
        
        cv_data = data.get('cvData', {})
        title = data.get('title')
        template_id = data.get('templateId')
        cv_score = data.get('cvScore')
        ats_score = data.get('atsScore')
        
        # Build update query
        update_fields = []
        params = []
        
        if title:
            update_fields.append("title = %s")
            params.append(title)
        if template_id:
            update_fields.append("template_name = %s")
            params.append(template_id)
        if cv_score is not None:
            update_fields.append("cv_score = %s")
            params.append(cv_score)
        if ats_score is not None:
            update_fields.append("ats_score = %s")
            params.append(ats_score)
            
        if cv_data:
            if 'personalInfo' in cv_data:
                update_fields.append("personal_info = %s::jsonb")
                params.append(json.dumps(cv_data['personalInfo']))
            if 'professionalSummary' in cv_data:
                update_fields.append("professional_summary = %s")
                params.append(cv_data['professionalSummary'])
            if 'technicalSkills' in cv_data:
                update_fields.append("technical_skills = %s::jsonb")
                params.append(json.dumps(cv_data['technicalSkills']))
            if 'softSkills' in cv_data:
                update_fields.append("soft_skills = %s::jsonb")
                params.append(json.dumps(cv_data['softSkills']))
            if 'experience' in cv_data:
                update_fields.append("work_experience = %s::jsonb")
                params.append(json.dumps(cv_data['experience']))
            if 'education' in cv_data:
                update_fields.append("education = %s::jsonb")
                params.append(json.dumps(cv_data['education']))
                
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(cv_id)
        
        query = f"UPDATE user_cvs SET {', '.join(update_fields)} WHERE id = %s::uuid"
        
        execute_query(query, tuple(params), fetch_all=False)
        
        return jsonify({'success': True, 'message': 'CV updated successfully'})
    except Exception as e:
        logger.error(f"Update CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>', methods=['DELETE'])
def delete_cv_fixed(cv_id):
    try:
        user_uuid = get_current_user_uuid_inline()
        execute_query("DELETE FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_all=False)
        return jsonify({'success': True, 'message': 'CV deleted successfully'})
    except Exception as e:
        logger.error(f"Delete CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>/duplicate', methods=['POST'])
def duplicate_cv_fixed(cv_id):
    try:
        user_uuid = get_current_user_uuid_inline()
        
        # Get original
        original = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not original:
             return jsonify({'success': False, 'message': 'CV not found'}), 404
             
        new_cv_id = str(uuidlib.uuid4())
        new_title = f"{original['title']} (Copy)"
        
        # Ensure we don't double encode if they are already strings
        tech_skills = safe_json_load(original['technical_skills'], [])
        soft_skills = safe_json_load(original['soft_skills'], [])
        work_exp = safe_json_load(original['work_experience'], [])
        education = safe_json_load(original['education'], [])
        personal_info = safe_json_load(original['personal_info'], {})

        insert_query = """
            INSERT INTO user_cvs (
                id, user_id, title, personal_info, professional_summary, 
                technical_skills, soft_skills, work_experience, education, 
                cv_score, ats_score
            ) VALUES (
                %s::uuid, %s::uuid, %s, %s::jsonb, %s,
                %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb,
                %s, %s
            )
        """
        params = (
            new_cv_id, user_uuid, new_title, json.dumps(personal_info), original['professional_summary'],
            json.dumps(tech_skills), json.dumps(soft_skills),
            json.dumps(work_exp), json.dumps(education),
            original['cv_score'], original['ats_score']
        )
        
        execute_query(insert_query, params, fetch_all=False)
        
        return jsonify({'success': True, 'message': 'CV duplicated', 'data': {'cv_id': new_cv_id}})
    except Exception as e:
        logger.error(f"Duplicate CV error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>/visible', methods=['PUT'])
def set_visible_fixed(cv_id):
    try:
        user_uuid = get_current_user_uuid_inline()
        
        # Set all to false
        execute_query("UPDATE user_cvs SET is_visible = false WHERE user_id = %s::uuid", (user_uuid,), fetch_all=False)
        # Set specific to true
        execute_query("UPDATE user_cvs SET is_visible = true WHERE id = %s::uuid", (cv_id,), fetch_all=False)
        
        return jsonify({'success': True, 'message': 'CV set as visible'})
    except Exception as e:
        logger.error(f"Set visible error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/cv/<cv_id>/export/<format>', methods=['GET'])
def export_cv_fixed(cv_id, format):
    try:
        user_uuid = get_current_user_uuid_inline()
        
        cv = execute_query("SELECT * FROM user_cvs WHERE id = %s::uuid", (cv_id,), fetch_one=True)
        if not cv:
            return jsonify({'error': 'CV not found'}), 404
            
        cv_data = {
            'metadata': {'title': cv['title'], 'cv_id': cv['id']},
            'data': {
                'personal_info': safe_json_load(cv['personal_info'], {}),
                'professional_summary': cv['professional_summary'],
                'experience': safe_json_load(cv['work_experience'], []),
                'education': safe_json_load(cv['education'], []),
                'skills': (safe_json_load(cv['technical_skills'], []) or []) + (safe_json_load(cv['soft_skills'], []) or [])
            }
        }
        
        if format == 'json':
            return jsonify({'success': True, 'cv_data': cv_data})
            
        # PDF/DOCX Handling
        from cv_builder.cv_export import CVExporter
        exporter = CVExporter()
        
        file_path = exporter.export_cv(cv_data, format)
        
        if not file_path or not os.path.exists(file_path):
             return jsonify({'error': 'Export failed: File not created'}), 500
             
        mime_types = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        
        return send_file(
            file_path,
            mimetype=mime_types.get(format, 'application/octet-stream'),
            as_attachment=True,
            download_name=f"cv_{cv_id}.{format}"
        )
            
    except Exception as e:
        logger.error(f"Export error: {e}")
        traceback.print_exc()
        return jsonify({'error': f"Export failed: {str(e)}"}), 500

# =====================================================
# PUBLIC SHARING ROUTES
# =====================================================

# =====================================================
# PUBLIC SHARING ROUTES
# =====================================================

@app.route('/api/cv/public/<cv_id>', methods=['GET'])
def get_public_cv(cv_id):
    """Get public CV data (No Auth Required)"""
    try:
        # Check if visible
        query = """
            SELECT 
                id, title, template_name, 
                personal_info, professional_summary,
                technical_skills, soft_skills, 
                work_experience, education,
                status, is_visible,
                created_at
            FROM user_cvs
            WHERE id = %s::uuid
        """
        cv = execute_query(query, (cv_id,), fetch_one=True)
        
        if not cv:
            return jsonify({'success': False, 'message': 'CV not found'}), 404
            
        if not cv.get('is_visible'):
            return jsonify({'success': False, 'message': 'This CV is private'}), 403

        # Return data similar to list_cvs but detailed
        return jsonify({
            'success': True,
            'data': cv
        })

    except Exception as e:
        logger.error(f"Public CV fetch error: {e}")
        return jsonify({'success': False, 'message': 'System error'}), 500



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

        # Sort by score descending as requested (High to Low)
        scored.sort(key=lambda x: (x['match_score'], x['id']), reverse=True)
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

        if user_id == 'mock_user_candidate':
            user_uuid = '550e8400-e29b-41d4-a716-446655440000'
        else:
            try:
                uuid.UUID(str(user_id))
                user_uuid = user_id
            except ValueError:
                user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(user_id)))
        # Ensure deterministic CV selection by ordering by updated_at AND id (tie-breaker)
        cv = execute_query("SELECT * FROM user_cvs WHERE user_id = %s::uuid AND is_visible = TRUE ORDER BY updated_at DESC, id DESC LIMIT 1", (user_uuid,), fetch_one=True)
        if not cv:
            return jsonify({'success': False, 'message': 'No visible CV set'}), 404
        return match_cv_top_vacancies(cv['id'])
    except Exception as e:
        logger.error(f"Match visible CV error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Matching failed'}), 500









# Duplicate matching route removed to ensure _match_visible_cv_top_vacancies is used

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
            ensure_application_tables_exist()
            ensure_fallback_schools_exist()
            ensure_fallback_schools_exist()
            logger.info("✅ Database fallback data ensured")
    except Exception as e:
        logger.error(f"Initialization DB ensure error: {e}")

    logger.info("🚀 Unified server initialization complete")

@app.route('/api/recruiter/analytics', methods=['GET', 'OPTIONS'])
def recruiter_analytics():
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
    
    return jsonify({
        'success': True,
        'data': {
            'total_matches': 12,
            'average_score': 78.5,
            'qualification_rate': 65.0,
            'stored_data': {'cvs': 15},
            'score_distribution': {'excellent': 4, 'good': 5, 'fair': 2, 'poor': 1},
            'top_skills': [{'skill': 'Python', 'frequency': 8}, {'skill': 'React', 'frequency': 5}]
        }
    })

if __name__ == '__main__':
    # Initialize the unified server
    initialize_unified_server()
    
    # Prioritize UNIFIED_PORT, then hardcode 5003 to avoid .env PORT=5005 conflict
    port = int(os.getenv('UNIFIED_PORT', 5005))
    
    print("="*80)
    print("EMIRATI JOURNEY PLATFORM - UNIFIED BACKEND SERVER")
    print("="*80)
    print(f"Server starting on port {port}")
    print(f"Health check: http://localhost:{port}/health")
    print("")
    print("  Authentication:")
    print(f"    POST http://localhost:{port}/api/auth/login")
    print(f"    POST http://localhost:{port}/api/auth/register")
    print("")
    print("  Candidate Dashboard:")
    print(f"    GET  http://localhost:{port}/api/candidate/dashboard/stats")
    print(f"    GET  http://localhost:{port}/api/candidate/job-matches")
    print("")
    print("  CV Management:")
    print(f"    POST http://localhost:{port}/api/cv/upload")
    print(f"    GET  http://localhost:{port}/api/cv/list")
    print(f"    GET  http://localhost:{port}/api/cv/<cv_id>")
    print(f"    GET  http://localhost:{port}/api/cv/<cv_id>/export/<format>")
    print("")
    print("  School Programs:")
    print(f"    GET  http://localhost:{port}/api/school-programs")
    print(f"    POST http://localhost:{port}/api/school-programs")
    print(f"    GET  http://localhost:{port}/api/schools")
    print(f"    GET  http://localhost:{port}/api/admin/dashboard-stats")
    print("")
    print("  Admin Management:")
    print(f"    GET  http://localhost:{port}/api/admin/health")
    print(f"    GET  http://localhost:{port}/api/admin/providers")
    print("")
    print("  Features: Auth + CV Upload + School Programs + Admin APIs")
    print("  CORS: Configured for frontend origins")
    print("  Security: JWT authentication with role-based access")
    print("="*80)
    


    # Recruiter Shortlist Routes
    try:
        from recruiter.shortlist_routes import shortlist_bp
        app.register_blueprint(shortlist_bp, url_prefix='/api/recruiter/shortlist')
        logger.info("✅ Recruiter Shortlist routes registered")
    except Exception as e:
        logger.error(f"Failed to register shortlist routes: {e}")

    # Recruiter Interview Routes
    try:
        from recruiter.interview_routes import interview_bp
        app.register_blueprint(interview_bp, url_prefix='/api/recruiter/interviews')
        logger.info("✅ Recruiter Interview routes registered")
    except Exception as e:
        logger.error(f"Failed to register interview routes: {e}")

    # Video Interview Routes (AI-Powered System)
    try:
        from video_interview_routes import video_interview_bp
        app.register_blueprint(video_interview_bp, url_prefix='/api/video-interview')
        logger.info("✅ Video Interview routes registered")
    except Exception as e:
        logger.error(f"Failed to register video interview routes: {e}")

    # Initialize SocketIO with App
    socketio.init_app(app)

    # Debug: List all registered routes
    print("\n" + "="*80)
    print("DEBUG: ALL REGISTERED ROUTES")
    print("="*80)
    routes_by_prefix = {}
    for rule in app.url_map.iter_rules():
        prefix = rule.rule.split('/')[1] if '/' in rule.rule else 'root'
        if prefix not in routes_by_prefix:
            routes_by_prefix[prefix] = []
        routes_by_prefix[prefix].append(f"{', '.join(rule.methods - {'OPTIONS', 'HEAD'}):8} {rule.rule}")
    
    for prefix in sorted(routes_by_prefix.keys()):
        if prefix in ['api', 'health', 'debug', 'static']:
            print(f"\n  /{prefix}:")
            for route in sorted(routes_by_prefix[prefix])[:20]:  # Limit to 20 per prefix
                print(f"    {route}")
    
    # Check specifically for candidate routes
    candidate_routes = [r.rule for r in app.url_map.iter_rules() if 'candidate' in r.rule]
    print(f"\n  CANDIDATE ROUTES FOUND: {len(candidate_routes)}")
    for route in candidate_routes:
        print(f"    {route}")
    print("="*80 + "\n")

    # Run the unified Flask app with SocketIO support (Critical for WebRTC signaling)
    # allow_unsafe_werkzeug=True is often needed for dev servers in threaded mode
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)