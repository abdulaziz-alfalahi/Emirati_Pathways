"""
Enhanced Flask App with Complete Job Matching Integration, Authentication, and Enhanced JD Processing
Version 4.0 - Includes Gemini 2.5 PRO optimization, advanced scoring, enhanced analytics, and AI-powered JD processing
"""

from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

import json
import time
import logging
import os
import sys
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize JWT Manager
jwt = JWTManager(app)

# JWT Error Handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'success': False,
        'message': 'Token has expired. Please log in again.'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    logger.error(f"JWT Invalid Token Error: {str(error)}")
    logger.error(f"JWT Invalid Token Error type: {type(error)}")
    return jsonify({
        'success': False,
        'message': f'Invalid token. Please log in again. Error: {str(error)}'
    }), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'success': False,
        'message': 'Authorization header is missing or invalid'
    }), 401

# CORS Configuration with authentication support - FIXED FOR AUTHORIZATION HEADER
allowed_origins_env = os.getenv('ALLOWED_ORIGINS', '').strip()
allowed_origin_list = [o for o in (x.strip() for x in allowed_origins_env.split(',')) if o]

cors_origins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:8089",
    "http://localhost:5173",
    r"https?://.*\.ngrok\.io",
    r"https?://.*\.ngrok\.app",
    r"https?://.*\.ngrok-free\.app",
]
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
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import enhanced matching components
try:
    from matching.job_matching_engine_optimized import get_enhanced_matching_engine
    from matching.advanced_scoring_system import get_advanced_scoring_system
    from matching.matching_performance_optimizer import get_performance_optimizer
    from matching.uae_matching_criteria import get_uae_criteria
    from matching.matching_routes_optimized import register_optimized_matching_routes
    
    # Initialize enhanced components
    matching_engine = get_enhanced_matching_engine()
    scoring_system = get_advanced_scoring_system()
    performance_optimizer = get_performance_optimizer()
    uae_criteria = get_uae_criteria()
    
    # Register optimized matching routes
    register_optimized_matching_routes(app)
    
    logger.info("✅ Enhanced matching system initialized successfully")
    enhanced_matching_available = True
    
except ImportError as e:
    logger.warning(f"⚠️ Enhanced matching system not available: {e}")
    logger.warning("   Falling back to basic matching engine")
    
    # Fallback to basic matching engine
    try:
        from job_matching_engine import JobMatchingEngine
        matching_engine = JobMatchingEngine()
        enhanced_matching_available = False
    except ImportError:
        logger.error("❌ No matching engine available")
        matching_engine = None
        enhanced_matching_available = False

# Import and initialize enhanced analytics engine
try:
    from analytics_engine import init_enhanced_analytics, enhanced_analytics_bp
    
    # Initialize enhanced analytics
    enhanced_analytics = init_enhanced_analytics(app)
    
    # Register the enhanced analytics blueprint
    app.register_blueprint(enhanced_analytics_bp)
    
    logger.info("✅ Enhanced analytics engine initialized successfully")
    enhanced_analytics_available = True
    
except ImportError as e:
    logger.warning(f"⚠️ Enhanced analytics engine not available: {e}")
    logger.warning("   Analytics functionality will be limited")
    enhanced_analytics_available = False

# Import CV Builder routes (optional)
try:
    from cv_builder.cv_routes import cv_routes
    from cv_builder.cv_management_routes import cv_management_routes
    from cv_builder.cv_analytics_routes import cv_analytics_routes
    app.register_blueprint(cv_routes)
    app.register_blueprint(cv_management_routes)
    app.register_blueprint(cv_analytics_routes)
    logger.info("✅ CV Builder routes registered successfully")
    cv_builder_available = True
except ImportError as e:
    logger.warning(f"⚠️ CV Builder routes not found: {e}")
    cv_builder_available = False

# Import and register authentication routes
try:
    from routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    logger.info("✅ Authentication routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import authentication routes: {e}")

# Import and register enhanced authentication routes
try:
    from auth_routes_enhanced import auth_bp as enhanced_auth_bp
    app.register_blueprint(enhanced_auth_bp, url_prefix='/api/auth/enhanced', name='enhanced_auth')
    logger.info("✅ Enhanced authentication routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import enhanced authentication routes: {e}")

