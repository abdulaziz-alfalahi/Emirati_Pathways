#!/usr/bin/env python3
"""
Windows-compatible backend startup script for Emirati Journey Platform
"""
import os
import sys
from pathlib import Path

def setup_directories():
    """Create necessary directories for Windows"""
    directories = [
        'uploads',
        'uploads/cv_uploads',
        'uploads/applications',
        'logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def main():
    """Main startup function"""
    print("🇦🇪 EMIRATI JOURNEY PLATFORM - WINDOWS SETUP")
    print("=" * 50)
    
    # Setup directories
    print("📁 Setting up directories...")
    setup_directories()
    
    # Import and run the main app
    print("🚀 Starting Flask application...")
    try:
        from app_fixed_v2 import app
        app.run(host='127.0.0.1', port=5003, debug=False)
    except ImportError as e:
        print(f"❌ Error importing app: {e}")
        print("Make sure you're in the backend directory and have installed requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting app: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
