"""Durable record of AI model calls (migration 069).

WHY THIS EXISTS

`qwen_client.UsageTracker` has counted tokens in memory since the Qwen
migration. It is lost on every restart, and `get_usage_summary()` — its only
reader — is called from nowhere. So the platform has never been able to answer
"what do we spend on AI, and on what", which is precisely the question the
self-hosted-inference decision turns on.

TWO DESIGN DECISIONS WORTH KNOWING

1. This module opens its OWN connection rather than using `db_utils.get_db()`.
   That is deliberate, not laziness: `execute_query` calls `commit()` on the
   request-scoped connection, so logging telemetry through it would commit
   whatever else the request had in flight. Telemetry must never be able to
   change the outcome of the work it is measuring.

2. Nothing here raises. A failure to record usage must never fail a CV parse.
   Every path swallows and logs, and `record()` returns a bool so callers can
   assert on it in tests without depending on exceptions.

The cost of a connection per call is a few milliseconds against an LLM call
measured in seconds — an acceptable trade for not sharing transaction state.
"""

import logging
import os
from typing import Any, Dict, List, Optional

import psycopg2

try:
    from backend.config.qwen_config import COST_PER_MILLION_TOKENS
except ImportError:  # pragma: no cover — the app runs under both roots
    from config.qwen_config import COST_PER_MILLION_TOKENS

logger = logging.getLogger(__name__)

OUTCOME_OK = 'ok'
OUTCOME_INVALID_JSON = 'invalid_json'
OUTCOME_ERROR = 'error'
VALID_OUTCOMES = (OUTCOME_OK, OUTCOME_INVALID_JSON, OUTCOME_ERROR)

# Short: a slow or unreachable database must not hold up an AI call.
_CONNECT_TIMEOUT = 5


def _recording_enabled() -> bool:
    """False while the test suite is running.

    Tests that exercise chat_completion with a stubbed client would otherwise
    write rows indistinguishable from real traffic — 4 per run, straight into
    the live table. This table exists to answer "what do we actually spend",
    and synthetic rows corrupt precisely that. Caught because a full-suite run
    left 8 rows behind on 2026-08-16.

    Tests that genuinely need to write (proving the DB accepts every outcome
    the code emits) monkeypatch this to True.
    """
    return 'PYTEST_CURRENT_TEST' not in os.environ


def _connect():
    """A dedicated short-lived connection, or None if the DB is unreachable."""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', ''),
        connect_timeout=_CONNECT_TIMEOUT,
    )


