"""
HR Recruiter Analytics Routes
Compute pipeline conversion and time-to-fill metrics for recruiter's company.
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import logging
from backend.db import get_db_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hr_analytics_bp = Blueprint("hr_analytics", __name__, url_prefix="/api/hr/analytics")



@hr_analytics_bp.route('/recruiter/summary', methods=['GET'])
@jwt_required()
def recruiter_summary():
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('recruiter', 'employer_admin', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id=%s", (current_user_id,))
            row = cursor.fetchone()
            if not row or not row.get('company_id'):
                return jsonify({'success': False, 'message': 'No company associated with your profile'}), 400
            company_id = row['company_id']

            # Jobs counts
            cursor.execute("""
                SELECT COUNT(*) AS total_jobs,
                       COUNT(*) FILTER (WHERE status='published') AS published_jobs,
                       AVG(EXTRACT(EPOCH FROM (published_at - created_at))/86400.0) FILTER (WHERE published_at IS NOT NULL) AS avg_time_to_publish_days
                FROM job_postings
                WHERE company_id=%s
            """, (company_id,))
            jobs = cursor.fetchone() or {}

            # Offers counts & time-to-fill
            cursor.execute("""
                SELECT COUNT(*) AS total_offers,
                       COUNT(*) FILTER (WHERE status='sent') AS offers_sent,
                       COUNT(*) FILTER (WHERE status='accepted') AS offers_accepted,
                       AVG(EXTRACT(EPOCH FROM (o.accepted_at - jp.published_at))/86400.0) FILTER (WHERE o.status='accepted' AND jp.published_at IS NOT NULL AND o.accepted_at IS NOT NULL) AS avg_time_to_fill_days
                FROM offers o
                INNER JOIN job_postings jp ON o.job_posting_id = jp.id
                WHERE jp.company_id=%s
            """, (company_id,))
            offers = cursor.fetchone() or {}

            # Shortlist count
            cursor.execute("""
                SELECT COUNT(*) AS total_shortlisted
                FROM job_shortlists js
                INNER JOIN job_postings jp ON js.job_posting_id = jp.id
                WHERE jp.company_id=%s
            """, (company_id,))
            shortlist = cursor.fetchone() or {}

            # Docs and distribution
            cursor.execute("""
                SELECT (
                  SELECT COUNT(*) FROM job_documents jd INNER JOIN job_postings jp ON jd.job_posting_id=jp.id WHERE jp.company_id=%s
                ) AS total_documents,
                (
                  SELECT COUNT(*) FROM external_job_distribution ed INNER JOIN job_postings jp2 ON ed.job_posting_id=jp2.id WHERE jp2.company_id=%s
                ) AS total_distributions
            """, (company_id, company_id))
            extra = cursor.fetchone() or {}

            # Pipeline summary
            cursor.execute("""
                SELECT 
                  (SELECT COUNT(*) FROM job_postings WHERE company_id=%s AND status='draft') AS jobs_draft,
                  (SELECT COUNT(*) FROM job_postings WHERE company_id=%s AND status='published') AS jobs_published,
                  (SELECT COUNT(*) FROM job_shortlists js INNER JOIN job_postings jp ON js.job_posting_id=jp.id WHERE jp.company_id=%s) AS candidates_shortlisted,
                  (SELECT COUNT(*) FROM offers o INNER JOIN job_postings jp ON o.job_posting_id=jp.id WHERE jp.company_id=%s AND o.status IN ('sent','accepted','declined')) AS offers_total,
                  (SELECT COUNT(*) FROM offers o INNER JOIN job_postings jp ON o.job_posting_id=jp.id WHERE jp.company_id=%s AND o.status='accepted') AS offers_accepted
            """, (company_id, company_id, company_id, company_id, company_id))
            pipeline = cursor.fetchone() or {}

            return jsonify({'success': True, 'data': {
                'jobs': jobs,
                'offers': offers,
                'shortlist': shortlist,
                'extra': extra,
                'pipeline': pipeline,
            }})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error recruiter analytics: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to compute analytics'}), 500
