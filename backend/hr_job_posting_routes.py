"""
HR/Recruiter Job Posting Routes
Emirati Journey Platform - Job Posting Functionality with UAE Compliance
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import psycopg2
import psycopg2.extras
import logging
from datetime import datetime, timedelta
import uuid
import os
import json
import re
from werkzeug.utils import secure_filename

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
hr_job_posting_bp = Blueprint('hr_job_posting', __name__, url_prefix='/api/hr/jobs')

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password')
}

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)

class UAEComplianceChecker:
    """UAE Labor Law and Emiratization Compliance Checker"""
    
    @staticmethod
    def check_job_posting_compliance(job_data):
        """Check job posting for UAE compliance"""
        compliance_issues = []
        compliance_score = 100
        
        # Check for discriminatory language
        discriminatory_terms = [
            'male only', 'female only', 'men only', 'women only',
            'young', 'old', 'age limit', 'specific nationality',
            'religion', 'marital status'
        ]
        
        description = job_data.get('description', '').lower()
        title = job_data.get('title', '').lower()
        requirements = str(job_data.get('requirements', {})).lower()
        
        full_text = f"{title} {description} {requirements}"
        
        for term in discriminatory_terms:
            if term in full_text:
                compliance_issues.append({
                    'type': 'discrimination',
                    'severity': 'high',
                    'message': f"Potentially discriminatory language detected: '{term}'",
                    'suggestion': 'Remove discriminatory language and focus on job-related qualifications'
                })
                compliance_score -= 20
        
        # Check Emiratization requirements
        emiratization_target = job_data.get('emiratization_target', 0)
        if emiratization_target < 2:
            compliance_issues.append({
                'type': 'emiratization',
                'severity': 'medium',
                'message': 'Low Emiratization target. Consider UAE national preference.',
                'suggestion': 'Set appropriate Emiratization target (minimum 2% for private sector)'
            })
            compliance_score -= 10
        
        # Check salary disclosure
        salary_min = job_data.get('salary_range_min')
        salary_max = job_data.get('salary_range_max')
        
        if not salary_min or not salary_max:
            compliance_issues.append({
                'type': 'salary_transparency',
                'severity': 'medium',
                'message': 'Salary range not specified',
                'suggestion': 'Include salary range for transparency (UAE Labor Law recommendation)'
            })
            compliance_score -= 15
        
        # Check visa sponsorship
        visa_sponsorship = job_data.get('visa_sponsorship_available', False)
        if not visa_sponsorship and 'uae' not in full_text:
            compliance_issues.append({
                'type': 'visa_sponsorship',
                'severity': 'low',
                'message': 'Visa sponsorship availability not specified',
                'suggestion': 'Clarify visa sponsorship availability for international candidates'
            })
            compliance_score -= 5
        
        # Check Arabic language requirement disclosure
        if 'arabic' in requirements and 'required' in requirements:
            # This is actually good for UAE compliance
            pass
        elif 'customer service' in full_text or 'client facing' in full_text:
            compliance_issues.append({
                'type': 'language_requirement',
                'severity': 'low',
                'message': 'Arabic language requirement not specified for customer-facing role',
                'suggestion': 'Consider specifying Arabic language requirements for customer-facing positions'
            })
            compliance_score -= 5
        
        return {
            'is_compliant': len([issue for issue in compliance_issues if issue['severity'] == 'high']) == 0,
            'compliance_score': max(0, compliance_score),
            'issues': compliance_issues,
            'recommendations': UAEComplianceChecker._get_compliance_recommendations(job_data)
        }
    
    @staticmethod
    def _get_compliance_recommendations(job_data):
        """Get UAE-specific compliance recommendations"""
        recommendations = []
        
        # Emiratization recommendations
        recommendations.append({
            'category': 'emiratization',
            'title': 'Emiratization Compliance',
            'description': 'Ensure compliance with UAE Emiratization requirements',
            'actions': [
                'Set appropriate Emiratization targets',
                'Highlight opportunities for UAE nationals',
                'Consider mentorship programs for Emirati employees'
            ]
        })
        
        # Language recommendations
        recommendations.append({
            'category': 'language',
            'title': 'Language Requirements',
            'description': 'Specify language requirements clearly',
            'actions': [
                'Specify Arabic language proficiency if required',
                'Indicate if bilingual capabilities are preferred',
                'Clarify communication requirements'
            ]
        })
        
        # Benefits recommendations
        recommendations.append({
            'category': 'benefits',
            'title': 'UAE Standard Benefits',
            'description': 'Include standard UAE employment benefits',
            'actions': [
                'Health insurance coverage',
                'Annual leave (minimum 30 days)',
                'End of service benefits',
                'Professional development opportunities'
            ]
        })
        
        return recommendations

def _get_company_id_for_user(cursor, user_id: str):
    cursor.execute("SELECT company_id FROM hr_profiles WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    return row['company_id'] if row and row.get('company_id') else None

def _uploads_dir() -> str:
    base_dir = os.getenv('JOB_DOCS_UPLOAD_DIR')
    if not base_dir:
        base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'job_documents')
    os.makedirs(base_dir, exist_ok=True)
    return base_dir

@hr_job_posting_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for job posting functionality"""
    return jsonify({
        'success': True,
        'message': 'HR Job Posting API is operational',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Job creation and management',
            'UAE compliance checking',
            'Job templates',
            'Application tracking',
            'Emiratization compliance'
        ]
    })

