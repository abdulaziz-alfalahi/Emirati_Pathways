import sys
import os
import traceback

# Add current directory to path
sys.path.insert(0, os.getcwd())

print(f"CWD: {os.getcwd()}")
print(f"SYS.PATH: {sys.path}")

try:
    print("Attempting import: from recruiter.interview_routes import interview_bp")
    from recruiter.interview_routes import interview_bp
    print("Import SUCCESS")
except Exception as e:
    print(f"Import FAILED: {e}")
    traceback.print_exc()
