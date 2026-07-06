
import os

# The openai library (used as DashScope/Qwen client with custom base_url)
# requires OPENAI_API_KEY to exist even during gevent monkey-patching.
# Set a dummy value if not already set — the real key is DASHSCOPE_API_KEY.
if not os.environ.get('OPENAI_API_KEY'):
    os.environ['OPENAI_API_KEY'] = os.environ.get('DASHSCOPE_API_KEY', 'dummy-not-used')

from backend.app import app, socketio

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5005)
