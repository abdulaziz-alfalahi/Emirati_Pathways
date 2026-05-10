"""
Recruiter Services Flask App
Registers recruiter-focused APIs: auth, postings, candidates, interviews,
messaging, candidate profiles, matching, and video interview endpoints.
"""

# Trigger reload - debug 7

import os
import sys
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

from flask_cors import CORS
from flask_jwt_extended import JWTManager



print("!!! DEBUG: LOADING RECRUITER_SERVER.PY !!!")
print(f"SYS.PATH: {sys.path}")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app() -> Flask:
    app = Flask(__name__)

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_HOURS", "24")))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_DAYS", "30")))

    JWTManager(app)

    # SQLAlchemy configuration (required for Profile V2 API and ORM-based routes)
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "emirati_journey")
    db_user = os.getenv("DB_USER", "emirati_user")
    db_pass = os.getenv("DB_PASSWORD", "emirati_secure_password")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    from backend.extensions import db
    db.init_app(app)

    # CORS configuration
    origins_env = os.getenv("CORS_ORIGINS", "").strip()
    allowed_origins = [o for o in (x.strip() for x in origins_env.split(",")) if o]
    # Always include local development origins
    local_origins = [
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:3000",
        "https://archdiocesan-complimentarily-marianna.ngrok-free.dev",
    ]
    
    if not allowed_origins:
        allowed_origins = local_origins
    else:
        allowed_origins.extend(local_origins)
        
    # Remove duplicates
    allowed_origins = list(set(allowed_origins))
    
    logger.info(f"CORS Allowed Origins: {allowed_origins}")

    # Global CORS configuration
    CORS(app, origins=allowed_origins, supports_credentials=True)

    # Make local imports available
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    # Health
    @app.route("/health", methods=["GET"])
    def health() -> tuple:
        return (
            jsonify(
                {
                    "status": "healthy",
                    "service": "recruiter-services",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
            200,
        )



    # Recruiter Dashboard API (offers, JD list, shortlist, candidate details, dashboard overview)
    try:
        from routes.recruiter_dashboard_api import recruiter_dashboard_bp
        app.register_blueprint(recruiter_dashboard_bp)
        logger.info("Registered: Recruiter Dashboard API routes")
    except Exception as e:
        logger.error(f"Failed registering Recruiter Dashboard API routes: {e}")

    # Interview Sessions API (video interview)
    try:
        from routes.interview_sessions_api import interview_sessions_bp
        app.register_blueprint(interview_sessions_bp)
        logger.info("Registered: Interview Sessions API routes")
    except Exception as e:
        logger.error(f"Failed registering Interview Sessions API routes: {e}")

    # Profile V2 API (candidate profile studio)
    try:
        from routes.profile.profile_routes_v2 import profile_v2_bp
        app.register_blueprint(profile_v2_bp)
        logger.info("Registered: Profile V2 API routes")
    except Exception as e:
        logger.error(f"Failed registering Profile V2 API routes: {e}")


    # Auth
    try:
        from routes.auth_routes import auth_bp

        app.register_blueprint(auth_bp)
        logger.info("Registered: auth routes")
    except Exception as e:
        logger.error(f"Failed registering auth routes: {e}")

    # Candidate profile
    try:
        from candidate_profile_routes import candidate_profile_bp

        app.register_blueprint(candidate_profile_bp)
        logger.info("Registered: candidate profile routes")
    except Exception as e:
        logger.error(f"Failed registering candidate profile routes: {e}")

    # Recruiter/HR: job postings
    try:
        from hr_job_posting_routes import hr_job_posting_bp

        app.register_blueprint(hr_job_posting_bp)
        logger.info("Registered: HR job posting routes")
    except Exception as e:
        logger.error(f"Failed registering HR job posting routes: {e}")

    # Recruiter/HR: offers management + public accept/decline
    try:
        from hr_offer_routes import hr_offer_bp, public_offer_bp

        app.register_blueprint(hr_offer_bp)
        app.register_blueprint(public_offer_bp)
        logger.info("Registered: HR offer routes and public offer routes")
    except Exception as e:
        logger.error(f"Failed registering HR offer routes: {e}")

    # Recruiter/HR: approval workflow
    try:
        from hr_approval_routes import hr_approval_bp

        app.register_blueprint(hr_approval_bp)
        logger.info("Registered: HR approval routes")
    except Exception as e:
        logger.error(f"Failed registering approval routes: {e}")

    # Recruiter/HR: external distribution + external callbacks
    try:
        from hr_external_distribution_routes import hr_distribution_bp, external_distribution_bp

        app.register_blueprint(hr_distribution_bp)
        app.register_blueprint(external_distribution_bp)
        logger.info("Registered: HR external distribution routes and external callbacks")
    except Exception as e:
        logger.error(f"Failed registering external distribution routes: {e}")

    # Recruiter/HR: analytics
    try:
        from hr_analytics_routes import hr_analytics_bp
        app.register_blueprint(hr_analytics_bp)
        logger.info("Registered: HR analytics routes")
        
        # New Recruiter Analytics
        from recruiter.analytics_routes import analytics_bp
        app.register_blueprint(analytics_bp, url_prefix='/api/recruiter')
        logger.info("Registered: Recruiter analytics routes")
    except Exception as e:
        logger.error(f"Failed registering HR analytics routes: {e}")

    # Recruiter/HR: candidate search & matching-by-job
    try:
        from hr_candidate_search_routes import hr_candidate_search_bp

        app.register_blueprint(hr_candidate_search_bp)
        logger.info("Registered: HR candidate search routes")
    except Exception as e:
        logger.error(f"Failed registering HR candidate search routes: {e}")

    # Recruiter/HR: interview scheduling & feedback
    try:
        from hr_interview_scheduling_routes import hr_interview_bp

        app.register_blueprint(hr_interview_bp)
        logger.info("Registered: HR interview scheduling routes")
    except Exception as e:
        logger.error(f"Failed registering HR interview scheduling routes: {e}")

    # Messaging & notifications
    try:
        from routes.communication_routes import communication_bp

        app.register_blueprint(communication_bp)
        logger.info("Registered: communication routes")
    except Exception as e:
        logger.error(f"Failed registering communication routes: {e}")



    # Video interviewing
    try:
        from video_interview_routes import video_interview_bp

        app.register_blueprint(video_interview_bp)
        logger.info("Registered: video interview routes")
    except Exception as e:
        logger.error(f"Failed registering video interview routes: {e}")

    # Quality assurance & bias detection
    try:
        from quality_assurance_routes import qa_bp

        app.register_blueprint(qa_bp)
        logger.info("Registered: quality assurance routes")
    except Exception as e:
        logger.error(f"Failed registering quality assurance routes: {e}")

    # Optimized matching endpoints
    try:
        from matching.matching_routes_optimized import register_optimized_matching_routes

        register_optimized_matching_routes(app)
        logger.info("Registered: optimized matching routes")
    except Exception as e:
        logger.error(f"Failed registering optimized matching routes: {e}")

    # NEW: Job Description Builder with AI Candidate Matching
    # (Removed duplicate registration)


    # Register JD Upload routes
    try:
        from recruiter.jd_upload_routes import jd_upload_routes
        app.register_blueprint(jd_upload_routes)
        logger.info("Registered: JD Upload routes with AI parsing")
    except Exception as e:
        logger.error(f"Failed registering JD Upload routes: {e}")

    # Register JD Builder v2 routes
    try:
        from recruiter.jd_routes_v2 import jd_bp as jd_v2_bp
        app.register_blueprint(jd_v2_bp)
        logger.info("Registered: JD Builder v2 routes")
    except Exception as e:
        logger.error(f"Failed registering JD Builder v2 routes: {e}")

    # Register Shortlist routes
    try:
        from recruiter.shortlist_routes import shortlist_bp
        app.register_blueprint(shortlist_bp, url_prefix='/api/recruiter/shortlist')
        logger.info("Registered: Shortlist routes for candidate management")
    except Exception as e:
        logger.error(f"Failed registering Shortlist routes: {e}")

    # Register Statistics routes
    try:
        from recruiter.statistics_routes import statistics_bp
        app.register_blueprint(statistics_bp, url_prefix='/api/recruiter/statistics')
        logger.info("Registered: Statistics routes")
    except Exception as e:
        logger.error(f"Failed registering Statistics routes: {e}")

    # Register Enhanced CV routes (full-featured, used by Profile Studio IdentityModule)
    try:
        from routes.enhanced_cv_routes import enhanced_cv_bp
        app.register_blueprint(enhanced_cv_bp)
        logger.info("Registered: Enhanced CV routes")
    except Exception as e:
        logger.error(f"Failed registering Enhanced CV routes: {e}")

    # Fallback: Register basic CV Builder routes only if enhanced failed
    try:
        if 'enhanced_cv' not in [bp.name for bp in app.blueprints.values() if hasattr(bp, 'name')]:
            from recruiter.cv_routes import cv_bp
            app.register_blueprint(cv_bp)
            logger.info("Registered: CV Builder routes (basic fallback)")
    except Exception as e:
        logger.error(f"Failed registering CV Builder routes: {e}")

    # Register Communication routes
    try:
        from recruiter.communication_routes import communication_routes

        app.register_blueprint(communication_routes)
        logger.info("Registered: Communication routes for messaging candidates")
    except Exception as e:
        logger.error(f"Failed registering Communication routes: {e}")

    # Register Interview Scheduling routes
    try:
        from recruiter.interview_routes import interview_bp as interview_routes
        
        app.register_blueprint(interview_routes, url_prefix='/api/recruiter/interviews')
        logger.info("Registered: Interview Scheduling routes for managing interviews")
    except Exception as e:
        import traceback
        with open('registration_error.log', 'w') as f:
            f.write(f"Error: {str(e)}\nTraceback:\n{traceback.format_exc()}")
        logger.error(f"Failed registering Interview Scheduling routes: {e}")

    # Register Offer Management routes
    try:
        from recruiter.offer_routes import offer_bp

        app.register_blueprint(offer_bp, url_prefix='/api/recruiter/offers')
        logger.info("Registered: Offer Management routes for managing job offers")
    except Exception as e:
        logger.error(f"Failed registering Offer Management routes: {e}")

    # Common error handlers
    @app.errorhandler(404)
    def not_found(e):
        logger.error(f"404 ERROR: {request.url}")
        return jsonify({"success": False, "message": "MY CUSTOM 404", "url": request.url}), 404

    @app.errorhandler(500)
    def internal_error(e):
        import traceback
        tb = traceback.format_exc()
        logger.error(f"500 ERROR: {e}\n{tb}")
        
        # Write to file
        try:
            log_path = os.path.join(os.getcwd(), "backend_error.log")
            with open(log_path, "a") as f:
                f.write(f"[{datetime.now()}] {e}\n{tb}\n\n")
        except Exception as write_err:
            logger.error(f"Failed to write to error log: {write_err}")
            
        response = jsonify({
            "success": False, 
            "message": "Internal server error", 
            "error": str(e),
            "traceback": tb
        })
        # Add CORS headers manually just in case
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 500

    @app.errorhandler(401)
    def unauthorized(_):
        return jsonify({"success": False, "message": "Authentication required"}), 401

    @app.errorhandler(403)
    def forbidden(_):
        return jsonify({"success": False, "message": "Access forbidden"}), 403

    try:
        from recruiter.training_routes import training_bp
        app.register_blueprint(training_bp)
        logger.info("Registered: Training recommendation routes")
    except Exception as e:
        logger.error(f"Failed registering training routes: {e}")

    try:
        from job_application_routes import job_application_bp
        app.register_blueprint(job_application_bp)
        logger.info("Registered: Job Application routes")
    except Exception as e:
        logger.error(f"Failed registering Job Application routes: {e}")

    try:
        from candidate_job_routes import candidate_job_bp
        app.register_blueprint(candidate_job_bp)
        logger.info("Registered: Candidate Job routes (Simple)")
    except Exception as e:
        logger.error(f"Failed registering Candidate Job routes: {e}")

    try:
        from recruiter.mentorship_routes import mentorship_bp
        app.register_blueprint(mentorship_bp)
        logger.info("Registered: Mentorship recommendation routes")
    except Exception as e:
        logger.error(f"Failed registering mentorship routes: {e}")

    return app


if __name__ == "__main__":
    flask_app = create_app()
    port = int(os.getenv("PORT", "5005"))
    logger.info(f"Recruiter services running on http://0.0.0.0:{port}")
    flask_app.run(host="0.0.0.0", port=port, debug=os.getenv('FLASK_ENV', 'production') != 'production', threaded=True)