# Import and register test token routes (for debugging)
try:
    from test_token_routes import test_token_bp
    app.register_blueprint(test_token_bp)
    logger.info("✅ Test Token routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import test token routes: {e}")

# Import and register profile management routes
try:
    from profile_management_routes import profile_bp
    app.register_blueprint(profile_bp, url_prefix='/api')
    logger.info("✅ Profile management routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import profile management routes: {e}")

# Import and register job management routes
try:
    from routes.job_routes import job_bp
    app.register_blueprint(job_bp)
    logger.info("✅ Job management routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import job routes: {e}")

# Import and register application management routes
try:
    from routes.application_routes import application_bp
    app.register_blueprint(application_bp)
    logger.info("✅ Application management routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import application routes: {e}")

# Import and register company management routes
try:
    from routes.company_routes import company_bp
    app.register_blueprint(company_bp)
    logger.info("✅ Company management routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import company routes: {e}")

# Import and register analytics routes
try:
    from routes.analytics_routes import analytics_bp
    app.register_blueprint(analytics_bp)
    logger.info("✅ Analytics routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import analytics routes: {e}")

# Import and register mentor routes
try:
    from mentor_routes import mentor_bp
    app.register_blueprint(mentor_bp)
    logger.info("✅ Mentor routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import mentor routes: {e}")

# Import and register AI mentorship matching routes
try:
    from ai_mentorship_matching_routes import ai_matching_bp
    app.register_blueprint(ai_matching_bp)
    logger.info("✅ AI Mentorship Matching routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import AI mentorship matching routes: {e}")

# Import and register mentorship program routes
try:
    from mentorship_program_routes import program_bp
    app.register_blueprint(program_bp)
    logger.info("✅ Mentorship Program routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import mentorship program routes: {e}")

# Import and register mentor analytics routes
try:
    from mentor_analytics_routes import analytics_bp
    app.register_blueprint(analytics_bp)
    logger.info("✅ Mentor Analytics routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import mentor analytics routes: {e}")

# Import and register enhanced job matching routes
try:
    from job_matching_routes import job_matching_bp
    app.register_blueprint(job_matching_bp)
    logger.info("✅ Enhanced job matching routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import job matching routes: {e}")

# Import and register application tracking routes
try:
    from application_tracking_routes import application_tracking_bp
    app.register_blueprint(application_tracking_bp)
    logger.info("✅ Application tracking routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import application tracking routes: {e}")

# Import and register HR dashboard routes
try:
    from hr_dashboard_routes import hr_dashboard_bp
    app.register_blueprint(hr_dashboard_bp)
    logger.info("✅ HR dashboard routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import HR dashboard routes: {e}")

# Import and register Company Team routes
try:
    from routes.company_team_routes import company_team_bp
    app.register_blueprint(company_team_bp)
    logger.info("✅ Company Team routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import Company Team routes: {e}")

# Import and register video interview routes
try:
    from video_interview_routes import video_interview_bp
    app.register_blueprint(video_interview_bp)
    logger.info("✅ Video interview routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import video interview routes: {e}")

# Import and register AI analysis routes
try:
    from ai_analysis_routes import ai_analysis_bp
    app.register_blueprint(ai_analysis_bp)
    logger.info("✅ AI analysis routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import AI analysis routes: {e}")

# Import and register video storage routes
try:
    from video_storage_routes import video_storage_bp
    app.register_blueprint(video_storage_bp)
    logger.info("✅ Video storage routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import video storage routes: {e}")

# Import and register educational opportunity routes
try:
    from educational_opportunity_routes import educational_opportunity_bp
    app.register_blueprint(educational_opportunity_bp)
    logger.info("✅ Educational opportunity routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import educational opportunity routes: {e}")

# Import and register enhanced job posting routes
try:
    from enhanced_job_posting_routes import enhanced_job_posting_bp
    app.register_blueprint(enhanced_job_posting_bp)
    logger.info("✅ Enhanced job posting routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import enhanced job posting routes: {e}")

