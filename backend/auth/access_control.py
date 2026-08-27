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
# board_operator = the board secretary: an EHRDC team member assigned this
# role by an admin (owner ruling 2026-08-05 — no magic link; they are
# already staff). Schedules meetings, keeps minutes, tracks recommendations.
BOARD_ROLES = ADMIN_ROLES | {'board_member', 'board_operator', 'board_chairman'}

# board_chairman = the chair of the EHRDC Board. A board member with two powers
# no other role has (owner ruling 2026-08-21):
#
#   * ADOPTING THE MINUTES. Approval used to sit with ORGANISER_ROLES, so the
#     secretary approved the minutes they had written and uploaded themselves —
#     the same person authoring and adopting the record. The board adopts its
#     own record; the chair signs it.
#   * DECLARING THE MEETING OPEN once quorum is met.
#
# DELIBERATELY EXCLUDES ADMIN, unlike every other set here. Adopting the
# minutes is a governance act, not an administrative one: an admin who could
# sign the record on the board's behalf would be exactly the hole this closes.
# The recovery path if no chair is assigned is for an admin to GRANT the role —
# visible, attributable, and a different act from signing.
CHAIRMAN_ROLES = {'board_chairman'}
HR_ROLES = ADMIN_ROLES | {'recruiter', 'employer_admin', 'hr', 'hr_manager', 'talent_operator', 'employer_relations'}
RECRUITER_ROLES = ADMIN_ROLES | {'recruiter', 'employer_admin', 'talent_operator', 'employer_relations'}
# Roles that only mean something INSIDE a company. Owner ruling 2026-08-05:
# nobody may hold one of these without a company — a recruiter with no employer
# cannot publish a job, has no company name to show, and cannot be verified,
# which is exactly the dead end 16 of 17 recruiter-side accounts were in.
# The only supported way in is the company onboarding chain: operator issues a
# magic link -> the company representative joins under that company -> the
# representative invites their own team (/join-team). These roles are therefore
# NOT self-requestable and cannot be granted to a user with no membership.
COMPANY_BOUND_ROLES = {'recruiter', 'employer_admin', 'hr', 'hr_manager'}

# ── Roles that are meaningless without a binding ────────────────────────────
#
# COMPANY_BOUND_ROLES generalised (#401). Three other families have exactly the
# same shape: the role scopes a workspace to a container, and without the
# binding row the workspace opens, shows nothing, and never says why — the #362
# dead end.
#
# This is NOT reasoning by symmetry. Each was walked end to end on 2026-08-14:
# an operator created the container, bound a user, and the user could then do
# the job — a bound advisor sees their enrolled student, an unbound one has no
# institution to scope to and sees nothing, permanently.
#
# The dedicated operator flows below already write the role AND the binding in
# the same call, so they are unaffected by this. What this closes is the GENERIC
# admin role grant, which bypassed the binding for every family except company.
#
# Each entry: role -> (predicate, the flow that does it properly).
BOUND_ROLE_REQUIREMENTS = {
    'recruiter':           ('company',     'the company onboarding chain — an operator issues the company magic link, the representative joins, then invites their team'),
    'employer_admin':      ('company',     'the company onboarding chain — an operator issues the company magic link, the representative joins, then invites their team'),
    'hr':                  ('company',     'the company onboarding chain — an operator issues the company magic link, the representative joins, then invites their team'),
    'hr_manager':          ('company',     'the company onboarding chain — an operator issues the company magic link, the representative joins, then invites their team'),
    'advisor':             ('institution', 'binding them to an institution (Students → Institutions → add staff), which grants the role automatically'),
    'training_provider':   ('centre',      'binding them to a training centre (Training Centres → add staff), which grants the role automatically'),
    'training_center_rep': ('centre',      'binding them to a training centre (Training Centres → add staff), which grants the role automatically'),
    'assessor':            ('assessor',    'certifying them at an assessment centre (Assessment Centres → add assessor), which grants the role automatically'),
}


