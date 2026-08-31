"""DO NOT RE-ENABLE psycogreen UNTIL THE SHARED CONNECTIONS ARE GONE.

This module is kept, unused, as the record of an outage — so that the next
person who notices psycopg2 blocking the gevent hub does not "fix" it the same
way.

WHAT WAS TRIED

Staging serves Socket.IO from ONE gunicorn gevent worker. psycopg2 is a C
extension, gevent cannot preempt C, so every query freezes the whole worker.
On 2026-08-31 psycogreen was added to make queries yield to the hub instead.

WHAT HAPPENED

The backend went unreachable within a day. Both workers wedged at the first
concurrent traffic of the morning — alive, 252 MB, 0.01% CPU, serving nothing,
the log stopping dead at:

    WARNING:backend.administrator_system:Database connection is stale, reconnecting...

WHY

`administrator_routes` builds ONE `AdministratorSystem` at module level, and it
holds ONE psycopg2 connection in `self.connection`, used in sixteen places by
every request that touches an administrator surface.

With ordinary blocking psycopg2 that is accidentally safe: a query holds the
entire worker, so concurrent requests serialise onto the connection one at a
time. **psycogreen removes exactly that accident.** A query yields mid-protocol,
a second greenlet enters the same connection while the first is still waiting on
its result, and the connection's state is now being driven by two conversations
at once. Both wait forever.

psycogreen did not cause the bug. It removed the property that was hiding it.

THE PRECONDITION FOR TRYING AGAIN

**A psycopg2 connection may not be shared between greenlets.** Before this is
re-enabled, every module-level/shared connection must become per-request or come
from a pool that hands one connection to one greenlet at a time. Start with
`administrator_system.AdministratorSystem`, then audit for the same shape —
modules that open their own connection are common here (see CLAUDE.md).

AND MEASURE FIRST

The change was made to stop a Socket.IO 400 reconnect loop. It did not: an A/B
of a 40-query burst against the pre- and post-psycogreen builds both returned
200, so the starvation was never reproduced and the fix was never shown to fix
anything. It carried a real cost for an unproven benefit. Reproduce the failure
before reaching for this again.
"""


def patch_psycopg2_for_gevent():
    """Deliberately does nothing. See the module docstring before changing this.

    Kept as a named no-op rather than deleted so that a search for the outage
    lands here rather than on an empty file.
    """
    return False
