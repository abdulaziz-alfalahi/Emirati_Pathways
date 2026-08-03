"""Admin API for platform-staff magic-link invitations (migration 045).

Admin-only except the public token preview the landing page needs before the
invitee has any session.
"""
import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

try:
    from backend.auth.access_control import require_roles, ADMIN_ROLES
    from backend.staff_invitation_system import StaffInvitationSystem, ALLOWED_STAFF_ROLES
    from backend.notification_helper import create_notification
except ImportError:  # pragma: no cover — the app runs under both roots
    from auth.access_control import require_roles, ADMIN_ROLES
    from staff_invitation_system import StaffInvitationSystem, ALLOWED_STAFF_ROLES
    from notification_helper import create_notification

logger = logging.getLogger(__name__)

staff_invitation_bp = Blueprint('staff_invitations', __name__,
                                url_prefix='/api/admin/staff-invitations')

_system = StaffInvitationSystem()


@staff_invitation_bp.route('/roles', methods=['GET'])
@require_roles(*ADMIN_ROLES)
def list_roles():
    """The roles an admin may confer by magic link (admin itself excluded)."""
    return jsonify({'success': True, 'roles': list(ALLOWED_STAFF_ROLES)})


@staff_invitation_bp.route('', methods=['GET'])
@require_roles(*ADMIN_ROLES)
def list_invitations():
    try:
        return jsonify({'success': True,
                        'invitations': _system.list_invitations()})
    except Exception as e:
        logger.error(f"List staff invitations failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to list invitations'}), 500


@staff_invitation_bp.route('', methods=['POST'])
@require_roles(*ADMIN_ROLES)
def create_invitation():
    data = request.get_json() or {}
    full_name = (data.get('full_name') or '').strip()
    role = (data.get('intended_role') or '').strip()
    if not full_name:
        return jsonify({'success': False, 'message': 'Full name is required'}), 400
    if not role:
        return jsonify({'success': False, 'message': 'Role is required'}), 400
    try:
        inv = _system.create_invitation(
            full_name=full_name,
            email=(data.get('email') or '').strip() or None,
            phone=(data.get('phone') or '').strip() or None,
            intended_role=role,
            organization=(data.get('organization') or '').strip() or None,
            notes=(data.get('notes') or '').strip() or None,
            expiry_days=data.get('expiry_days') or 7,
            invited_by=get_jwt_identity(),
        )
        for k in ('expires_at', 'created_at', 'updated_at'):
            if inv.get(k):
                inv[k] = inv[k].isoformat()
        return jsonify({'success': True, 'invitation': inv,
                        'magic_link': inv['magic_link']}), 201
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Create staff invitation failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to create invitation'}), 500


@staff_invitation_bp.route('/<int:invitation_id>', methods=['DELETE'])
@require_roles(*ADMIN_ROLES)
def revoke_invitation(invitation_id):
    try:
        _system.revoke_invitation(invitation_id)
        return jsonify({'success': True, 'message': 'Invitation revoked'})
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Revoke staff invitation failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to revoke invitation'}), 500


# --- public: the landing page needs this before the invitee has a session ---
staff_invitation_public_bp = Blueprint('staff_invitations_public', __name__,
                                       url_prefix='/api/staff-invitations')


@staff_invitation_public_bp.route('/<token>/preview', methods=['GET'])
def preview_invitation(token):
    """Name + offered role only — no roster or PII beyond the invitee's own."""
    try:
        return jsonify({'success': True, 'invitation': _system.preview(token)})
    except Exception as e:
        logger.error(f"Preview staff invitation failed: {e}")
        return jsonify({'success': False, 'invitation': {'valid': False}}), 200
