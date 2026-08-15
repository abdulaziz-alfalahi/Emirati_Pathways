"""What an employer actually received from the platform.

THE ONE DEFINITION LAYER (Phase 1 of docs/employer_value_instrumentation_scope.md)

These numbers will appear in an employer-facing view, an operator view, and
eventually Council reporting. They are computed here and only here. Three
queries written in three places is how `hired` and `placed` became two names for
one thing (#410); this module exists so that does not happen to time-to-hire.

DECISIONS SETTLED HERE, deliberately and in one place:

1. ATTRIBUTION — a hire is ours when an application record exists, i.e. the
   candidate applied through the platform. Simple, auditable, and it avoids
   adjudicating whether the employer already knew the candidate, which is an
   argument we could not win.

2. AUTHORITATIVE TIMESTAMP — `job_applications.applied_at`. The table also
   carries `submitted_at`, and both are populated identically in all rows today
   (verified 2026-08-16), but duplicated columns drift and then two dashboards
   disagree. One is named here; nothing else in this module reads the other.

3. WHEN A PLACEMENT COUNTS — the period in which the placement happened, not
   the period the application arrived. Value is delivered at the hire.

4. MEDIAN, NOT MEAN, for durations. One six-month requisition would otherwise
   define an entire cohort.

5. HONEST NULLS — a duration we cannot measure is reported as None with the
   reason, never as zero. Rates are suppressed below MIN_RATE_DENOMINATOR
   rather than presented as a percentage of three.

WHY EVERY COMPANY CURRENTLY MEASURES ZERO (verified live 2026-08-16)

All 7 `published` postings have `company_id = NULL`, and they are the only ones
candidates can apply to — so today's 9 applications attribute to no employer at
all. This is not a fault in this module and it is not ongoing:

  * 297 of 302 `pending_verification` postings DO carry a company, so the NAFIS
    import path is sound;
  * migration 066 added `job_postings_published_has_company` CHECK (status <>
    'published' OR company_id IS NOT NULL) as NOT VALID, which grandfathers the
    legacy rows and refuses any NEW published posting without a company.

So the gap is historical test data, already fenced, and the production reset
clears it. Expect zeros until real employers publish real postings — and note
that `has_outcomes: False` says exactly that rather than implying measurement.

COVERAGE IS REPORTED ALONGSIDE EVERY DURATION. Time-to-hire is derived from
`application_status_history`, which is written by six code paths; if a
transition was not recorded, that placement cannot be timed. Reporting a median
over 8 of 40 placements without saying so would be a confident number resting on
a fifth of the data. Every duration therefore returns `measured` and `total`.
"""

import logging
from typing import Any, Dict, Optional

try:
    from backend.db_utils import execute_query
    from backend.application_stages import APPLICATION_STAGES
except ImportError:  # pragma: no cover — the app runs under both roots
    from db_utils import execute_query
    from application_stages import APPLICATION_STAGES

logger = logging.getLogger(__name__)

# Decision 2. Nothing in this module reads `submitted_at`.
APPLIED_AT = 'applied_at'

# THE JOIN NEEDS A CAST, AND THAT IS A SYMPTOM (verified live 2026-08-16).
#
#   job_postings.id          integer
#   job_applications.job_id  text      (holds numeric strings: '20', '11', …)
#
# so `p.id = a.job_id` fails outright with "operator does not exist:
# integer = text". We cast the POSTING side (`p.id::text`) rather than the
# application side: `a.job_id::integer` would raise on the first non-numeric
# value ever written, turning a reporting query into an outage. Casting to text
# cannot fail.
#
# The deeper issue is that `job_applications` carries NO foreign key constraints
# at all, so nothing prevents an application referencing a posting that does not
# exist. Today the data is clean — 9 of 9 applications join, 0 non-numeric ids,
# 0 orphans — but that is luck, not a guarantee. Reconciling the types and
# adding the constraint is a separate migration and deliberately not done here;
# it is a data-model change, not a reporting change.
POSTING_JOIN = 'p.id::text = a.job_id'

# Below this many observations a percentage is noise wearing a decimal point.
MIN_RATE_DENOMINATOR = 10

# The stage a candidate reaches when the employer has hired them. Single
# canonical value since migration 068 — before that, counting hires was
# impossible without also knowing which of three spellings was in use.
PLACED = 'placed'
SHORTLISTED = 'shortlisted'


def _query(sql: str, params: tuple = None, one: bool = False):
    """All database access goes through here so tests have a single seam."""
    return execute_query(sql, params, fetch_one=one, fetch_all=not one)


def _window_clause(column: str, days: Optional[int]) -> str:
    """Optional time window. None means all time, which is what a lifetime
    'placements to date' figure needs."""
    return f" AND {column} > now() - make_interval(days => %s)" if days else ""


# ── Outcomes ────────────────────────────────────────────────────────────────

def placements(company_id: str, days: Optional[int] = None) -> int:
    """Hires attributable to the platform, by the placement date.

    Counted from application_status_history rather than the application's
    current status, so that a candidate later marked something else still
    counts for the period in which they were actually placed.
    """
    sql = f"""
        SELECT count(DISTINCT a.id) AS n
          FROM job_applications a
          JOIN job_postings p ON p.id::text = a.job_id
          JOIN application_status_history h ON h.application_id = a.id
         WHERE p.company_id = %s
           AND h.new_status = '{PLACED}'
           {_window_clause('h.changed_at', days)}
    """
    params = (company_id, days) if days else (company_id,)
    row = _query(sql, params, one=True)
    return int(row['n']) if row and row.get('n') is not None else 0


