
import socketio
import time

sio = socketio.Client(logger=True, engineio_logger=True)

@sio.event
def connect():
    print("✅ CONNECTION SUCCESSFUL!")

@sio.event
def connect_error(data):
    print(f"❌ CONNECTION FAILED: {data}")

@sio.event
def disconnect():
    print("disconnected from server")

def test_connection():
    try:
        print("Attempting to connect to http://127.0.0.1:5004 ...")
        sio.connect('http://127.0.0.1:5004', transports=['websocket', 'polling'])
        sio.wait()
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")

if __name__ == '__main__':
    test_connection()