def estimate_cost_aed(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Estimated AED for one call, from the configured price list.

    Returns 0.0 for a model with no published price — a self-hosted model has
    no per-token price, and recording 0 is truthful where guessing would not be.
    """
    pricing = COST_PER_MILLION_TOKENS.get(model)
    if not pricing:
        return 0.0
    inp = (prompt_tokens / 1_000_000) * pricing.get('input', 0)
    out = (completion_tokens / 1_000_000) * pricing.get('output', 0)
    return round(inp + out, 6)


def record(model: str,
           task_type: Optional[str] = None,
           prompt_tokens: int = 0,
           completion_tokens: int = 0,
           latency_ms: Optional[int] = None,
           attempt: int = 1,
           outcome: str = OUTCOME_OK) -> bool:
    """Record one API response. Returns True if it was stored.

    One row per RESPONSE, not per logical call: a retried call writes a row per
    attempt, because each attempt is separately billed.

    Never raises — a telemetry failure must not fail the work being measured.
    """
    if not _recording_enabled():
        return False

    if outcome not in VALID_OUTCOMES:
        logger.warning("ai_usage_log: unknown outcome %r, recording as error", outcome)
        outcome = OUTCOME_ERROR

    prompt_tokens = max(0, int(prompt_tokens or 0))
    completion_tokens = max(0, int(completion_tokens or 0))
    cost = estimate_cost_aed(model, prompt_tokens, completion_tokens)

    conn = None
    try:
        conn = _connect()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ai_usage_log
                    (model, task_type, prompt_tokens, completion_tokens,
                     latency_ms, attempt, outcome, estimated_cost_aed)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (model, task_type, prompt_tokens, completion_tokens,
                 latency_ms, attempt, outcome, cost),
            )
        conn.commit()
        return True
    except Exception as e:
        # Debug, not warning: if the DB is down the caller already has bigger
        # problems, and one log line per AI call would drown the real error.
        logger.debug("ai_usage_log: could not record usage (%s): %s", model, e)
        return False
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


def summary(days: int = 30) -> Dict[str, Any]:
    """Usage over the last `days`, broken down by task type and by model.

    Returns an empty structure rather than raising if the table is unreachable —
    an admin page showing nothing is better than a 500.
    """
    # None means "unspecified, use the default"; 0 means "as small as possible"
    # and must clamp to 1 rather than silently becoming 30.
    days = 30 if days is None else days
    days = max(1, min(int(days), 365))
    empty: Dict[str, Any] = {'days': days, 'totals': {}, 'by_task': [], 'by_model': [], 'available': False}

    conn = None
    try:
        conn = _connect()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT count(*)                                   AS calls,
                       coalesce(sum(prompt_tokens), 0)            AS prompt_tokens,
                       coalesce(sum(completion_tokens), 0)        AS completion_tokens,
                       coalesce(sum(estimated_cost_aed), 0)       AS estimated_cost_aed,
                       count(*) FILTER (WHERE outcome <> 'ok')    AS failed_calls,
                       count(*) FILTER (WHERE attempt > 1)        AS retry_calls
                  FROM ai_usage_log
                 WHERE created_at > now() - make_interval(days => %s)
                """, (days,))
            row = cur.fetchone()
            totals = {
                'calls': row[0],
                'prompt_tokens': row[1],
                'completion_tokens': row[2],
                'total_tokens': row[1] + row[2],
                'estimated_cost_aed': float(row[3]),
                # Retries and failures are called out separately because they
                # are spend with nothing delivered.
                'failed_calls': row[4],
                'retry_calls': row[5],
            }

            cur.execute(
                """
                SELECT task_type, count(*) AS calls,
                       coalesce(sum(prompt_tokens + completion_tokens), 0) AS tokens,
                       coalesce(sum(estimated_cost_aed), 0)                AS aed
                  FROM ai_usage_log
                 WHERE created_at > now() - make_interval(days => %s)
                 GROUP BY task_type ORDER BY aed DESC NULLS LAST
                """, (days,))
            by_task = [
                {'task_type': r[0], 'calls': r[1], 'tokens': r[2], 'estimated_cost_aed': float(r[3])}
                for r in cur.fetchall()
            ]

            cur.execute(
                """
                SELECT model, count(*) AS calls,
                       coalesce(sum(prompt_tokens + completion_tokens), 0) AS tokens,
                       coalesce(sum(estimated_cost_aed), 0)                AS aed,
                       round(avg(latency_ms)) AS avg_latency_ms
                  FROM ai_usage_log
                 WHERE created_at > now() - make_interval(days => %s)
                 GROUP BY model ORDER BY aed DESC NULLS LAST
                """, (days,))
            by_model = [
                {'model': r[0], 'calls': r[1], 'tokens': r[2],
                 'estimated_cost_aed': float(r[3]),
                 'avg_latency_ms': int(r[4]) if r[4] is not None else None}
                for r in cur.fetchall()
            ]

        return {'days': days, 'totals': totals, 'by_task': by_task,
                'by_model': by_model, 'available': True}
    except Exception as e:
        logger.warning("ai_usage_log: summary unavailable: %s", e)
        return empty
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


def daily(days: int = 30) -> List[Dict[str, Any]]:
    """Per-day totals, for a trend line. Empty list if unavailable."""
    # None means "unspecified, use the default"; 0 means "as small as possible"
    # and must clamp to 1 rather than silently becoming 30.
    days = 30 if days is None else days
    days = max(1, min(int(days), 365))
    conn = None
    try:
        conn = _connect()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT created_at::date AS day, count(*) AS calls,
                       coalesce(sum(prompt_tokens + completion_tokens), 0) AS tokens,
                       coalesce(sum(estimated_cost_aed), 0)                AS aed
                  FROM ai_usage_log
                 WHERE created_at > now() - make_interval(days => %s)
                 GROUP BY 1 ORDER BY 1
                """, (days,))
            return [
                {'day': r[0].isoformat(), 'calls': r[1], 'tokens': r[2],
                 'estimated_cost_aed': float(r[3])}
                for r in cur.fetchall()
            ]
    except Exception as e:
        logger.warning("ai_usage_log: daily unavailable: %s", e)
        return []
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass
