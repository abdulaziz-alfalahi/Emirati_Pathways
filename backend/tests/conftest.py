"""
Pytest bootstrap for the backend test suite.

CI provides ``DATABASE_URL`` but not the individual ``DB_*`` environment variables that
the app's DB layers (``backend/db.py``, ``backend/db_utils.py``, and several engine
modules) read to build their psycopg2 connection. Without ``DB_*`` they fall back to the
``emirati_user`` / ``emirati_journey`` defaults and fail authentication against the CI
Postgres service — which breaks *collection* of every test that opens a connection at
import time (``from app import create_app`` pulls those layers in).

Bridge ``DATABASE_URL`` -> ``DB_*`` here, before any test module imports app code. This
file is imported by pytest before it collects the test modules, so the environment is set
in time. It is guarded to never override an explicit ``DB_*`` configuration, so it is a
no-op in production (which sets ``DB_*`` directly and never runs the test suite).
"""
import os
from urllib.parse import urlparse, unquote

_url = os.getenv("DATABASE_URL")
if _url and not os.getenv("DB_HOST"):
    _p = urlparse(_url)
    if _p.hostname:
        os.environ["DB_HOST"] = _p.hostname
    os.environ["DB_PORT"] = str(_p.port or 5432)
    _name = (_p.path or "").lstrip("/")
    if _name:
        os.environ["DB_NAME"] = _name
    if _p.username:
        os.environ["DB_USER"] = _p.username
    if _p.password:
        # DATABASE_URL percent-encodes special characters in the password; decode it back.
        os.environ["DB_PASSWORD"] = unquote(_p.password)

    # Enable uuid-ossp so uuid_generate_v4() DEFAULTs in the app's table-creation DDL
    # work against the fresh CI database (best-effort — a no-op if it already exists or
    # the DB is unreachable).
    try:
        import psycopg2
        _c = psycopg2.connect(
            host=os.environ.get("DB_HOST"), port=os.environ.get("DB_PORT"),
            dbname=os.environ.get("DB_NAME"), user=os.environ.get("DB_USER"),
            password=os.environ.get("DB_PASSWORD"),
        )
        _c.autocommit = True
        with _c.cursor() as _cur:
            _cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
        _c.close()
    except Exception:
        pass
