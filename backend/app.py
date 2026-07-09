#!/usr/bin/env python3
"""
Unified Emirati Journey Platform Backend Server
================================================

This is the main application entry point. It:
1. Creates the Flask app and configures JWT, CORS, SocketIO
2. Registers all blueprints via the registry
3. Provides backward-compatible exports (get_db, execute_query, etc.)

Inline routes and utilities that were previously in this file have been
extracted to dedicated modules — see backend/routes/ and backend/db_utils.py.
"""

import os
import sys
import json
import time
import logging
import secrets
import traceback
from pathlib import Path
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify, g, send_file, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request, create_access_token
from flask_socketio import SocketIO, emit, join_room, leave_room
import psycopg2
import psycopg2.extras

# Ensure parent directory is on path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv

# Load environment variables
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, '.env')
load_dotenv(env_path)

# Automatically compile DATABASE_URL from individual DB_ connection details
# to prevent connection failures in endpoints using the DATABASE_URL environment fallback.
import urllib.parse
if not os.environ.get('DATABASE_URL'):
    db_user = os.environ.get('DB_USER', 'emirati_user')
    db_pass = os.environ.get('DB_PASSWORD', 'emirati_secure_password')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME', 'emirati_journey')
    
    encoded_user = urllib.parse.quote_plus(db_user)
    encoded_pass = urllib.parse.quote_plus(db_pass)
    
    database_url = f"postgresql://{encoded_user}:{encoded_pass}@{db_host}:{db_port}/{db_name}"
    os.environ['DATABASE_URL'] = database_url

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================================================
# OBSERVABILITY (T4.4): request-id correlation, JSON logs, Sentry
# =====================================================
class _RequestIdFilter(logging.Filter):
    """Inject the current request id into every log record (best-effort)."""
    def filter(self, record):
        try:
            from flask import g, has_request_context
            record.request_id = getattr(g, 'request_id', '-') if has_request_context() else '-'
        except Exception:
            record.request_id = '-'
        return True


class _JsonLogFormatter(logging.Formatter):
    """Structured JSON log lines for centralized aggregation."""
    def format(self, record):
        payload = {
            'ts': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'request_id': getattr(record, 'request_id', '-'),
            'message': record.getMessage(),
        }
        if record.exc_info:
            payload['exc'] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


# Opt-in JSON logging (set LOG_FORMAT=json in production); plain text otherwise.
if os.getenv('LOG_FORMAT', '').lower() == 'json':
    _json_handler = logging.StreamHandler()
    _json_handler.setFormatter(_JsonLogFormatter())
    _json_handler.addFilter(_RequestIdFilter())
    _root_logger = logging.getLogger()
    _root_logger.handlers = [_json_handler]
    _root_logger.setLevel(getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper(), logging.INFO))

# Initialize Sentry only when a DSN is configured (inert otherwise).
_sentry_dsn = os.getenv('SENTRY_DSN')
if _sentry_dsn:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.flask import FlaskIntegration
        sentry_sdk.init(
            dsn=_sentry_dsn,
            integrations=[FlaskIntegration()],
            environment=os.getenv('FLASK_ENV', 'production'),
            traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.0')),
            send_default_pii=False,  # never ship citizen PII to Sentry
        )
        logger.info("Sentry initialized")
    except Exception as _sentry_err:
        logger.warning(f"Sentry init failed: {_sentry_err}")

# Debug: Print AI API Key status
dashscope_key = os.getenv('DASHSCOPE_API_KEY')
if dashscope_key:
    logger.info(f"DASHSCOPE_API_KEY found: {dashscope_key[:4]}...")
else:
    logger.warning("DASHSCOPE_API_KEY NOT FOUND - AI features may not work")


# =====================================================
# UTILITY FUNCTIONS (kept here for backward compatibility)
# =====================================================

def safe_json_load(value, default=None):
    """Safely load JSON data, recursively handling strings inside lists/dicts."""
    if default is None:
        default = []

    def recursive_parse(item):
        if item is None:
            return None
        if isinstance(item, str):
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
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            logger.warning(f"Failed to decode top-level JSON: {value[:50]}...")
            return default
    try:
        cleaned = recursive_parse(value)
        return cleaned if cleaned is not None else default
    except Exception as e:
        logger.error(f"Error in deep cleaning JSON: {e}")
        return default