# Import and register educator routes
try:
    from educator_routes import educator_bp
    app.register_blueprint(educator_bp)
    logger.info("✅ Educator routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import educator routes: {e}")

# Import and register performance analytics routes
try:
    from performance_analytics_routes import performance_analytics_bp
    app.register_blueprint(performance_analytics_bp)
    logger.info("✅ Performance analytics routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import performance analytics routes: {e}")# Import and register industry integration routes
try:
    from industry_integration_routes import industry_integration_bp
    app.register_blueprint(industry_integration_bp)
    logger.info("✅ Industry integration routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import industry integration routes: {e}")

# Import and register assessment routes
try:
    from assessment_routes import assessment_bp
    app.register_blueprint(assessment_bp)
    logger.info("✅ Assessment routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import assessment routes: {e}")

# Import and register AI intelligence routes
try:
    from ai_intelligence_routes import ai_intelligence_bp
    app.register_blueprint(ai_intelligence_bp)
    logger.info("✅ AI intelligence routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import AI intelligence routes: {e}")

# Import and register competency validation routes
try:
    from competency_validation_routes import competency_validation_bp
    app.register_blueprint(competency_validation_bp)
    logger.info("✅ Competency validation routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import competency validation routes: {e}")

# Import and register assessment analytics QA routes
try:
    from assessment_analytics_qa_routes import assessment_analytics_qa_bp
    app.register_blueprint(assessment_analytics_qa_bp)
    logger.info("✅ Assessment analytics QA routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import assessment analytics QA routes: {e}")

# Import and register communication routes
try:
    from routes.communication_routes import communication_bp
    app.register_blueprint(communication_bp)
    logger.info("✅ Communication routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import communication routes: {e}")

# Enhanced JD Processing modules
try:
    from jd_processing.enhanced_jd_routes import enhanced_jd_bp
    from jd_processing.uae_compliance_checker import UAEComplianceChecker
    from jd_processing.jd_analytics_engine import JDAnalyticsEngine
    from jd_processing.jd_quality_scorer import JDQualityScorer
    from jd_processing.jd_optimization_engine import JDOptimizationEngine
    
    # Initialize Enhanced JD Processing components
    uae_compliance_checker = UAEComplianceChecker()
    jd_analytics_engine = JDAnalyticsEngine()
    jd_quality_scorer = JDQualityScorer()
    jd_optimization_engine = JDOptimizationEngine()
    
    # Register Enhanced JD Processing routes
    app.register_blueprint(enhanced_jd_bp)
    
    logger.info("✅ Enhanced JD Processing modules loaded successfully")
    logger.info("✅ Enhanced JD Processing initialized successfully")
    enhanced_jd_available = True
    
except ImportError as e:
    logger.warning(f"⚠️ Enhanced JD Processing not available: {e}")
    enhanced_jd_available = False

# Global variables for components
cv_parser = None
jd_parser = None

# Initialize CV Parser
try:
    from cv_parser import CVParser
    cv_parser = CVParser()
    logger.info("✅ CV Parser initialized")
except ImportError as e:
    logger.warning(f"⚠️ CV Parser not available: {e}")

# Initialize JD Parser
try:
    from jd_parser import JDParser
    jd_parser = JDParser()
    logger.info("✅ JD Parser initialized")
except ImportError as e:
    logger.warning(f"⚠️ JD Parser not available: {e}")

# Import and register test endpoints (for development)
try:
    from test_endpoints import test_bp
    app.register_blueprint(test_bp)
    logger.info("✅ Test endpoints registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Test endpoints not available: {e}")

# Register Enhanced Job Application Blueprint
try:
    from enhanced_job_application_routes import enhanced_job_application_bp
    app.register_blueprint(enhanced_job_application_bp)
    logger.info("✅ Enhanced Job Application Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Enhanced Job Application Blueprint not available: {e}")
    # Fallback to basic job application blueprint
    try:
        from job_application_routes import job_application_bp
        app.register_blueprint(job_application_bp)
        logger.info("✅ Basic Job Application Blueprint registered as fallback")
    except ImportError as e2:
        logger.warning(f"⚠️ No Job Application Blueprint available: {e2}")
    job_application_available = False

