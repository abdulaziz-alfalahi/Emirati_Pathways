"""JSON encoding for types psycopg2 returns and Flask cannot serialise.

WHY THIS EXISTS

`GET /api/video-interview/sessions/<id>` returned 500 for every interview ever
scheduled — 15 of 15 rows on 2026-08-31. The handler does `SELECT s.*`, the
table has a `scheduled_time TIME` column, and Flask's default provider raises:

    TypeError: Object of type time is not JSON serializable

The handler caught it and reported a generic "Failed to retrieve session", so
the cause was invisible from the response.

WHY A PROVIDER RATHER THAN A SIXTH ROW-SERIALISER

Five hand-written row serialisers already exist in this codebase
(ai_assessment_intelligence_routes._json_safe, workspace_routes.serialize_row,
workspace_phase2_routes.serialize_row, internship_engagement_routes._serialize,
outbound_mail_routes._serialise). Each was written when one endpoint hit this
wall. Adding a sixth would fix one endpoint and leave the same landmine under
every other `SELECT *` in ~90 blueprints — the parallel-implementations shape
that has bitten this project repeatedly.

Encoding is a property of the application, so it belongs in the one place Flask
provides for it. Every blueprint gets the fix, including ones not yet written.

WHAT IS DEFERRED, AND WHY THAT MATTERS

Flask's DefaultJSONProvider already handles date, datetime, UUID, dataclasses
and __html__. This subclass adds ONLY what psycopg2 hands back that Flask does
not understand, and delegates everything else to super(). It therefore cannot
change the encoding of any response that already works — a payload that
serialised before serialises identically now.
"""
import datetime
import decimal

from flask.json.provider import DefaultJSONProvider


class DatabaseFriendlyJSONProvider(DefaultJSONProvider):
    """Flask's provider plus the column types psycopg2 actually returns."""

    @staticmethod
    def default(o):
        # TIME — the column that broke every interview session lookup.
        # Rendered ISO ("20:30:35"). Note this does NOT match how Flask renders
        # DATE and TIMESTAMP, which it emits as HTTP-date ("Sun, 30 Aug 2026
        # 00:00:00 GMT"). There is no HTTP-date form for a bare time, and
        # inventing one would be worse than the inconsistency: ISO is what
        # every client library parses.
        if isinstance(o, datetime.time):
            return o.isoformat()

        # INTERVAL. Seconds as a number, not "1 day, 0:00:00": the repr is
        # Python-specific and unparseable by a JavaScript client, and every
        # consumer of an interval here wants arithmetic on it.
        if isinstance(o, datetime.timedelta):
            return o.total_seconds()

        # NUMERIC. float() loses precision on money, and every use of NUMERIC
        # in this schema is a rate, a score or an amount — so it is rendered as
        # a JSON string, which round-trips exactly.
        if isinstance(o, decimal.Decimal):
            return str(o)

        # BYTEA. Rare, but psycopg2 returns a memoryview and the failure looks
        # identical to the one above.
        if isinstance(o, (bytes, bytearray, memoryview)):
            return bytes(o).hex()

        return DefaultJSONProvider.default(o)
