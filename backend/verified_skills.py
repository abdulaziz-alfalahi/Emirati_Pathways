"""
Assessment-verified skills — the bridge from the assessment cluster into matching.

A skill in `user_skills` with verified=TRUE was proven through a professional
assessment (see assessor_dashboard_api.complete). This module surfaces those so
the JD↔candidate match can (a) count an assessed skill even if the CV omits it,
and (b) weight it above a self-claimed skill. Best-effort: returns an empty set
on any error so matching never breaks.
"""
import logging

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query

logger = logging.getLogger(__name__)


def verified_skill_names(user_id):
    """Lowercased set of the user's assessment-verified skill names."""
    if not user_id:
        return set()
    try:
        rows = execute_query(
            "SELECT DISTINCT LOWER(skill_name) AS name FROM user_skills "
            "WHERE user_id = %s AND verified IS TRUE AND COALESCE(skill_name,'') <> ''",
            (str(user_id),)) or []
        return {r['name'] for r in rows if r.get('name')}
    except Exception as e:  # pragma: no cover
        logger.warning(f"verified_skill_names failed for {user_id}: {e}")
        return set()
