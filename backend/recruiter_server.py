"""
Recruiter Services Flask App
Registers recruiter-focused APIs: auth, postings, candidates, interviews,
messaging, candidate profiles, matching, and video interview endpoints.
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app() -> Flask:
    app = Flask(__name__)

    # JWT configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-this-in-production")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_HOURS", "24")))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=int(os.getenv("JWT_REFRESH_TOKEN_DAYS", "30")))

    JWTManager(app)

    # CORS configuration
    origins_env = os.getenv("CORS_ORIGINS", "").strip()
    allowed_origins = [o for o in (x.strip() for x in origins_env.split(",")) if o]
    if not allowed_origins:
        allowed_origins = [
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:3000",
        ]

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": allowed_origins,
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
                "supports_credentials": True,
                "expose_headers": ["Authorization"],
            },
            r"/health": {"origins": ["*"], "methods": ["GET", "OPTIONS"]},
        },
    )

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

    # Offers (HR + public accept/decline)
    try:
        from hr_offer_routes import hr_offer_bp, public_offer_bp

        app.register_blueprint(hr_offer_bp)
        app.register_blueprint(public_offer_bp)
        logger.info("Registered: offer routes")
    except Exception as e:
        logger.error(f"Failed registering offer routes: {e}")

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

    # Common error handlers
    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"success": False, "message": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(_):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    @app.errorhandler(401)
    def unauthorized(_):
        return jsonify({"success": False, "message": "Authentication required"}), 401

    @app.errorhandler(403)
    def forbidden(_):
        return jsonify({"success": False, "message": "Access forbidden"}), 403

    return app


if __name__ == "__main__":
    flask_app = create_app()
    port = int(os.getenv("PORT", "5003"))
    logger.info(f"Recruiter services running on http://0.0.0.0:{port}")
    flask_app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
