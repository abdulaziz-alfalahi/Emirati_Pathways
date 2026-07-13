"""National Development Priority scoring — a SEPARATE, disclosed axis from Job Fit.

Issue #12. This score differentiates Emirati candidates on national-development
signals (employment-support need, strategic-sector skills, development
trajectory) so the platform can advance Emiratisation / D33 / Talent33 /
Centennial 2071 — WITHOUT ever folding policy into the suitability (Job Fit)
score.

Design rules (issue #12 + matching-scoring-principles):
  * Never uses geography / residence. Where a candidate lives must not move it.
  * Fail-neutral: a missing signal scores 0, never negative.
  * Explainable: every point carries a plain-language reason.
  * Config-governed: weights live in the `national_priority_weights` table
    (versioned, EHRDC-editable). The hardcoded defaults below are only the
    seed + a fail-safe fallback when the table is unavailable.
"""
import logging

logger = logging.getLogger(__name__)

# Default, seed-able weights: (code, label, points, category).
# Single source of truth for seeding the DB table and the fallback if the table
# can't be read. Points are awarded when the signal fires.
DEFAULT_WEIGHTS = [
    ("emp_entry_stage",           "Entering the workforce (first job search / early career)", 40, "employment_support"),
    ("emp_early_stage",           "Building profile / exploring career direction",            25, "employment_support"),
    ("strategic_priority_skills", "Skills in a national priority sector",                     35, "strategic_skills"),
    ("dev_certification",         "Holds a professional certification",                       25, "development"),
    ("dev_training_completion",   "Completed on-platform training",                           20, "development"),
]

# National priority sectors (Talent33 / D33). Matched case-insensitively as
# substrings against candidate skills. Reference data — safe to extend.
PRIORITY_SECTOR_SKILLS = {
    "ai", "artificial intelligence", "machine learning", "data science", "data analytics",
    "cloud", "cybersecurity", "software", "programming", "python",
    "fintech", "finance", "blockchain", "digital",
    "health", "healthcare", "biotech", "life sciences",
    "renewable", "sustainability", "energy", "advanced manufacturing", "robotics",
    "space", "logistics", "semiconductor",
}

# Lifecycle stages -> which employment-support signal they map to.
_ENTRY_STAGES = {"entry"}
_EARLY_STAGES = {"discovery", "assessment", "upskilling"}


def ensure_weights_table(conn):
    """Create + seed the national_priority_weights table (idempotent)."""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS national_priority_weights (
            code       VARCHAR(64) PRIMARY KEY,
            label      VARCHAR(255) NOT NULL,
            points     INTEGER NOT NULL DEFAULT 0,
            category   VARCHAR(64) NOT NULL,
            active     BOOLEAN NOT NULL DEFAULT TRUE,
            version    INTEGER NOT NULL DEFAULT 1,
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)
    for code, label, points, category in DEFAULT_WEIGHTS:
        cur.execute("""
            INSERT INTO national_priority_weights (code, label, points, category)
            VALUES (%s, %s, %s, %s) ON CONFLICT (code) DO NOTHING
        """, (code, label, points, category))
    conn.commit()
    cur.close()


def load_weights(conn):
    """Return {code: {'points', 'label', 'category'}} for active rows, falling
    back to DEFAULT_WEIGHTS if the table is unavailable (fail-neutral)."""
    try:
        cur = conn.cursor()
        cur.execute("SELECT code, label, points, category FROM national_priority_weights WHERE active = TRUE")
        rows = cur.fetchall()
        cur.close()
        if rows:
            return {r[0]: {"label": r[1], "points": r[2], "category": r[3]} for r in rows}
    except Exception as e:
        logger.warning(f"national_priority_weights unavailable, using defaults: {e}")
    return {c: {"label": l, "points": p, "category": cat} for c, l, p, cat in DEFAULT_WEIGHTS}


def _has_priority_skill(skills):
    for s in skills or []:
        sl = str(s).lower()
        for kw in PRIORITY_SECTOR_SKILLS:
            if kw in sl:
                return True
    return False


def compute_national_priority(candidate, weights, stage=None, cert_count=0, training_count=0):
    """National Development Priority score (0..100) + plain-language reasons.

    Pure and fail-neutral: a signal that can't be evaluated simply doesn't fire.
    Never uses geography. `weights` comes from load_weights().
    """
    reasons = []

    def _fire(code):
        w = weights.get(code)
        if w and w.get("points"):
            reasons.append({"code": code, "label": w["label"],
                            "points": w["points"], "category": w.get("category", "")})

    # A. Employment-support need — lifecycle stage, else first-time-seeker proxy.
    st = (stage or "").lower()
    exp = candidate.get("experience_years") or 0
    if st in _ENTRY_STAGES or (not st and exp == 0):
        _fire("emp_entry_stage")
    elif st in _EARLY_STAGES:
        _fire("emp_early_stage")

    # B. Strategic-sector skills.
    if _has_priority_skill(candidate.get("skills")):
        _fire("strategic_priority_skills")

    # C. Development trajectory.
    if cert_count and cert_count > 0:
        _fire("dev_certification")
    if training_count and training_count > 0:
        _fire("dev_training_completion")

    score = min(sum(r["points"] for r in reasons), 100)
    return {"score": score, "reasons": reasons}
