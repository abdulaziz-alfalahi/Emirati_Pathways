"""
Job Applications API — /api/applications

The frontend applicationService (src/services/applicationService.ts) has always
called /api/applications/*, but no blueprint ever owned that prefix — the
2026-07-23 service-catalog audit found /api/applications/my-applications
returning the global 404 handler, which is why the Applications page never
listed anything (catalog EJ-02).

Implements the candidate-facing core against the LIVE schema
(job_applications: id text, job_id text, candidate_id text, status,
cover_letter, applied_at/submitted_at, expected_salary text) joined to
job_postings (id integer) and companies (name/company_name drift → COALESCE).
"""

import uuid
import logging
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

try:
    from backend.db_utils import execute_query
    from backend.auth.access_control import require_roles, RECRUITER_ROLES
except ImportError:  # pragma: no cover — app also runs from backend/ as cwd
    from db_utils import execute_query
    from auth.access_control import require_roles, RECRUITER_ROLES

logger = logging.getLogger(__name__)

applications_bp = Blueprint('applications_api', __name__, url_prefix='/api/applications')

# Statuses a candidate may see; transitions the candidate may set themselves.
_CANDIDATE_SETTABLE = {'withdrawn'}
_VALID_STATUSES = {'submitted', 'under_review', 'shortlisted', 'interview',
                   'offer', 'hired', 'rejected', 'withdrawn'}

_BASE_SELECT = """
    SELECT ja.id, ja.job_id, ja.candidate_id, ja.status, ja.cover_letter,
           ja.expected_salary, ja.applied_at, ja.submitted_at, ja.updated_at,
           ja.interview_date, ja.interview_type,
           jp.title AS job_title, jp.emirate, jp.city,
           COALESCE(c.name, c.company_name, '') AS company_name
    FROM job_applications ja
    LEFT JOIN job_postings jp ON jp.id::text = ja.job_id
    LEFT JOIN companies c ON c.id = jp.company_id
"""


def _row_out(r):
    return {
        'id': r['id'],
        'job_id': r['job_id'],
        'candidate_id': r['candidate_id'],
        'status': r['status'],
        'cover_letter': r.get('cover_letter'),
        'expected_salary': r.get('expected_salary'),
        'salary_currency': 'AED',
        'job_title': r.get('job_title') or '',
        'company_name': r.get('company_name') or '',
        'emirate': r.get('emirate'),
        'city': r.get('city'),
        'interview_date': r['interview_date'].isoformat() if r.get('interview_date') else None,
        'interview_type': r.get('interview_type'),
        'created_at': (r.get('applied_at') or r.get('submitted_at')).isoformat()
                      if (r.get('applied_at') or r.get('submitted_at')) else None,
        'updated_at': r['updated_at'].isoformat() if r.get('updated_at') else None,
    }


@applications_bp.route('/my-applications', methods=['GET'])
@jwt_required()
def my_applications():
    """Applications belonging to the authenticated candidate."""
    try:
        user_id = get_jwt_identity()
        rows = execute_query(
            _BASE_SELECT + " WHERE ja.candidate_id = %s ORDER BY COALESCE(ja.applied_at, ja.submitted_at) DESC",
            (user_id,)
        ) or []
        return jsonify({'success': True, 'data': [_row_out(r) for r in rows]})
    except Exception as e:
        logger.error(f"my-applications failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load applications'}), 500


@applications_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply():
    """Submit an application to a job posting."""
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        job_id = str(data.get('job_id') or '').strip()
        if not job_id:
            return jsonify({'success': False, 'message': 'job_id is required'}), 400

        job = execute_query("SELECT id, status FROM job_postings WHERE id::text = %s",
                            (job_id,), fetch_one=True)
        if not job:
            return jsonify({'success': False, 'message': 'Job not found'}), 404

        dup = execute_query(
            "SELECT id FROM job_applications WHERE candidate_id = %s AND job_id = %s AND status != 'withdrawn'",
            (user_id, job_id), fetch_one=True)
        if dup:
            return jsonify({'success': False, 'message': 'You have already applied to this job'}), 409

        app_id = str(uuid.uuid4())
        execute_query(
            """INSERT INTO job_applications
                   (id, job_id, candidate_id, cover_letter, expected_salary,
                    status, applied_at, submitted_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, 'submitted', NOW(), NOW(), NOW())""",
            (app_id, job_id, user_id,
             (data.get('cover_letter') or '')[:8000],
             str(data.get('expected_salary') or '')[:60]),
            fetch_all=False,
        )
        return jsonify({'success': True, 'message': 'Application submitted successfully',
                        'data': {'id': app_id, 'job_id': job_id, 'status': 'submitted'}}), 201
    except Exception as e:
        logger.error(f"apply failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to submit application'}), 500


@applications_bp.route('/<application_id>', methods=['GET'])
@jwt_required()
def get_application(application_id):
    try:
        user_id = get_jwt_identity()
        row = execute_query(_BASE_SELECT + " WHERE ja.id = %s", (application_id,), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        # Candidates may only read their own application (recruiter roles may read all).
        from backend.auth.access_control import resolve_roles  # local import keeps top clean
        roles = resolve_roles()
        if row['candidate_id'] != user_id and not (roles & RECRUITER_ROLES):
            return jsonify({'success': False, 'message': 'Forbidden'}), 403
        return jsonify({'success': True, 'data': _row_out(row)})
    except Exception as e:
        logger.error(f"get application failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load application'}), 500


@applications_bp.route('/<application_id>/withdraw', methods=['POST'])
@jwt_required()
def withdraw(application_id):
    try:
        user_id = get_jwt_identity()
        row = execute_query("SELECT candidate_id, status FROM job_applications WHERE id = %s",
                            (application_id,), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        if row['candidate_id'] != user_id:
            return jsonify({'success': False, 'message': 'Forbidden'}), 403
        execute_query("UPDATE job_applications SET status = 'withdrawn', updated_at = NOW() WHERE id = %s",
                      (application_id,), fetch_all=False)
        return jsonify({'success': True, 'message': 'Application withdrawn'})
    except Exception as e:
        logger.error(f"withdraw failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to withdraw application'}), 500


@applications_bp.route('/<application_id>/status', methods=['PUT'])
@require_roles(*RECRUITER_ROLES)
def set_status(application_id):
    """Recruiter-side status transition."""
    try:
        data = request.get_json(silent=True) or {}
        status = str(data.get('status') or '').strip()
        if status not in _VALID_STATUSES:
            return jsonify({'success': False, 'message': f'Invalid status: {status}'}), 400
        row = execute_query("SELECT id FROM job_applications WHERE id = %s",
                            (application_id,), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'message': 'Application not found'}), 404
        execute_query(
            "UPDATE job_applications SET status = %s, notes = COALESCE(%s, notes), updated_at = NOW() WHERE id = %s",
            (status, data.get('notes'), application_id), fetch_all=False)
        return jsonify({'success': True, 'message': f'Status updated to {status}'})
    except Exception as e:
        logger.error(f"set status failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to update status'}), 500


@applications_bp.route('/job/<job_id>', methods=['GET'])
@require_roles(*RECRUITER_ROLES)
def job_applications(job_id):
    """Recruiter view: all applications for one job."""
    try:
        rows = execute_query(
            _BASE_SELECT + " WHERE ja.job_id = %s ORDER BY COALESCE(ja.applied_at, ja.submitted_at) DESC",
            (str(job_id),)) or []
        return jsonify({'success': True, 'data': [_row_out(r) for r in rows]})
    except Exception as e:
        logger.error(f"job applications failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to load applications'}), 500
