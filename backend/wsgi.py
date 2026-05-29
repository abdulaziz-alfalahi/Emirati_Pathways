"""
WSGI entry point for Gunicorn.
Usage: gunicorn --bind 0.0.0.0:5005 wsgi:app
"""
from app import app, socketio  # noqa: F401

# Gunicorn picks up `app` from this module.
# SocketIO is initialized on `app` during import.
