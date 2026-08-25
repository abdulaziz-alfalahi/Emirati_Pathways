"""The review desk for everything the platform wants to email.

WHY THIS EXISTS

The platform holds real candidate and real employer data. On 2026-08-25, a
sweep run hours before the first mail credentials were configured found 46
board-meeting emails and 131 invitation links queued to real recipients —
Al Rostamani, Majid Al Futtaim, Gargash Hospital, board offices at dghr.gov.ae
— none of which had ever been reviewed, and 42 of which announced test meetings
that had already been deleted.

The owner's rule, 2026-08-25: nothing reaches a real user or company that has
not been verified and approved, one message at a time.

So these endpoints are the only way a message leaves `held`. There is
deliberately NO "approve all" — per-message approval is the requirement, and
a bulk button would quietly recreate the thing this replaced. Approving 40
invitations means reading 40 messages.

ACCESS

Approving mail to real employers is a platform-administrator act, so the
mutating endpoints are ADMIN_ROLES only. Reading the queue and the
configuration is open to OPERATOR_ROLES, because an operator needs to see that
their invitation is waiting for approval rather than lost — but seeing it is
not approving it.
"""
import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

try:
    from backend.auth.access_control import require_roles, ADMIN_ROLES, OPERATOR_ROLES
except ImportError:                          # the app runs under both roots
    from auth.access_control import require_roles, ADMIN_ROLES, OPERATOR_ROLES

try:
    from backend import outbound_mail
    from backend.services import graph_mail
except ImportError:
    import outbound_mail
    from services import graph_mail

logger = logging.getLogger(__name__)

outbound_mail_bp = Blueprint('outbound_mail', __name__)


def _serialise(row):
    """What the reviewer sees. The FULL body, deliberately.

    A reviewer approving a message to a real employer must read what that
    employer will read. Truncating it here would turn per-message approval into
    per-subject-line approval, which is how unreviewed content gets out.
    """
    return {
        'id': row['id'],
        'to_email': row['to_email'],
        'to_name': row.get('to_name'),
        'subject': row['subject'],
        'body_text': row['body_text'],
        'body_html': row.get('body_html'),
        'kind': row['kind'],
        'related_type': row.get('related_type'),
        'related_id': row.get('related_id'),
        'created_at': row['created_at'].isoformat() if row.get('created_at') else None,
        'attempts': row.get('attempts', 0),
        'last_error': row.get('last_error'),
    }


@outbound_mail_bp.route('/queue', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_queue():
    """Messages waiting for a person, plus the counts for the badge."""
    try:
        limit = min(int(request.args.get('limit', 50)), 200)
    except (TypeError, ValueError):
        limit = 50
    held = outbound_mail.held_messages(limit=limit)
    return jsonify({
        'success': True,
        'messages': [_serialise(r) for r in held],
        'summary': outbound_mail.queue_summary(),
    })


@outbound_mail_bp.route('/config', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_config():
    """Whether sending is possible at all — presence of settings, never values.

    An operator wondering why nothing is being delivered should be able to see
    that the switch is off or the allow-list is empty, without a client secret
    ever appearing on a screen or in a screenshot.
    """
    config = graph_mail.describe_config()
    return jsonify({
        'success': True,
        'configured': graph_mail.configured(),
        'settings': config,
        'note': ('Nothing is delivered unless sending is enabled, the '
                 'recipient is on the approved list, and the message itself '
                 'has been approved.'),
    })


@outbound_mail_bp.route('/<int:message_id>/approve', methods=['POST'])
@require_roles(*ADMIN_ROLES)
def approve_message(message_id):
    """Approve exactly one message.

    There is no bulk equivalent, and adding one would defeat the point.
    """
    payload = request.get_json(silent=True) or {}
    approver = get_jwt_identity()
    if not outbound_mail.approve(message_id, approver, note=payload.get('note')):
        # Either it does not exist or somebody already decided it. Both mean
        # "your click did not do what you think", which is what matters.
        return jsonify({'success': False,
                        'error': 'this message is no longer waiting for a '
                                 'decision — it may have been approved or '
                                 'rejected already'}), 409
    logger.info('outbound mail %s approved by %s', message_id, approver)
    return jsonify({'success': True, 'message': 'Approved for sending'})


@outbound_mail_bp.route('/<int:message_id>/reject', methods=['POST'])
@require_roles(*ADMIN_ROLES)
def reject_message(message_id):
    payload = request.get_json(silent=True) or {}
    rejecter = get_jwt_identity()
    if not outbound_mail.reject(message_id, rejecter, note=payload.get('note')):
        return jsonify({'success': False,
                        'error': 'this message is no longer waiting for a '
                                 'decision'}), 409
    logger.info('outbound mail %s rejected by %s', message_id, rejecter)
    return jsonify({'success': True, 'message': 'Rejected — it will not be sent'})


@outbound_mail_bp.route('/send-approved', methods=['POST'])
@require_roles(*ADMIN_ROLES)
def send_approved():
    """Deliver what has already been approved.

    Separate from approval on purpose: approving records a decision, and this
    acts on decisions already made. Nothing here can send an unapproved
    message — `send_one` reads the approval off the row rather than trusting
    its caller.
    """
    if not graph_mail.configured():
        return jsonify({'success': False,
                        'error': 'Microsoft Graph is not configured yet',
                        'settings': graph_mail.describe_config()}), 400
    result = graph_mail.send_approved_batch()
    return jsonify({'success': True, **result,
                    'summary': outbound_mail.queue_summary()})
