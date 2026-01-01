#!/usr/bin/env python3
"""
Combined server that serves frontend static files and proxies API requests to the backend.
"""

from flask import Flask, send_from_directory, request, Response
import requests
import os

app = Flask(__name__, static_folder='frontend/dist', static_url_path='')

BACKEND_URL = 'http://localhost:5005'

# Proxy all /api requests to backend
@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy_api(path):
    """Proxy API requests to the backend server"""
    url = f"{BACKEND_URL}/api/{path}"
    
    # Handle OPTIONS (CORS preflight)
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept'
        return response
    
    # Forward the request to backend
    headers = {key: value for key, value in request.headers if key.lower() != 'host'}
    
    try:
        resp = requests.request(
            method=request.method,
            url=url,
            headers=headers,
            data=request.get_data(),
            params=request.args,
            allow_redirects=False,
            timeout=60
        )
        
        # Build response
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        response_headers = [(name, value) for name, value in resp.raw.headers.items()
                          if name.lower() not in excluded_headers]
        
        response = Response(resp.content, resp.status_code, response_headers)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
        
    except requests.exceptions.RequestException as e:
        return {'error': str(e), 'message': 'Backend server unavailable'}, 503

# Serve frontend static files
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Try to serve the file directly
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # For SPA routing, return index.html for non-file paths
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    print("Starting combined server on port 8089...")
    print(f"Frontend: {app.static_folder}")
    print(f"Backend proxy: {BACKEND_URL}")
    app.run(host='0.0.0.0', port=8089, debug=False, threaded=True)
