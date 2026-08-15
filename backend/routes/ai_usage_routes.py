"""Admin view of AI model spend (migration 069).

The in-memory tracker this replaces had a reader — `get_usage_summary()` — that
was never called from anywhere. A metric nobody can look at is the same as no
metric, so the endpoint ships with the table rather than after it.
"""
import logging

from flask import Blueprint, jsonify, request

try:
    from backend.auth.access_control import require_roles, ADMIN_ROLES
    from backend.services import ai_usage_log
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import require_roles, ADMIN_ROLES
    from services import ai_usage_log

logger = logging.getLogger(__name__)

ai_usage_bp = Blueprint('ai_usage', __name__, url_prefix='/api/admin/ai-usage')


def _days_param(default=30):
    """Window in days, clamped. Rejected values fall back rather than 400 —
    this is a dashboard, and a bad querystring should not blank the page."""
    try:
        return max(1, min(int(request.args.get('days', default)), 365))
    except (TypeError, ValueError):
        return default


@ai_usage_bp.route('', methods=['GET'])
@require_roles(*ADMIN_ROLES)
def usage_summary():
    """Totals plus per-task and per-model breakdowns.

    `available: false` means the table could not be read — the caller should say
    "no data yet" rather than render zeros as though they were measurements.
    """
    days = _days_param()
    data = ai_usage_log.summary(days=days)
    return jsonify({'success': True, 'data': data})


@ai_usage_bp.route('/daily', methods=['GET'])
@require_roles(*ADMIN_ROLES)
def usage_daily():
    """Per-day totals for a trend line."""
    days = _days_param()
    return jsonify({'success': True, 'data': {'days': days, 'series': ai_usage_log.daily(days=days)}})
