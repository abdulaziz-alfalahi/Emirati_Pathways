"""
FIXED Flask App - Authentication and CV Upload Working
Version 4.2 - Fixed JWT context and CV upload functionality
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
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

# JWT Configuration - FIXED
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)  # Extended for better UX
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize JWT Manager - MUST be done before importing routes
jwt = JWTManager(app)

# CORS Configuration with authentication support
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8080", "http://localhost:8081", "http://localhost:3000"],
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

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'emirati-journey-platform',
        'version': '4.2-fixed-cv',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# Import and register authentication routes - FIXED ORDER
try:
    from routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    logger.info("✅ Authentication routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import authentication routes: {e}")

# Import simplified CV upload routes
try:
    from routes.cv_upload_simple import cv_upload_bp
    app.register_blueprint(cv_upload_bp)
    logger.info("✅ CV upload routes registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import CV upload routes: {e}")

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
    print("🇦🇪 EMIRATI JOURNEY PLATFORM - CV UPLOAD FIXED")
    print("="*60)
    print(f"🚀 Server starting on port {port}")
    print(f"🔗 Health check: http://localhost:{port}/health")
    print(f"🔐 Authentication: http://localhost:{port}/api/auth/login")
    print(f"📄 CV Upload: http://localhost:{port}/api/cv/upload")
    print(f"📋 CV List: http://localhost:{port}/api/cv/list")
    print("="*60)
    
    # Run the Flask app - FIXED: Removed debug mode for production stability
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
