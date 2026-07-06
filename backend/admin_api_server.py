#!/usr/bin/env python3
"""
Thin wrapper re-exporting admin_api_endpoints to avoid code duplication.
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.admin_api_endpoints import app, logger, log_admin_action, require_admin_auth

if __name__ == '__main__':
    # Keep the same port (5001) for backwards compatibility of this file
    logger.info("Starting consolidated Admin API Keys Management Backend (via admin_api_endpoints)")
    app.run(host='0.0.0.0', port=5001, debug=os.getenv('FLASK_ENV', 'production') != 'production')
