"""
NAFIS Talent Routes

Flask Blueprint for job seeker CSV import, batch listing,
seeker listing, dashboard statistics, and magic link invitations.
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
import logging
try:
    from backend.auth.access_control import resolve_roles
except ImportError:  # pragma: no cover
    from auth.access_control import resolve_roles

logger = logging.getLogger(__name__)

nafis_talent_bp = Blueprint('nafis_talent', __name__, url_prefix='/api/nafis-talent')

# Lazy-init system instance
_system = None


def _get_system():
    global _system
    if _system is None:
        try:
            from backend.nafis_talent_system import NafisTalentSystem
        except ImportError:
            from nafis_talent_system import NafisTalentSystem
        _system = NafisTalentSystem()
    return _system


# Roles permitted to operate NAFIS talent tooling (Cluster-1 authz hardening).
_OPERATOR_ROLES = {'talent_operator', 'employer_relations', 'growth_operator',
                   'platform_operator', 'platform_administrator', 'admin', 'super_admin'}


def _operator_required(fn):
    """Require a valid JWT with an operator/admin role.

    NAFIS seeker data is citizen PII (Emirates IDs, names, emails, phones), so
    every internal route must be authenticated + authorized. The /public/invitation/*
    routes are intentionally NOT decorated with this (token-gated onboarding).
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        # resolve_roles() honours primary claim + secondary_roles (claim + DB),
        # so an operator holding the role as a SECONDARY role is not locked out
        # of its own tooling (C1). Reading only get_jwt()['role'] did that.
        if not (resolve_roles() & _OPERATOR_ROLES):
            return jsonify({'success': False, 'message': 'Forbidden - operator access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


# ─────────────────────────────────────────────
# POST /api/nafis-talent/import
# ─────────────────────────────────────────────
@nafis_talent_bp.route('/import', methods=['POST'])
@_operator_required
def import_csv():
    """Upload a NAFIS job-seeker CSV and import records."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if not file.filename:
            return jsonify({'error': 'Empty filename'}), 400

        csv_content = file.read()
        if not csv_content:
            return jsonify({'error': 'Empty file'}), 400

        uploaded_by = None
        try:
            from flask import g
            uploaded_by = getattr(g, 'user_id', None)
        except Exception:
            pass

        system = _get_system()
        report = system.import_job_seekers_from_csv(
            csv_content,
            uploaded_by=uploaded_by,
            filename=file.filename,
        )

        return jsonify(report), 200

    except Exception as e:
        logger.error(f"NAFIS import error: {e}")
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# GET /api/nafis-talent/batches
# ─────────────────────────────────────────────
@nafis_talent_bp.route('/batches', methods=['GET'])
@_operator_required
def list_batches():
    """Return all import batches."""
    try:
        system = _get_system()
        batches = system.get_import_batches()
        for b in batches:
            if b.get('created_at'):
                b['created_at'] = b['created_at'].isoformat()
        return jsonify({'batches': batches}), 200
    except Exception as e:
        logger.error(f"Error fetching batches: {e}")
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# GET /api/nafis-talent/seekers
# ─────────────────────────────────────────────
@nafis_talent_bp.route('/seekers', methods=['GET'])
@_operator_required
def list_seekers():
    """Return paginated job seekers with advanced filters."""
    try:
        status = request.args.get('status')
        search = request.args.get('search')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 25))

        # Collect advanced filters
        filter_keys = [
            'gender', 'age_group', 'education_level', 'specialization',
            'sub_specialization', 'job_seeker_type', 'preferred_work_mode',
            'national_service', 'emirate_of_origin', 'emirate_of_residence',
            'city_name', 'marital_status', 'determination_type',
            'is_student', 'is_person_of_determination',
            'experience_min', 'experience_max', 'gpa_min', 'gpa_max',
            'registered_from', 'registered_to',
            'job_seeker_date_from', 'job_seeker_date_to',
        ]
        filters = {}
        for k in filter_keys:
            v = request.args.get(k)
            if v is not None and v != '':
                filters[k] = v

        system = _get_system()
        result = system.get_job_seekers(
            status=status, search=search, page=page, limit=limit,
            filters=filters if filters else None,
        )
        for s in result.get('seekers', []):
            if s.get('created_at'):
                s['created_at'] = s['created_at'].isoformat()
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error fetching seekers: {e}")
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# GET /api/nafis-talent/filter-options
# ─────────────────────────────────────────────
@nafis_talent_bp.route('/filter-options', methods=['GET'])
@_operator_required
def filter_options():
    """Return distinct values for filter dropdowns."""
    try:
        system = _get_system()
        options = system.get_filter_options()
        return jsonify(options), 200
    except Exception as e:
        logger.error(f"Error fetching filter options: {e}")
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# GET /api/nafis-talent/stats
# ─────────────────────────────────────────────
@nafis_talent_bp.route('/stats', methods=['GET'])
@_operator_required
def get_stats():
    """Return dashboard statistics."""
    try:
        system = _get_system()
        stats = system.get_stats()
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        return jsonify({'error': str(e)}), 500


# ═════════════════════════════════════════════
# SEEKER INVITATION ENDPOINTS (Magic Links)
# ═════════════════════════════════════════════

@nafis_talent_bp.route('/invite', methods=['POST'])
@_operator_required
def invite_seekers():
    """
    Send magic link invitations to selected seekers.
    Expects JSON: { "seeker_ids": [1, 2, 3] }
    """
    try:
        data = request.json
        seeker_ids = data.get('seeker_ids', [])
        if not seeker_ids:
            return jsonify({'success': False, 'error': 'No seekers selected'}), 400

        invited_by = None
        try:
            from flask_jwt_extended import get_jwt_identity
            invited_by = get_jwt_identity()
            if invited_by:
                invited_by = int(invited_by)
        except Exception:
            pass

        system = _get_system()
        results = system.create_seeker_invitations(seeker_ids, invited_by=invited_by)

        successful = [r for r in results if 'error' not in r]
        failed = [r for r in results if 'error' in r]

        return jsonify({
            'success': True,
            'message': f"Sent {len(successful)} invitations ({len(failed)} failed)",
            'invitations': successful,
            'errors': failed,
        })

    except Exception as e:
        logger.error(f"Invite seekers error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────────
# Public endpoints (no auth required)
# ─────────────────────────────────────────────


@nafis_talent_bp.route('/public/invitation/<token>', methods=['GET'])
def get_seeker_invitation(token):
    """Validate a seeker invitation token. Returns seeker data.

    Still used: the onboarding wizard shows the seeker their imported details
    before handing off to UAE Pass.
    """
    try:
        system = _get_system()
        data = system.validate_seeker_invitation(token)
        if not data:
            return jsonify({'success': False, 'error': 'Invalid or expired invitation link'}), 404
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        logger.error(f"Seeker invitation validation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ────────────────────────────────────────────────────────────
# RETIRED: OTP onboarding. Seeker onboarding now hands off to UAE Pass —
# the wizard calls GET /api/auth/uaepass/login?invitation_token=<t>&
# invitation_type=seeker, and the UAE Pass callback redeems the invitation
# against the government-verified identity (NafisTalentSystem.
# redeem_seeker_invitation_for_user). This retires the in-memory OTP store
# and the mock SMS sender, and binds the account to the EID rather than an
# unverified phone. Mirrors the employer flow (PR #105).
# ────────────────────────────────────────────────────────────
_RETIRED_OTP_MSG = {
    'success': False,
    'message': 'Phone OTP onboarding has been replaced by UAE Pass. '
               'Start onboarding via /api/auth/uaepass/login?invitation_type=seeker.',
}


@nafis_talent_bp.route('/public/invitation/<token>/send-otp', methods=['POST'])
def send_otp(token):
    return jsonify(_RETIRED_OTP_MSG), 410


@nafis_talent_bp.route('/public/invitation/<token>/verify-otp', methods=['POST'])
def verify_otp(token):
    return jsonify(_RETIRED_OTP_MSG), 410


@nafis_talent_bp.route('/public/invitation/<token>/accept', methods=['POST'])
def accept_seeker_invitation(token):
    """RETIRED — onboarding is completed by the UAE Pass callback now. 410."""
    return jsonify(_RETIRED_OTP_MSG), 410
