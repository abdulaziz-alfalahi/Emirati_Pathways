
from backend.app import app, socketio

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5005, debug=True, allow_unsafe_werkzeug=True)
