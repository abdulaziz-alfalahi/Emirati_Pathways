"""
Shared access-control decorators (server-side authorization).

Centralises the CORRECT auth pattern for this platform, replacing the family of no-op
``optional_auth`` decorators that let privileged endpoints run fully unauthenticated:

- Verify a JWT from EITHER the ``Authorization: Bearer`` header OR the httpOnly
  ``access_token`` cookie (UAE Pass sessions authenticate via cookies).
- Resolve the caller's FULL role set. The JWT carries only the primary ``role`` claim,
  but users commonly hold their privileged role (admin/recruiter/hr/assessor/…) as a
  SECONDARY role in ``users.secondary_roles``. We therefore merge: the primary claim,
  any ``secondary_roles`` claim, and a DB lookup of ``users.role`` + ``users.secondary_roles``.

Usage:
    from backend.auth.access_control import require_auth, require_roles, ADMIN_ROLES
    @bp.route(...) ; @require_auth                       # any authenticated user
    @bp.route(...) ; @require_roles(*ADMIN_ROLES)        # role-gated
Handlers can read ``flask.g.user_id`` for the verified identity instead of trusting a
client-supplied id.
"""
import json
import logging
from functools import wraps

from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

logger = logging.getLogger(__name__)

try:
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover
    from db_utils import execute_query

ADMIN_ROLES = {'admin', 'administrator', 'super_user', 'super_admin', 'platform_administrator'}
# Convenience role sets for common privileged surfaces (admin always included).
BOARD_ROLES = ADMIN_ROLES | {'board_member'}
HR_ROLES = ADMIN_ROLES | {'recruiter', 'employer_admin', 'hr', 'hr_manager', 'talent_operator', 'employer_relations'}
RECRUITER_ROLES = ADMIN_ROLES | {'recruiter', 'employer_admin', 'talent_operator', 'employer_relations'}
# The full operator family (growth/education/assessment/mentorship/community/platform/etc.) plus admin.
OPERATOR_ROLES = ADMIN_ROLES | {
    'operator', 'growth_operator', 'talent_operator', 'employer_relations',
    'education_operator', 'assessment_operator', 'mentorship_operator', 'community_operator',
    'platform_operator', 'professional_dev_operator', 'career_services_operator',
}
# Career-services counselling CRM (candidate pipeline, counselling notes, PII).
# Kept tight — this surface exposes candidate national IDs / phones.
CAREER_SERVICES_ROLES = ADMIN_ROLES | {'career_services_operator', 'call_center_agent', 'operator'}
# Enrolment-verified education role, and who may verify enrolment.
STUDENT_ROLES = ADMIN_ROLES | {'student'}
# Academic/career advisor — institution-side role that owns the student caseload.
ADVISOR_ROLES = ADMIN_ROLES | {'advisor'}
# Who may enrol a person (grant the `student` role). Enrolment is an
# institution-side act owned by the Academic Advisor (bound to the institution).
# The internship_coordinator was removed (2026-07-25 — it only enters at the
# internship stage), and the education_operator was removed too (2026-07-25 —
# it is a platform-side setup/oversight role; it provisions institutions and
# binds advisors, but does not do institution-side data entry). An operator who
# must enrol binds itself as an advisor at that institution. Only admin is an
# unscoped enroller (break-glass).
ENROLMENT_ROLES = ADMIN_ROLES | {'advisor'}
# Any institution-side staff (read/list students of one's institution). Includes
# the coordinator (lists/assigns, no enrol) and the education_operator (oversight
# + institution setup).
INSTITUTION_ROLES = ADMIN_ROLES | {'education_operator', 'advisor', 'internship_coordinator'}
# Professional-development operator: platform-side role that vets/onboards training
# centers and curates their programs (analogous to education_operator for schools).
PROFDEV_ROLES = ADMIN_ROLES | {'professional_dev_operator'}
# Training-center-side staff: representatives who list their center's programs.
# Bound to a center via training_center_staff (the binding grants the role).
TRAINING_ROLES = ADMIN_ROLES | {'training_provider', 'training_center_rep'}
# Governance / oversight surfaces (metrics, demographics, executive analytics).
GOVERNANCE_ROLES = BOARD_ROLES | {'compliance_auditor', 'platform_operator'}


def _verify_any_jwt():
    """Verify a JWT from the Authorization header or the access_token cookie.
    Returns the identity (user id) string, or None if unauthenticated."""
    try:
        verify_jwt_in_request()
        uid = get_jwt_identity()
        if uid is not None:
            return uid
    except Exception:
        pass
    try:
        verify_jwt_in_request(locations=['cookies'])
        return get_jwt_identity()
    except Exception:
        return None


def resolve_roles():
    """Full role set for the current identity: primary ``role`` claim + any
    ``secondary_roles`` claim + DB (``users.role`` + ``users.secondary_roles``)."""
    roles = set()
    try:
        claims = get_jwt() or {}
        if claims.get('role'):
            roles.add(claims['role'])
        sec = claims.get('secondary_roles')
        if isinstance(sec, (list, tuple)):
            roles.update(sec)
    except Exception:
        pass
    try:
        uid = get_jwt_identity()
        if uid is not None:
            row = execute_query(
                "SELECT role, secondary_roles FROM users WHERE id::text = %s",
                (str(uid),), fetch_one=True
            )
            if row:
                if row.get('role'):
                    roles.add(row['role'])
                s = row.get('secondary_roles') or []
                if isinstance(s, str):
                    try:
                        s = json.loads(s)
                    except Exception:
                        s = [s]
                roles.update(s or [])
    except Exception as e:
        logger.warning(f"resolve_roles DB lookup failed: {e}")
    # `job_seeker` was collapsed into `candidate` (migration 029). Any lingering
    # claim (e.g. a JWT minted before the migration) resolves to candidate so
    # guards never fail closed during the transition.
    if 'job_seeker' in roles:
        roles.add('candidate')
    # The student role has legacy/label variants (school_student, university_student,
    # and the Title-Case 'Student' the role-request UI grants). Fold them to the
    # canonical `student` so guards match regardless of how it was granted.
    if roles & {'school_student', 'university_student', 'Student'}:
        roles.add('student')
    return roles


def require_auth(f):
    """Require ANY authenticated user (header or cookie JWT). Sets ``g.user_id``."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        uid = _verify_any_jwt()
        if not uid:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        g.user_id = str(uid)
        return f(*args, **kwargs)
    return wrapper


def require_roles(*allowed):
    """Require an authenticated caller holding at least one of ``allowed`` roles
    (resolved across primary claim + secondary_roles). Sets ``g.user_id``."""
    allowed_set = set(allowed)

    def deco(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            uid = _verify_any_jwt()
            if not uid:
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            if not (resolve_roles() & allowed_set):
                return jsonify({'success': False, 'message': 'Forbidden - insufficient role'}), 403
            g.user_id = str(uid)
            return f(*args, **kwargs)
        return wrapper
    return deco
