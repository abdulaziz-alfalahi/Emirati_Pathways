#!/usr/bin/env python3
"""
Simple test server for enhanced authentication system
"""
import sys
import os
sys.path.append('.')

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Import our enhanced auth routes
try:
    from auth_routes_enhanced import auth_bp
    print("✅ Enhanced auth routes imported successfully")
except ImportError as e:
    print(f"❌ Failed to import enhanced auth routes: {e}")
    sys.exit(1)

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'enhanced-auth-secret-key-2024'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False

# Enable CORS for all routes
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

# Initialize JWT
jwt = JWTManager(app)

# Register the enhanced auth blueprint
app.register_blueprint(auth_bp, url_prefix='/api/auth')

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'message': 'Enhanced Authentication System is running',
        'version': '2.0',
        'features': [
            'Multi-step onboarding',
            'Card-based role selection',
            'All 5 personas supported',
            'Flexible role management',
            'Enhanced validation'
        ]
    })

@app.route('/api/test')
def test():
    return jsonify({
        'message': 'Enhanced auth system test endpoint',
        'available_endpoints': [
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/roles',
            '/api/auth/update-roles',
            '/api/auth/profile',
            '/api/auth/logout'
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting Enhanced Authentication Backend")
    print("📍 Server: http://localhost:5003")
    print("🔗 Health Check: http://localhost:5003/api/health")
    print("🧪 Test Endpoint: http://localhost:5003/api/test")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5003, debug=True, use_reloader=False)
