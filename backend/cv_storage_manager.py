#!/usr/bin/env python3
"""
CV Storage and Management System (PostgreSQL Pro)
Emirati Journey Platform - Unified CV handling
"""

import os
import json
import logging
import psycopg2
import psycopg2.extras
import uuid
from datetime import datetime, timedelta
from contextlib import contextmanager
from typing import Dict, List, Optional, Any
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CVStorageManager:
    """Manages CV storage, retrieval, and lifecycle using PostgreSQL"""
    
    def __init__(self):
        """Initialize CV storage manager"""
        self.db_config = {
            'dbname': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', 5432)
        }
        
        # storage_dir logic remains if we are storing physical files, 
        # but pure DB operations don't strictly need it unless 'store_cv' handles file I/O.
        # The previous code initialized it, so we keep it for safety.
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, 'data')
        self.storage_dir = Path(os.getenv('CV_STORAGE_DIR', os.path.join(data_dir, 'cv_files')))
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info("✅ CV Storage Manager initialized (PostgreSQL Backend)")
    
    @contextmanager
    def _get_db_connection(self):
        """Get database connection with context manager"""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            yield conn
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if conn:
                conn.close()

    def store_cv(self, cv_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Store CV data and metadata"""
        try:
            cv_id = cv_data.get('cv_id') or str(uuid.uuid4())
            
            # Prepare data for storage
            # Postgres JSONB accepts string dump or dict (if using adapter).
            # We'll dump to string to be safe and consistent with previous behavior.
            parsed_data = json.dumps(cv_data.get('data', {}))
            analysis_results = json.dumps(cv_data.get('analysis', {}))
            file_info = cv_data.get('file_info', {})
            
            with self._get_db_connection() as conn:
                # Use RealDictCursor to check existence
                check_cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                check_cur.execute(
                    'SELECT id FROM user_cvs WHERE id = %s',
                    (cv_id,)
                )
                existing = check_cur.fetchone()
                check_cur.close()
                
                cur = conn.cursor()
                if existing:
                    # Update existing record
                    # We update both the specific columns and the main JSON/Status columns
                    cur.execute('''
                        UPDATE user_cvs 
                        SET parsed_data = %s, 
                            analysis_results = %s, 
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (parsed_data, analysis_results, cv_id))
                    
                    # Create new version
                    version_number = self._get_next_version_number(conn, cv_id)
                    version_id = str(uuid.uuid4())
                    
                    cur.execute('''
                        INSERT INTO cv_versions 
                        (id, cv_id, version_number, parsed_data, analysis_results, created_at)
                        VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ''', (version_id, cv_id, version_number, parsed_data, analysis_results))
                    
                else:
                    # Insert new record using the unified user_cvs table
                    # We default stats to Active
                    cur.execute('''
                        INSERT INTO user_cvs 
                        (id, user_id, filename, file_size, file_type, mime_type, 
                         upload_timestamp, parsed_data, analysis_results, last_accessed_at,
                         status, is_visible, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, 
                                'active', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ''', (
                        cv_id, user_id,
                        file_info.get('original_filename'),
                        file_info.get('file_size'),
                        file_info.get('file_type'),
                        file_info.get('mime_type'),
                        file_info.get('upload_timestamp', datetime.utcnow().isoformat()),
                        parsed_data, analysis_results
                    ))
                
                # Log analytics event
                self._log_analytics_event(cur, cv_id, user_id, 'cv_stored', {
                    'file_size': file_info.get('file_size'),
                    'file_type': file_info.get('file_type')
                })
                
                conn.commit()
                cur.close()
            
            logger.info(f"✅ CV {cv_id} stored successfully for user {user_id}")
            return {
                'success': True,
                'cv_id': cv_id,
                'message': 'CV stored successfully'
            }
            
        except Exception as e:
            logger.error(f"CV storage error: {str(e)}")
            return {
                'success': False,
                'message': f'Storage failed: {str(e)}'
            }
    
    def get_cv(self, cv_id: str, user_id: str = None) -> Dict[str, Any]:
        """Retrieve CV data by ID"""
        try:
            with self._get_db_connection() as conn:
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                
                query = 'SELECT * FROM user_cvs WHERE id = %s'
                params = [cv_id]
                
                if user_id:
                    query += ' AND user_id = %s'
                    params.append(user_id)
                
                cur.execute(query, params)
                cv_record = cur.fetchone()
                
                if not cv_record:
                    return {
                        'success': False,
                        'message': 'CV not found'
                    }
                
                # Check status
                if cv_record.get('status') == 'deleted':
                     return {
                        'success': False,
                        'message': 'CV has been deleted'
                    }
                
                # Update access stats
                update_cur = conn.cursor()
                update_cur.execute('''
                    UPDATE user_cvs 
                    SET last_accessed_at = CURRENT_TIMESTAMP, 
                        access_count = COALESCE(access_count, 0) + 1
                    WHERE id = %s
                ''', (cv_id,))
                
                # Log analytics
                self._log_analytics_event(update_cur, cv_id, str(cv_record['user_id']), 'cv_accessed', {})
                conn.commit()
                update_cur.close()
                
                # Prepare response
                result = {
                    'success': True,
                    'cv_id': str(cv_record['id']),
                    'user_id': str(cv_record['user_id']),
                    'metadata': {
                        'filename': cv_record.get('filename'),
                        'file_size': cv_record.get('file_size'),
                        'file_type': cv_record.get('file_type'),
                        'mime_type': cv_record.get('mime_type'),
                        'upload_timestamp': str(cv_record.get('upload_timestamp')),
                        'last_accessed': str(cv_record.get('last_accessed_at')),
                        'access_count': cv_record.get('access_count', 0),
                        'status': cv_record.get('status')
                    }
                }
                
                # Parse JSON Data if string, or use directly if dict (psycopg2 auto-converts JSONB)
                p_data = cv_record.get('parsed_data')
                a_results = cv_record.get('analysis_results')
                
                if p_data:
                    result['data'] = json.loads(p_data) if isinstance(p_data, str) else p_data
                
                if a_results:
                    result['analysis'] = json.loads(a_results) if isinstance(a_results, str) else a_results
                
                cur.close()
                return result
                
        except Exception as e:
            logger.error(f"CV retrieval error: {str(e)}")
            return {
                'success': False,
                'message': f'Retrieval failed: {str(e)}'
            }

    def set_cv_visibility(self, cv_id: str, user_id: str, is_visible: bool) -> Dict[str, Any]:
        """Set CV visibility"""
        try:
            with self._get_db_connection() as conn:
                cur = conn.cursor()
                
                # Check ownership
                cur.execute('SELECT id FROM user_cvs WHERE id = %s AND user_id = %s', (cv_id, user_id))
                if not cur.fetchone():
                    return {'success': False, 'message': 'CV not found or access denied'}

                if is_visible:
                    # Mutual exclusivity
                    cur.execute('UPDATE user_cvs SET is_visible = false WHERE user_id = %s', (user_id,))
                
                cur.execute(
                    'UPDATE user_cvs SET is_visible = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s',
                    (is_visible, cv_id)
                )
                conn.commit()
                cur.close()
                
                return {
                    'success': True,
                    'message': f'CV visibility set to {is_visible}'
                }

        except Exception as e:
            logger.error(f"Visibility update error: {str(e)}")
            return {'success': False, 'message': str(e)}

    def get_user_cvs(self, user_id: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get all CVs for a user"""
        try:
            with self._get_db_connection() as conn:
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                
                # Count
                cur.execute(
                    "SELECT COUNT(*) as count FROM user_cvs WHERE user_id = %s AND status = 'active'",
                    (user_id,)
                )
                total_count = cur.fetchone()['count']
                
                # Fetch
                cur.execute('''
                    SELECT id as cv_id, filename, file_size, file_type, upload_timestamp, 
                           last_accessed_at as last_accessed, access_count, status, is_visible, updated_at
                    FROM user_cvs 
                    WHERE user_id = %s AND status = 'active'
                    ORDER BY upload_timestamp DESC
                    LIMIT %s OFFSET %s
                ''', (user_id, limit, offset))
                
                cvs = cur.fetchall()
                cur.close()
                
                cv_list = []
                for cv in cvs:
                    cv_list.append({
                        'cv_id': str(cv['cv_id']), # Ensure string UUID
                        'filename': cv['filename'],
                        'file_size': cv['file_size'],
                        'file_type': cv['file_type'],
                        'upload_timestamp': str(cv['upload_timestamp']),
                        'last_accessed': str(cv['last_accessed']),
                        'access_count': cv['access_count'],
                        'status': cv['status'],
                        'is_visible': cv['is_visible'],
                        'updated_at': str(cv['updated_at'])
                    })
                
                return {
                    'success': True,
                    'cvs': cv_list,
                    'total_count': total_count,
                    'limit': limit,
                    'offset': offset,
                    'has_more': (offset + limit) < total_count
                }
                
        except Exception as e:
            logger.error(f"User CVs retrieval error: {str(e)}")
            return {'success': False, 'message': str(e)}

    def delete_cv(self, cv_id: str, user_id: str) -> Dict[str, Any]:
        """Soft delete a CV"""
        try:
            with self._get_db_connection() as conn:
                cur = conn.cursor()
                
                cur.execute('SELECT id FROM user_cvs WHERE id = %s AND user_id = %s', (cv_id, user_id))
                if not cur.fetchone():
                    return {'success': False, 'message': 'CV not found'}
                
                cur.execute('''
                    UPDATE user_cvs SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = %s
                ''', (cv_id,))
                
                self._log_analytics_event(cur, cv_id, user_id, 'cv_deleted', {})
                conn.commit()
                cur.close()
                return {'success': True, 'message': 'CV deleted successfully'}
                
        except Exception as e:
            logger.error(f"CV deletion error: {str(e)}")
            return {'success': False, 'message': str(e)}

    def cleanup_old_cvs(self, days_old: int = 90) -> Dict[str, Any]:
        """Clean up old inactive CVs"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            with self._get_db_connection() as conn:
                cur = conn.cursor()
                
                # Fetch old IDs
                cur.execute('''
                    SELECT id FROM user_cvs 
                    WHERE status = 'deleted' AND updated_at < %s
                ''', (cutoff_date,))
                rows = cur.fetchall()
                
                deleted_count = 0
                if rows:
                    ids = [row[0] for row in rows]
                    # Convert UUIDs to strings for reporting, though Postgres handles UUID objects fine
                    
                    # Batch delete dependencies
                    # Depending on CASCADE settings in DB, manual deletion might be redundant, but safer.
                    # user_cvs usually cascades, but we check.
                    
                    # Cast tuple to string for logging / debugging
                    # Using individual deletes or WHERE IN with tuple
                    
                    # NOTE: psycopg2 tuple handling for IN clause requires tuple(ids)
                    if len(ids) == 1:
                        params = (ids[0],)
                    else:
                        params = tuple(ids)
                    
                    cur.execute(f"DELETE FROM cv_versions WHERE cv_id IN %s", (params,))
                    cur.execute(f"DELETE FROM cv_usage_logs WHERE cv_id IN %s", (params,))
                    cur.execute(f"DELETE FROM user_cvs WHERE id IN %s", (params,))
                    deleted_count = len(ids)
                
                conn.commit()
                cur.close()
                return {
                    'success': True, 
                    'deleted_count': deleted_count,
                    'message': f'Cleaned up {deleted_count} old CVs'
                }
        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}")
            return {'success': False, 'message': str(e)}

    def _get_next_version_number(self, conn, cv_id: str) -> int:
        cur = conn.cursor()
        cur.execute(
            'SELECT MAX(version_number) as max_version FROM cv_versions WHERE cv_id = %s',
            (cv_id,)
        )
        res = cur.fetchone()[0]
        cur.close()
        return (res or 0) + 1
    
    def _log_analytics_event(self, cursor, cv_id: str, user_id: str, event_type: str, event_data: Dict):
        try:
            analytics_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO cv_usage_logs 
                (id, cv_id, user_id, event_type, event_data, timestamp)
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ''', (analytics_id, cv_id, str(user_id), event_type, json.dumps(event_data)))
        except Exception as e:
            logger.error(f"Analytics logging error: {str(e)}")

    def get_cv_analytics(self, cv_id: str, user_id: str = None) -> Dict[str, Any]:
        """Get analytics for a CV"""
        try:
            with self._get_db_connection() as conn:
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                query = '''
                    SELECT event_type, COUNT(*) as count, 
                           MIN(timestamp) as first_event, 
                           MAX(timestamp) as last_event
                    FROM cv_usage_logs 
                    WHERE cv_id = %s
                '''
                params = [cv_id]
                
                if user_id:
                    query += ' AND user_id = %s'
                    params.append(str(user_id))
                
                query += ' GROUP BY event_type ORDER BY count DESC'
                
                cur.execute(query, params)
                analytics = cur.fetchall()
                cur.close()
                
                analytics_data = []
                for row in analytics:
                    analytics_data.append({
                        'event_type': row['event_type'],
                        'count': row['count'],
                        'first_event': str(row['first_event']),
                        'last_event': str(row['last_event'])
                    })
                
                return {
                    'success': True,
                    'cv_id': cv_id,
                    'analytics': analytics_data
                }
                
        except Exception as e:
            logger.error(f"Analytics retrieval error: {str(e)}")
            return {'success': False, 'message': str(e)}

    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        try:
            with self._get_db_connection() as conn:
                cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                cur.execute('''
                    SELECT 
                        COUNT(*) as total_cvs,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cvs,
                        COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted_cvs,
                        AVG(file_size) as avg_file_size,
                        SUM(file_size) as total_storage,
                        COUNT(DISTINCT user_id) as unique_users
                    FROM user_cvs
                ''')
                stats = cur.fetchone()
                
                # Debug: Fetch latest records to verify content
                cur.execute('''
                    SELECT id as cv_id, user_id, filename, status, is_visible 
                    FROM user_cvs 
                    ORDER BY created_at DESC 
                    LIMIT 10
                ''')
                latest_records = cur.fetchall()
                cur.close()
                
                debug_records = []
                for r in latest_records:
                    debug_records.append({
                        'cv_id': str(r['cv_id']),
                        'user_id': str(r['user_id']),
                        'filename': r['filename'],
                        'status': r['status'],
                        'is_visible': r['is_visible']
                    })

                return {
                    'success': True,
                    'debug_records': debug_records,
                    'stats': {
                        'total_cvs': stats['total_cvs'],
                        'active_cvs': stats['active_cvs'],
                        'deleted_cvs': stats['deleted_cvs'],
                        'avg_file_size': float(stats['avg_file_size']) if stats['avg_file_size'] else 0,
                        'total_storage': int(stats['total_storage']) if stats['total_storage'] else 0,
                        'unique_users': stats['unique_users']
                    }
                }
                
        except Exception as e:
            logger.error(f"Stats retrieval error: {str(e)}")
            return {'success': False, 'message': str(e)}

# Export singleton instance
cv_storage_manager = CVStorageManager()
