import os
os.environ.setdefault('DASHSCOPE_API_KEY', os.environ.get('DASHSCOPE_API_KEY', ''))
os.environ.setdefault('JWT_SECRET_KEY', os.environ.get('JWT_SECRET_KEY', ''))
from backend.app import app, socketio
socketio.run(app, host='0.0.0.0', port=5005, debug=False, allow_unsafe_werkzeug=True)