@hr_job_posting_bp.route('/', methods=['GET'])
@jwt_required()
def get_job_postings():
    """Get job postings for the HR user's company"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        
        # Get query parameters
        status = request.args.get('status', 'all')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        search = request.args.get('search', '')
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get company ID from HR profile
            cursor.execute("""
                SELECT company_id FROM hr_profiles WHERE user_id = %s
            """, (current_user_id,))
            
            hr_profile = cursor.fetchone()
            if not hr_profile or not hr_profile['company_id']:
                return jsonify({
                    'success': False,
                    'message': 'No company associated with your profile'
                }), 400
            
            company_id = hr_profile['company_id']
            
            # Build query
            where_conditions = ["jp.company_id = %s"]
            params = [company_id]
            
            if status != 'all':
                where_conditions.append("jp.status = %s")
                params.append(status)
            
            if search:
                where_conditions.append("(jp.title ILIKE %s OR jp.description ILIKE %s)")
                search_term = f"%{search}%"
                params.extend([search_term, search_term])
            
            where_clause = " AND ".join(where_conditions)
            
            # Get job postings with application counts
            cursor.execute(f"""
                SELECT 
                    jp.*,
                    c.name as company_name,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    COUNT(ja.id) as application_count,
                    COUNT(CASE WHEN ja.application_status = 'submitted' THEN 1 END) as new_applications
                FROM job_postings jp
                LEFT JOIN companies c ON jp.company_id = c.id
                LEFT JOIN users u ON jp.created_by = u.id
                LEFT JOIN job_applications ja ON jp.id::text = ja.job_id
                WHERE {where_clause}
                GROUP BY jp.id, c.name, u.first_name, u.last_name
                ORDER BY jp.created_at DESC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            
            job_postings = cursor.fetchall()
            
            # Get total count
            cursor.execute(f"""
                SELECT COUNT(DISTINCT jp.id)
                FROM job_postings jp
                WHERE {where_clause}
            """, params)
            
            total_count = cursor.fetchone()['count']
            
            # Convert to list of dicts and parse JSONB fields
            jobs_data = []
            for job in job_postings:
                job_data = dict(job)
                
                # Parse JSONB fields
                jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
                for field in jsonb_fields:
                    if job_data.get(field):
                        try:
                            if isinstance(job_data[field], str):
                                job_data[field] = json.loads(job_data[field])
                        except (json.JSONDecodeError, TypeError):
                            job_data[field] = {}
                
                jobs_data.append(job_data)
            
            return jsonify({
                'success': True,
                'data': {
                    'job_postings': jobs_data,
                    'total_count': total_count,
                    'current_page': offset // limit + 1,
                    'total_pages': (total_count + limit - 1) // limit
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting job postings: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job postings'
        }), 500

@hr_job_posting_bp.route('/batch', methods=['POST'])
@jwt_required()
def create_job_postings_batch():
    """Create a batch of job postings in one request"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        data = request.get_json() or {}
        jobs = data.get('jobs', [])
        if not isinstance(jobs, list) or not jobs:
            return jsonify({'success': False, 'message': 'jobs array is required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        created = []
        try:
            company_id = _get_company_id_for_user(cursor, current_user_id)
            if not company_id:
                return jsonify({'success': False, 'message': 'No company associated with your profile'}), 400

            for job in jobs:
                if not job.get('title') or not job.get('description'):
                    return jsonify({'success': False, 'message': 'Each job requires title and description'}), 400

                compliance_result = UAEComplianceChecker.check_job_posting_compliance(job)
                job_id = str(uuid.uuid4())

                application_deadline = None
                expires_at = None
                if job.get('application_deadline'):
                    try:
                        application_deadline = datetime.strptime(job['application_deadline'], '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({'success': False, 'message': 'Invalid application_deadline format. Use YYYY-MM-DD'}), 400
                if job.get('expires_at'):
                    try:
                        expires_at = datetime.strptime(job['expires_at'], '%Y-%m-%d').date()
                    except ValueError:
                        return jsonify({'success': False, 'message': 'Invalid expires_at format. Use YYYY-MM-DD'}), 400

                cursor.execute(
                    """
                    INSERT INTO job_postings (
                        id, company_id, created_by, title, description, requirements,
                        responsibilities, benefits, salary_range_min, salary_range_max,
                        currency, location, remote_work_allowed, employment_type,
                        experience_level, status, priority_level, application_deadline,
                        expires_at, uae_compliance_checked, emiratization_target,
                        visa_sponsorship_available, tags, seo_keywords
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    ) RETURNING *
                    """,
                    (
                        job_id, company_id, current_user_id, job['title'], job['description'],
                        json.dumps(job.get('requirements', {})),
                        json.dumps(job.get('responsibilities', [])),
                        json.dumps(job.get('benefits', [])),
                        job.get('salary_range_min'),
                        job.get('salary_range_max'),
                        job.get('currency', 'AED'),
                        job.get('location'),
                        job.get('remote_work_allowed', False),
                        job.get('employment_type', 'full-time'),
                        job.get('experience_level', 'mid'),
                        job.get('status', 'draft'),
                        job.get('priority_level', 'normal'),
                        application_deadline,
                        expires_at,
                        compliance_result['is_compliant'],
                        job.get('emiratization_target', 0),
                        job.get('visa_sponsorship_available', False),
                        json.dumps(job.get('tags', [])),
                        json.dumps(job.get('seo_keywords', []))
                    )
                )
                created.append(dict(cursor.fetchone()))

            conn.commit()
            return jsonify({'success': True, 'message': 'Batch created successfully', 'data': created}), 201
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error creating job postings batch: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create batch'}), 500

@hr_job_posting_bp.route('/', methods=['POST'])
@jwt_required()
def create_job_posting():
    """Create a new job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get company ID from HR profile
            cursor.execute("""
                SELECT company_id FROM hr_profiles WHERE user_id = %s
            """, (current_user_id,))
            
            hr_profile = cursor.fetchone()
            if not hr_profile or not hr_profile['company_id']:
                return jsonify({
                    'success': False,
                    'message': 'No company associated with your profile'
                }), 400
            
            company_id = hr_profile['company_id']
            
            # Run UAE compliance check
            compliance_result = UAEComplianceChecker.check_job_posting_compliance(data)
            
            # Prepare job posting data
            job_id = str(uuid.uuid4())
            
            # Parse dates
            application_deadline = None
            expires_at = None
            
            if data.get('application_deadline'):
                try:
                    application_deadline = datetime.strptime(data['application_deadline'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid application_deadline format. Use YYYY-MM-DD'
                    }), 400
            
            if data.get('expires_at'):
                try:
                    expires_at = datetime.strptime(data['expires_at'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid expires_at format. Use YYYY-MM-DD'
                    }), 400
            
            # Insert job posting
            cursor.execute("""
                INSERT INTO job_postings (
                    id, company_id, created_by, title, description, requirements,
                    responsibilities, benefits, salary_range_min, salary_range_max,
                    currency, location, remote_work_allowed, employment_type,
                    experience_level, status, priority_level, application_deadline,
                    expires_at, uae_compliance_checked, emiratization_target,
                    visa_sponsorship_available, tags, seo_keywords
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING *
            """, (
                job_id, company_id, current_user_id, data['title'], data['description'],
                json.dumps(data.get('requirements', {})),
                json.dumps(data.get('responsibilities', [])),
                json.dumps(data.get('benefits', [])),
                data.get('salary_range_min'),
                data.get('salary_range_max'),
                data.get('currency', 'AED'),
                data.get('location'),
                data.get('remote_work_allowed', False),
                data.get('employment_type', 'full-time'),
                data.get('experience_level', 'mid'),
                data.get('status', 'draft'),
                data.get('priority_level', 'normal'),
                application_deadline,
                expires_at,
                compliance_result['is_compliant'],
                data.get('emiratization_target', 0),
                data.get('visa_sponsorship_available', False),
                json.dumps(data.get('tags', [])),
                json.dumps(data.get('seo_keywords', []))
            ))
            
            new_job = cursor.fetchone()
            
            # Insert detailed requirements if provided
            if data.get('detailed_requirements'):
                for req in data['detailed_requirements']:
                    cursor.execute("""
                        INSERT INTO job_requirements (
                            job_posting_id, requirement_type, requirement_name,
                            requirement_level, proficiency_level, years_required,
                            description, weight
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        job_id, req.get('type'), req.get('name'),
                        req.get('level', 'required'), req.get('proficiency'),
                        req.get('years_required'), req.get('description'),
                        req.get('weight', 1.0)
                    ))
            
            # Insert detailed benefits if provided
            if data.get('detailed_benefits'):
                for benefit in data['detailed_benefits']:
                    cursor.execute("""
                        INSERT INTO job_benefits (
                            job_posting_id, benefit_category, benefit_name,
                            benefit_description, benefit_value, is_highlighted
                        ) VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        job_id, benefit.get('category'), benefit.get('name'),
                        benefit.get('description'), benefit.get('value'),
                        benefit.get('is_highlighted', False)
                    ))
            
            conn.commit()
            
            # Prepare response
            job_result = dict(new_job)
            
            # Parse JSONB fields for response
            jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
            for field in jsonb_fields:
                if job_result.get(field):
                    try:
                        if isinstance(job_result[field], str):
                            job_result[field] = json.loads(job_result[field])
                    except (json.JSONDecodeError, TypeError):
                        job_result[field] = {}
            
            return jsonify({
                'success': True,
                'message': 'Job posting created successfully',
                'data': {
                    'job_posting': job_result,
                    'compliance_check': compliance_result
                }
            }), 201
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error creating job posting: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to create job posting'
        }), 500

