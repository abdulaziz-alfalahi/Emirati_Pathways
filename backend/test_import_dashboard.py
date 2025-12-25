
import sys
import os

# Add current directory to path
sys.path.insert(0, os.getcwd())

try:
    from hr_dashboard_routes import hr_dashboard_bp
    print("✅ Import successful")
except ImportError as e:
    print(f"❌ ImportError: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
