from flask import Blueprint, jsonify, request
import logging
from datetime import datetime
import psycopg2
import psycopg2.extras
import os

from backend.db import get_db_connection

student_bp = Blueprint('student_bp', __name__)
logger = logging.getLogger(__name__)

from flask_jwt_extended import jwt_required, get_jwt_identity

@student_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_student_stats():
    """Get statistics for student dashboard"""
    try:
        # Get user ID directly from JWT
        user_id = str(get_jwt_identity())
        raw_user_id = user_id # Keep for CV storage legacy check if needed
        
        logger.info(f"Dashboard Stats: Fetching for {user_id}")

        # Robust CV manager import
        try:
             from backend.cv_storage_manager import cv_storage_manager
        except ImportError:
             import sys
             sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
             try:
                 from cv_storage_manager import cv_storage_manager
             except ImportError:
                 # Mock to prevent crash
                 class cv_storage_manager:
                     @staticmethod
                     def get_user_cvs(uid): return {'total_count': 0}

        # Default data structure
        stats_data = {
            'success': True,
            'data': {
                'profile': {
                    'name': 'Job Seeker',
                    'completionPercentage': 0,
                    'cvUploaded': False,
                    'ats_score': 0
                },
                'stats': {
                    'applications_submitted': 0,
                    'upcoming_interviews': 0,
                    'profile_views': 0,
                    'saved_programs': 0
                }
            }
        }
        
        if not user_id:
            return jsonify(stats_data)
            
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                
                # 1. Fetch User Name and Photo
                # Try profiles table first (v2), then users table
                cursor.execute("""
                    SELECT full_name, profile_photo_url FROM candidate_profiles WHERE user_id = %s
                """, (user_id,))
                profile = cursor.fetchone()
                
                full_name = "Job Seeker"
                photo_url = None
                
                if profile:
                    if profile.get('full_name'):
                        full_name = profile['full_name']
                    if profile.get('profile_photo_url'):
                        photo_url = profile['profile_photo_url']
                else:
                    # Fallback to users table - fetch first/last name
                    cursor.execute("SELECT first_name, last_name FROM users WHERE id = %s", (user_id,))
                    user = cursor.fetchone()
                    if user:
                        f_name = user.get('first_name', '') or ''
                        l_name = user.get('last_name', '') or ''
                        full_name = f"{f_name} {l_name}".strip() or "Job Seeker"
                
                # 2. Check CV Status (Use Storage Manager - SQLite)
                # Fetch using raw_user_id as stored in SQLite
                cv_data = cv_storage_manager.get_user_cvs(raw_user_id)
                cv_count = cv_data.get('total_count', 0)
                
                # 3. Calculate Mock Stats (for now, until real systems are connected)
                # Ensure we at least show some profile views if they have activity
                # NOTE: job_applications table uses 'candidate_id' which maps to the user's UUID
                cursor.execute("SELECT COUNT(*) as count FROM job_applications WHERE candidate_id = %s", (user_id,))
                app_count = cursor.fetchone()['count']
                
                # ATS Score Calculation (Mock based on profile data existence)
                # In future: Fetch from user_cv_analysis table
                ats_score = 0
                if cv_count > 0:
                    ats_score = 65 + (app_count * 2) # Base score + activity bonus
                    if ats_score > 95: ats_score = 95
                
                stats_data['data']['profile']['name'] = full_name
                if photo_url:
                    stats_data['data']['profile']['profile_photo_url'] = photo_url
                stats_data['data']['profile']['cvUploaded'] = cv_count > 0
                stats_data['data']['profile']['ats_score'] = ats_score
                # Completion percentage logic (simplified)
                stats_data['data']['profile']['completionPercentage'] = 40 + (20 if cv_count > 0 else 0) + (10 if app_count > 0 else 0)
                
                stats_data['data']['stats']['applications_submitted'] = app_count
                stats_data['data']['stats']['profile_views'] = 12 + (app_count * 3) # Mock engagement
                
                return jsonify(stats_data)
                
            except Exception as e:
                logger.error(f"Error fetching real dashboard stats: {e}")
                # Fallback to defaults on partial error
                return jsonify(stats_data)
            finally:
                conn.close()
        
        return jsonify(stats_data)

    except Exception as e:
        logger.error(f"Dashboard Stats Fatal Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@student_bp.route('/programs', methods=['GET'])
def get_student_programs():
    """Get scholarships, programs, and internships"""
    program_type = request.args.get('type', 'all')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Fetch Scholarships
        cursor.execute("SELECT * FROM scholarships WHERE is_active = TRUE")
        scholarships = cursor.fetchall()
        
        # Serialize scholarships (handle dates)
        serialized_scholarships = []
        for s in scholarships:
            s_dict = dict(s)
            if s_dict.get('deadline'):
                s_dict['deadline'] = str(s_dict['deadline'])
            if s_dict.get('created_at'):
                s_dict['created_at'] = str(s_dict['created_at'])
            serialized_scholarships.append(s_dict)
        
        # Fetch Camps/Programs
        cursor.execute("SELECT * FROM educational_programs WHERE is_active = TRUE")
        camps = cursor.fetchall()
        
        # Serialize camps (handle dates)
        serialized_camps = []
        for c in camps:
            c_dict = dict(c)
            date_fields = ['start_date', 'end_date', 'application_deadline', 'created_at']
            for field in date_fields:
                if c_dict.get(field):
                    c_dict[field] = str(c_dict[field])
            serialized_camps.append(c_dict)
        
        # Fetch Internships (from Job Postings)
        cursor.execute("""
            SELECT j.id, j.title as job_title, c.name as organization, j.location, 
                   j.employment_type, j.salary_range_min, j.salary_range_max, 
                   j.posted_date as date
            FROM job_postings j
            LEFT JOIN companies c ON j.company_id = c.id::text
            WHERE j.employment_type ILIKE '%internship%' 
               OR j.employment_type ILIKE '%summer%'
               OR j.title ILIKE '%intern%'
        """)
        internships = cursor.fetchall()
        
        # Format Internships
        formatted_internships = []
        for i in internships:
            formatted_internships.append({
                'id': i['id'],
                'title': i['job_title'],
                'organizer': i['organization'] or 'Unknown Company', 
                'location': i['location'],
                'type': 'Internship',
                'date': str(i['date']) if i['date'] else None
            })
            
        data = {
            'scholarships': serialized_scholarships,
            'camps': serialized_camps,
            'internships': formatted_internships
        }
        
        if program_type == 'scholarship':
            return jsonify({'success': True, 'data': serialized_scholarships})
        elif program_type == 'camp':
            return jsonify({'success': True, 'data': serialized_camps})
        elif program_type == 'internship':
            return jsonify({'success': True, 'data': formatted_internships})
            
        return jsonify({'success': True, 'data': data})
        
    except Exception as e:
        logger.error(f"Error fetching programs: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        pass # connection closed in get_db_connection?? No, we created it here. 
        # Wait, get_db_connection returns a new connection each time.
        if conn:
            conn.close()