def _has_binding(user_id, kind):
    """Does this user hold the binding row `kind` requires?

    Never raises and never blocks on a lookup failure: returning True on error
    means a broken query cannot lock an operator out of granting a role. The
    dead end this prevents is bad; a platform where roles cannot be granted at
    all is worse.
    """
    queries = {
        'company':     ("SELECT 1 FROM company_team_members "
                        "WHERE user_id::text = %s AND invitation_status = 'accepted' LIMIT 1"),
        'institution': "SELECT 1 FROM institution_staff WHERE user_id::text = %s LIMIT 1",
        'centre':      "SELECT 1 FROM training_center_staff WHERE user_id::text = %s LIMIT 1",
        'assessor':    "SELECT 1 FROM assessor_profiles WHERE user_id::text = %s LIMIT 1",
    }
    sql = queries.get(kind)
    if not sql or not user_id:
        return True
    try:
        return bool(execute_query(sql, (str(user_id),), fetch_one=True))
    except Exception as e:  # pragma: no cover
        logger.warning(f"{kind} binding lookup failed for {user_id}: {e}")
        return True


def missing_role_binding(user_id, role):
    """None if the role may be granted, else a sentence saying how to do it properly.

    The message names the flow rather than only refusing, because the refusal
    is useless on its own: the operator's next question is always "then how?"
    """
    req = BOUND_ROLE_REQUIREMENTS.get(str(role or '').strip().lower())
    if not req:
        return None
    kind, how = req
    if _has_binding(user_id, kind):
        return None
    return (f"'{role}' cannot be granted on its own — it only means something once "
            f"the person is bound to the thing it scopes to. Grant it by {how}.")


def has_company_membership(user_id):
    """True if the user is an accepted member of any company.

    Reads company_team_members — the same table the workspace ACL trusts.
    hr_profiles is legacy display data and is deliberately not consulted.
    """
    if not user_id:
        return False
    try:
        row = execute_query(
            """SELECT 1 FROM company_team_members
               WHERE user_id::text = %s AND invitation_status = 'accepted' LIMIT 1""",
            (str(user_id),), fetch_one=True)
        return bool(row)
    except Exception as e:  # pragma: no cover — never block on a lookup failure
        logger.warning(f"company membership lookup failed for {user_id}: {e}")
        return False
# A growth operator is assigned to one or more DOMAINS. Each domain maps to a
# role the platform ALREADY HAS — the one an administrator sees on the Users
# tab, with permissions attached and people already holding it.
#
# WHY THERE IS A MAP HERE RATHER THAN A growth_operator_<domain> FAMILY
#
# There was such a family. The domain screen wrote growth_operator_company while
# the Users tab offered "Company Onboarding Operator" (employer_relations), so
# the same job had two role ids: a checkbox that stayed unchecked for somebody
# who plainly held the role, and three different labels across three screens.
#
# Owner, 2026-08-27: keep talent_operator and employer_relations. The parallel
# family had ONE holder between all seven of its names; the roles it duplicated
# had eleven. Every domain already had a role, so the family was never needed.
#
# I made that worse before I noticed it: earlier the same day I taught the
# guards to accept growth_operator_<domain>, which fixed the reported symptom by
# legitimising the duplicate instead of removing it.
GROWTH_OPERATOR_DOMAIN_ROLES = {
    'candidate':  'talent_operator',        # "Candidate Onboarding Operator"
    'company':    'employer_relations',     # "Company Onboarding Operator"
    'education':  'education_operator',
    'assessment': 'assessment_operator',
    'mentorship': 'mentorship_operator',
    'community':  'community_operator',
    'monitoring': 'platform_operator',      # "Monitoring Center Operator"
}

GROWTH_OPERATOR_DOMAINS = tuple(GROWTH_OPERATOR_DOMAIN_ROLES)

#: Retired. Kept ONLY so a guard still admits anyone carrying one of these from
#: before the sweep, and so migration 092 has a definition to clean up against.
#: Nothing grants them any more — see GROWTH_OPERATOR_DOMAIN_ROLES.
LEGACY_GROWTH_OPERATOR_ROLES = frozenset(
    f'growth_operator_{domain}' for domain in GROWTH_OPERATOR_DOMAINS
)

