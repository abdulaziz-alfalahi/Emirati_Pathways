"""National Development Priority — fairness / distribution monitoring (#34).

Governance guardrail from the #12 proposal: watch the priority-score and
reason distributions for unintended skew. Read-only aggregation computed
live from the candidate pool — no scores are stored or changed here, and
NO geographic dimension is ever used (owner rule, #12).

Honesty note: sensitive-dimension monitoring (gender, etc.) is scoped in
#34 but the platform stores no such field today, so this reports the
dimensions that actually exist (score bands, reason firing, strategic
sector participation) and flags what is not yet measurable rather than
inventing it.
"""

import logging

logger = logging.getLogger(__name__)

# Score bands for the distribution histogram.
SCORE_BANDS = [(0, 0), (1, 25), (26, 50), (51, 75), (76, 100)]


def _band_label(lo, hi):
    return "0" if lo == 0 and hi == 0 else f"{lo}-{hi}"


def compute_fairness_snapshot(conn, sample_limit=5000):
    """Aggregate priority-score distribution + reason firing over candidates.

    Pure aggregation over the same engine used in matching; fail-neutral —
    an unavailable signal table simply contributes nothing.

    Returns a dict:
      total_candidates, score_distribution[], reason_frequency[],
      strategic_sector[], summary, notes[]
    """
    try:
        from backend.national_priority_engine import (
            ensure_weights_table, load_weights, compute_national_priority)
    except ImportError:
        from national_priority_engine import (
            ensure_weights_table, load_weights, compute_national_priority)

    import psycopg2.extras

    notes = []
    try:
        ensure_weights_table(conn)
    except Exception as e:
        logger.warning(f"fairness: weights init failed: {e}")
        try:
            conn.rollback()
        except Exception:
            pass
    weights = load_weights(conn)

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT u.id, u.experience_years,
               COALESCE((SELECT array_agg(name) FROM candidate_skills WHERE user_id = u.id::varchar),
                        ARRAY[]::text[]) AS skills
        FROM users u
        WHERE u.role IN ('candidate', 'job_seeker') AND u.is_active = true
        LIMIT %s
    """, (sample_limit,))
    candidates = [dict(r) for r in cur.fetchall()]
    cur.close()

    cand_ids = [str(c['id']) for c in candidates]
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
                    {'stage': stage_map, 'cert': cert_map, 'train': training_map}[target][str(row[0])] = row[1]
            except Exception as e:
                logger.warning(f"fairness: signal '{target}' unavailable: {e}")
                notes.append(f"Signal '{target}' unavailable — not counted.")
                try:
                    conn.rollback()
                except Exception:
                    pass
        pcur.close()

    band_counts = {_band_label(lo, hi): 0 for lo, hi in SCORE_BANDS}
    reason_counts = {}
    strategic = {'with_priority_skill': 0, 'without': 0}
    scores = []

    for c in candidates:
        cid = str(c['id'])
        result = compute_national_priority(
            c, weights,
            stage=stage_map.get(cid),
            cert_count=cert_map.get(cid, 0),
            training_count=training_map.get(cid, 0),
        )
        s = result['score']
        scores.append(s)
        for lo, hi in SCORE_BANDS:
            if lo <= s <= hi:
                band_counts[_band_label(lo, hi)] += 1
                break
        fired = {r['code'] for r in result['reasons']}
        for r in result['reasons']:
            reason_counts[r['code']] = reason_counts.get(r['code'], 0)
            reason_counts[r['code']] += 1
        if 'strategic_priority_skills' in fired:
            strategic['with_priority_skill'] += 1
        else:
            strategic['without'] += 1

    total = len(scores)
    reason_labels = {code: w.get('label', code) for code, w in weights.items()}

    notes.append("No geographic dimension is used in this score or its monitoring (#12).")
    notes.append("Sensitive-dimension breakdown (e.g. gender) is not shown: the platform stores no such field. Add it with policy sign-off before enabling that view.")

    return {
        'total_candidates': total,
        'score_distribution': [
            {'band': _band_label(lo, hi), 'count': band_counts[_band_label(lo, hi)],
             'pct': round(100 * band_counts[_band_label(lo, hi)] / total, 1) if total else 0.0}
            for lo, hi in SCORE_BANDS
        ],
        'reason_frequency': sorted([
            {'code': code, 'label': reason_labels.get(code, code), 'count': cnt,
             'pct': round(100 * cnt / total, 1) if total else 0.0}
            for code, cnt in reason_counts.items()
        ], key=lambda x: x['count'], reverse=True),
        'strategic_sector': strategic,
        'summary': {
            'mean_score': round(sum(scores) / total, 1) if total else 0.0,
            'zero_score_pct': round(100 * band_counts['0'] / total, 1) if total else 0.0,
            'max_band_pct': round(100 * band_counts['76-100'] / total, 1) if total else 0.0,
        },
        'notes': notes,
    }
