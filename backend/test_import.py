import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print("Attempting to import enhanced_cv_routes...")
try:
    from routes.enhanced_cv_routes import enhanced_cv_bp
    print("✅ Success: enhanced_cv_bp imported.")
except ImportError as e:
    print(f"❌ ImportError: {e}")
except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()
