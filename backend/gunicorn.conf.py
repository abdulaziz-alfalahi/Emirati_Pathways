# Gunicorn Production Configuration
# Usage: gunicorn -c gunicorn.conf.py wsgi:app

import os

# --- Server Socket ---
bind = "0.0.0.0:" + os.getenv("PORT", "5005")

# --- Worker Processes ---
# MUST default to 1: the gevent-websocket worker + Flask-SocketIO does not support
# multiple workers behind a single bind (a client's polling handshake lands on a
# random worker that doesn't hold its session -> HTTP 400 "session unknown" -> the
# socket never connects and WebRTC signaling never reaches the peer). To scale,
# run multiple single-worker instances behind an nginx sticky-session load balancer.
workers = int(os.getenv("WORKERS", "1"))
worker_class = "geventwebsocket.gunicorn.workers.GeventWebSocketWorker"
worker_connections = 1000
timeout = 120
keepalive = 5

# --- Request Limits ---
max_requests = 1000
max_requests_jitter = 100
limit_request_line = 8190
limit_request_fields = 100

# --- Logging ---
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = os.getenv("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# --- Process Naming ---
proc_name = "emirati-platform-api"

# --- Security ---
tmp_upload_dir = "/tmp"
