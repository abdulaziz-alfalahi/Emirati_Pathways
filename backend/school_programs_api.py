#!/usr/bin/env python3
"""
School Programs API Server
Connects React frontend to PostgreSQL database
Provides RESTful endpoints for school programs functionality
"""

from flask import Flask, jsonify, request, g
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE_CONFIG = {
    'host': 'localhost',
    'database': 'emirati_journey',
    'user': 'emirati_user',
    'password': 'emirati_secure_password',
    'port': 5432
}

def get_db():
    """Get database connection"""
    if 'db' not in g:
        try:
            g.db = psycopg2.connect(**DATABASE_CONFIG)
        except psycopg2.Error as e:
            print(f"Database connection error: {e}")
            return None
    return g.db

def close_db(e=None):
    """Close database connection"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db(error):
    close_db()

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """Execute database query with error handling"""
    try:
        db = get_db()
        if not db:
            return None
            
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query, params)
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = None
            
        db.commit()
        cursor.close()
        return result
    except psycopg2.Error as e:
        print(f"Database query error: {e}")
        if db:
            db.rollback()
        return None

# API Endpoints

@app.route('/api/school-programs', methods=['GET'])
def get_school_programs():
    """Get all school programs with filtering and search"""
    try:
        # Get query parameters
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        status = request.args.get('status', 'published')
        featured = request.args.get('featured', '')
        
        # Build query
        query = """
            SELECT 
                sp.*,
                s.name_en as school_name_en,
                s.name_ar as school_name_ar,
                s.location as school_location,
                s.khda_rating,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'name', pt.tag_name,
                            'type', pt.tag_type
                        )
                    ) FILTER (WHERE pt.tag_name IS NOT NULL), 
                    '[]'::json
                ) as tags
            FROM school_programs sp
            JOIN schools s ON sp.school_id = s.id
            LEFT JOIN program_tags pt ON sp.id = pt.program_id
            WHERE 1=1
        """
        
        params = []
        param_count = 1
        
        if search:
            query += f" AND (sp.title_en ILIKE ${param_count} OR sp.description_en ILIKE ${param_count})"
            params.append(f'%{search}%')
            param_count += 1
            
        if category:
            query += f" AND sp.category = ${param_count}"
            params.append(category)
            param_count += 1
            
        if status:
            query += f" AND sp.status = ${param_count}"
            params.append(status)
            param_count += 1
            
        if featured:
            query += f" AND sp.featured = ${param_count}"
            params.append(featured.lower() == 'true')
            param_count += 1
            
        query += " GROUP BY sp.id, s.name_en, s.name_ar, s.location, s.khda_rating ORDER BY sp.created_at DESC"
        
        programs = execute_query(query, params)
        
        if programs is None:
            return jsonify({'error': 'Database error'}), 500
            
        # Convert to JSON-serializable format
        result = []
        for program in programs:
            program_dict = dict(program)
            # Convert dates to ISO format
            for date_field in ['created_at', 'updated_at', 'start_date', 'end_date', 'application_deadline']:
                if program_dict.get(date_field):
                    if isinstance(program_dict[date_field], datetime):
                        program_dict[date_field] = program_dict[date_field].isoformat()
            
            # Ensure arrays are properly formatted
            for array_field in ['requirements', 'learning_outcomes', 'assessment_methods', 'language_of_instruction', 'schedule_days', 'equipment_provided', 'prerequisites', 'image_urls', 'video_urls']:
                if program_dict.get(array_field) is None:
                    program_dict[array_field] = []
                    
            result.append(program_dict)
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_school_programs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/school-programs/<program_id>', methods=['GET'])
def get_school_program(program_id):
    """Get single school program by ID"""
    try:
        query = """
            SELECT 
                sp.*,
                s.name_en as school_name_en,
                s.name_ar as school_name_ar,
                s.location as school_location,
                s.contact_email as school_email,
                s.contact_phone as school_phone,
                s.website_url as school_website,
                s.khda_rating
            FROM school_programs sp
            JOIN schools s ON sp.school_id = s.id
            WHERE sp.id = %s
        """
        
        program = execute_query(query, (program_id,), fetch_one=True)
        
        if not program:
            return jsonify({'error': 'Program not found'}), 404
            
        # Get program tags
        tags_query = "SELECT tag_name, tag_type FROM program_tags WHERE program_id = %s"
        tags = execute_query(tags_query, (program_id,))
        
        # Get success metrics
        metrics_query = "SELECT * FROM program_success_metrics WHERE program_id = %s"
        metrics = execute_query(metrics_query, (program_id,), fetch_one=True)
        
        result = dict(program)
        result['tags'] = [dict(tag) for tag in (tags or [])]
        result['success_metrics'] = dict(metrics) if metrics else None
        
        # Convert dates to ISO format
        for date_field in ['created_at', 'updated_at', 'start_date', 'end_date', 'application_deadline']:
            if result.get(date_field):
                if isinstance(result[date_field], datetime):
                    result[date_field] = result[date_field].isoformat()
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_school_program: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/school-programs/categories', methods=['GET'])
def get_program_categories():
    """Get all program categories"""
    try:
        query = "SELECT * FROM program_categories ORDER BY name_en"
        categories = execute_query(query)
        
        if categories is None:
            return jsonify({'error': 'Database error'}), 500
            
        return jsonify([dict(cat) for cat in categories])
        
    except Exception as e:
        print(f"Error in get_program_categories: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/schools', methods=['GET'])
def get_schools():
    """Get all schools"""
    try:
        query = "SELECT * FROM schools WHERE is_active = true ORDER BY name_en"
        schools = execute_query(query)
        
        if schools is None:
            return jsonify({'error': 'Database error'}), 500
            
        result = []
        for school in schools:
            school_dict = dict(school)
            # Convert dates to ISO format
            for date_field in ['created_at', 'updated_at']:
                if school_dict.get(date_field):
                    if isinstance(school_dict[date_field], datetime):
                        school_dict[date_field] = school_dict[date_field].isoformat()
            result.append(school_dict)
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_schools: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/school-programs', methods=['GET'])
def get_admin_school_programs():
    """Get all school programs for admin interface"""
    try:
        query = """
            SELECT 
                sp.*,
                s.name_en as school_name_en,
                s.name_ar as school_name_ar,
                u1.full_name as created_by_name,
                u2.full_name as last_modified_by_name
            FROM school_programs sp
            JOIN schools s ON sp.school_id = s.id
            LEFT JOIN users u1 ON sp.created_by = u1.id
            LEFT JOIN users u2 ON sp.last_modified_by = u2.id
            ORDER BY sp.created_at DESC
        """
        
        programs = execute_query(query)
        
        if programs is None:
            return jsonify({'error': 'Database error'}), 500
            
        result = []
        for program in programs:
            program_dict = dict(program)
            # Convert dates to ISO format
            for date_field in ['created_at', 'updated_at', 'start_date', 'end_date', 'application_deadline']:
                if program_dict.get(date_field):
                    if isinstance(program_dict[date_field], datetime):
                        program_dict[date_field] = program_dict[date_field].isoformat()
            result.append(program_dict)
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_admin_school_programs: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for admin interface"""
    try:
        # Get total programs
        total_query = "SELECT COUNT(*) as total FROM school_programs"
        total_result = execute_query(total_query, fetch_one=True)
        total_programs = total_result['total'] if total_result else 0
        
        # Get published programs
        published_query = "SELECT COUNT(*) as published FROM school_programs WHERE status = 'published'"
        published_result = execute_query(published_query, fetch_one=True)
        published_programs = published_result['published'] if published_result else 0
        
        # Get pending reviews
        pending_query = "SELECT COUNT(*) as pending FROM school_programs WHERE status = 'under_review'"
        pending_result = execute_query(pending_query, fetch_one=True)
        pending_reviews = pending_result['pending'] if pending_result else 0
        
        # Calculate approval rate
        approval_rate = (published_programs / total_programs * 100) if total_programs > 0 else 0
        
        stats = {
            'totalPrograms': total_programs,
            'publishedPrograms': published_programs,
            'pendingReviews': pending_reviews,
            'approvalRate': round(approval_rate, 1),
            'averageApprovalTime': '18 days'  # This would need more complex calculation
        }
        
        return jsonify(stats)
        
    except Exception as e:
        print(f"Error in get_dashboard_stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/school-programs', methods=['POST'])
def create_school_program():
    """Create a new school program"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Validate required fields
        required_fields = ['title_en', 'school_id', 'category', 'description_en']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Insert new program
        insert_query = """
            INSERT INTO school_programs (
                title_en, title_ar, school_id, category, status,
                description_en, description_ar, target_age_min, target_age_max,
                capacity_total, capacity_available, fees_amount, fees_currency,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id
        """
        
        params = (
            data['title_en'],
            data.get('title_ar', data['title_en']),  # Fallback to English
            data['school_id'],
            data['category'],
            data.get('status', 'draft'),
            data['description_en'],
            data.get('description_ar', data['description_en']),  # Fallback to English
            data.get('target_age_min', 5),
            data.get('target_age_max', 18),
            data.get('capacity_total', 50),
            data.get('capacity_available', data.get('capacity_total', 50)),
            data.get('fees_amount', 0),
            data.get('fees_currency', 'AED')
        )
        
        result = execute_query(insert_query, params, fetch_one=True)
        
        if not result:
            return jsonify({'error': 'Failed to create program'}), 500
            
        program_id = result['id']
        
        # Create success metrics record
        metrics_query = """
            INSERT INTO program_success_metrics (
                program_id, completion_rate, satisfaction_rating, 
                employment_rate, skill_improvement_score, created_at
            ) VALUES (%s, 0, 0, 0, 0, CURRENT_TIMESTAMP)
        """
        execute_query(metrics_query, (program_id,))
        
        return jsonify({
            'message': 'Program created successfully',
            'program_id': program_id
        }), 201
        
    except Exception as e:
        print(f"Error in create_school_program: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/schools', methods=['GET'])
def get_schools():
    """Get list of schools for dropdowns"""
    try:
        query = "SELECT id, name_en, name_ar, location FROM schools WHERE is_active = true ORDER BY name_en"
        schools = execute_query(query)
        
        if schools is None:
            return jsonify({'error': 'Database error'}), 500
            
        result = [dict(school) for school in schools]
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_schools: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        db = get_db()
        if db:
            return jsonify({'status': 'healthy', 'database': 'connected'})
        else:
            return jsonify({'status': 'unhealthy', 'database': 'disconnected'}), 500
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting School Programs API Server...")
    print(f"Database: {DATABASE_CONFIG['database']} on {DATABASE_CONFIG['host']}")
    app.run(debug=True, host='0.0.0.0', port=5001)