@hr_job_posting_bp.route('/<job_id>/documents', methods=['POST'])
@jwt_required()
def upload_job_document(job_id):
    """Upload a required document for a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403

        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify ownership
            cursor.execute(
                """
                SELECT jp.id
                FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
                """,
                (job_id, current_user_id),
            )
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Job posting not found or access denied'}), 404

            uploads_dir = _uploads_dir()
            filename = secure_filename(file.filename)
            stored_name = f"{uuid.uuid4().hex}_{filename}"
            storage_path = os.path.join(uploads_dir, stored_name)
            file.save(storage_path)

            cursor.execute(
                """
                INSERT INTO job_documents (
                    job_posting_id, uploaded_by, document_type, original_filename,
                    stored_filename, content_type, size_bytes, storage_path
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    job_id,
                    current_user_id,
                    request.form.get('document_type'),
                    filename,
                    stored_name,
                    file.mimetype,
                    request.content_length or 0,
                    storage_path,
                ),
            )
            doc = dict(cursor.fetchone())
            conn.commit()
            # Do not expose full storage path
            doc['storage_path'] = None
            return jsonify({'success': True, 'data': doc}), 201
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error uploading job document: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to upload document'}), 500

@hr_job_posting_bp.route('/<job_id>/documents', methods=['GET'])
@jwt_required()
def list_job_documents(job_id):
    """List uploaded documents for a job posting"""
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(
                """
                SELECT jd.id, jd.document_type, jd.original_filename, jd.content_type, jd.size_bytes, jd.created_at
                FROM job_documents jd
                INNER JOIN job_postings jp ON jd.job_posting_id = jp.id
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jd.job_posting_id = %s AND hp.user_id = %s
                ORDER BY jd.created_at DESC
                """,
                (job_id, current_user_id),
            )
            docs = [dict(r) for r in cursor.fetchall()]
            return jsonify({'success': True, 'data': docs})
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error listing job documents: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to list documents'}), 500