# Register Status Tracking Blueprint
try:
    from status_tracking_routes import status_tracking_bp
    app.register_blueprint(status_tracking_bp)
    logger.info("✅ Status Tracking Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Status Tracking Blueprint not available: {e}")

# Register HR Profile Management Blueprint
try:
    from hr_profile_management_routes import hr_profile_bp
    app.register_blueprint(hr_profile_bp)
    logger.info("✅ HR Profile Management Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ HR Profile Management Blueprint not available: {e}")

# Register HR Job Posting Blueprint
try:
    from hr_job_posting_routes import hr_job_posting_bp
    app.register_blueprint(hr_job_posting_bp)
    logger.info("✅ HR Job Posting Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ HR Job Posting Blueprint not available: {e}")

# Register HR Candidate Search Blueprint
try:
    from hr_candidate_search_routes import hr_candidate_search_bp
    app.register_blueprint(hr_candidate_search_bp)
    logger.info("✅ HR Candidate Search Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ HR Candidate Search Blueprint not available: {e}")

# Register HR Dashboard Blueprint
try:
    from hr_dashboard_routes import hr_dashboard_bp
    app.register_blueprint(hr_dashboard_bp)
    logger.info("✅ HR Dashboard Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ HR Dashboard Blueprint not available: {e}")

# Register HR Interview Scheduling Blueprint
try:
    from hr_interview_scheduling_routes import hr_interview_bp
    app.register_blueprint(hr_interview_bp)
    logger.info("✅ HR Interview Scheduling Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ HR Interview Scheduling Blueprint not available: {e}")

# Register HR Offer Management Blueprint
try:
    from hr_offer_routes import hr_offer_bp, public_offer_bp
    app.register_blueprint(hr_offer_bp)
    app.register_blueprint(public_offer_bp)
    logger.info("✅ HR Offer Management Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ HR Offer Management Blueprint not available: {e}")

# Register HR Approval Workflow Blueprint
try:
    from hr_approval_routes import hr_approval_bp
    app.register_blueprint(hr_approval_bp)
    logger.info("✅ HR Approval Workflow Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ HR Approval Workflow Blueprint not available: {e}")

# Register Recruiter Shortlist Blueprint
try:
    from recruiter.shortlist_routes import shortlist_bp
    app.register_blueprint(shortlist_bp, url_prefix='/api/recruiter/shortlist')
    logger.info("✅ Recruiter Shortlist Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter Shortlist Blueprint not available: {e}")

# Register Recruiter Offer Blueprint
try:
    from recruiter.offer_routes import offer_bp
    app.register_blueprint(offer_bp, url_prefix='/api/recruiter/offers')
    logger.info("✅ Recruiter Offer Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter Offer Blueprint not available: {e}")

# Register Recruiter Interview Blueprint
try:
    from recruiter.interview_routes import interview_bp
    app.register_blueprint(interview_bp, url_prefix='/api/recruiter/interviews')
    logger.info("✅ Recruiter Interview Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter Interview Blueprint not available: {e}")

# Register Recruiter JD Blueprint
try:
    from recruiter.jd_routes import jd_bp
    app.register_blueprint(jd_bp, url_prefix='/api/recruiter/jd')
    logger.info("✅ Recruiter JD Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter JD Blueprint not available: {e}")

# Register Recruiter JD Upload Blueprint
try:
    from recruiter.jd_upload_routes import jd_upload_routes
    app.register_blueprint(jd_upload_routes)
    logger.info("✅ Recruiter JD Upload Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter JD Upload Blueprint not available: {e}")

# Register Recruiter Communication Blueprint
try:
    from recruiter.communication_routes import communication_bp
    app.register_blueprint(communication_bp, url_prefix='/api/recruiter/communication')
    logger.info("✅ Recruiter Communication Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter Communication Blueprint not available: {e}")

# Register Recruiter Statistics Blueprint
try:
    from recruiter.statistics_routes import statistics_bp
    app.register_blueprint(statistics_bp, url_prefix='/api/recruiter/statistics')
    logger.info("✅ Recruiter Statistics Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter Statistics Blueprint not available: {e}")