def _median_days_to(company_id: str, target_status: str, days: Optional[int]) -> Dict[str, Any]:
    """Median days from application to first arrival at `target_status`.

    Returns median_days=None when nothing could be measured — never 0, which
    would read as "instant".
    """
    sql = f"""
        WITH first_arrival AS (
            SELECT a.id,
                   a.{APPLIED_AT} AS applied_at,
                   min(h.changed_at) AS reached_at
              FROM job_applications a
              JOIN job_postings p ON p.id::text = a.job_id
              JOIN application_status_history h ON h.application_id = a.id
             WHERE p.company_id = %s
               AND h.new_status = %s
               {_window_clause('h.changed_at', days)}
             GROUP BY a.id, a.{APPLIED_AT}
        )
        SELECT count(*) AS measured,
               percentile_cont(0.5) WITHIN GROUP (
                   ORDER BY EXTRACT(EPOCH FROM (reached_at - applied_at)) / 86400.0
               ) AS median_days
          FROM first_arrival
         WHERE applied_at IS NOT NULL
           AND reached_at >= applied_at
    """
    params = (company_id, target_status, days) if days else (company_id, target_status)
    row = _query(sql, params, one=True)

    measured = int(row['measured']) if row and row.get('measured') is not None else 0
    median = row.get('median_days') if row else None
    return {
        'median_days': round(float(median), 1) if median is not None and measured else None,
        'measured': measured,
    }


def time_to_hire(company_id: str, days: Optional[int] = None) -> Dict[str, Any]:
    """Application submitted → placed.

    `measured` vs `total` is the honesty column: a median over a fraction of
    placements is not the same claim as a median over all of them, and the
    caller must be able to tell the difference.
    """
    result = _median_days_to(company_id, PLACED, days)
    total = placements(company_id, days)
    result['total'] = total
    result['complete'] = (total > 0 and result['measured'] >= total)
    if total and result['measured'] < total:
        result['note'] = (
            f"{result['measured']} of {total} placements have a recorded "
            f"transition and could be timed."
        )
    return result


def time_to_first_shortlist(company_id: str, days: Optional[int] = None) -> Dict[str, Any]:
    """Application submitted → shortlisted.

    This is the platform's OWN performance — how quickly we put usable
    candidates in front of an employer — as distinct from how fast the employer
    then moves. Kept separate for exactly that reason: it is the number that
    defends the platform when an employer complains about speed.
    """
    return _median_days_to(company_id, SHORTLISTED, days)


# ── Funnel (counts only in Phase 1; conversion analysis is Phase 2) ─────────

def stage_counts(company_id: str, days: Optional[int] = None) -> Dict[str, int]:
    """Applications currently at each stage of the canonical ladder.

    Keyed by every stage in APPLICATION_STAGES, including the empty ones, so a
    consumer can render a complete funnel without inventing the gaps.
    """
    sql = f"""
        SELECT a.status, count(*) AS n
          FROM job_applications a
          JOIN job_postings p ON p.id::text = a.job_id
         WHERE p.company_id = %s
           {_window_clause('a.' + APPLIED_AT, days)}
         GROUP BY a.status
    """
    params = (company_id, days) if days else (company_id,)
    rows = _query(sql, params) or []
    found = {r['status']: int(r['n']) for r in rows if r.get('status')}
    counts = {stage: found.get(stage, 0) for stage in APPLICATION_STAGES}
    for status, n in found.items():
        if status not in counts:
            counts[status] = n          # terminal states: rejected, withdrawn
    return counts


def rate(numerator: int, denominator: int) -> Optional[float]:
    """A percentage, or None when the denominator is too small to mean anything.

    Suppressing is the point. "33%" from three applications invites a decision
    that the data cannot support.
    """
    if not denominator or denominator < MIN_RATE_DENOMINATOR:
        return None
    return round((numerator / denominator) * 100, 1)


# ── The one call a surface should make ──────────────────────────────────────

def employer_value(company_id: str, days: Optional[int] = 90) -> Dict[str, Any]:
    """Everything Phase 1 measures, for one company.

    `days=None` gives lifetime figures. Every duration carries its own coverage,
    and `has_outcomes` tells a caller whether to render outcome figures at all
    rather than leaving it to infer that from zeros.
    """
    counts = stage_counts(company_id, days)
    applications = sum(counts.values())
    placed = placements(company_id, days)

    return {
        'company_id': company_id,
        'window_days': days,
        'applications': applications,
        'placements': placed,
        'time_to_hire': time_to_hire(company_id, days),
        'time_to_first_shortlist': time_to_first_shortlist(company_id, days),
        'stage_counts': counts,
        # None rather than 0.0 when there is not enough to compute one.
        'placement_rate_pct': rate(placed, applications),
        'has_outcomes': placed > 0,
        'min_rate_denominator': MIN_RATE_DENOMINATOR,
    }
