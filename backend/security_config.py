"""
Security Configuration for Emirati Journey API
Production-ready security settings
"""

import os
from datetime import timedelta

class SecurityConfig:
    """Security configuration settings"""
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = 'HS256'
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    
    # Session Configuration
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',')
    CORS_ALLOW_HEADERS = [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token'
    ]
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_SUPPORTS_CREDENTIALS = True
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL')
    RATELIMIT_DEFAULT = "100 per hour"
    RATELIMIT_HEADERS_ENABLED = True
    
    # Content Security Policy
    CSP_DIRECTIVES = {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
        'font-src': "'self' https://fonts.gstatic.com",
        'img-src': "'self' data: https:",
        'connect-src': "'self' https://api.groq.com https://generativelanguage.googleapis.com",
        'frame-ancestors': "'none'"
    }
    
    # File Upload Security
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {
        'pdf', 'doc', 'docx', 'txt', 'rtf',
        'jpg', 'jpeg', 'png', 'gif', 'webp'
    }
    
    # Password Policy
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_SPECIAL = True
    
    # API Security
    API_KEY_HEADER = 'X-API-Key'
    API_RATE_LIMIT = "1000 per hour"
    
    # Audit Logging
    AUDIT_LOG_ENABLED = True
    AUDIT_LOG_LEVEL = 'INFO'
    AUDIT_LOG_FORMAT = 'json'
    
    # Data Encryption
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')
    HASH_ALGORITHM = 'sha256'
    
    # UAE Compliance
    DATA_RESIDENCY_REQUIRED = True
    GDPR_COMPLIANCE_ENABLED = True
    AUDIT_RETENTION_DAYS = 2555  # 7 years
    
    @staticmethod
    def is_allowed_file(filename):
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in SecurityConfig.ALLOWED_EXTENSIONS
    
    @staticmethod
    def validate_password(password):
        """Validate password against security policy"""
        if len(password) < SecurityConfig.PASSWORD_MIN_LENGTH:
            return False, "Password must be at least 8 characters long"
        
        if SecurityConfig.PASSWORD_REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        
        if SecurityConfig.PASSWORD_REQUIRE_LOWERCASE and not any(c.islower() for c in password):
            return False, "Password must contain at least one lowercase letter"
        
        if SecurityConfig.PASSWORD_REQUIRE_NUMBERS and not any(c.isdigit() for c in password):
            return False, "Password must contain at least one number"
        
        if SecurityConfig.PASSWORD_REQUIRE_SPECIAL and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            return False, "Password must contain at least one special character"
        
        return True, "Password is valid"