# Register Recruiter Analytics Blueprint (New)
try:
    from recruiter.analytics_routes import analytics_bp
    app.register_blueprint(analytics_bp, url_prefix='/api/recruiter')
    logger.info("✅ Recruiter Analytics Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter Analytics Blueprint not available: {e}")

# Register Recruiter Reports Blueprint
try:
    from recruiter.reports_routes import reports_bp
    app.register_blueprint(reports_bp, url_prefix='/api/recruiter/reports')
    logger.info("✅ Recruiter Reports Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Recruiter Reports Blueprint not available: {e}")

# Register Candidate Profile Management Blueprint
try:
    from candidate_profile_routes import candidate_profile_bp
    app.register_blueprint(candidate_profile_bp)
    logger.info("✅ Candidate Profile Management Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Candidate Profile Management Blueprint not available: {e}")

# Register Mentor Matching Blueprint
try:
    from mentor_matching_routes import mentor_matching_bp
    app.register_blueprint(mentor_matching_bp)
    logger.info("✅ Mentor Matching Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Mentor Matching Blueprint not available: {e}")

# Register Mentor Session Scheduling Blueprint
try:
    from mentor_session_routes import mentor_session_bp
    app.register_blueprint(mentor_session_bp)
    logger.info("✅ Mentor Session Scheduling Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Mentor Session Scheduling Blueprint not available: {e}")

# Register Mentor Progress Tracking Blueprint
try:
    from mentor_progress_routes import mentor_progress_bp
    app.register_blueprint(mentor_progress_bp)
    logger.info("✅ Mentor Progress Tracking Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Mentor Progress Tracking Blueprint not available: {e}")

# Register Mentor Communication Blueprint
try:
    from mentor_communication_routes import mentor_communication_bp
    app.register_blueprint(mentor_communication_bp)
    logger.info("✅ Mentor Communication Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Mentor Communication Blueprint not available: {e}")

# Register Student Tracking Blueprint
try:
    from student_tracking_routes import student_tracking_bp
    app.register_blueprint(student_tracking_bp)
    logger.info("✅ Student Tracking Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Student Tracking Blueprint not available: {e}")

# Register Curriculum Planning Blueprint
try:
    from curriculum_planning_routes import curriculum_planning_bp
    app.register_blueprint(curriculum_planning_bp)
    logger.info("✅ Curriculum Planning Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Curriculum Planning Blueprint not available: {e}")

# Register Resource Management Blueprint
try:
    from resource_management_routes import resource_management_bp
    app.register_blueprint(resource_management_bp)
    logger.info("✅ Resource Management Blueprint registered successfully")
