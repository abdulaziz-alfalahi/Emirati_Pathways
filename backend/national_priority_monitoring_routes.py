"""National Development Priority — distribution / fairness monitoring (#12 / #34).

Admin visibility into how the priority axis scores the candidate pool (score
distribution + which reasons fire), so EHRDC can monitor the axis for drift
without exposing individuals. No geographic dimension. Reads the live weights.

Blueprint prefix: /api/admin/national-priority
"""
import logging
from collections import Counter
from statistics import mean, median

import psycopg2
import psycopg2.extras
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from backend.db import get_db_connection
from backend.national_priority_engine import (
    ensure_weights_table, load_weights, compute_national_priority,
)

logger = logging.getLogger(__name__)

national_priority_monitoring_bp = Blueprint(
    'national_priority_monitoring', __name__, url_prefix='/api/admin/national-priority'
)

_ADMIN_ROLES = {'admin', 'super_user', 'super_admin', 'platform_administrator'}
_BUCKETS = ("0-19", "20-39", "40-59", "60-79", "80-100")


def _require_admin():
    try:
        role = (get_jwt() or {}).get('role', '')
    except Exception:
        role = ''
    if role not in _ADMIN_ROLES:
        return jsonify({"error": "Forbidden - admin access required"}), 403
    return None


def _bucket(score):
    if score < 20:
        return "0-19"
    if score < 40:
        return "20-39"
    if score < 60:
        return "40-59"
    if score < 80:
        return "60-79"
    return "80-100"


@national_priority_monitoring_bp.route('/distribution', methods=['GET'])
@jwt_required()
def priority_distribution():
    """Distribution of National Development Priority scores across the candidate pool."""
    guard = _require_admin()
    if guard:
        return guard
    try:
        limit = min(int(request.args.get('limit', 500)), 5000)
    except Exception:
        limit = 500

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 503
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, experience_years, skills
            FROM users
            WHERE role IN ('candidate', 'job_seeker') AND is_active = true
            ORDER BY last_login DESC NULLS LAST
            LIMIT %s
        """, (limit,))
        rows = cur.fetchall()
        cand_ids = [str(r['id']) for r in rows]

        try:
            ensure_weights_table(conn)
        except Exception:
            try:
                conn.rollback()
            except Exception:
                pass
        weights = load_weights(conn)

        # Batch-load the signal inputs (fail-neutral).
        stage_map, cert_map, training_map = {}, {}, {}
        if cand_ids:
            pcur = conn.cursor()
            for sql, target in (
                ("SELECT user_id, stage FROM user_lifecycle_stage WHERE user_id = ANY(%s)", 'stage'),
                ("SELECT user_id, COUNT(*) FROM candidate_certifications WHERE user_id = ANY(%s) GROUP BY user_id", 'cert'),
                ("SELECT user_id, COUNT(*) FROM course_enrollments WHERE user_id = ANY(%s) AND completion_date IS NOT NULL GROUP BY user_id", 'train'),
            ):
                try:
                    pcur.execute(sql, (cand_ids,))
                    for row in pcur.fetchall():
                        key = str(row[0])
                        if target == 'stage':
                            stage_map[key] = row[1]
                        elif target == 'cert':
                            cert_map[key] = row[1]
                        else:
                            training_map[key] = row[1]
                except Exception:
                    try:
                        conn.rollback()
                    except Exception:
                        pass
            pcur.close()

        scores, reason_counter, hist = [], Counter(), Counter()
        for r in rows:
            cid = str(r['id'])
            skills = r.get('skills')
            if isinstance(skills, str):
                skills = [s.strip('"') for s in skills.strip('{}').split(',') if s.strip()]
            cand = {"experience_years": r.get('experience_years'), "skills": skills or []}
            np_result = compute_national_priority(
                cand, weights,
                stage=stage_map.get(cid),
                cert_count=cert_map.get(cid, 0),
                training_count=training_map.get(cid, 0),
            )
            scores.append(np_result["score"])
            hist[_bucket(np_result["score"])] += 1
            for reason in np_result["reasons"]:
                reason_counter[reason["code"]] += 1

        cur.close()
        conn.close()
        n = len(scores)
        return jsonify({
            "candidates_scored": n,
            "score": {
                "mean": round(mean(scores), 1) if scores else None,
                "median": round(median(scores), 1) if scores else None,
                "min": min(scores) if scores else None,
                "max": max(scores) if scores else None,
                "histogram": {b: hist.get(b, 0) for b in _BUCKETS},
            },
            "reason_frequency": dict(reason_counter),
            "note": ("Distribution of the National Development Priority score across the active "
                     "candidate pool. No geographic dimension; fail-neutral on missing signals."),
        }), 200
    except Exception as e:
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({"error": str(e)}), 500
