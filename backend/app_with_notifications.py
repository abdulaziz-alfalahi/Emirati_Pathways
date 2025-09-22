#!/usr/bin/env python3
"""
Enhanced Flask Application with Real-Time Notifications
Integrates WebSocket support and notification system with existing Emirati Journey Platform
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import os
import logging
from datetime import datetime, timedelta

# Import existing routes
from routes.auth_routes import auth_bp
from routes.job_routes import job_bp
from routes.profile_routes import profile_bp
from routes.notification_routes import notification_bp

# Import notification system
from notification_system import create_notification_system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    """Application factory function"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['REDIS_URL'] = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Initialize extensions
    CORS(app, origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:8080", "http://localhost:8081"])
    jwt = JWTManager(app)
    
    # Initialize notification system
    notification_system, notification_helpers = create_notification_system(
        app, app.config['REDIS_URL']
    )
    
    # Store notification system in app context for access in routes
    app.notification_system = notification_system
    app.notification_helpers = notification_helpers
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(job_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(notification_bp)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Main application health check"""
        try:
            # Test notification system
            notification_status = "healthy"
            if notification_system.redis_client:
                notification_system.redis_client.ping()
                redis_status = "connected"
            else:
                redis_status = "not_available"
                notification_status = "degraded"
            
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'services': {
                    'api': 'healthy',
                    'notifications': notification_status,
                    'redis': redis_status,
                    'websocket': 'active'
                },
                'version': '2.0.0'
            }), 200
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    # Enhanced authentication endpoints with notification integration
    @app.route('/api/auth/login-enhanced', methods=['POST'])
    def enhanced_login():
        """Enhanced login with notification system integration"""
        try:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            
            # Basic validation (in production, use proper authentication)
            if not email or not password:
                return jsonify({'error': 'Email and password required'}), 400
            
            # Mock user authentication (replace with real authentication)
            user_id = "user_123"  # This would come from your user database
            user_type = "job_seeker"  # This would come from user profile
            
            # Create JWT token with notification-relevant claims
            additional_claims = {
                'user_type': user_type,
                'notification_enabled': True
            }
            
            access_token = create_access_token(
                identity=user_id,
                additional_claims=additional_claims
            )
            
            # Send welcome notification
            notification_helpers.system_announcement(
                f"Welcome back! You're now connected to real-time updates.",
                [user_type]
            )
            
            return jsonify({
                'access_token': access_token,
                'user_id': user_id,
                'user_type': user_type,
                'notification_enabled': True,
                'websocket_url': request.host_url.replace('http', 'ws').rstrip('/')
            }), 200
            
        except Exception as e:
            logger.error(f"Enhanced login error: {e}")
            return jsonify({'error': 'Login failed'}), 500
    
    # Demo endpoints for testing notifications
    @app.route('/api/demo/send-job-alert', methods=['POST'])
    @jwt_required()
    def demo_send_job_alert():
        """Demo endpoint to send job alert notification"""
        try:
            user_id = str(get_jwt_identity())
            
            notification_helpers.new_job_alert(
                user_id=user_id,
                job_title="Senior Software Engineer",
                company="Emirates NBD",
                location="Dubai, UAE",
                job_id="job_001"
            )
            
            return jsonify({
                'success': True,
                'message': 'Job alert notification sent'
            }), 200
            
        except Exception as e:
            logger.error(f"Demo job alert error: {e}")
            return jsonify({'error': 'Failed to send notification'}), 500
    
    @app.route('/api/demo/send-application-update', methods=['POST'])
    @jwt_required()
    def demo_send_application_update():
        """Demo endpoint to send application status update"""
        try:
            user_id = str(get_jwt_identity())
            
            notification_helpers.job_application_status_update(
                user_id=user_id,
                job_title="Software Developer",
                company="ADNOC",
                status="interview_scheduled"
            )
            
            return jsonify({
                'success': True,
                'message': 'Application update notification sent'
            }), 200
            
        except Exception as e:
            logger.error(f"Demo application update error: {e}")
            return jsonify({'error': 'Failed to send notification'}), 500
    
    @app.route('/api/demo/send-mentoring-reminder', methods=['POST'])
    @jwt_required()
    def demo_send_mentoring_reminder():
        """Demo endpoint to send mentoring session reminder"""
        try:
            user_id = str(get_jwt_identity())
            
            notification_helpers.mentoring_session_reminder(
                user_id=user_id,
                mentor_name="Dr. Ahmed Al-Rashid",
                session_time="Tomorrow at 2:00 PM",
                session_id="session_001"
            )
            
            return jsonify({
                'success': True,
                'message': 'Mentoring reminder notification sent'
            }), 200
            
        except Exception as e:
            logger.error(f"Demo mentoring reminder error: {e}")
            return jsonify({'error': 'Failed to send notification'}), 500
    
    @app.route('/api/demo/broadcast-announcement', methods=['POST'])
    @jwt_required()
    def demo_broadcast_announcement():
        """Demo endpoint to broadcast system announcement"""
        try:
            data = request.get_json()
            message = data.get('message', 'System maintenance scheduled for tonight at 11 PM UAE time.')
            
            notification_helpers.system_announcement(message)
            
            return jsonify({
                'success': True,
                'message': 'System announcement broadcasted'
            }), 200
            
        except Exception as e:
            logger.error(f"Demo broadcast error: {e}")
            return jsonify({'error': 'Failed to broadcast announcement'}), 500
    
    # WebSocket connection info endpoint
    @app.route('/api/websocket/info', methods=['GET'])
    @jwt_required()
    def websocket_info():
        """Get WebSocket connection information"""
        return jsonify({
            'websocket_url': request.host_url.replace('http', 'ws').rstrip('/'),
            'supported_events': [
                'connect',
                'disconnect',
                'get_notifications',
                'mark_read',
                'delete_notification'
            ],
            'notification_types': [
                'job_alert',
                'application_update',
                'interview_scheduled',
                'mentoring_session',
                'educational_content',
                'system_announcement'
            ]
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({'error': 'Internal server error'}), 500
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authorization token required'}), 401
    
    return app

def run_app():
    """Run the application with WebSocket support"""
    app = create_app()
    
    # Get SocketIO instance for running with WebSocket support
    socketio = app.notification_system.get_socketio()
    
    # Run with SocketIO
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True
    )

if __name__ == '__main__':
    run_app()
