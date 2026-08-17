"""The caseload assignment lifecycle, and who may allocate a coach.

Two subsystems write `coach_client_assignments` with different semantics — the
candidate self-request path and the operator allocation path. They agreed about
the vocabulary by coincidence, not by construction, which is what this module
and these tests exist to change.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import caseload_states as cs  # noqa: E402

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _src(*parts):
    with open(os.path.join(BACKEND, *parts), encoding='utf-8') as fh:
        return fh.read()


# ── Who may allocate a coach ────────────────────────────────────────────────

def test_career_services_operators_may_assign_a_coach():
    assert 'career_services_operator' in cs.COACH_ASSIGN_ROLES


def test_call_centre_agents_may_NOT_assign_a_coach():
    """Owner decision 2026-08-17. The outsourced call centre reads the CRM — it
    is in CAREER_SERVICES_ROLES — but allocating coaching is not theirs to do.
    This is the assertion that would catch someone widening the gate by reusing
    CAREER_SERVICES_ROLES, which contains call_center_agent."""
    assert 'call_center_agent' not in cs.COACH_ASSIGN_ROLES


def test_admins_may_assign():
    assert 'admin' in cs.COACH_ASSIGN_ROLES


def test_the_advisor_gate_is_unchanged():
    """Tightening advisor assignment as a side effect of a coaching decision
    would break a different subsystem that nobody asked about."""
    try:
        from backend.auth.access_control import OPERATOR_ROLES
    except ImportError:
        from auth.access_control import OPERATOR_ROLES
    assert cs.ADVISOR_ASSIGN_ROLES == frozenset(OPERATOR_ROLES)


def test_the_two_kinds_have_different_answers():
    """If these ever became equal the per-kind check would be pointless
    indirection, and someone would rightly delete it."""
    assert cs.COACH_ASSIGN_ROLES != cs.ADVISOR_ASSIGN_ROLES


# ── Transitions ─────────────────────────────────────────────────────────────

def test_a_pending_request_may_be_accepted_or_declined():
    assert cs.can_transition(cs.PENDING, cs.ACTIVE)
    assert cs.can_transition(cs.PENDING, cs.DECLINED)


def test_an_active_relationship_may_be_withdrawn_or_handed_back():
    assert cs.can_transition(cs.ACTIVE, cs.REMOVED)
    assert cs.can_transition(cs.ACTIVE, cs.HANDED_BACK)


def test_a_declined_request_may_be_sent_again():
    """The candidate is not locked out by one refusal."""
    assert cs.can_transition(cs.DECLINED, cs.PENDING)


def test_a_handed_back_client_may_be_reallocated():
    assert cs.can_transition(cs.HANDED_BACK, cs.ACTIVE)


def test_an_active_relationship_cannot_go_back_to_pending():
    """Pending means 'awaiting the coach'. An established relationship has
    already had that answer."""
    assert not cs.can_transition(cs.ACTIVE, cs.PENDING)


def test_an_unknown_state_refuses_rather_than_raising():
    """A row written before this module existed, or by a path added later, must
    not be able to crash a request."""
    assert cs.can_transition('some_legacy_value', cs.ACTIVE) is False


# ── Hand-back is only for allocated work ────────────────────────────────────

def test_an_allocated_client_may_be_handed_back():
    assert cs.can_hand_back(cs.ACTIVE, cs.ORIGIN_ASSIGNED) is True


def test_a_client_who_CHOSE_this_coach_may_not_be_handed_back():
    """The coach accepted that request. Withdrawing from it is a different act
    with a different conversation attached — not a silent status change."""
    assert cs.can_hand_back(cs.ACTIVE, cs.ORIGIN_REQUESTED) is False


def test_only_an_active_assignment_may_be_handed_back():
    assert cs.can_hand_back(cs.PENDING, cs.ORIGIN_ASSIGNED) is False
    assert cs.can_hand_back(cs.HANDED_BACK, cs.ORIGIN_ASSIGNED) is False


def test_a_null_origin_may_not_be_handed_back():
    """Rows predating migration 072 have no origin. Refusing is the safe
    reading: we do not know the coach did not accept them."""
    assert cs.can_hand_back(cs.ACTIVE, None) is False


# ── The writers use the shared vocabulary ───────────────────────────────────

def test_the_operator_path_writes_active_and_records_the_origin():
    """Owner decision: allocation does NOT wait for the coach to accept."""
    src = _src('routes', 'caseload_assignment_routes.py')
    body = src.split('def assign(kind)')[1].split('def unassign')[0]
    assert 'cs.ACTIVE' in body
    assert 'cs.ORIGIN_ASSIGNED' in body
    assert "'pending'" not in body


def test_the_candidate_is_notified_when_a_coach_is_allocated():
    """Assignment gives a staff member access to their skill gaps and lets them
    schedule sessions that are transcribed and retained under policy 1.1.
    Learning about it when a coach calls is the wrong way to find out."""
    src = _src('routes', 'caseload_assignment_routes.py')
    body = src.split('def assign(kind)')[1].split('def unassign')[0]
    # Assert the call shape, not proximity: the target is the FIRST argument, so
    # searching forward from the notification type misses it entirely.
    assert "_notify(user_id=str(member_id), notification_type='coach_assigned'" in body, \
        'the notification must go to the CANDIDATE, not only the coach'


def test_the_self_request_path_records_its_origin_too():
    """Without this every self-request has a NULL origin and the coach dashboard
    cannot tell chosen from allocated."""
    src = _src('coach_routes.py')
    body = src.split('def request_coach')[1].split('\n@coach_bp.route')[0]
    assert 'cs.ORIGIN_REQUESTED' in body
    assert 'cs.PENDING' in body


def test_both_assign_and_unassign_are_gated():
    """A role that can create a relationship it cannot undo is a trap."""
    src = _src('routes', 'caseload_assignment_routes.py')
    assert src.count('refused = _may_assign(kind)') == 2


def test_the_gate_uses_resolve_roles():
    """Hand-rolled `role in ...` checks have failed open twelve times (#96), and
    a multi-role user holding career_services_operator as a SECONDARY role must
    still pass."""
    src = _src('routes', 'caseload_assignment_routes.py')
    body = src.split('def _may_assign')[1].split('\n@caseload_bp')[0]
    assert 'resolve_roles()' in body


def test_the_hand_back_endpoint_refuses_before_writing():
    """can_hand_back is consulted before the UPDATE, not after."""
    src = _src('coach_routes.py')
    body = src.split('def hand_back_client')[1].split('\n@coach_bp.route')[0]
    assert body.index('can_hand_back') < body.index('UPDATE coach_client_assignments')


def test_the_hand_back_requires_a_reason():
    src = _src('coach_routes.py')
    body = src.split('def hand_back_client')[1].split('\n@coach_bp.route')[0]
    assert 'A reason is required' in body


def test_a_hand_back_without_a_recorded_assigner_still_succeeds():
    """Rows predating migration 072 have no assigned_by. Losing the notification
    is better than refusing the coach a way out of work they did not accept."""
    src = _src('coach_routes.py')
    body = src.split('def hand_back_client')[1].split('\n@coach_bp.route')[0]
    assert 'if assigned_by:' in body
    assert 'logger.warning' in body