@hr_job_posting_bp.route('/<job_id>/documents/<doc_id>', methods=['DELETE'])
@jwt_required()
def delete_job_document(job_id, doc_id):
    """Delete an uploaded document (removes DB record and file)"""
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(
                """
                SELECT jd.*
                FROM job_documents jd
                INNER JOIN job_postings jp ON jd.job_posting_id = jp.id
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jd.id = %s AND jd.job_posting_id = %s AND hp.user_id = %s
                """,
                (doc_id, job_id, current_user_id),
            )
            doc = cursor.fetchone()
            if not doc:
                return jsonify({'success': False, 'message': 'Document not found or access denied'}), 404
            # Delete DB record first
            cursor.execute("DELETE FROM job_documents WHERE id = %s", (doc_id,))
            conn.commit()
            # Attempt to remove file
            try:
                if doc.get('storage_path') and os.path.exists(doc['storage_path']):
                    os.remove(doc['storage_path'])
            except Exception:
                pass
            return jsonify({'success': True, 'message': 'Document deleted'})
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        logger.error(f"Error deleting job document: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to delete document'}), 500

@hr_job_posting_bp.route('/<job_id>', methods=['GET'])
@jwt_required()
def get_job_posting(job_id):
    """Get a specific job posting"""
    try:
        current_user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get job posting with company verification
            cursor.execute("""
                SELECT 
                    jp.*,
                    c.name as company_name,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    COUNT(ja.id) as application_count
                FROM job_postings jp
                LEFT JOIN companies c ON jp.company_id = c.id
                LEFT JOIN users u ON jp.created_by = u.id
                LEFT JOIN hr_profiles hp ON jp.company_id = hp.company_id
                LEFT JOIN job_applications ja ON jp.id::text = ja.job_id
                WHERE jp.id = %s AND hp.user_id = %s
                GROUP BY jp.id, c.name, u.first_name, u.last_name
            """, (job_id, current_user_id))
            
            job = cursor.fetchone()
            
            if not job:
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            job_data = dict(job)
            
            # Parse JSONB fields
            jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
            for field in jsonb_fields:
                if job_data.get(field):
                    try:
                        if isinstance(job_data[field], str):
                            job_data[field] = json.loads(job_data[field])
                    except (json.JSONDecodeError, TypeError):
                        job_data[field] = {}
            
            # Get detailed requirements
            cursor.execute("""
                SELECT * FROM job_requirements WHERE job_posting_id = %s ORDER BY requirement_type, requirement_name
            """, (job_id,))
            detailed_requirements = [dict(req) for req in cursor.fetchall()]
            
            # Get detailed benefits
            cursor.execute("""
                SELECT * FROM job_benefits WHERE job_posting_id = %s ORDER BY benefit_category, benefit_name
            """, (job_id,))
            detailed_benefits = [dict(benefit) for benefit in cursor.fetchall()]
            
            job_data['detailed_requirements'] = detailed_requirements
            job_data['detailed_benefits'] = detailed_benefits
            
            return jsonify({
                'success': True,
                'data': job_data
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting job posting: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job posting'
        }), 500

@hr_job_posting_bp.route('/<job_id>', methods=['PUT'])
@jwt_required()
def update_job_posting(job_id):
    """Update a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify ownership
            cursor.execute("""
                SELECT jp.id FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            # Run compliance check if content changed
            compliance_result = None
            if any(field in data for field in ['title', 'description', 'requirements']):
                compliance_result = UAEComplianceChecker.check_job_posting_compliance(data)
            
            # Prepare update data
            update_fields = []
            update_values = []
            
            updatable_fields = [
                'title', 'description', 'salary_range_min', 'salary_range_max',
                'currency', 'location', 'remote_work_allowed', 'employment_type',
                'experience_level', 'status', 'priority_level', 'emiratization_target',
                'visa_sponsorship_available'
            ]
            
            for field in updatable_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    update_values.append(data[field])
            
            # Handle JSONB fields
            jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
            for field in jsonb_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    update_values.append(json.dumps(data[field]))
            
            # Handle date fields
            date_fields = ['application_deadline', 'expires_at']
            for field in date_fields:
                if field in data and data[field]:
                    try:
                        date_value = datetime.strptime(data[field], '%Y-%m-%d').date()
                        update_fields.append(f"{field} = %s")
                        update_values.append(date_value)
                    except ValueError:
                        return jsonify({
                            'success': False,
                            'message': f'Invalid {field} format. Use YYYY-MM-DD'
                        }), 400
            
            if compliance_result:
                update_fields.append("uae_compliance_checked = %s")
                update_values.append(compliance_result['is_compliant'])
            
            if update_fields:
                update_values.append(job_id)
                
                cursor.execute(f"""
                    UPDATE job_postings 
                    SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING *
                """, update_values)
                
                updated_job = cursor.fetchone()
                conn.commit()
                
                # Parse JSONB fields for response
                job_result = dict(updated_job)
                jsonb_fields = ['requirements', 'responsibilities', 'benefits', 'tags', 'seo_keywords']
                for field in jsonb_fields:
                    if job_result.get(field):
                        try:
                            if isinstance(job_result[field], str):
                                job_result[field] = json.loads(job_result[field])
                        except (json.JSONDecodeError, TypeError):
                            job_result[field] = {}
                
                response_data = {'job_posting': job_result}
                if compliance_result:
                    response_data['compliance_check'] = compliance_result
                
                return jsonify({
                    'success': True,
                    'message': 'Job posting updated successfully',
                    'data': response_data
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'No valid fields to update'
                }), 400
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error updating job posting: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to update job posting'
        }), 500

