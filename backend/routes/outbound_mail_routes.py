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


# ── Templates: what the OWNER approves, once per message kind ───────────────

@outbound_mail_bp.route('/templates', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def list_templates():
    """Every template version, so "which wording was signed off, and when" has
    an answer that does not depend on reading the code as it is today."""
    from db_utils import execute_query as _q
    rows = _q("""SELECT t.id, t.kind, t.version, t.fingerprint, t.status,
                        t.sample_subject, t.sample_body, t.created_at,
                        t.approved_at, t.note,
                        COALESCE(u.full_name, u.first_name, t.approved_by) AS approved_by_name
                   FROM outbound_mail_templates t
                   LEFT JOIN users u ON u.id = t.approved_by
                  ORDER BY t.kind, t.version DESC""") or []
    # What changes per message, attached at read time rather than stored: it is
    # documentation about the template, not part of the wording, and folding it
    # into the sample would move every fingerprint and invalidate approvals
    # already given.
    from services import mail_templates
    return jsonify({'success': True, 'templates': [
        {**dict(r),
         'varies': mail_templates.varies_for(r['kind']),
         'created_at': r['created_at'].isoformat() if r.get('created_at') else None,
         'approved_at': r['approved_at'].isoformat() if r.get('approved_at') else None}
        for r in rows]})


@outbound_mail_bp.route('/templates/register', methods=['POST'])
@require_roles(*ADMIN_ROLES)
def register_templates():
    """Render every known template and record any whose wording is new.

    Deliberately does NOT approve anything. It puts the current wording in
    front of an administrator to read; approval is a separate, explicit act.
    """
    from services import mail_templates
    return jsonify({'success': True, **mail_templates.register_all()})


@outbound_mail_bp.route('/templates/<int:template_id>/approve', methods=['POST'])
@require_roles(*ADMIN_ROLES)
def approve_template(template_id):
    """Approve one wording. Retires whatever it replaces.

    This is the owner's whole involvement in a bulk send: read this text once,
    approve it, and operators release messages that render from it.
    """
    from db_utils import execute_query as _q
    payload = request.get_json(silent=True) or {}
    approver = get_jwt_identity()
    row = _q("SELECT kind, status FROM outbound_mail_templates WHERE id = %s",
             (template_id,), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'error': 'no such template'}), 404
    if row['status'] == 'approved':
        return jsonify({'success': False, 'error': 'already approved'}), 409

    # One approved version per kind — the partial unique index enforces it, so
    # the previous one is retired first rather than colliding.
    _q("""UPDATE outbound_mail_templates
             SET status = 'retired', retired_at = now()
           WHERE kind = %s AND status = 'approved'""", (row['kind'],), fetch_all=False)
    _q("""UPDATE outbound_mail_templates
             SET status = 'approved', approved_by = %s, approved_at = now(),
                 note = COALESCE(%s, note)
           WHERE id = %s""", (approver, payload.get('note'), template_id), fetch_all=False)
    logger.info('mail template %s (%s) approved by %s', template_id, row['kind'], approver)
    return jsonify({'success': True,
                    'message': f"Approved. Operators can now release "
                               f"\"{row['kind']}\" messages."})


# ── Release: what OPERATORS do ──────────────────────────────────────────────

@outbound_mail_bp.route('/release', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def release_messages():
    """Release held messages of one kind on an approved template's authority.

    Every refusal comes back as a state with a reason rather than an error:
    the caller is running a bulk operation, and a 500 mid-run says nothing
    about what already went out.
    """
    payload = request.get_json(silent=True) or {}
    kind = (payload.get('kind') or '').strip()
    if not kind:
        return jsonify({'success': False, 'error': 'kind is required'}), 400
    result = outbound_mail.release(kind, get_jwt_identity(), limit=payload.get('limit'))
    return jsonify({'success': True, **result,
                    'summary': outbound_mail.queue_summary()})


@outbound_mail_bp.route('/controls', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_controls():
    state = outbound_mail.controls()
    for key in ('paused_at', 'resumed_at'):
        if state.get(key):
            state[key] = state[key].isoformat()
    return jsonify({'success': True, 'controls': state})


@outbound_mail_bp.route('/controls/pause', methods=['POST'])
@require_roles(*OPERATOR_ROLES)
def pause_sending():
    """Anyone who can release can stop. Stopping is never the risky direction."""
    payload = request.get_json(silent=True) or {}
    reason = (payload.get('reason') or '').strip() or 'paused by an operator'
    outbound_mail.pause(reason, by=get_jwt_identity())
    return jsonify({'success': True, 'message': 'Sending paused'})


@outbound_mail_bp.route('/controls/resume', methods=['POST'])
@require_roles(*ADMIN_ROLES)
def resume_sending():
    """Resuming is an ADMIN act, deliberately narrower than pausing.

    A pause is usually automatic and means a run looked wrong; the person who
    decides it is safe to continue should not be the one whose run tripped it.
    """
    outbound_mail.resume(get_jwt_identity())
    return jsonify({'success': True, 'message': 'Sending resumed'})


@outbound_mail_bp.route('/controls/cap', methods=['POST'])
@require_roles(*ADMIN_ROLES)
def set_cap():
    from db_utils import execute_query as _q
    payload = request.get_json(silent=True) or {}
    try:
        cap = int(payload.get('daily_release_cap'))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'error': 'daily_release_cap must be a number'}), 400
    if cap < 1:
        return jsonify({'success': False, 'error': 'the cap must be at least 1'}), 400
    _q("""UPDATE outbound_mail_controls SET daily_release_cap = %s,
             updated_at = now() WHERE id = 1""", (cap,), fetch_all=False)
    return jsonify({'success': True, 'daily_release_cap': cap})


# ── Audit: what replaces the owner's queue ──────────────────────────────────

@outbound_mail_bp.route('/audit', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def audit():
    """Volume, authority, failures and drift over a window.

    Includes a random sample of DELIVERED bodies, because a summary can look
    healthy while every message in it says the wrong thing. The sample is what
    verifies quality; the counts only describe volume.
    """
    try:
        days = max(1, min(int(request.args.get('days', 7)), 90))
    except (TypeError, ValueError):
        days = 7
    try:
        size = int(request.args.get('sample', 5))
    except (TypeError, ValueError):
        size = 5

    summary = outbound_mail.audit_summary(days=days)
    sample = outbound_mail.audit_sample(days=days, size=size,
                                        kind=(request.args.get('kind') or None))
    for row in sample:
        if row.get('sent_at'):
            row['sent_at'] = row['sent_at'].isoformat()
    for row in summary.get('by_operator', []):
        if row.get('last_release'):
            row['last_release'] = row['last_release'].isoformat()
    for key in ('paused_at', 'resumed_at'):
        if summary.get('controls', {}).get(key):
            summary['controls'][key] = summary['controls'][key].isoformat()

    return jsonify({'success': True, **summary,
                    'sample': sample,
                    'drift': outbound_mail.audit_drift()})
