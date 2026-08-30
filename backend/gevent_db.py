"""Stop psycopg2 from blocking the gevent hub.

THE BUG THIS FIXES

Staging serves Socket.IO from ONE gunicorn worker — it has to, because
Socket.IO session state is per-worker (see deployment/run-backend-appqa.sh).
That worker is a gevent worker: thousands of greenlets cooperatively scheduled
on a single OS thread.

psycopg2 is a C extension. Its `execute()` blocks in libpq, and because gevent
cannot preempt C code, the ENTIRE worker stops — every greenlet, including the
Engine.IO housekeeping greenlet that answers ping/poll requests. A page that
fires a dozen queries can hold the hub long enough for Engine.IO to expire the
client's session. The browser then polls a sid the server has forgotten:

    Invalid session uugV72lKM9C_6jYQAAAb     (server log)
    GET /socket.io/?...&sid=... -> 400        (browser)

socket.io-client reconnects, gets a new sid, and the cycle repeats. That is the
reconnect loop observed on 2026-08-31, and it is why the video call's P2P
fallback — which signals over Socket.IO — could not rescue a call either.

THE FIX

psycogreen installs a libpq wait callback that puts the connection in
non-blocking mode and yields to the gevent hub while waiting on the socket.
The query takes the same wall-clock time; the difference is that the other
greenlets keep running, so pings are answered and sessions survive.

WHY IT IS GUARDED

Tests, `flask run`, and any non-gevent context must not be patched: without
gevent's monkey-patched socket the callback would be pointless at best. The
patch therefore applies only when gevent has actually patched the socket
module, which is true under GeventWebSocketWorker and false everywhere else.

MUST RUN BEFORE THE FIRST CONNECTION. The callback is consulted per connection
at creation, so connections opened before patching keep blocking. app.py calls
this at the top of the module, ahead of every blueprint import.
"""
import logging

logger = logging.getLogger(__name__)


def patch_psycopg2_for_gevent():
    """Returns True if the patch was applied, False if it was not needed."""
    try:
        from gevent import monkey
    except ImportError:  # pragma: no cover — gevent absent (plain test run)
        return False

    if not monkey.is_module_patched('socket'):
        # Not running under gevent — nothing blocks a hub that does not exist.
        return False

    try:
        from psycogreen.gevent import patch_psycopg
    except ImportError:  # pragma: no cover
        logger.warning(
            'Running under gevent WITHOUT psycogreen: every psycopg2 query will '
            'block the whole worker, and Socket.IO sessions will time out under '
            'load. Install psycogreen.')
        return False

    patch_psycopg()
    logger.info('psycopg2 patched for gevent — queries now yield to the hub')
    return True
