
import sys
import os

print("Python Executable:", sys.executable)
print("System Path:")
for p in sys.path:
    print(p)

try:
    import flask
    print("Flask location:", flask.__file__)
except ImportError:
    print("Flask not found")

sys.path.append(os.path.abspath('backend'))
try:
    from backend.routes import auth_routes
    print("Successfully imported auth_routes")
except Exception as e:
    print(f"Failed to import auth_routes: {e}")
    import traceback
    traceback.print_exc()
