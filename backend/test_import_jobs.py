
import sys
import os

print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print(f"Sys Path: {sys.path}")

try:
    import flask
    print(f"Flask Version: {flask.__version__}")
    print(f"Flask File: {flask.__file__}")
except ImportError:
    print("❌ Flask not installed")

try:
    sys.path.insert(0, os.getcwd())
    from hr_job_posting_routes import hr_job_posting_bp
    print("✅ Import successful")
except ImportError as e:
    print(f"❌ ImportError: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