# =====================================================
# DATABASE UTILITIES (delegated to db_utils, re-exported here)
# =====================================================

from backend.db_utils import DATABASE_CONFIG, get_db, close_db, execute_query

# =====================================================
# FLASK APP INITIALIZATION
# =====================================================

# Initialize SocketIO (lazy — will attach to app below)
# IMPORTANT: cors_allowed_origins MUST be in the constructor.
# Setting it as a property after init_app() is silently ignored.
_socketio_allowed_origins = os.environ.get('CORS_ALLOWED_ORIGINS', 'https://emirati.ehrdc.gov.ae').split(',')
if os.getenv('FLASK_ENV', 'production') != 'production':
    _socketio_allowed_origins.extend(['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5005'])
# Cross-worker message queue: gunicorn runs multiple GeventWebSocket workers, so a
# `join`/`offer`/`answer`/`ice-candidate` handled by one worker must be relayed to a
# participant connected to another worker. Without a shared message_queue, room emits
# stay worker-local and WebRTC signaling never reaches the peer — each side sees only
# its own camera. Reuse the app-wide REDIS_URL (compose points it at the `redis`
# service, sometimes password-protected) so the queue matches the notification system
# and rate limiter; SOCKETIO_MESSAGE_QUEUE can override it independently.
_socketio_message_queue = os.environ.get(
    'SOCKETIO_MESSAGE_QUEUE',
    os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
)
socketio = SocketIO(
    async_mode='gevent',
    logger=True,
    engineio_logger=True,
    cors_allowed_origins=_socketio_allowed_origins,
    message_queue=_socketio_message_queue,
)

# In-memory presence tracking
online_users: dict[str, str] = {}
socketio.online_users = online_users

# Create Flask app
app = Flask(__name__)
socketio.init_app(app)

# JWT Configuration
_jwt_secret = os.getenv('JWT_SECRET_KEY')
if not _jwt_secret:
    raise RuntimeError("FATAL: JWT_SECRET_KEY environment variable is required.")
app.config['JWT_SECRET_KEY'] = _jwt_secret
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # T4.1: short-lived access token
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_COOKIE_SECURE'] = True
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_REFRESH_COOKIE_SAMESITE'] = 'Strict'
app.config['JWT_ACCESS_COOKIE_SAMESITE'] = 'Lax'

jwt = JWTManager(app)

# T4.4: apply hardened session/cookie settings from SecurityConfig (wires the
# previously-unused security_config.py into the running app).
try:
    from backend.security_config import SecurityConfig
    app.config['SESSION_COOKIE_SECURE'] = SecurityConfig.SESSION_COOKIE_SECURE
    app.config['SESSION_COOKIE_HTTPONLY'] = SecurityConfig.SESSION_COOKIE_HTTPONLY
    app.config['SESSION_COOKIE_SAMESITE'] = SecurityConfig.SESSION_COOKIE_SAMESITE
    app.config['PERMANENT_SESSION_LIFETIME'] = SecurityConfig.PERMANENT_SESSION_LIFETIME
except Exception as _sc_err:
    logger.warning(f"Could not apply SecurityConfig session settings: {_sc_err}")

# UAE Pass EID Encryption Key Configuration
_uaepass_eid_key = os.getenv('UAEPASS_EID_KEY')
if not _uaepass_eid_key:
    if os.getenv('FLASK_ENV', 'production') == 'production':
        raise RuntimeError("FATAL: UAEPASS_EID_KEY environment variable is required in production.")
    else:
        logger.warning("⚠️  UAEPASS_EID_KEY not set. Using dev default key (non-production).")
        import base64
        os.environ['UAEPASS_EID_KEY'] = base64.b64encode(b'dev_uaepass_eid_key_32bytes_long').decode('utf-8')

# CORS Configuration
allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '').strip()
allowed_origin_list = [o for o in (x.strip() for x in allowed_origins_env.split(',')) if o]

_is_production = os.getenv('FLASK_ENV', 'production') == 'production'

