import os
os.environ['DASHSCOPE_API_KEY'] = 'sk-9b054acdf06240d79c6a5b2369526248'
os.environ['JWT_SECRET_KEY'] = 'emirati_journey_secure_jwt_key_2024'
from backend.app import app, socketio
socketio.run(app, host='0.0.0.0', port=5005, debug=False, allow_unsafe_werkzeug=True)