#: What the domain screen now grants: the platform's own role for that domain.
GROWTH_OPERATOR_ROLES = frozenset(GROWTH_OPERATOR_DOMAIN_ROLES.values())


def role_for_domain(domain):
    """The role a domain assignment grants, or None if the domain is unknown."""
    return GROWTH_OPERATOR_DOMAIN_ROLES.get((domain or '').strip().lower())


#: role -> domain, the reverse of GROWTH_OPERATOR_DOMAIN_ROLES.
DOMAIN_FOR_ROLE = {role: domain for domain, role in GROWTH_OPERATOR_DOMAIN_ROLES.items()}


def domain_for_role(role):
    """The domain a role covers, or None if it covers none.

    Understands the retired ``growth_operator_<domain>`` spelling as well, so a
    person who still carries one is shown on the domain they were assigned
    rather than silently dropping off the screen.
    """
    key = (role or '').strip().lower()
    if key in DOMAIN_FOR_ROLE:
        return DOMAIN_FOR_ROLE[key]
    if key.startswith('growth_operator_'):
        legacy = key[len('growth_operator_'):]
        return legacy if legacy in GROWTH_OPERATOR_DOMAIN_ROLES else None
    return None


# The full operator family (growth/education/assessment/mentorship/community/platform/etc.) plus admin.
OPERATOR_ROLES = ADMIN_ROLES | GROWTH_OPERATOR_ROLES | LEGACY_GROWTH_OPERATOR_ROLES | {
    'operator', 'growth_operator', 'talent_operator', 'employer_relations',
    'education_operator', 'assessment_operator', 'mentorship_operator', 'community_operator',
    'platform_operator', 'professional_dev_operator', 'career_services_operator',
    'board_operator',
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


# ── Who works on the platform ───────────────────────────────────────────────
#
# Everyone who holds a role because of a JOB, as opposed to the people the
# platform serves. Used by the operator console to answer "who has access, and
# to what" — a question that previously had no honest answer.
#
# WHY THIS IS AN EXPLICIT UNION AND NOT A PATTERN
#
# The console used to find its people with
#
#     u.secondary_roles::text ILIKE '%operator%'
#
# a substring search over raw JSON. It matched every kind of operator when the
# page was about one kind, and it matched anyone whose role list merely
# CONTAINED the word — including a candidate carrying twenty-seven secondary
# roles. Seventeen people were listed as growth operators; one was.
#
# That was harmless while the roles it offered to grant did nothing. Once
# growth_operator_<domain> started actually granting access (2026-08-27), a
# page inviting an administrator to drag thirteen of the wrong people into a
# domain stopped being cosmetic.
#
# Composed from the sets that already gate staff surfaces, so a role added to
# any of them appears here without anybody remembering to.
STAFF_ROLES = (
    ADMIN_ROLES | BOARD_ROLES | OPERATOR_ROLES | CAREER_SERVICES_ROLES
    | ADVISOR_ROLES | INSTITUTION_ROLES | PROFDEV_ROLES | TRAINING_ROLES
    | GOVERNANCE_ROLES
    | {'assessor', 'coach', 'mentor', 'internship_coordinator',
       'compliance_auditor', 'call_center_agent'}
) - {
    # Held BY the people the platform serves, and by staff only incidentally.
    # Listing someone as staff because they are also a candidate would put
    # 38,000 people in a directory of colleagues.
    'candidate', 'student', 'parent', 'employee', 'seeker', 'entrepreneur',
}


def is_staff(roles):
    """True if any of these roles is held because of a job.

    Takes the already-resolved role list (primary + secondary), so callers
    cannot accidentally check the primary role alone — which is how operators
    granted through secondary_roles became invisible in the first place.
    """
    return any((r or '').strip().lower() in STAFF_ROLES for r in (roles or []))


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
    # Role slugs are lowercase, but grants have arrived Title-Cased (e.g. a
    # 'Recruiter' secondary role 403'd a real recruiter on /jd/create). Fold
    # every resolved role to its lowercase slug so guards match regardless of
    # how the grant was stored.
    roles |= {r.lower() for r in roles if isinstance(r, str)}
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
