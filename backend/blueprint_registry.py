import logging
from flask import Flask

# Configure logging
logger = logging.getLogger(__name__)

def register_all_blueprints(app: Flask):
    """
    Registers all blueprints for the application.
    Uses try-except blocks to strictly handle missing modules without crashing.
    """
    
    # 1. Core Auth & Admin
    try:
        from backend.routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        logger.info("✅ Auth routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Auth routes not available: {e}")

    try:
        from backend.routes.feature_flags_api import feature_flags_bp
        app.register_blueprint(feature_flags_bp)
        logger.info("✅ Feature flags routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Feature flags routes not available: {e}")

    try:
        from backend.routes.company_team_routes import company_team_bp
        app.register_blueprint(company_team_bp, url_prefix='/api/company/team')
        logger.info("✅ Company Team routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Company Team routes not available: {e}")


    try:
        from backend.routes.administrator_routes import admin_bp, init_admin_routes
        import os
        
        # Configure DB for admin routes
        admin_db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'port': int(os.getenv('DB_PORT', 5432))
        }
        
        # Initialize admin system
        init_admin_routes(app, admin_db_config)
        app.register_blueprint(admin_bp)
        logger.info("✅ Administrator routes registered")
    except Exception as e:
        logger.error(f"⚠️ Administrator routes not available: {e}", exc_info=True)

    try:
        from backend.role_routes import role_bp
        app.register_blueprint(role_bp)
        logger.info("✅ Role Management routes registered")
    except Exception as e:
        logger.warning(f"⚠️ Role Management routes not available: {e}")

    # ... (skipping unchanged lines) ...

    # 8. Feedback & Utilities
    try:
        from backend.routes.admin_dashboard_api import admin_dashboard_bp, feedback_bp as sql_feedback_bp, ensure_feedback_table_exist
        app.register_blueprint(admin_dashboard_bp)
        app.register_blueprint(sql_feedback_bp)
        # Ensure DB table exists
        ensure_feedback_table_exist()
        logger.info("✅ Admin Dashboard & Feedback Routes (SQL) registered successfully")
    except Exception as e:
        logger.error(f"❌ Failed to register Admin Dashboard / SQL Feedback Routes: {e}")
        # Fallback to old JSON file routes if SQL fails (unlikely)
        _register_safe(app, 'feedback_routes', 'feedback_bp', 'Feedback Routes (JSON Fallback)', url_prefix='/api/feedback')
    
    # 9. Student Modules
    _register_safe(app, 'backend.routes.student_routes', 'student_bp', 'Student Dashboard', url_prefix='/api/student')
    _register_safe(app, 'backend.educator_routes', 'educator_bp', 'Educator Dashboard', url_prefix='/api/educator')
    
    # 10. Missing Core Blueprints (Explicit Registration)
    try:
        from backend.routes.profile.profile_routes_v2 import profile_v2_bp
        app.register_blueprint(profile_v2_bp)
        logger.info("✅ Profile V2 routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Profile V2 routes not available: {e}")

    try:
        from backend.candidate_profile_routes import candidate_profile_bp
        app.register_blueprint(candidate_profile_bp, url_prefix='/api/profile')
        logger.info("✅ Candidate Profile routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Candidate Profile routes not available: {e}")

    try:
        from backend.routes.enhanced_cv_routes import enhanced_cv_bp
        app.register_blueprint(enhanced_cv_bp)
        logger.info("✅ Enhanced CV routes registered (via registry)")
    except ImportError as e:
        logger.warning(f"⚠️ Enhanced CV routes not available: {e}")
        # FALLBACK: Use standard CV Upload Routes (Patched)
        try:
            from backend.routes.cv_upload_routes import cv_upload_bp
            app.register_blueprint(cv_upload_bp)
            logger.info("✅ Standard CV upload routes registered (Fallback)")
        except ImportError as e2:
            logger.warning(f"⚠️ Standard CV upload routes not available: {e2}")

    try:
        from backend.candidate_job_routes import candidate_job_bp
        app.register_blueprint(candidate_job_bp)
        logger.info("✅ Candidate Job routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Candidate Job routes not available: {e}")

    try:
        from backend.routes.communication_routes import communication_bp
        app.register_blueprint(communication_bp)
        logger.info("✅ Communication routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Communication routes not available: {e}")

    # 11. Recruiter & HR Modules (CRITICAL FIX)
    try:
        from backend.routes.hr_dashboard_api import hr_dashboard_api_bp
        app.register_blueprint(hr_dashboard_api_bp)
        logger.info("✅ HR Dashboard API routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ HR Dashboard API routes not available: {e}")

    try:
        from backend.routes.recruiter_dashboard_api import recruiter_dashboard_bp
        app.register_blueprint(recruiter_dashboard_bp)
        logger.info("✅ Recruiter Dashboard routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Recruiter Dashboard routes not available: {e}")

    try:
        from backend.hr_offer_routes import hr_offer_bp, public_offer_bp
        app.register_blueprint(hr_offer_bp)
        app.register_blueprint(public_offer_bp)
        logger.info("✅ HR Offer routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ HR Offer routes not available: {e}")

    try:
        from backend.routes.interview_sessions_api import interview_sessions_bp
        # The internal file uses '/api/video-interview' (fixed)
        app.register_blueprint(interview_sessions_bp)
        logger.info("✅ Video Interview routes registered (as /api/video-interview)")
    except ImportError as e:
        logger.warning(f"⚠️ Video Interview routes not available: {e}")

    try:
        from backend.routes.interview_routes import interview_bp
        app.register_blueprint(interview_bp)
        logger.info("✅ Interview routes registered (as /api/interviews)")
    except ImportError as e:
        logger.warning(f"⚠️ Interview routes not available: {e}")

    # Recruiter Interview Scheduling (shortlist → interview workflow)
    try:
        from backend.recruiter.interview_routes import interview_bp as recruiter_interview_bp
        app.register_blueprint(recruiter_interview_bp, url_prefix='/api/recruiter/interviews')
        logger.info("✅ Recruiter Interview Scheduling routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Recruiter Interview Scheduling routes not available: {e}")

    try:
        from backend.hr_job_posting_routes import hr_job_posting_bp, ensure_job_postings_table_exists
        app.register_blueprint(hr_job_posting_bp)
        ensure_job_postings_table_exists() # Initialize tables
        logger.info("✅ HR Job Posting routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ HR Job Posting routes not available: {e}")

    try:
        from backend.job_application_routes import job_application_bp
        app.register_blueprint(job_application_bp)
        logger.info("✅ Job Application routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Job Application routes not available: {e}")

    try:
        from backend.hr_candidate_routes import hr_candidate_bp
        app.register_blueprint(hr_candidate_bp)
        logger.info("✅ HR Candidate routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ HR Candidate routes not available: {e}")

    # 12. Jobs API Routes (Candidate job matching, applications, withdrawal)
    try:
        from backend.routes.jobs_api import register_jobs_routes
        register_jobs_routes(app)
        logger.info("✅ Jobs API routes registered (includes application withdrawal)")
    except ImportError as e:
        logger.warning(f"⚠️ Jobs API routes not available: {e}")

    # 13. HR Analytics (recruiter pipeline/conversion metrics)
    try:
        from backend.hr_analytics_routes import hr_analytics_bp
        app.register_blueprint(hr_analytics_bp)
        logger.info("✅ HR Analytics routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ HR Analytics routes not available: {e}")

    # 14. Recruiter Reports (pipeline, candidates, interviews, offers, performance)
    try:
        from backend.recruiter.reports_routes import reports_bp
        app.register_blueprint(reports_bp, url_prefix='/api/recruiter/reports')
        logger.info("✅ Recruiter Reports routes registered")
    except ImportError as e:
        logger.warning(f"⚠️ Recruiter Reports routes not available: {e}")

    # 15. Board Portal
    _register_safe(app, 'backend.routes.board_portal_routes', 'board_portal_bp', 'Board Portal')

    # 16. Assessor Modules
    _register_safe(app, 'backend.routes.assessor_routes', 'assessor_bp', 'Assessor Dashboard', url_prefix=None)
    _register_safe(app, 'backend.assessment_analytics_qa_routes', 'assessment_analytics_qa_bp', 'Assessment Analytics & QA')


def _register_safe(app, module_path, bp_name, display_name, url_prefix=None):
    try:
        # Dynamic import
        import importlib
        module = importlib.import_module(module_path)
        bp = getattr(module, bp_name)
        
        kwargs = {}
        if url_prefix:
            kwargs['url_prefix'] = url_prefix
            
        app.register_blueprint(bp, **kwargs)
        logger.info(f"✅ {display_name} registered successfully")
    except (ImportError, AttributeError) as e:
        logger.debug(f"ℹ️ {display_name} skipped: {e}")
        # Try alternate path (prefixing with 'backend.') if it failed
        if not module_path.startswith('backend.'):
            try:
                module = importlib.import_module(f'backend.{module_path}')
                bp = getattr(module, bp_name)
                kwargs = {}
                if url_prefix:
                    kwargs['url_prefix'] = url_prefix
                app.register_blueprint(bp, **kwargs)
                logger.info(f"✅ {display_name} registered (via backend prefix)")
                return
            except Exception:
                pass
        
        logger.warning(f"⚠️ {display_name} not available")
