"""
FIXED Flask App - Authentication Context Issue Resolved
Version 4.1 - Fixed JWT context handling for authentication
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_socketio import SocketIO
import json
import time
import logging
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Initialize SocketIO without cors logic first (handled manually/globally)
# Initialize SocketIO without cors logic first (handled manually/globally)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Notification System
try:
    from notification_system import create_notification_system
    # We attach these to app so they are accessible via current_app in blueprints
    app.notification_system, app.notification_helpers = create_notification_system(app, socketio=socketio)
    logger.info("✅ Notification System initialized")
except ImportError as e:
    logger.error(f"❌ Failed to import Notification System: {e}")

# JWT Configuration - FIXED
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)  # Extended for better UX
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize JWT Manager - MUST be done before importing routes
jwt = JWTManager(app)

# CORS Configuration with authentication support
# CORS(app, resources={...}) - DISABLED
# Manually handling CORS to avoid conflicts

from flask import make_response

@app.before_request
def handle_options_request():
    origin = request.headers.get('Origin')
    print(f"DEBUG: before_request handling {request.method} from {origin}")
    sys.stdout.flush()
    
    if request.method == "OPTIONS":
        response = make_response()
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept'
            response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    print(f"DEBUG: after_request called. Origin: {origin}")
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With,Accept'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'emirati-journey-platform',
        'version': '4.1-fixed',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# Import and register authentication routes - FIXED ORDER
try:
    from routes.auth_routes import auth_bp
    import routes.auth_routes
    print(f"!!! DEBUG: LOADED routes.auth_routes FROM: {routes.auth_routes.__file__}")
    app.register_blueprint(auth_bp)
    logger.info("✅ Authentication routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import authentication routes: {e}")

# Import Enhanced CV routes (Upload + Management + Parsing)
try:
    from routes.enhanced_cv_routes import enhanced_cv_bp
    app.register_blueprint(enhanced_cv_bp)
    logger.info("✅ Enhanced CV routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import Enhanced CV routes: {e}")

# Import Administrator Routes (Preferred over User Management API)
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
    logger.info("✅ Administrator routes registered successfully")
except Exception as e:
    logger.error(f"❌ Failed to import/register Administrator routes: {e}")

# Import User Management routes (Disable to avoid conflict or keep as backup if different prefix)
# Setting url_prefix to something else if needed, but for now we assume admin_bp handles /api/admin
try:
    from routes.user_management_api import user_management_bp
    # If admin_bp uses /api/admin, and user_management_bp uses /api/admin, we have a conflict.
    # administrator_routes is the more "complete" implementation we want.
    # So we DO NOT register user_management_bp to /api/admin. 
    # Or we can register it to /api/legacy/admin if needed.
    # For now, let's comment it out to fully rely on administrator_routes.
    # app.register_blueprint(user_management_bp)
    logger.info("ℹ️ User Management routes skipped (using Administrator routes)")
except ImportError as e:
    logger.error(f"❌ Failed to import User Management routes: {e}")

# Import Admin Dashboard & Feedback routes
try:
    from routes.admin_dashboard_api import admin_dashboard_bp, feedback_bp, ensure_feedback_table_exist
    app.register_blueprint(admin_dashboard_bp)
    app.register_blueprint(feedback_bp)
    # Ensure tables exist
    ensure_feedback_table_exist()
    logger.info("✅ Admin Dashboard & Feedback routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import Admin Dashboard routes: {e}")

# Import Notification routes (aliased to /api/communication/notifications)
try:
    from routes.notification_routes import notification_bp
    # The frontend expects /api/communication/notifications, but BP defines /api/notifications
    # We override the prefix here to match frontend expectation
    app.register_blueprint(notification_bp, url_prefix='/api/communication/notifications')
    logger.info("✅ Notification routes registered successfully (at /api/communication/notifications)")
except ImportError as e:
    logger.error(f"❌ Failed to import Notification routes: {e}")

# Import Student routes
try:
    from routes.student_routes import student_bp
    app.register_blueprint(student_bp, url_prefix='/api/student')
    logger.info("✅ Student routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import Student routes: {e}")

# Error handlers
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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5003))
    
    print("="*60)
    print(" EMIRATI JOURNEY PLATFORM - FIXED VERSION")
    print("="*60)
    print(f" Server starting on port {port}")
    print(f" Health check: http://localhost:{port}/health")
    print(f" Authentication: http://localhost:{port}/api/auth/login")
    print(f" CV Upload: http://localhost:{port}/api/cv/upload")
    print("="*60)
    print(" REGISTERED ROUTES MAP:")
    print(app.url_map)
    print("="*60)
    
    # Run the Flask app with SocketIO
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