@hr_job_posting_bp.route('/<job_id>/publish', methods=['POST'])
@jwt_required()
def publish_job_posting(job_id):
    """Publish a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Verify ownership and get job details
            cursor.execute("""
                SELECT jp.* FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            
            job = cursor.fetchone()
            if not job:
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            # Check if already published
            if job['status'] == 'published':
                return jsonify({
                    'success': False,
                    'message': 'Job posting is already published'
                }), 400
            
            # Run final compliance check
            job_data = dict(job)
            compliance_result = UAEComplianceChecker.check_job_posting_compliance(job_data)
            
            if not compliance_result['is_compliant']:
                return jsonify({
                    'success': False,
                    'message': 'Job posting cannot be published due to compliance issues',
                    'compliance_check': compliance_result
                }), 400
            
            # Set default expiry if not set (30 days from now)
            expires_at = job['expires_at']
            if not expires_at:
                expires_at = datetime.now().date() + timedelta(days=30)
            
            # Publish the job
            cursor.execute("""
                UPDATE job_postings 
                SET status = 'published', 
                    published_at = CURRENT_TIMESTAMP,
                    expires_at = %s,
                    uae_compliance_checked = true,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (expires_at, job_id))
            
            published_job = cursor.fetchone()
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Job posting published successfully',
                'data': {
                    'job_posting': dict(published_job),
                    'compliance_check': compliance_result,
                    'published_at': published_job['published_at'].isoformat(),
                    'expires_at': published_job['expires_at'].isoformat() if published_job['expires_at'] else None
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error publishing job posting: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to publish job posting'
        }), 500

@hr_job_posting_bp.route('/<job_id>/publish-and-match', methods=['POST'])
@jwt_required()
def publish_and_match(job_id):
    """Publish a job and return initial top-10 matching candidates"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403

        conn = get_db_connection(); cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            # Verify ownership and get job details
            cursor.execute("""
                SELECT jp.* FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            job = cursor.fetchone()
            if not job:
                return jsonify({'success': False, 'message': 'Job posting not found or access denied'}), 404

            # Publish if needed
            if job['status'] != 'published':
                expires_at = job['expires_at'] or (datetime.now().date() + timedelta(days=30))
                cursor.execute("""
                    UPDATE job_postings 
                    SET status = 'published', published_at = CURRENT_TIMESTAMP, expires_at = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s RETURNING *
                """, (expires_at, job_id))
                job = cursor.fetchone()
                conn.commit()

            # Build requirements for matching
            requirements = {}
            if job.get('requirements'):
                try:
                    requirements = json.loads(job['requirements']) if isinstance(job['requirements'], str) else job['requirements']
                except (json.JSONDecodeError, TypeError):
                    requirements = {}
            job_requirements = {
                'min_experience': (requirements or {}).get('min_experience', 0),
                'education_level': (requirements or {}).get('education_level', ''),
                'skills': (requirements or {}).get('skills', []),
                'location': job.get('location', ''),
                'salary_max': job.get('salary_range_max', 0)
            }

            # Fetch active candidates
            cursor.execute("""
                SELECT 
                    u.id, u.first_name, u.last_name, u.email, u.emirate, u.education_level,
                    u.experience_years, u.preferred_salary_min, u.preferred_salary_max,
                    u.preferred_location, u.is_uae_national, u.skills, u.last_login
                FROM users u
                WHERE u.role = 'candidate' AND u.is_active = true
                LIMIT 500
            """)
            candidates = [dict(r) for r in cursor.fetchall()]

            from hr_candidate_search_routes import CandidateSearchEngine
            matched = []
            for c in candidates:
                # Parse skills from Postgres array text if needed
                if c.get('skills') and isinstance(c['skills'], str):
                    skills_str = c['skills'].strip('{}')
                    c['skills'] = [s.strip('"') for s in skills_str.split(',') if s.strip()]
                # Calculate match score using existing engine
                score = CandidateSearchEngine.calculate_match_score(c, job_requirements)
                matched.append({
                    'candidate_id': c['id'],
                    'first_name': c.get('first_name'),
                    'last_name': c.get('last_name'),
                    'match_score': score
                })
            # Sort and take top 10
            matched.sort(key=lambda m: m['match_score']['match_percentage'], reverse=True)
            top10 = matched[:10]

            return jsonify({'success': True, 'data': {'job_posting': {'id': job['id'], 'title': job['title']}, 'top_matches': top10}})
        finally:
            cursor.close(); conn.close()
    except Exception as e:
        logger.error(f"Error publish-and-match: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to publish and match'}), 500

@hr_job_posting_bp.route('/<job_id>/compliance-check', methods=['POST'])
@jwt_required()
def check_compliance(job_id):
    """Run UAE compliance check on a job posting"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get job posting
            cursor.execute("""
                SELECT jp.* FROM job_postings jp
                INNER JOIN hr_profiles hp ON jp.company_id = hp.company_id
                WHERE jp.id = %s AND hp.user_id = %s
            """, (job_id, current_user_id))
            
            job = cursor.fetchone()
            if not job:
                return jsonify({
                    'success': False,
                    'message': 'Job posting not found or access denied'
                }), 404
            
            # Run compliance check
            job_data = dict(job)
            compliance_result = UAEComplianceChecker.check_job_posting_compliance(job_data)
            
            # Update compliance status in database
            cursor.execute("""
                UPDATE job_postings 
                SET uae_compliance_checked = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (compliance_result['is_compliant'], job_id))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Compliance check completed',
                'data': compliance_result
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error checking compliance: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to check compliance'
        }), 500

@hr_job_posting_bp.route('/templates', methods=['GET'])
@jwt_required()
def get_job_templates():
    """Get job templates for the company"""
    try:
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        if claims and claims.get('role') not in ('hr_recruiter', 'admin'):
            return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            # Get company templates and public templates
            cursor.execute("""
                SELECT 
                    jt.*,
                    u.first_name || ' ' || u.last_name as created_by_name,
                    CASE WHEN jt.company_id = hp.company_id THEN 'company' ELSE 'public' END as template_source
                FROM job_templates jt
                LEFT JOIN users u ON jt.created_by = u.id
                LEFT JOIN hr_profiles hp ON jt.company_id = hp.company_id OR jt.is_public = true
                WHERE hp.user_id = %s
                ORDER BY template_source, jt.usage_count DESC, jt.created_at DESC
            """, (current_user_id,))
            
            templates = cursor.fetchall()
            
            # Parse JSONB fields
            templates_data = []
            for template in templates:
                template_data = dict(template)
                
                jsonb_fields = ['requirements_template', 'responsibilities_template', 'benefits_template']
                for field in jsonb_fields:
                    if template_data.get(field):
                        try:
                            if isinstance(template_data[field], str):
                                template_data[field] = json.loads(template_data[field])
                        except (json.JSONDecodeError, TypeError):
                            template_data[field] = {}
                
                templates_data.append(template_data)
            
            return jsonify({
                'success': True,
                'data': {
                    'templates': templates_data,
                    'total_count': len(templates_data)
                }
            })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        logger.error(f"Error getting job templates: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to retrieve job templates'
        }), 500