if _is_production:
    # Production: only allow the production domain + explicitly configured origins
    cors_origins = [
        "https://emirati.ehrdc.gov.ae",
        "http://emirati.ehrdc.gov.ae",
    ]
    cors_origins.extend(allowed_origin_list)
    logger.info(f"CORS: Production mode — allowed origins: {cors_origins}")
else:
    # Development: allow localhost + ngrok + configured origins
    cors_origins = [
        "http://localhost:8081",
        "http://localhost:3000",
        "http://localhost:8089",
        "http://localhost:5173",
        r"https?://.*\.ngrok\.io",
        r"https?://.*\.ngrok\.app",
        r"https?://.*\.ngrok-free\.app",
        r"https?://.*\.ngrok-free\.dev",
    ]
    cors_origins.extend(allowed_origin_list)
    logger.info("CORS: Development mode — localhost + ngrok origins ENABLED")

# Note: socketio cors_allowed_origins is now restricted (see constructor above).
# The Flask CORS below handles API route CORS separately.

CORS(app, resources={
    r"/api/*": {
        "origins": cors_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-CSRF-Token", "X-CSRF-TOKEN"],
        "supports_credentials": True,
        "expose_headers": ["Authorization"]
    },
    r"/health": {
        "origins": ["*"],
        "methods": ["GET", "OPTIONS"]
    }
})

# =====================================================
# RATE LIMITING (OWASP: Brute-Force Protection)
# =====================================================
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per minute"],
    storage_uri=os.getenv('REDIS_URL', 'memory://'),
)

# Apply strict rate limits to authentication endpoints
@app.before_request
def rate_limit_auth():
    """Apply strict rate limits to sensitive endpoints."""
    pass  # flask-limiter decorators are applied on the individual routes


@app.before_request
def _assign_request_id():
    """T4.4: give every request a correlation id (honor inbound X-Request-ID)."""
    g.request_id = request.headers.get('X-Request-ID') or secrets.token_hex(8)

# =====================================================
# SECURITY HEADERS (OWASP: Security Misconfiguration)
# =====================================================
@app.after_request
def add_security_headers(response):
    """Inject security headers on every response."""
    # Prevent MIME-type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    # XSS Protection (legacy browsers)
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Control referrer information
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Restrict browser features
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    # Remove server header
    response.headers.pop('Server', None)

    if _is_production:
        # HSTS — force HTTPS
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        # Content Security Policy — tightened (no unsafe-eval)
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self' https://emirati.ehrdc.gov.ae wss://emirati.ehrdc.gov.ae; "
            "frame-ancestors 'none'"
        )

    # T4.4: expose the request correlation id to clients/log aggregators
    _rid = getattr(g, 'request_id', None)
    if _rid:
        response.headers['X-Request-ID'] = _rid
    return response

# =====================================================
# GLOBAL ERROR HANDLERS (prevent stack trace leaks)
# =====================================================
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'success': False, 'error': 'Resource not found'}), 404

