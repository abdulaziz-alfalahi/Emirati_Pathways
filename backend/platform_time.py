"""What time it is, for a platform that serves Dubai.

WHY THIS EXISTS

A coach could not start a coaching session that had already begun. The session
was scheduled for 14:25, stored as `timestamp without time zone`, and compared
against `datetime.now()` — which inside the backend container is **UTC**. At
14:22 Gulf time the server saw 10:22 and refused with "This session opens at
14:10". The coach was twelve minutes late and was told to wait four hours.

  POST /api/coach/sessions/5/join -> 409 too_early   (feedback fb_1787135002)

The bug was written five times, identically:

    now = datetime.now(start.tzinfo) if start.tzinfo else datetime.now()

That line is CORRECT when the stored value carries a timezone — which is exactly
why it survived review five times. It fails only for naive columns, and every
scheduled time the UI writes is naive: a `datetime-local` input sends wall-clock
time and `timestamp without time zone` keeps it that way.

THE RULE THIS MODULE ENCODES

A naive timestamp in this database is **Gulf wall-clock time**, because that is
what the person entering it meant. Not UTC, and not "whatever the server's
locale happens to be" — the container has no TZ set, so that is UTC today and
could silently become something else tomorrow.

WHY A FIXED OFFSET AND NOT A TZ DATABASE

The UAE has observed UTC+04 with **no daylight saving** since 1972. A fixed
offset is therefore exactly correct here, not an approximation, and it removes a
dependency on tzdata being present and current inside every container. If the
platform ever serves a second country this must become a real timezone — the
constant below is the one place that would change.

WHAT THIS DELIBERATELY DOES NOT DO

It does not migrate the columns to `timestamptz`. That is the durable fix and it
should happen, but it touches every table with a scheduled time and cannot be
done safely in a bug fix — a wrong assumption during that conversion would
silently shift every existing appointment by four hours in the other direction.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

# UTC+04, no DST — see the module docstring before changing this.
PLATFORM_UTC_OFFSET_HOURS = 4
PLATFORM_TZ = timezone(timedelta(hours=PLATFORM_UTC_OFFSET_HOURS), 'GST')


def now() -> datetime:
    """The current time, as a timezone-aware value in platform time."""
    return datetime.now(PLATFORM_TZ)


def clock(value: Optional[datetime]) -> str:
    """A time a reader in another country cannot misread: '18:15 Dubai time'.

    WHY THIS IS NOT strftime('%H:%M')

    The comparison bug this module was written for is fixed: the server now
    correctly decides that a session scheduled for 18:15 Gulf time has not
    opened yet. But the REFUSAL still said only "This session opens at 18:15",
    and a coach reading that at 18:32 in Brisbane concluded the platform was
    broken (feedback fb_1787560378, 2026-08-24).

    They were right to. A bare wall-clock time is a claim about a clock, and the
    message never said whose. The server was correct and the sentence was
    misleading — which, to the person locked out of their session, is the same
    thing.

    So every time we tell someone when something opens, we name the clock. The
    endpoints also return `opens_at` as ISO 8601 with the offset, so a client
    can render it in the reader's own timezone rather than relying on this
    string at all.
    """
    v = aware(value)
    if v is None:
        return ''
    return f"{v.strftime('%H:%M')} Dubai time"


def iso(value: Optional[datetime]) -> Optional[str]:
    """ISO 8601 with the offset, for a client to render in the reader's zone.

    Naive timestamps in this database are Gulf wall-clock (see the module
    docstring), so this is where that assumption becomes explicit to everyone
    downstream instead of being re-guessed.
    """
    v = aware(value)
    return v.isoformat() if v else None


def aware(value: Optional[datetime]) -> Optional[datetime]:
    """Make a stored timestamp comparable.

    A NAIVE value is interpreted as platform wall-clock time — the reading that
    matches what the person scheduling it meant. An AWARE value is converted
    rather than reinterpreted, so a column that already carries a zone keeps its
    meaning.

    None passes through: a missing time is not a time at midnight.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=PLATFORM_TZ)
    return value.astimezone(PLATFORM_TZ)


def compare_pair(stored: datetime):
    """`(stored_aware, now)` — both in platform time, ready to compare.

    A convenience for the join-window checks, whose whole bug was comparing two
    values that were not on the same clock. Returning them together makes it
    hard to convert one and forget the other.
    """
    return aware(stored), now()
