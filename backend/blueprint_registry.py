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
        from routes.administrator_routes import admin_bp, init_admin_routes
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
        logger.warning(f"⚠️ Administrator routes not available: {e}")

    try:
        from role_routes import role_bp
        app.register_blueprint(role_bp)
        logger.info("✅ Role Management routes registered")
    except Exception as e:
        logger.warning(f"⚠️ Role Management routes not available: {e}")

    # 2. Recruiter Modules
    _register_safe(app, 'recruiter.jd_upload_routes', 'jd_upload_routes', 'Recruiter JD Upload')
    _register_safe(app, 'recruiter.statistics_routes', 'statistics_bp', 'Recruiter Statistics', url_prefix='/api/recruiter/statistics')
    _register_safe(app, 'recruiter.jd_routes_v2', 'jd_bp', 'Recruiter JD V2')
    _register_safe(app, 'recruiter.analytics_routes', 'analytics_bp', 'Recruiter Analytics', url_prefix='/api/recruiter')
    _register_safe(app, 'recruiter.shortlist_routes', 'shortlist_bp', 'Recruiter Shortlist', url_prefix='/api/recruiter/shortlist')
    _register_safe(app, 'recruiter.interview_routes', 'interview_bp', 'Recruiter Interview', url_prefix='/api/recruiter/interviews')
    _register_safe(app, 'recruiter.offer_routes', 'offer_bp', 'Recruiter Offer', url_prefix='/api/recruiter/offers')

    # 3. HR Modules
    _register_safe(app, 'hr_job_posting_routes', 'hr_job_posting_bp', 'HR Job Posting')
    _register_safe(app, 'hr_offer_routes', 'hr_offer_bp', 'HR Offer')
    _register_safe(app, 'hr_offer_routes', 'public_offer_bp', 'Public Offer')
    _register_safe(app, 'hr_candidate_search_routes', 'hr_candidate_search_bp', 'HR Candidate Search')
    _register_safe(app, 'hr_dashboard_routes', 'hr_dashboard_bp', 'HR Dashboard')
    _register_safe(app, 'hr_profile_management_routes', 'hr_profile_bp', 'HR Profile')

    # 4. Job & Application
    _register_safe(app, 'candidate_job_routes', 'candidate_job_bp', 'Candidate Job')
    _register_safe(app, 'job_application_routes', 'job_application_bp', 'Job Application')
    _register_safe(app, 'candidate_profile_routes', 'candidate_profile_bp', 'Candidate Profile')
    
    # 5. Growth & Community
    try:
        from backend.routes.growth_routes import growth_bp
        app.register_blueprint(growth_bp) # Path typically embedded
        logger.info("✅ Growth routes registered")
    except ImportError:
        logger.warning("⚠️ Growth routes not found")

    _register_safe(app, 'backend.routes.company_team_routes', 'company_team_bp', 'Company Team')
    
    # 6. Communication & Interview
    _register_safe(app, 'backend.routes.communication_routes', 'communication_bp', 'Communication')
    _register_safe(app, 'backend.routes.interview_routes', 'interview_bp', 'Interview (Video)')

    # 7. Enhanced APIs (Dashboard APIs)
    _register_safe(app, 'routes.admin_dashboard_api', 'admin_dashboard_bp', 'Admin Dashboard API')
    _register_safe(app, 'routes.growth_operator_api', 'growth_operator_bp', 'Growth Operator API')
    # _register_safe(app, 'routes.communication_api', 'communication_bp', 'Communication API')
    _register_safe(app, 'routes.interview_sessions_api', 'interview_sessions_bp', 'Interview Sessions API')
    _register_safe(app, 'routes.hr_dashboard_api', 'hr_dashboard_api_bp', 'HR Dashboard API')
    _register_safe(app, 'routes.recruiter_dashboard_api', 'recruiter_dashboard_bp', 'Recruiter Dashboard API')
    _register_safe(app, 'routes.jobs_api', 'jobs_bp', 'Jobs API')
    _register_safe(app, 'routes.jobs_api', 'candidate_jobs_bp', 'Candidate Jobs API')
    _register_safe(app, 'routes.growth_operator_assignment_api', 'growth_operator_assignment_bp', 'Growth Operator Assignment API')
    _register_safe(app, 'routes.jd_templates_api', 'jd_templates_bp', 'JD Templates API')
    _register_safe(app, 'routes.user_management_api', 'user_management_bp', 'User Management API')
    _register_safe(app, 'routes.user_activity_api', 'user_activity_bp', 'User Activity API')
    
    # 8. Feedback & Utilities
    _register_safe(app, 'feedback_routes', 'feedback_bp', 'Feedback Routes', url_prefix='/api/feedback')


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
