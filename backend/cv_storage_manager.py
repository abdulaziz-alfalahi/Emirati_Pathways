#!/usr/bin/env python3
"""
CV Storage and Management System
Emirati Journey Platform - Enhanced CV handling with database integration
"""

import os
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import sqlite3
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CVStorageManager:
    """Manages CV storage, retrieval, and lifecycle"""
    
    def __init__(self, db_path: str = None):
        """Initialize CV storage manager"""
        self.db_path = db_path or os.getenv('CV_DB_PATH', '/tmp/cv_storage.db')
        self.storage_dir = Path(os.getenv('CV_STORAGE_DIR', '/tmp/cv_storage'))
        self.storage_dir.mkdir(exist_ok=True)
        
        # Initialize database
        self._init_database()
        logger.info("✅ CV Storage Manager initialized")
    
    def _init_database(self):
        """Initialize SQLite database for CV metadata"""
        try:
            with self._get_db_connection() as conn:
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS cv_records (
                        cv_id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        filename TEXT,
                        file_size INTEGER,
                        file_type TEXT,
                        mime_type TEXT,
                        upload_timestamp TEXT,
                        parsed_data TEXT,
                        analysis_results TEXT,
                        status TEXT DEFAULT 'active',
                        last_accessed TEXT,
                        access_count INTEGER DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS cv_versions (
                        version_id TEXT PRIMARY KEY,
                        cv_id TEXT,
                        version_number INTEGER,
                        parsed_data TEXT,
                        analysis_results TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (cv_id) REFERENCES cv_records (cv_id)
                    )
                ''')
                
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS cv_analytics (
                        analytics_id TEXT PRIMARY KEY,
                        cv_id TEXT,
                        user_id TEXT,
                        event_type TEXT,
                        event_data TEXT,
                        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (cv_id) REFERENCES cv_records (cv_id)
                    )
                ''')
                
                # Create indexes
                conn.execute('CREATE INDEX IF NOT EXISTS idx_user_id ON cv_records (user_id)')
                conn.execute('CREATE INDEX IF NOT EXISTS idx_status ON cv_records (status)')
                conn.execute('CREATE INDEX IF NOT EXISTS idx_upload_timestamp ON cv_records (upload_timestamp)')
                
                conn.commit()
                logger.info("✅ Database initialized successfully")
                
        except Exception as e:
            logger.error(f"Database initialization error: {str(e)}")
            raise
    
    @contextmanager
    def _get_db_connection(self):
        """Get database connection with context manager"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def store_cv(self, cv_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Store CV data and metadata"""
        try:
            cv_id = cv_data.get('cv_id') or str(uuid.uuid4())
            
            # Prepare data for storage
            parsed_data = json.dumps(cv_data.get('data', {}))
            analysis_results = json.dumps(cv_data.get('analysis', {}))
            file_info = cv_data.get('file_info', {})
            
            with self._get_db_connection() as conn:
                # Check if CV already exists
                existing = conn.execute(
                    'SELECT cv_id FROM cv_records WHERE cv_id = ?',
                    (cv_id,)
                ).fetchone()
                
                if existing:
                    # Update existing record
                    conn.execute('''
                        UPDATE cv_records 
                        SET parsed_data = ?, analysis_results = ?, updated_at = ?
                        WHERE cv_id = ?
                    ''', (parsed_data, analysis_results, datetime.utcnow().isoformat(), cv_id))
                    
                    # Create new version
                    version_number = self._get_next_version_number(conn, cv_id)
                    version_id = str(uuid.uuid4())
                    
                    conn.execute('''
                        INSERT INTO cv_versions 
                        (version_id, cv_id, version_number, parsed_data, analysis_results)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (version_id, cv_id, version_number, parsed_data, analysis_results))
                    
                else:
                    # Insert new record
                    conn.execute('''
                        INSERT INTO cv_records 
                        (cv_id, user_id, filename, file_size, file_type, mime_type, 
                         upload_timestamp, parsed_data, analysis_results, last_accessed)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        cv_id, user_id,
                        file_info.get('original_filename'),
                        file_info.get('file_size'),
                        file_info.get('file_type'),
                        file_info.get('mime_type'),
                        file_info.get('upload_timestamp', datetime.utcnow().isoformat()),
                        parsed_data, analysis_results,
                        datetime.utcnow().isoformat()
                    ))
                
                # Log analytics event
                self._log_analytics_event(conn, cv_id, user_id, 'cv_stored', {
                    'file_size': file_info.get('file_size'),
                    'file_type': file_info.get('file_type')
                })
                
                conn.commit()
            
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
                query = 'SELECT * FROM cv_records WHERE cv_id = ?'
                params = [cv_id]
                
                if user_id:
                    query += ' AND user_id = ?'
                    params.append(user_id)
                
                cv_record = conn.execute(query, params).fetchone()
                
                if not cv_record:
                    return {
                        'success': False,
                        'message': 'CV not found'
                    }
                
                # Update access tracking
                conn.execute('''
                    UPDATE cv_records 
                    SET last_accessed = ?, access_count = access_count + 1
                    WHERE cv_id = ?
                ''', (datetime.utcnow().isoformat(), cv_id))
                
                # Log analytics event
                self._log_analytics_event(conn, cv_id, cv_record['user_id'], 'cv_accessed', {})
                
                conn.commit()
                
                # Prepare response
                result = {
                    'success': True,
                    'cv_id': cv_record['cv_id'],
                    'user_id': cv_record['user_id'],
                    'metadata': {
                        'filename': cv_record['filename'],
                        'file_size': cv_record['file_size'],
                        'file_type': cv_record['file_type'],
                        'mime_type': cv_record['mime_type'],
                        'upload_timestamp': cv_record['upload_timestamp'],
                        'last_accessed': cv_record['last_accessed'],
                        'access_count': cv_record['access_count'],
                        'status': cv_record['status']
                    }
                }
                
                # Parse JSON data
                if cv_record['parsed_data']:
                    result['data'] = json.loads(cv_record['parsed_data'])
                
                if cv_record['analysis_results']:
                    result['analysis'] = json.loads(cv_record['analysis_results'])
                
                return result
                
        except Exception as e:
            logger.error(f"CV retrieval error: {str(e)}")
            return {
                'success': False,
                'message': f'Retrieval failed: {str(e)}'
            }
    
    def get_user_cvs(self, user_id: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get all CVs for a user"""
        try:
            with self._get_db_connection() as conn:
                # Get total count
                total_count = conn.execute(
                    'SELECT COUNT(*) as count FROM cv_records WHERE user_id = ? AND status = ?',
                    (user_id, 'active')
                ).fetchone()['count']
                
                # Get CVs with pagination
                cvs = conn.execute('''
                    SELECT cv_id, filename, file_size, file_type, upload_timestamp, 
                           last_accessed, access_count, status
                    FROM cv_records 
                    WHERE user_id = ? AND status = ?
                    ORDER BY upload_timestamp DESC
                    LIMIT ? OFFSET ?
                ''', (user_id, 'active', limit, offset)).fetchall()
                
                cv_list = []
                for cv in cvs:
                    cv_list.append({
                        'cv_id': cv['cv_id'],
                        'filename': cv['filename'],
                        'file_size': cv['file_size'],
                        'file_type': cv['file_type'],
                        'upload_timestamp': cv['upload_timestamp'],
                        'last_accessed': cv['last_accessed'],
                        'access_count': cv['access_count'],
                        'status': cv['status']
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
            return {
                'success': False,
                'message': f'Retrieval failed: {str(e)}'
            }
    
    def delete_cv(self, cv_id: str, user_id: str) -> Dict[str, Any]:
        """Soft delete a CV"""
        try:
            with self._get_db_connection() as conn:
                # Check if CV exists and belongs to user
                cv_record = conn.execute(
                    'SELECT cv_id FROM cv_records WHERE cv_id = ? AND user_id = ?',
                    (cv_id, user_id)
                ).fetchone()
                
                if not cv_record:
                    return {
                        'success': False,
                        'message': 'CV not found or access denied'
                    }
                
                # Soft delete
                conn.execute('''
                    UPDATE cv_records 
                    SET status = 'deleted', updated_at = ?
                    WHERE cv_id = ?
                ''', (datetime.utcnow().isoformat(), cv_id))
                
                # Log analytics event
                self._log_analytics_event(conn, cv_id, user_id, 'cv_deleted', {})
                
                conn.commit()
                
                return {
                    'success': True,
                    'message': 'CV deleted successfully'
                }
                
        except Exception as e:
            logger.error(f"CV deletion error: {str(e)}")
            return {
                'success': False,
                'message': f'Deletion failed: {str(e)}'
            }
    
    def get_cv_analytics(self, cv_id: str, user_id: str = None) -> Dict[str, Any]:
        """Get analytics for a CV"""
        try:
            with self._get_db_connection() as conn:
                query = '''
                    SELECT event_type, COUNT(*) as count, 
                           MIN(timestamp) as first_event, 
                           MAX(timestamp) as last_event
                    FROM cv_analytics 
                    WHERE cv_id = ?
                '''
                params = [cv_id]
                
                if user_id:
                    query += ' AND user_id = ?'
                    params.append(user_id)
                
                query += ' GROUP BY event_type ORDER BY count DESC'
                
                analytics = conn.execute(query, params).fetchall()
                
                analytics_data = []
                for row in analytics:
                    analytics_data.append({
                        'event_type': row['event_type'],
                        'count': row['count'],
                        'first_event': row['first_event'],
                        'last_event': row['last_event']
                    })
                
                return {
                    'success': True,
                    'cv_id': cv_id,
                    'analytics': analytics_data
                }
                
        except Exception as e:
            logger.error(f"Analytics retrieval error: {str(e)}")
            return {
                'success': False,
                'message': f'Analytics retrieval failed: {str(e)}'
            }
    
    def cleanup_old_cvs(self, days_old: int = 90) -> Dict[str, Any]:
        """Clean up old inactive CVs"""
        try:
            cutoff_date = (datetime.utcnow() - timedelta(days=days_old)).isoformat()
            
            with self._get_db_connection() as conn:
                # Find old CVs
                old_cvs = conn.execute('''
                    SELECT cv_id FROM cv_records 
                    WHERE status = 'deleted' AND updated_at < ?
                ''', (cutoff_date,)).fetchall()
                
                # Delete old CVs permanently
                deleted_count = 0
                for cv in old_cvs:
                    conn.execute('DELETE FROM cv_records WHERE cv_id = ?', (cv['cv_id'],))
                    conn.execute('DELETE FROM cv_versions WHERE cv_id = ?', (cv['cv_id'],))
                    conn.execute('DELETE FROM cv_analytics WHERE cv_id = ?', (cv['cv_id'],))
                    deleted_count += 1
                
                conn.commit()
                
                return {
                    'success': True,
                    'deleted_count': deleted_count,
                    'message': f'Cleaned up {deleted_count} old CVs'
                }
                
        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}")
            return {
                'success': False,
                'message': f'Cleanup failed: {str(e)}'
            }
    
    def _get_next_version_number(self, conn, cv_id: str) -> int:
        """Get next version number for CV"""
        result = conn.execute(
            'SELECT MAX(version_number) as max_version FROM cv_versions WHERE cv_id = ?',
            (cv_id,)
        ).fetchone()
        
        return (result['max_version'] or 0) + 1
    
    def _log_analytics_event(self, conn, cv_id: str, user_id: str, event_type: str, event_data: Dict):
        """Log analytics event"""
        try:
            analytics_id = str(uuid.uuid4())
            conn.execute('''
                INSERT INTO cv_analytics 
                (analytics_id, cv_id, user_id, event_type, event_data)
                VALUES (?, ?, ?, ?, ?)
            ''', (analytics_id, cv_id, user_id, event_type, json.dumps(event_data)))
        except Exception as e:
            logger.error(f"Analytics logging error: {str(e)}")
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        try:
            with self._get_db_connection() as conn:
                stats = conn.execute('''
                    SELECT 
                        COUNT(*) as total_cvs,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cvs,
                        COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted_cvs,
                        AVG(file_size) as avg_file_size,
                        SUM(file_size) as total_storage,
                        COUNT(DISTINCT user_id) as unique_users
                    FROM cv_records
                ''').fetchone()
                
                return {
                    'success': True,
                    'stats': {
                        'total_cvs': stats['total_cvs'],
                        'active_cvs': stats['active_cvs'],
                        'deleted_cvs': stats['deleted_cvs'],
                        'avg_file_size': stats['avg_file_size'],
                        'total_storage': stats['total_storage'],
                        'unique_users': stats['unique_users']
                    }
                }
                
        except Exception as e:
            logger.error(f"Stats retrieval error: {str(e)}")
            return {
                'success': False,
                'message': f'Stats retrieval failed: {str(e)}'
            }

# Export singleton instance
cv_storage_manager = CVStorageManager()
