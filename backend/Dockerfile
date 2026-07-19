FROM python:3.11-slim-bookworm

WORKDIR /app

# System dependencies for psycopg2, WeasyPrint, arabic-reshaper
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libpq-dev libffi-dev \
    libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 \
    libcairo2 libgirepository1.0-dev gir1.2-pango-1.0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (filtered by .dockerignore)
COPY . .

# Create symlink for "backend." imports
RUN ln -s /app /backend

# Create upload directory
RUN mkdir -p /app/uploads

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5005/health')" || exit 1

# Production: Gunicorn with gevent workers
# WORKERS MUST STAY 1. gevent-websocket + Socket.IO keeps session state in the
# worker process, so with >1 worker a client's polling handshake lands on a
# worker that doesn't hold its session -> HTTP 400 "session unknown" -> the
# socket never connects, and the WebRTC signalling relay never reaches the peer
# (each video-interview participant sees only their own camera). Measured at 4
# workers: ~60% of handshakes failed; at 1 worker: 100% succeeded.
#
# This CMD is the last line of defence: docker-compose.yml overrides it with an
# explicit 1-worker command, but APPQA runs the image via plain `docker run`
# (compose v1 is broken against that engine), where this CMD is what actually
# runs. It previously said 4 and only worked because the run command happened to
# override it — one recreate without that override silently breaks realtime.
#
# To scale, run multiple single-worker backends behind an nginx sticky-session
# load balancer. Do not raise this number.
CMD ["gunicorn", \
     "--worker-class", "geventwebsocket.gunicorn.workers.GeventWebSocketWorker", \
     "--workers", "1", \
     "--bind", "0.0.0.0:5005", \
     "--timeout", "120", \
     "--keep-alive", "5", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "100", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "wsgi:app"]
