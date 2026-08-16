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


# ─────────────────────────────────────────────────────────────────────────────
# LIVE DATABASE GUARD
#
# The DB in backend/.env is dghr_prod — the LIVE database. It is what the app
# reads locally, so `pytest backend/tests/` on a dev box writes production data.
# This is not hypothetical: stranded users and orphaned consent rows have been
# cleared by hand from it on 2026-08-12, 08-15 and 08-16.
#
# WHY A GUARD AND NOT MORE CLEANUP. Every previous fix was per-test cleanup, and
# it failed twice for the same structural reason: the cleanup is the LAST
# statement in the test body, so any assertion that fires above it strands the
# row. Teardown helps, but only in the tests someone remembered to convert —
# and 16 test modules open a real connection. The guard is chosen instead
# because it needs no list, covers modules that do not exist yet, and cannot be
# defeated by a test failing in an unexpected place.
#
# WHY IT INTERCEPTS psycopg2.connect. Verified 2026-08-16: no module anywhere in
# the backend does `from psycopg2 import connect`, so every connection in the
# codebase — db.py, db_utils.py, and the modules that roll their own — passes
# through this one function. One interception point covers all of them.
#
# WHY SKIP AND NOT RAISE. A raise would turn a green local suite red and teach
# people to set the override reflexively. pytest.skip marks exactly the tests
# that tried to reach the live DB and lets the rest run. It is deliberately
# pytest.skip and not an exception: Skipped derives from BaseException, so it
# survives the `except Exception: conn.rollback()` blocks that made this class
# of bug silent for twelve days.
#
# CI IS UNAFFECTED. CI sets DATABASE_URL to its own Postgres service, which is
# bridged to DB_* above and is not the live host, so the guard never engages.
# ─────────────────────────────────────────────────────────────────────────────

LIVE_DB_HOSTS = {"10.228.145.66"}
LIVE_DB_NAMES = {"dghr_prod"}

# Set to 1 to run the live-DB tests deliberately. Doing so writes to production
# data — every row created must use a ZZ- prefix and be cleaned up.
_ALLOW_LIVE = os.getenv("ALLOW_LIVE_DB_TESTS") == "1"


def _is_live_target(args, kwargs):
    """True if this connect() call is aimed at the live database."""
    host = kwargs.get("host")
    name = kwargs.get("dbname") or kwargs.get("database")

    # A DSN may be passed positionally instead of as keywords.
    if args and isinstance(args[0], str):
        dsn = args[0]
        for part in dsn.replace("postgresql://", " ").replace("postgres://", " ").split():
            if "=" in part:
                k, _, v = part.partition("=")
                if k == "host":
                    host = host or v
                elif k in ("dbname", "database"):
                    name = name or v
        for h in LIVE_DB_HOSTS:
            if h in dsn:
                host = host or h
        for n in LIVE_DB_NAMES:
            if n in dsn:
                name = name or n

    return str(host) in LIVE_DB_HOSTS or str(name) in LIVE_DB_NAMES


def pytest_configure(config):
    """Install the guard before any test runs."""
    if _ALLOW_LIVE:
        return

    import psycopg2

    _real_connect = psycopg2.connect

    def _guarded_connect(*args, **kwargs):
        if _is_live_target(args, kwargs):
            import pytest
            # allow_module_level matters: many modules connect during IMPORT
            # (`from app import create_app` builds the app, which opens a
            # connection). Without the flag pytest reports a plain Skipped
            # raised at collection time as a collection ERROR, which is how
            # this guard first presented — 21 red modules instead of 21
            # skipped ones. With it, the module is skipped cleanly.
            pytest.skip(
                "Refusing to connect to the LIVE database (dghr_prod) from the "
                "test suite — this test writes production data. Point DATABASE_URL "
                "at a throwaway Postgres to run it, or set ALLOW_LIVE_DB_TESTS=1 "
                "to override deliberately (ZZ- prefix all rows and clean up).",
                allow_module_level=True,
            )
        return _real_connect(*args, **kwargs)

    psycopg2.connect = _guarded_connect
    config._live_db_real_connect = _real_connect


def pytest_unconfigure(config):
    real = getattr(config, "_live_db_real_connect", None)
    if real is not None:
        import psycopg2
        psycopg2.connect = real
