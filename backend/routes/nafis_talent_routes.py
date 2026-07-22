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


# ────────────────────────────────────────────────────────────
# In-memory OTP store  { token: { code, phone, expires_at } }
# In production this would use Redis / SMS gateway.
# ────────────────────────────────────────────────────────────
import random, time as _time
_otp_store: dict = {}

@nafis_talent_bp.route('/public/invitation/<token>', methods=['GET'])
def get_seeker_invitation(token):
    """Validate a seeker invitation token. Returns seeker data."""
    try:
        system = _get_system()
        data = system.validate_seeker_invitation(token)
        if not data:
            return jsonify({'success': False, 'error': 'Invalid or expired invitation link'}), 404
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        logger.error(f"Seeker invitation validation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@nafis_talent_bp.route('/public/invitation/<token>/send-otp', methods=['POST'])
def send_otp(token):
    """Generate a 6-digit OTP and 'send' it via mock SMS (printed to terminal)."""
    try:
        payload = request.json or {}
        phone = payload.get('phone', '').strip()
        if not phone:
            return jsonify({'success': False, 'error': 'Phone number is required'}), 400

        # Validate the invitation token first
        system = _get_system()
        data = system.validate_seeker_invitation(token)
        if not data:
            return jsonify({'success': False, 'error': 'Invalid or expired invitation link'}), 404

        code = f"{random.randint(100000, 999999)}"
        _otp_store[token] = {
            'code': code,
            'phone': phone,
            'expires_at': _time.time() + 600,  # 10 minutes
        }

        # Mock SMS — print to terminal
        print(f"\n📱 [MOCK SMS TO {phone}] ──────────────────────────────────────")
        print(f"   Your verification code is: {code}")
        print(f"   (This code expires in 10 minutes)")
        print(f"──────────────────────────────────────────────────────────────────\n")

        return jsonify({
            'success': True,
            'message': 'Verification code sent to your phone.',
            'phone_masked': phone[:4] + '****' + phone[-3:] if len(phone) > 7 else '****',
        })
    except Exception as e:
        logger.error(f"OTP send error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@nafis_talent_bp.route('/public/invitation/<token>/verify-otp', methods=['POST'])
def verify_otp(token):
    """Verify the 6-digit OTP code."""
    try:
        payload = request.json or {}
        code = payload.get('code', '').strip()
        if not code:
            return jsonify({'success': False, 'error': 'Verification code is required'}), 400

        entry = _otp_store.get(token)
        if not entry:
            return jsonify({'success': False, 'error': 'No verification code found. Please request a new one.'}), 400

        if _time.time() > entry['expires_at']:
            del _otp_store[token]
            return jsonify({'success': False, 'error': 'Verification code has expired. Please request a new one.'}), 400

        if entry['code'] != code:
            return jsonify({'success': False, 'error': 'Incorrect verification code. Please try again.'}), 400

        # OTP verified — clean up
        del _otp_store[token]
        return jsonify({'success': True, 'message': 'Phone number verified successfully.'})

    except Exception as e:
        logger.error(f"OTP verify error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@nafis_talent_bp.route('/public/invitation/<token>/accept', methods=['POST'])
def accept_seeker_invitation(token):
    """Accept invitation, create candidate account, return JWT."""
    try:
        payload = request.json or {}

        system = _get_system()
        user_data = system.accept_seeker_invitation(token, payload)

        # Generate JWT tokens for auto-login
        try:
            from flask_jwt_extended import create_access_token, create_refresh_token
            user_id = str(user_data['id'])
            access_token = create_access_token(
                identity=user_id,
                additional_claims={'role': 'candidate'}
            )
            refresh_token = create_refresh_token(identity=user_id)

            return jsonify({
                'success': True,
                'message': 'Registration complete! Welcome to Emirati Pathways.',
                'data': {
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': user_data,
                }
            })
        except ImportError:
            return jsonify({
                'success': True,
                'message': 'Registration complete!',
                'data': {'user': user_data}
            })

    except ValueError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Seeker invitation accept error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