@app.errorhandler(405)
def method_not_allowed_error(error):
    return jsonify({'success': False, 'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    if _is_production:
        logger.error(f"Internal server error: {error}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
    return jsonify({'success': False, 'error': str(error)}), 500

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({'success': False, 'error': 'Rate limit exceeded. Try again later.'}), 429

# SQLAlchemy Configuration
# URL-encode password to handle special chars (#, $, @) in Moro credentials
from urllib.parse import quote_plus as _url_quote
_db_password_encoded = _url_quote(str(DATABASE_CONFIG['password']))
app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql://{DATABASE_CONFIG['user']}:{_db_password_encoded}@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from backend.extensions import db
db.init_app(app)

# Auto-create SQLAlchemy ORM tables (Profile V2, etc.) on startup.
# Safe: db.create_all() only creates tables that don't exist, never drops existing ones.
# This runs at import time so it works with both Gunicorn and direct execution.
with app.app_context():
    try:
        from backend.models.profile.candidate_profile_models import (
            CandidateProfile, CandidateExperience, CandidateEducation,
            CandidateSkill, CandidateCertification, CandidateAssessment
        )
        db.create_all()
        logger.info("✅ SQLAlchemy ORM tables verified/created")
    except Exception as e:
        logger.warning(f"⚠️ Could not auto-create ORM tables (DB may be unavailable): {e}")

# =====================================================
# SOCKETIO EVENT HANDLERS
# =====================================================

@socketio.on('connect')
def on_connect(auth=None):
    """Handle new socket connection."""
    try:
        token = None
        if auth and isinstance(auth, dict):
            token = auth.get('token')
        if not token:
            return

        import jwt as pyjwt
        payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        user_id = payload.get('sub') or payload.get('user_id')
        if user_id:
            user_id = str(user_id)
            online_users[user_id] = request.sid
            print(f"[Presence] User {user_id} connected (sid={request.sid}). Online: {list(online_users.keys())}")
            socketio.emit('user_online', {'user_id': user_id})
            emit('online_users', {'users': list(online_users.keys())})
    except Exception as e:
        print(f"[Presence] connect error: {e}")

@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    logger.debug(f"User joined room: {room} (Socket: {request.sid})")
    emit('peer-joined', {'sid': request.sid}, room=room, include_self=False)

@socketio.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)

@socketio.on('offer')
def on_offer(data):
    room = data.get('room')
    emit('offer', data, room=room, include_self=False)

@socketio.on('answer')
def on_answer(data):
    room = data.get('room')
    emit('answer', data, room=room, include_self=False)

@socketio.on('ice-candidate')
def on_ice_candidate(data):
    room = data.get('room')
    emit('ice-candidate', data, room=room, include_self=False)

@socketio.on('disconnect')
def on_disconnect():
    user_id = None
    for uid, sid in list(online_users.items()):
        if sid == request.sid:
            user_id = uid
            break
    if user_id:
        del online_users[user_id]
        print(f"[Presence] User {user_id} disconnected. Online: {list(online_users.keys())}")
        socketio.emit('user_offline', {'user_id': user_id})

@socketio.on('get_online_users')
def on_get_online_users():
    print(f"[Presence] get_online_users requested. Online: {list(online_users.keys())}")
    emit('online_users', {'users': list(online_users.keys())})

# G12: Real-time notification push infrastructure
@socketio.on('join_notification_room')
def on_join_notification_room(data):
    """Join notification room — uses verified token identity, not client data."""
    # Get user_id from the authenticated connection, not client data
    token = request.args.get('token') or (data or {}).get('token', '')
    if not token:
        return
    try:
        import jwt as pyjwt
        payload = pyjwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        user_id = str(payload.get('sub') or payload.get('user_id', ''))
    except Exception:
        return  # Reject invalid tokens silently

    if user_id:
        room = f"notifications:{user_id}"
        join_room(room)
        emit('notification_room_joined', {'room': room, 'user_id': user_id})
        logger.info(f"[G12] User {user_id} joined notification room {room}")

def push_notification_to_user(user_id, event_type, payload):
    """Push a real-time notification to a specific user via SocketIO.
    
    G12: This is the canonical way to push events to Recruiter/HR/Candidate.
    Called from notification_helper.py and route handlers.
    
    Args:
        user_id: The target user's ID (str or int)
        event_type: Event name (e.g. 'new_notification', 'offer_approved', 'new_application')
        payload: Dict with event data
    """
    try:
        room = f"notifications:{str(user_id)}"
        socketio.emit(event_type, payload, room=room)
        # Also emit to user's direct SID if online
        sid = online_users.get(str(user_id))
        if sid:
            socketio.emit(event_type, payload, to=sid)
        logger.info(f"[G12] Pushed {event_type} to user {user_id}")
    except Exception as e:
        logger.warning(f"[G12] Failed to push notification: {e}")

# Make push_notification accessible to other modules
app.push_notification_to_user = push_notification_to_user


# =====================================================
# STATIC FILE SERVING
# =====================================================

@app.route('/uploads/<path:filename>')
@jwt_required()
def serve_uploads(filename):
    """Serve uploaded files - requires authentication."""
    # Path traversal protection
    if '..' in filename or filename.startswith('/'):
        return jsonify({'error': 'Invalid path'}), 400

    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    # Resolve and verify path stays within upload directory
    requested_path = os.path.realpath(os.path.join(upload_dir, filename))
    if not requested_path.startswith(os.path.realpath(upload_dir)):
        return jsonify({'error': 'Access denied'}), 403

    if not os.path.exists(requested_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        from backend.services.storage import storage
        return storage.serve(filename)
    except Exception as e:
        logger.error(f"File serve error: {e}")
        # Fallback to direct filesystem serve
        return send_from_directory(upload_dir, filename)


# =====================================================
# REQUEST LIFECYCLE
# =====================================================

@app.teardown_appcontext
def close_db_teardown(error):
    close_db()


# =====================================================
# SHARED CONSTANTS & HELPERS (used by inline routes below)
# =====================================================

# CV Upload Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
UPLOAD_FOLDER = Path('uploads/cv_uploads')
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

ADMIN_ROLES = ['platform_administrator', 'super_user']

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def require_admin_auth(f):
    """Decorator to require admin authentication via JWT verification."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Authentication required.'}), 401
        token = auth_header.replace('Bearer ', '', 1)
        try:
            from flask_jwt_extended import decode_token
            decoded = decode_token(token)
            user_id = decoded.get('sub')
            if not user_id:
                return jsonify({'success': False, 'error': 'Invalid token.'}), 401
        except Exception as e:
            logger.warning(f"Admin auth token verification failed: {e}")
            return jsonify({'success': False, 'error': 'Invalid or expired token.'}), 401
        try:
            user_row = execute_query(
                "SELECT id, email, role FROM users WHERE id = %s",
                (user_id,), fetch_one=True
            )
            if not user_row:
                return jsonify({'success': False, 'error': 'User not found.'}), 401
            user_role = (user_row.get('role') or '').strip()
            if user_role not in ADMIN_ROLES:
                return jsonify({'success': False, 'error': 'Admin access required.'}), 403
        except Exception as e:
            logger.error(f"Admin auth DB lookup failed: {e}")
            return jsonify({'success': False, 'error': 'Authentication service error.'}), 500
        request.admin_user = {
            'email': user_row.get('email', 'unknown'),
            'roles': [user_role],
            'user_id': user_id
        }
        return f(*args, **kwargs)
    return decorated_function


# =====================================================
# BLUEPRINT REGISTRATION
# =====================================================

# 1. Core blueprints via the unified registry
from backend.blueprint_registry import register_all_blueprints
register_all_blueprints(app)

# 2. Additional blueprints registered directly (recruiter, education, etc.)
_additional_blueprints = [
    ('backend.recruiter.shortlist_routes', 'shortlist_bp', '/api/recruiter/shortlist', 'Recruiter Shortlist'),
    ('backend.recruiter.interview_routes', 'interview_bp', '/api/recruiter/interviews', 'Recruiter Interview'),
    ('backend.hr_interview_scheduling_routes', 'hr_interview_bp', None, 'HR Interview Scheduling'),
    ('backend.video_interview_routes', 'video_interview_bp', '/api/video-interview', 'Video Interview'),
    ('backend.recruiter.jd_routes_v2', 'jd_bp', None, 'Recruiter JD V2'),
    ('backend.routes.growth_routes', 'growth_bp', None, 'Growth Operator'),
    ('backend.routes.nafis_talent_routes', 'nafis_talent_bp', None, 'NAFIS Talent'),
    ('backend.routes.demand_signal_routes', 'demand_signal_bp', None, 'NAFIS Demand Signals'),
    ('backend.recruiter.jd_upload_routes', 'jd_upload_routes', None, 'JD Upload'),
    ('backend.intelligence_routes', 'intelligence_bp', None, 'Intelligence Backbone'),
    ('backend.education_api_routes', 'education_bp', None, 'Education API'),
    ('backend.career_services_routes', 'career_services_bp', None, 'Career Services'),
    ('backend.operations_routes', 'operations_bp', None, 'Operations Monitoring'),
    ('backend.demographics_routes', 'demographics_bp', None, 'Demographics Analytics'),
    ('backend.skills_development_routes', 'skills_dev_bp', None, 'Skills & Development'),
    ('backend.community_mentorship_routes', 'community_mentorship_bp', None, 'Community & Mentorship'),
    ('backend.mentor_routes', 'mentor_bp', None, 'Mentor System'),
    ('backend.lifelong_engagement_routes', 'lifelong_engagement_bp', None, 'Lifelong Engagement'),
    ('backend.career_simulator_routes', 'career_simulator_bp', None, 'Career Simulator'),
    ('backend.career_passport_routes', 'career_passport_bp', None, 'Career Passport'),
    ('backend.advisor_routes', 'advisor_bp', None, 'Advisor'),
    ('backend.coach_routes', 'coach_bp', None, 'Coach'),
    ('backend.parent_routes', 'parent_bp', None, 'Parent Dashboard'),
    ('backend.internship_coordinator_routes', 'internship_coord_bp', None, 'Internship Coordinator'),
    ('backend.training_center_routes', 'training_center_bp', None, 'Training Center'),
    ('backend.platform_ops_routes', 'platform_ops_bp', None, 'Platform Operations'),
    ('backend.routes.workspace_routes', 'workspace_bp', None, 'Workspaces'),
    ('backend.routes.workspace_phase2_routes', 'workspace_phase2_bp', None, 'Workspace Phase 2'),
    ('backend.routes.career_dial_routes', 'career_dial_bp', None, 'Career Dial'),
    ('backend.routes.uaepass_routes', 'uaepass_bp', None, 'UAE Pass Authentication'),
    ('backend.routes.company_routes', 'company_bp', None, 'Companies'),
    # --- Blueprints migrated from recruiter_server.py ---
    ('backend.routes.profile.profile_readiness', 'profile_readiness_bp', None, 'Profile Readiness'),
    ('backend.hr_approval_routes', 'hr_approval_bp', None, 'HR Approval Workflow'),
    ('backend.hr_external_distribution_routes', 'hr_distribution_bp', None, 'HR External Distribution'),
    ('backend.hr_external_distribution_routes', 'external_distribution_bp', None, 'External Distribution Callbacks'),
    ('backend.hr_candidate_search_routes', 'hr_candidate_search_bp', None, 'HR Candidate Search'),
    ('backend.quality_assurance_routes', 'qa_bp', None, 'Quality Assurance'),
    ('backend.recruiter.statistics_routes', 'statistics_bp', '/api/recruiter/statistics', 'Recruiter Statistics'),
    ('backend.recruiter.offer_routes', 'offer_bp', '/api/recruiter/offers', 'Recruiter Offer Management'),
    ('backend.recruiter.training_routes', 'training_bp', None, 'Recruiter Training'),
    ('backend.recruiter.mentorship_routes', 'mentorship_bp', None, 'Recruiter Mentorship'),
    ('backend.routes.user_activity_api', 'user_activity_bp', None, 'User Activity'),
    ('backend.recruiter.analytics_routes', 'analytics_bp', '/api/recruiter', 'Recruiter Analytics'),
    ('backend.routes.strategic_metrics_api', 'strategic_metrics_bp', None, 'Strategic Metrics'),
]

for module_path, bp_name, url_prefix, label in _additional_blueprints:
    try:
        # Try backend-prefixed import first, then relative
        try:
            mod = __import__(module_path, fromlist=[bp_name])
        except ImportError:
            # Fallback: try without backend. prefix
            fallback = module_path.replace('backend.', '', 1)
            mod = __import__(fallback, fromlist=[bp_name])
        bp = getattr(mod, bp_name)
        if url_prefix:
            app.register_blueprint(bp, url_prefix=url_prefix)
        else:
            app.register_blueprint(bp)
        logger.info(f"✅ {label} routes registered")
    except Exception as e:
        logger.error(f"Failed to register {label} routes: {e}")

# Growth Operator Assignment API (uses function-based registration)
try:
    try:
        from backend.routes.growth_operator_assignment_api import register_growth_operator_assignment_routes
    except ImportError:
        from routes.growth_operator_assignment_api import register_growth_operator_assignment_routes
    register_growth_operator_assignment_routes(app)
    logger.info("✅ Growth Operator Assignment API registered")
except Exception as e:
    logger.error(f"Failed to register Growth Operator Assignment API: {e}")

# Optimized matching routes (function-based registration, migrated from recruiter_server.py)
try:
    try:
        from backend.matching.matching_routes_optimized import register_optimized_matching_routes
    except ImportError:
        from matching.matching_routes_optimized import register_optimized_matching_routes
    register_optimized_matching_routes(app)
    logger.info("✅ Optimized matching routes registered")
except Exception as e:
    logger.error(f"Failed to register optimized matching routes: {e}")


# =====================================================
# INLINE ROUTES (legacy — kept for backward compatibility)
# These are routes defined directly on `app` rather than
# in blueprint modules. Future work: migrate to blueprints.
# =====================================================

# --- Import inline route modules ---
# These modules define @app.route handlers using the app instance.
# They are imported AFTER app creation to avoid circular imports.
try:
    from backend.routes.inline_routes import register_inline_routes
    register_inline_routes(app, execute_query, safe_json_load, require_admin_auth, UPLOAD_FOLDER, ALLOWED_EXTENSIONS, allowed_file, MAX_FILE_SIZE)
    logger.info("✅ Inline routes registered (health, auth, CV, matching, admin, recruiter, school-programs)")
except Exception as e:
    logger.error(f"Failed to register inline routes: {e}")
    traceback.print_exc()


# =====================================================
# SERVER INITIALIZATION
# =====================================================

def initialize_unified_server():
    """Initialize all components of the unified server."""
    logger.info("🔧 Initializing unified server components...")

    try:
        with app.app_context():
            # Table creation and data seeding is handled by the inline route
            # registration (ensure_cv_tables_exist, ensure_vacancy_tables_exist, etc.
            # are called as part of register_inline_routes > internal init).
            # ORM tables (Profile V2) are auto-created at import time (line ~258).
            # Here we just verify the DB connection works.
            from backend.db_utils import get_db
            db_conn = get_db()
            if db_conn:
                logger.info("✅ Database connection verified")
            else:
                logger.warning("⚠️ Database connection could not be established")
    except Exception as e:
        logger.error(f"Initialization error: {e}")

    logger.info("🚀 Unified server initialization complete")


# =====================================================
# STARTUP SECURITY CHECKS
# =====================================================

def _log_security_warnings():
    """Log prominent warnings about security-sensitive configuration."""
    flask_env = os.getenv('FLASK_ENV', 'production')

    if flask_env != 'production':
        logger.warning("=" * 72)
        logger.warning("⚠️  SECURITY WARNING: FLASK_ENV='%s' (non-production)", flask_env)
        if os.getenv('ENABLE_DEV_LOGIN') == 'true':
            logger.warning("⚠️  Dev-login bypass is ACTIVE — ENABLE_DEV_LOGIN=true")
            logger.warning("⚠️  Unset ENABLE_DEV_LOGIN to disable dev-login.")
        else:
            logger.info("🔒 Dev-login is disabled (ENABLE_DEV_LOGIN not set)")
        logger.warning("=" * 72)
    else:
        logger.info("🔒 Production mode — dev-login is DISABLED")
        logger.info("🔒 Authentication uses UAEPass integration")

_log_security_warnings()


# =====================================================
# MAIN ENTRY POINT
# =====================================================

if __name__ == '__main__':
    initialize_unified_server()

    port = int(os.getenv('UNIFIED_PORT', 5005))

    print("=" * 80)
    print("EMIRATI JOURNEY PLATFORM - UNIFIED BACKEND SERVER")
    print("=" * 80)
    print(f"Server starting on port {port}")
    print(f"Health check: http://localhost:{port}/health")
    print("=" * 80)

    socketio.init_app(app)

    is_debug = os.getenv('FLASK_ENV', 'production') != 'production'
    socketio.run(app, host='0.0.0.0', port=port, debug=is_debug, allow_unsafe_werkzeug=is_debug)


# =====================================================
# TEST FACTORY (backward compatibility with test suites)
# =====================================================

def create_app():
    """Factory function for test compatibility.
    Returns the module-level app (already configured with all blueprints).
    """
    return app