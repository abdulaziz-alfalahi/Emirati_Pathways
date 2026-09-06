"""Candidate → recruiter referrals (migration 110). See candidate_referrals.py.

  candidate:  POST /api/referrals            invite a recruiter to view me
              GET  /api/referrals            my referrals, with views
              DELETE /api/referrals/<id>     withdraw
  recruiter:  GET  /api/referrals/recruiter  candidates who invited me
              POST /api/referrals/recruiter/<candidate_id>/viewed
  operator:   GET  /api/referrals/operator   pending referrals to act on
              POST /api/referrals/operator/<id>/invite   issue the company invitation
"""
import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

try:
    from backend.auth.access_control import require_auth, require_roles, RECRUITER_ROLES, OPERATOR_ROLES
    from backend.candidate_referrals import CandidateReferralSystem
    from backend.growth_system import GrowthSystem
    from backend.db_utils import execute_query
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import require_auth, require_roles, RECRUITER_ROLES, OPERATOR_ROLES
    from candidate_referrals import CandidateReferralSystem
    from growth_system import GrowthSystem
    from db_utils import execute_query

logger = logging.getLogger(__name__)

referrals_bp = Blueprint('candidate_referrals', __name__, url_prefix='/api/referrals')
_system = CandidateReferralSystem()


def _me():
    return str(get_jwt_identity() or '').strip()


def _my_email():
    row = execute_query("SELECT email FROM users WHERE id = %s", (_me(),), fetch_one=True)
    return (row or {}).get('email')


# ---------------------------------------------------------------- candidate
@referrals_bp.route('', methods=['POST'])
@require_auth
def create_referral():
    data = request.get_json(silent=True) or {}
    try:
        row = _system.create(_me(), data.get('recruiter_name'), data.get('recruiter_email'),
                             data.get('company_name'), data.get('note'))
        return jsonify({'success': True, 'referral': row}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"create referral failed: {e}")
        return jsonify({'success': False, 'message': 'Could not create the invitation'}), 500


@referrals_bp.route('', methods=['GET'])
@require_auth
def my_referrals():
    try:
        return jsonify({'success': True, 'referrals': _system.list_for_candidate(_me())})
    except Exception as e:
        logger.error(f"list referrals failed: {e}")
        return jsonify({'success': False, 'message': 'Could not list invitations'}), 500


@referrals_bp.route('/<int:referral_id>', methods=['DELETE'])
@require_auth
def revoke_referral(referral_id):
    try:
        if _system.revoke(_me(), referral_id):
            return jsonify({'success': True, 'message': 'Invitation withdrawn'})
        return jsonify({'success': False, 'message': 'Not found or already closed'}), 404
    except Exception as e:
        logger.error(f"revoke referral failed: {e}")
        return jsonify({'success': False, 'message': 'Could not withdraw'}), 500


# ---------------------------------------------------------------- recruiter
@referrals_bp.route('/recruiter', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def recruiter_referrals():
    try:
        return jsonify({'success': True, 'referrals': _system.list_for_recruiter(_me(), _my_email())})
    except Exception as e:
        logger.error(f"recruiter referrals failed: {e}")
        return jsonify({'success': False, 'message': 'Could not list referrals'}), 500


@referrals_bp.route('/recruiter/<candidate_id>/viewed', methods=['POST'])
@require_roles(*RECRUITER_ROLES)
def recruiter_viewed(candidate_id):
    """The recruiter opened the candidate's profile: the candidate gets to see that."""
    try:
        return jsonify({'success': True, 'recorded': _system.record_view(_me(), str(candidate_id).strip())})
    except Exception as e:
        logger.error(f"record view failed: {e}")
        return jsonify({'success': False}), 500


# ---------------------------------------------------------------- operators
@referrals_bp.route('/operator', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def operator_queue():
    try:
        return jsonify({'success': True, 'referrals': _system.list_pending_for_operators()})
    except Exception as e:
        logger.error(f"operator referrals failed: {e}")
        return jsonify({'success': False, 'message': 'Could not list referrals'}), 500


@referrals_bp.route('/operator/<int:referral_id>/invite', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def operator_invite(referral_id):
    """One click: a company invitation (intended_role=recruiter) to the
    recruiter's email, through the same magic-link path every employer takes,
    linked back to the referral so redemption grants the view."""
    pending = [r for r in _system.list_pending_for_operators() if r['id'] == referral_id]
    if not pending:
        return jsonify({'success': False, 'message': 'Referral not pending'}), 404
    ref = pending[0]
    try:
        results = GrowthSystem().create_company_invitations([{
            'name': ref.get('company_display_name') or ref.get('company_name') or '',
            'code': '', 'email': ref['recruiter_email'], 'phone': '', 'sector': '',
            'tradeLicense': '', 'intended_role': 'recruiter',
        }], invited_by=_me())
        inv = (results or [{}])[0]
        if not inv.get('id'):
            return jsonify({'success': False, 'message': inv.get('error') or 'Invitation not created'}), 500
        _system.attach_company_invitation(referral_id, inv['id'])
        return jsonify({'success': True, 'invitation': {k: (str(v) if k == 'id' else v) for k, v in inv.items()}})
    except Exception as e:
        logger.error(f"operator invite from referral failed: {e}")
        return jsonify({'success': False, 'message': 'Could not issue the invitation'}), 500