except ImportError as e:
    logger.warning(f"⚠️ Resource Management Blueprint not available: {e}")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with feature status"""
    
    # Determine AI model status
    ai_model = "basic"
    if enhanced_matching_available:
        ai_model = "enhanced-gemini-2.5-pro"
    
    # Determine JD processing model
    jd_processing_model = "basic"
    if enhanced_jd_available:
        jd_processing_model = "enhanced-ai"
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "4.0.0",
        "ai_model": ai_model,
        "jd_processing_model": jd_processing_model,
        "features": {
            "cv_parsing": cv_parser is not None,
            "jd_parsing": jd_parser is not None,
            "job_matching": matching_engine is not None,
            "enhanced_matching": enhanced_matching_available,
            "advanced_scoring": enhanced_matching_available,
            "performance_optimization": enhanced_matching_available,
            "uae_specific_features": enhanced_matching_available,
            "authentication": True,
            "user_management": True,
            "analytics": enhanced_analytics_available,
            "enhanced_analytics": enhanced_analytics_available,
            "cv_builder": cv_builder_available,
            "bulk_processing": True,
            "bilingual_support": True,
            "uae_compliance_checking": enhanced_jd_available,
            "jd_optimization": enhanced_jd_available,
            "jd_quality_scoring": enhanced_jd_available,
            "ai_powered_jd_analysis": enhanced_jd_available,
            "enhanced_jd_processing": enhanced_jd_available,
            "jd_parsing": jd_parser is not None,
            "candidate_ranking": True,
            "gemini_ai": enhanced_matching_available
        },
        "performance_metrics": {}
    }
    
    return jsonify(health_status)

# Candidate Dashboard endpoint
@app.route('/api/candidate/dashboard', methods=['GET'])
@jwt_required()
def get_candidate_dashboard():
    """Get candidate dashboard data"""
    try:
        current_user_id = get_jwt_identity()
        
        # Mock dashboard data for demonstration
        dashboard_data = {
            'success': True,
            'data': {
                'user_id': current_user_id,
                'profile': {
                    'completion_percentage': 75,
                    'missing_sections': ['Skills', 'Experience'],
                    'last_updated': datetime.utcnow().isoformat()
                },
                'statistics': {
                    'total_applications': 5,
                    'pending_applications': 2,
                    'interviews_scheduled': 1,
                    'profile_views': 23
                },
                'recent_activities': [
                    {
                        'id': 1,
                        'type': 'application',
                        'title': 'Applied to Software Engineer at TechCorp',
                        'date': (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                        'status': 'pending'
                    },
                    {
                        'id': 2,
                        'type': 'profile_view',
                        'title': 'Your profile was viewed by Emirates Airlines',
                        'date': (datetime.utcnow() - timedelta(hours=5)).isoformat(),
                        'status': 'info'
                    }
                ],
                'recommended_jobs': [
                    {
                        'id': 1,
                        'title': 'Senior Software Engineer',
                        'company': 'Emirates Group',
                        'location': 'Dubai, UAE',
                        'match_score': 92,
                        'posted_date': (datetime.utcnow() - timedelta(days=1)).isoformat()
                    },
                    {
                        'id': 2,
                        'title': 'Data Analyst',
                        'company': 'ADNOC',
                        'location': 'Abu Dhabi, UAE',
                        'match_score': 87,
                        'posted_date': (datetime.utcnow() - timedelta(days=2)).isoformat()
                    }
                ],
                'notifications': {
                    'unread_count': 3,
                    'recent': [
                        {
                            'id': 1,
                            'title': 'New job match found',
                            'message': 'We found 2 new jobs that match your profile',
                            'type': 'job_match',
                            'read': False,
                            'created_at': (datetime.utcnow() - timedelta(hours=1)).isoformat()
                        }
                    ]
                },
                'quick_actions': [
                    {
                        'title': 'Complete Profile',
                        'description': 'Add missing information to improve job matches',
                        'action': 'complete_profile',
                        'priority': 'high'
                    },
                    {
                        'title': 'Browse Jobs',
                        'description': 'Explore new job opportunities',
                        'action': 'browse_jobs',
                        'priority': 'medium'
                    }
                ]
            },
            'message': 'Dashboard data loaded successfully'
        }
        
        return jsonify(dashboard_data)
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to load dashboard data'
        }), 500

# JD Processing Status endpoint
@app.route('/api/jd/status', methods=['GET'])
def jd_status():
    """Get JD processing systems status"""
    
    status = {
        "enhanced_jd_processing": enhanced_jd_available,
        "uae_compliance_checker": enhanced_jd_available,
        "jd_analytics_engine": enhanced_jd_available,
        "jd_quality_scorer": enhanced_jd_available,
        "jd_optimization_engine": enhanced_jd_available,
        "basic_jd_parser": jd_parser is not None,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return jsonify(status)

# CV parsing endpoint
@app.route('/api/cv/parse', methods=['POST'])
@jwt_required()
def parse_cv():
    """Parse CV from uploaded file"""
    if not cv_parser:
        return jsonify({
            'success': False,
            'message': 'CV parser not available'
        }), 503
    
    try:
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
        
        # Get current user ID
        current_user_id = get_jwt_identity()
        
        # Parse CV
        result = cv_parser.parse_cv_file(file, user_id=current_user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'cv_id': result['cv_id'],
                'data': result['data'],
                'message': 'CV parsed successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"CV parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'CV parsing failed'
        }), 500

# CV text parsing endpoint
@app.route('/api/cv/parse-text', methods=['POST'])
@jwt_required()
def parse_cv_text():
    """Parse CV from text input"""
    if not cv_parser:
        return jsonify({
            'success': False,
            'message': 'CV parser not available'
        }), 503
    
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'message': 'No text provided'
            }), 400
        
        # Get current user ID
        current_user_id = get_jwt_identity()
        
        # Parse CV text
        result = cv_parser.parse_cv_text(data['text'], user_id=current_user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'cv_id': result['cv_id'],
                'data': result['data'],
                'message': 'CV text parsed successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"CV text parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'CV text parsing failed'
        }), 500

# JD parsing endpoint
@app.route('/api/jd/parse', methods=['POST'])
@jwt_required()
def parse_jd():
    """Parse JD from uploaded file"""
    if not jd_parser:
        return jsonify({
            'success': False,
            'message': 'JD parser not available'
        }), 503
    
    try:
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
        
        # Get current user ID
        current_user_id = get_jwt_identity()
        
        # Parse JD
        result = jd_parser.parse_jd_file(file, user_id=current_user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'jd_id': result['jd_id'],
                'data': result['data'],
                'message': 'JD parsed successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"JD parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'JD parsing failed'
        }), 500

# JD text parsing endpoint
@app.route('/api/jd/parse-text', methods=['POST'])
@jwt_required()
def parse_jd_text():
    """Parse JD from text input"""
    if not jd_parser:
        return jsonify({
            'success': False,
            'message': 'JD parser not available'
        }), 503
    
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'message': 'No text provided'
            }), 400
        
        # Get current user ID
        current_user_id = get_jwt_identity()
        
        # Parse JD text
        result = jd_parser.parse_jd_text(data['text'], user_id=current_user_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'jd_id': result['jd_id'],
                'data': result['data'],
                'message': 'JD text parsed successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"JD text parsing error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'JD text parsing failed'
        }), 500

# List parsed JDs endpoint
@app.route('/api/jd/list', methods=['GET'])
@jwt_required()
def list_jds():
    """List all parsed JDs for the current user"""
    try:
        # Get current user ID
        current_user_id = get_jwt_identity()
        
        # Get JDs from parser
        if jd_parser:
            jds = jd_parser.get_user_jds(current_user_id)
            return jsonify({
                'success': True,
                'jds': jds,
                'total_count': len(jds)
            })
        else:
            return jsonify({
                'success': True,
                'jds': [],
                'total_count': 0,
                'message': 'JD parser not available'
            })
            
    except Exception as e:
        logger.error(f"List JDs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve JDs'
        }), 500

# Job matching endpoint
@app.route('/api/matching/single', methods=['POST'])
@jwt_required()
def match_cv_to_jd():
    """Match a single CV to a JD"""
    if not matching_engine:
        return jsonify({
            'success': False,
            'message': 'Matching engine not available'
        }), 503
    
    try:
        data = request.get_json()
        if not data or 'cv_id' not in data or 'jd_id' not in data:
            return jsonify({
                'success': False,
                'message': 'CV ID and JD ID are required'
            }), 400
        
        # Get current user ID
        current_user_id = get_jwt_identity()
        
        # Perform matching
        result = matching_engine.match_cv_to_jd(
            data['cv_id'], 
            data['jd_id'], 
            user_id=current_user_id
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'match_score': result['match_score'],
                'detailed_scores': result.get('detailed_scores', {}),
                'recommendations': result.get('recommendations', []),
                'uae_specific_analysis': result.get('uae_specific_analysis', {}),
                'message': 'Matching completed successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400
            
    except Exception as e:
        logger.error(f"Matching error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Matching failed'
        }), 500

# Data retrieval endpoints
@app.route('/api/data/cvs', methods=['GET'])
@jwt_required()
def get_cvs():
    """Get all CVs for the current user"""
    try:
        # Get current user ID
        current_user_id = get_jwt_identity()
        
        # Get CVs from parser
        if cv_parser:
            cvs = cv_parser.get_user_cvs(current_user_id)
            return jsonify({
                'success': True,
                'cvs': cvs,
                'total_count': len(cvs)
            })
        else:
            return jsonify({
                'success': True,
                'cvs': [],
                'total_count': 0,
                'message': 'CV parser not available'
            })
            
    except Exception as e:
        logger.error(f"Get CVs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve CVs'
        }), 500

@app.route('/api/data/jds', methods=['GET'])
@jwt_required()
def get_jds():
    """Get all JDs for the current user"""
    try:
        # Get current user ID
        current_user_id = get_jwt_identity()
        
        # Get JDs from parser
        if jd_parser:
            jds = jd_parser.get_user_jds(current_user_id)
            return jsonify({
                'success': True,
                'jds': jds,
                'total_count': len(jds)
            })
        else:
            return jsonify({
                'success': True,
                'jds': [],
                'total_count': 0,
                'message': 'JD parser not available'
            })
            
    except Exception as e:
        logger.error(f"Get JDs error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve JDs'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

@app.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'message': 'Authentication required'
    }), 401

@app.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'message': 'Access forbidden'
    }), 403

@app.errorhandler(422)
def unprocessable_entity(error):
    """Handle 422 Unprocessable Entity errors (often from JWT validation)"""
    error_message = 'Request could not be processed'
    if hasattr(error, 'description'):
        error_message = error.description
    elif isinstance(error, str):
        error_message = error
    
    return jsonify({
        'success': False,
        'message': error_message
    }), 422

if __name__ == '__main__':
    # Print startup information
    print("\n" + "="*60)
    print("🚀 Starting Enhanced Emirati Journey API v4.0")
    print("📋 Features: CV Parsing + JD Parsing + Job Matching + User Authentication + Enhanced JD Processing")
    
    if enhanced_matching_available:
        print("🤖 AI Model: Gemini 2.5 PRO with Advanced Scoring")
    else:
        print("🤖 AI Model: Basic Matching Engine (Fallback)")
    
    if enhanced_analytics_available:
        print("📊 Analytics: Enhanced Real-time Analytics with UAE-specific Insights")
    else:
        print("📊 Analytics: Basic Analytics")
    
    if enhanced_jd_available:
        print("🔍 JD Processing: AI-Powered Analysis + UAE Compliance + Quality Scoring + Optimization")
        print("🎯 JD Features: Cultural Intelligence + Emiratization Compliance + Industry Benchmarking")
    else:
        print("🔍 JD Processing: Basic JD Parsing")
    
    # Get port from environment variable or default to 5001
    port = int(os.getenv('PORT', 5001))
    logger.info(f"🌐 Server: http://0.0.0.0:{port}")
    
    print("\n📋 Available Endpoints:")
    print("  GET  /health - Health check with feature status")
    print("  GET  /api/jd/status - JD processing systems status")
    print("  POST /api/auth/register - User registration")
    print("  POST /api/auth/login - User login")
    print("  POST /api/auth/refresh - Refresh token")
    print("  GET  /api/candidate/dashboard - Candidate dashboard data")
    print("  POST /api/cv/parse - Parse CV from file")
    print("  POST /api/cv/parse-text - Parse CV from text")
    print("  POST /api/jd/parse - Parse JD from file")
    print("  POST /api/jd/parse-text - Parse JD from text")
    print("  GET  /api/jd/list - List parsed JDs")
    print("  POST /api/matching/single - Match CV to JD")
    print("  GET  /api/data/cvs - List stored CVs")
    print("  GET  /api/data/jds - List stored JDs")
    
    if enhanced_jd_available:
        print("\n🔍 Enhanced JD Processing Endpoints:")
        print("  POST /api/jd/enhanced/parse - Enhanced JD parsing")
        print("  POST /api/jd/enhanced/analyze/compliance - UAE compliance analysis")
        print("  POST /api/jd/enhanced/analyze/quality - Quality assessment")
        print("  POST /api/jd/enhanced/optimize - AI optimization")
        print("  POST /api/jd/enhanced/analyze/complete - Complete analysis")
        print("  GET  /api/jd/enhanced/analytics/performance - Performance analytics")
        print("  GET  /api/jd/enhanced/analytics/benchmark - Industry benchmarking")
    
    if enhanced_analytics_available:
        print("\n📊 Enhanced Analytics Endpoints:")
        print("  GET  /api/analytics/enhanced/health - Analytics health check")
        print("  GET  /api/analytics/enhanced/real-time/{window} - Real-time metrics")
        print("  GET  /api/analytics/enhanced/uae-dashboard - UAE-specific dashboard")
    
    print("="*60 + "\n")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port, debug=True)

