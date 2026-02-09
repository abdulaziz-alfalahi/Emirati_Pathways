
import sys
import os

print("Validating CV Module Imports...")

# Add current directory to path
sys.path.append(os.getcwd())
# Add parent directory if running from backend/
if os.path.basename(os.getcwd()) == 'backend':
    sys.path.append(os.path.dirname(os.getcwd()))

try:
    print("1. Importing cv_parser...")
    import cv_parser
    print("   ✅ cv_parser imported.")
except Exception as e:
    print(f"   ❌ FAILED: {e}")

try:
    print("2. Importing cv_storage_manager...")
    import cv_storage_manager
    print("   ✅ cv_storage_manager imported.")
except Exception as e:
    print(f"   ❌ FAILED: {e}")

try:
    print("3. Importing cv_job_matching_integration...")
    import cv_job_matching_integration
    print("   ✅ cv_job_matching_integration imported.")
except Exception as e:
    print(f"   ❌ FAILED: {e}")

try:
    print("4. Importing enhanced_cv_routes...")
    from routes import enhanced_cv_routes
    print("   ✅ enhanced_cv_routes imported.")
except Exception as e:
    print(f"   ❌ FAILED: {e}")

print("Validation Complete.")
