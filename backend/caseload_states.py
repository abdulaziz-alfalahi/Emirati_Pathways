"""The lifecycle of a caseload assignment, in one place.

WHY THIS EXISTS

`coach_client_assignments.status` is a free-form varchar with no CHECK
constraint, and TWO subsystems write it with different semantics:

  coach_routes.py                    candidate self-request  -> 'pending'
  routes/caseload_assignment_routes  operator assignment     -> 'active'

Those grew independently. The strings 'pending', 'active', 'declined' and
'removed' were each introduced at the site that needed them, and nothing
recorded which transitions are legal. Adding 'handed_back' as a fifth string
typed at a fifth site is how the two paths quietly stop agreeing about what a
row means — so the states, the transitions and the assign permissions live here
and both writers import them.

THE TWO ORIGINS ARE NOT THE SAME RELATIONSHIP

A candidate who chose their coach and a candidate an operator allocated are in
different situations, and the coach needs to tell them apart: the first asked
for them, the second did not. `origin` records which, so the coach dashboard can
say so and so a hand-back can be offered only where it makes sense — you cannot
hand back someone who chose you.

OWNER DECISIONS 2026-08-17

  * Operator assignment stays ACTIVE. It does not wait for the coach to accept.
    The earlier "coaches accept like mentors, no silent auto-assign" rule was
    written for CANDIDATE-initiated requests, where auto-assign would drop a
    stranger into a coach's dashboard. An operator allocating a caseload is a
    managed act by someone accountable, and in a call-centre-driven operation a
    coach's veto would leave an agent's promise to a candidate unfulfilled.
    The coach gets agency AFTER the fact instead: HANDED_BACK.
  * The candidate IS notified. Assignment gives a staff member access to their
    skill gaps and development plans, and lets them schedule sessions that are
    transcribed and retained under consent policy 1.1. Learning about that when
    a coach calls is the wrong way to find out.
  * Only career-services operators may assign a coach — NOT call-centre agents,
    who can read the CRM but not allocate coaching.
"""

from typing import Dict, FrozenSet, Set

try:
    from backend.auth.access_control import ADMIN_ROLES, OPERATOR_ROLES
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import ADMIN_ROLES, OPERATOR_ROLES

# ── States ──────────────────────────────────────────────────────────────────

PENDING = 'pending'          # candidate asked; the coach has not answered
ACTIVE = 'active'            # a live coaching relationship
DECLINED = 'declined'        # the coach turned down a candidate's request
HANDED_BACK = 'handed_back'  # the coach returned an operator-assigned client
REMOVED = 'removed'          # an operator withdrew the assignment

ALL_STATES: FrozenSet[str] = frozenset(
    {PENDING, ACTIVE, DECLINED, HANDED_BACK, REMOVED})

# The only state in which the relationship exists. Every caseload query filters
# on this, which is why HANDED_BACK and REMOVED are separate states rather than
# a deleted row: the history of who was assigned to whom survives.
LIVE_STATES: FrozenSet[str] = frozenset({ACTIVE})

# ── Origins ─────────────────────────────────────────────────────────────────

ORIGIN_REQUESTED = 'requested'   # the candidate chose this coach
ORIGIN_ASSIGNED = 'assigned'     # an operator allocated them

ALL_ORIGINS: FrozenSet[str] = frozenset({ORIGIN_REQUESTED, ORIGIN_ASSIGNED})

# ── Transitions ─────────────────────────────────────────────────────────────

# None on the left means "no row yet". Anything not listed is not a legal move.
TRANSITIONS: Dict[str, Set[str]] = {
    PENDING: {ACTIVE, DECLINED},
    # An operator may withdraw an active assignment, and a coach may hand back
    # one they did not ask for.
    ACTIVE: {REMOVED, HANDED_BACK},
    # A declined request may be sent again; the candidate is not locked out.
    DECLINED: {PENDING},
    # An operator can re-allocate someone a coach handed back — to the same
    # coach if circumstances changed, or to a different one.
    HANDED_BACK: {ACTIVE},
    REMOVED: {ACTIVE, PENDING},
}


def can_transition(current: str, target: str) -> bool:
    """True if `current -> target` is a legal move.

    Deliberately returns False rather than raising for an unknown state: a row
    written before this module existed, or by a path added later, must not be
    able to crash a request. The caller refuses the move and says so.
    """
    return target in TRANSITIONS.get(current, set())


def can_hand_back(status: str, origin: str) -> bool:
    """A coach may hand back an ACTIVE relationship they did not ask for.

    Not someone who chose them: the coach already accepted that request, and
    withdrawing from it is a different act with a different conversation
    attached. Handing back is for allocated work.
    """
    return status == ACTIVE and origin == ORIGIN_ASSIGNED


# ── Who may assign ──────────────────────────────────────────────────────────

# Owner decision 2026-08-17: career-services operators only. NOT
# call_center_agent — the outsourced call centre reads the CRM (it is in
# CAREER_SERVICES_ROLES) but allocating a coach is not theirs to do.
COACH_ASSIGN_ROLES: FrozenSet[str] = frozenset(
    ADMIN_ROLES | {'career_services_operator'})

# Advisor caseloads keep EXACTLY the gate they have today (OPERATOR_ROLES).
# Deliberately not narrowed: tightening them here would silently change a
# different subsystem's permissions as a side effect of a coaching decision,
# and nobody asked for that.
ADVISOR_ASSIGN_ROLES: FrozenSet[str] = frozenset(OPERATOR_ROLES)

ASSIGN_ROLES_BY_KIND: Dict[str, FrozenSet[str]] = {
    'coach': COACH_ASSIGN_ROLES,
    'advisor': ADVISOR_ASSIGN_ROLES,
}
