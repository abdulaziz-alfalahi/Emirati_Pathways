from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
# Explicitly use threading to match main server attempt
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading', logger=True, engineio_logger=True)

@app.route('/')
def index():
    return "Server Running"

@socketio.on('connect')
def test_connect():
    print('✅ Client connected to Simple Server!')

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    print("Starting Simple Socket Server on 5004...")
    socketio.run(app, host='0.0.0.0', port=5004, debug=os.getenv('FLASK_ENV', 'production') != 'production', allow_unsafe_werkzeug=os.getenv('FLASK_ENV', 'production') != 'production')
