import sys
import os
from flask import Flask

# Mock necessary imports to avoid heavy dependencies if possible, or just import unified_server
# Better to import unified_server directly to see the EXACT state

sys.path.append(os.path.join(os.getcwd(), 'backend'))
try:
    from backend.unified_server import app
    print("Map:")
    print(app.url_map)
except Exception as e:
    print(f"Error importing app: {e}")
