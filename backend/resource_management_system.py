"""
Resource Management System
Emirati Journey Platform - Educator Persona
Comprehensive digital library and resource management
Created: September 20, 2025
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime, date
from typing import List, Dict, Optional, Any
import uuid
from dataclasses import dataclass
from enum import Enum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResourceType(Enum):
    LESSON_PLAN = "lesson_plan"
    WORKSHEET = "worksheet"
    PRESENTATION = "presentation"
    VIDEO = "video"
    AUDIO = "audio"
    INTERACTIVE_TOOL = "interactive_tool"
    ASSESSMENT = "assessment"
    RUBRIC = "rubric"
    GAME = "game"
    SIMULATION = "simulation"
    EBOOK = "ebook"
    ARTICLE = "article"
    INFOGRAPHIC = "infographic"
    TEMPLATE = "template"
    GUIDE = "guide"
    REFERENCE_MATERIAL = "reference_material"
    MULTIMEDIA_PACKAGE = "multimedia_package"

class DifficultyLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class AccessLevel(Enum):
    PUBLIC = "public"
    REGISTERED = "registered"
    PREMIUM = "premium"
    INSTITUTIONAL = "institutional"

class ApprovalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    UNDER_REVIEW = "under_review"

@dataclass
class EducationalResource:
    """Educational Resource data model"""
    id: Optional[str] = None
    resource_title: str = ""
    resource_description: str = ""
    resource_type: str = ""
    subject: str = ""
    grade_levels: List[int] = None
    topics: List[str] = None
    content_url: str = ""
    preview_url: str = ""
    thumbnail_url: str = ""
    learning_objectives: List[str] = None
    standards_alignment: List[str] = None
    difficulty_level: str = "intermediate"
    estimated_duration_minutes: int = 0
    primary_language: str = "English"
    cultural_relevance: str = "UAE"
    quality_rating: float = 0.0
    access_level: str = "public"
    is_free: bool = True
    created_by: str = ""
    approval_status: str = "pending"
    keywords: List[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ResourceManagementSystem:
    """Comprehensive Resource Management System for Educators"""
    
    def __init__(self, db_config: Dict[str, str]):
        """Initialize the Resource Management System"""
        self.db_config = db_config
        self.connection = None
        
    def get_connection(self):
        """Get database connection"""
        if not self.connection or self.connection.closed:
            self.connection = psycopg2.connect(**self.db_config)
        return self.connection
    
    def close_connection(self):
        """Close database connection"""
        if self.connection and not self.connection.closed:
            self.connection.close()
    
    # ==================== RESOURCE MANAGEMENT ====================
    
    def create_resource(self, resource_data: Dict[str, Any], creator_id: str) -> Dict[str, Any]:
        """Create a new educational resource"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Validate required fields
            required_fields = ['resource_title', 'resource_type', 'subject', 'grade_levels']
            for field in required_fields:
                if field not in resource_data or not resource_data[field]:
                    raise ValueError(f"Missing required field: {field}")
            
            # Prepare resource data
            resource_id = str(uuid.uuid4())
            
            query = """
                INSERT INTO educational_resources (
                    id, resource_title, resource_description, resource_type, subject,
                    grade_levels, topics, content_url, preview_url, thumbnail_url,
                    learning_objectives, standards_alignment, difficulty_level,
                    estimated_duration_minutes, primary_language, cultural_relevance,
                    access_level, is_free, created_by, keywords
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING *
            """
            
            cursor.execute(query, (
                resource_id,
                resource_data.get('resource_title'),
                resource_data.get('resource_description', ''),
                resource_data.get('resource_type'),
                resource_data.get('subject'),
                resource_data.get('grade_levels', []),
                resource_data.get('topics', []),
                resource_data.get('content_url', ''),
                resource_data.get('preview_url', ''),
                resource_data.get('thumbnail_url', ''),
                resource_data.get('learning_objectives', []),
                resource_data.get('standards_alignment', []),
                resource_data.get('difficulty_level', 'intermediate'),
                resource_data.get('estimated_duration_minutes', 0),
                resource_data.get('primary_language', 'English'),
                resource_data.get('cultural_relevance', 'UAE'),
                resource_data.get('access_level', 'public'),
                resource_data.get('is_free', True),
                creator_id,
                resource_data.get('keywords', [])
            ))
            
            resource = dict(cursor.fetchone())
            conn.commit()
            
            logger.info(f"Created educational resource: {resource_id}")
            return {
                'success': True,
                'resource_id': resource_id,
                'resource': resource,
                'message': 'Educational resource created successfully'
            }
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error creating educational resource: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to create educational resource'
            }
        finally:
            if cursor:
                cursor.close()
    
    def search_resources(self, search_params: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Advanced search for educational resources"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build dynamic search query
            base_query = """
                SELECT er.*, 
                       u.first_name || ' ' || u.last_name as creator_name,
                       COALESCE(ur.is_favorite, false) as is_user_favorite,
                       COALESCE(ur.personal_rating, 0) as user_rating
                FROM educational_resources er
                LEFT JOIN users u ON er.created_by = u.id
                LEFT JOIN user_resource_library ur ON er.id = ur.resource_id AND ur.user_id = %s
                WHERE er.approval_status = 'approved'
            """
            
            params = [user_id]
            conditions = []
            
            # Add search conditions
            if search_params.get('query'):
                conditions.append("er.search_vector @@ plainto_tsquery('english', %s)")
                params.append(search_params['query'])
            
            if search_params.get('subject'):
                conditions.append("er.subject = %s")
                params.append(search_params['subject'])
            
            if search_params.get('grade_levels'):
                conditions.append("er.grade_levels && %s")
                params.append(search_params['grade_levels'])
            
            if search_params.get('resource_type'):
                conditions.append("er.resource_type = %s")
                params.append(search_params['resource_type'])
            
            if search_params.get('difficulty_level'):
                conditions.append("er.difficulty_level = %s")
                params.append(search_params['difficulty_level'])
            
            if search_params.get('is_free') is not None:
                conditions.append("er.is_free = %s")
                params.append(search_params['is_free'])
            
            if search_params.get('topics'):
                conditions.append("er.topics && %s")
                params.append(search_params['topics'])
            
            if search_params.get('min_rating'):
                conditions.append("er.quality_rating >= %s")
                params.append(search_params['min_rating'])
            
            # Add conditions to query
            if conditions:
                base_query += " AND " + " AND ".join(conditions)
            
            # Add ordering
            order_by = search_params.get('sort_by', 'relevance')
            if order_by == 'relevance' and search_params.get('query'):
                base_query += " ORDER BY ts_rank(er.search_vector, plainto_tsquery('english', %s)) DESC"
                params.append(search_params['query'])
            elif order_by == 'rating':
                base_query += " ORDER BY er.quality_rating DESC"
            elif order_by == 'newest':
                base_query += " ORDER BY er.created_at DESC"
            elif order_by == 'popular':
                base_query += " ORDER BY er.usage_count DESC"
            else:
                base_query += " ORDER BY er.created_at DESC"
            
            # Add pagination
            limit = search_params.get('limit', 20)
            offset = search_params.get('offset', 0)
            base_query += " LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(base_query, params)
            resources = [dict(row) for row in cursor.fetchall()]
            
            # Get total count
            count_query = """
                SELECT COUNT(*) as total
                FROM educational_resources er
                WHERE er.approval_status = 'approved'
            """
            
            if conditions:
                count_query += " AND " + " AND ".join(conditions)
            
            cursor.execute(count_query, params[1:-2])  # Exclude user_id, limit, offset
            total_count = cursor.fetchone()['total']
            
            logger.info(f"Found {len(resources)} resources for user {user_id}")
            return {
                'success': True,
                'resources': resources,
                'total_count': total_count,
                'page_info': {
                    'limit': limit,
                    'offset': offset,
                    'has_more': offset + len(resources) < total_count
                }
            }
            
        except Exception as e:
            logger.error(f"Error searching resources: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to search resources'
            }
        finally:
            if cursor:
                cursor.close()
    
    def get_resource_details(self, resource_id: str, user_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific resource"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Get resource details with user-specific information
            query = """
                SELECT er.*, 
                       u.first_name || ' ' || u.last_name as creator_name,
                       u.email as creator_email,
                       COALESCE(ur.is_favorite, false) as is_user_favorite,
                       COALESCE(ur.personal_rating, 0) as user_rating,
                       COALESCE(ur.personal_notes, '') as user_notes,
                       COALESCE(ur.access_count, 0) as user_access_count
                FROM educational_resources er
                LEFT JOIN users u ON er.created_by = u.id
                LEFT JOIN user_resource_library ur ON er.id = ur.resource_id AND ur.user_id = %s
                WHERE er.id = %s
            """
            
            cursor.execute(query, (user_id, resource_id))
            resource = cursor.fetchone()
            
            if not resource:
                return {
                    'success': False,
                    'error': 'Resource not found',
                    'message': 'The requested resource does not exist'
                }
            
            resource = dict(resource)
            
            # Get resource categories
            cursor.execute("""
                SELECT rc.category_name, rc.category_path
                FROM resource_category_assignments rca
                JOIN resource_categories rc ON rca.category_id = rc.id
                WHERE rca.resource_id = %s
            """, (resource_id,))
            
            categories = [dict(row) for row in cursor.fetchall()]
            resource['categories'] = categories
            
            # Get recent reviews
            cursor.execute("""
                SELECT rr.*, u.first_name || ' ' || u.last_name as reviewer_name
                FROM resource_reviews rr
                JOIN users u ON rr.reviewer_id = u.id
                WHERE rr.resource_id = %s AND rr.is_approved = true
                ORDER BY rr.created_at DESC
                LIMIT 5
            """, (resource_id,))
            
            reviews = [dict(row) for row in cursor.fetchall()]
            resource['recent_reviews'] = reviews
            
            # Update usage analytics
            self._track_resource_usage(resource_id, user_id, 'view')
            
            logger.info(f"Retrieved resource details: {resource_id}")
            return {
                'success': True,
                'resource': resource
            }
            
        except Exception as e:
            logger.error(f"Error getting resource details: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to get resource details'
            }
        finally:
            if cursor:
                cursor.close()
    
    # ==================== RESOURCE COLLECTIONS ====================
    
    def create_collection(self, collection_data: Dict[str, Any], creator_id: str) -> Dict[str, Any]:
        """Create a new resource collection"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            collection_id = str(uuid.uuid4())
            
            query = """
                INSERT INTO resource_collections (
                    id, collection_name, collection_description, collection_type,
                    subject, grade_levels, created_by, visibility
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            
            cursor.execute(query, (
                collection_id,
                collection_data.get('collection_name'),
                collection_data.get('collection_description', ''),
                collection_data.get('collection_type', 'curriculum_unit'),
                collection_data.get('subject'),
                collection_data.get('grade_levels', []),
                creator_id,
                collection_data.get('visibility', 'private')
            ))
            
            collection = dict(cursor.fetchone())
            conn.commit()
            
            logger.info(f"Created resource collection: {collection_id}")
            return {
                'success': True,
                'collection_id': collection_id,
                'collection': collection,
                'message': 'Resource collection created successfully'
            }
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error creating resource collection: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to create resource collection'
            }
        finally:
            if cursor:
                cursor.close()
    
    def add_resource_to_collection(self, collection_id: str, resource_id: str, 
                                 user_id: str, item_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Add a resource to a collection"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Verify collection ownership or collaboration
            cursor.execute("""
                SELECT created_by, collaborators FROM resource_collections 
                WHERE id = %s
            """, (collection_id,))
            
            collection = cursor.fetchone()
            if not collection:
                return {
                    'success': False,
                    'error': 'Collection not found',
                    'message': 'The specified collection does not exist'
                }
            
            # Check permissions
            if (collection['created_by'] != user_id and 
                user_id not in (collection['collaborators'] or [])):
                return {
                    'success': False,
                    'error': 'Permission denied',
                    'message': 'You do not have permission to modify this collection'
                }
            
            # Get next order number
            cursor.execute("""
                SELECT COALESCE(MAX(item_order), 0) + 1 as next_order
                FROM resource_collection_items
                WHERE collection_id = %s
            """, (collection_id,))
            
            next_order = cursor.fetchone()['next_order']
            
            # Add resource to collection
            item_id = str(uuid.uuid4())
            query = """
                INSERT INTO resource_collection_items (
                    id, collection_id, resource_id, item_order,
                    section_name, notes, is_required, estimated_time_minutes, added_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            
            cursor.execute(query, (
                item_id,
                collection_id,
                resource_id,
                item_data.get('item_order', next_order) if item_data else next_order,
                item_data.get('section_name', '') if item_data else '',
                item_data.get('notes', '') if item_data else '',
                item_data.get('is_required', True) if item_data else True,
                item_data.get('estimated_time_minutes', 0) if item_data else 0,
                user_id
            ))
            
            item = dict(cursor.fetchone())
            
            # Update collection total resources count
            cursor.execute("""
                UPDATE resource_collections 
                SET total_resources = (
                    SELECT COUNT(*) FROM resource_collection_items 
                    WHERE collection_id = %s
                )
                WHERE id = %s
            """, (collection_id, collection_id))
            
            conn.commit()
            
            logger.info(f"Added resource {resource_id} to collection {collection_id}")
            return {
                'success': True,
                'item': item,
                'message': 'Resource added to collection successfully'
            }
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error adding resource to collection: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to add resource to collection'
            }
        finally:
            if cursor:
                cursor.close()
    
    # ==================== USER LIBRARY MANAGEMENT ====================
    
    def add_to_user_library(self, user_id: str, resource_id: str, 
                           library_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Add a resource to user's personal library"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Check if already in library
            cursor.execute("""
                SELECT id FROM user_resource_library 
                WHERE user_id = %s AND resource_id = %s
            """, (user_id, resource_id))
            
            if cursor.fetchone():
                return {
                    'success': False,
                    'error': 'Already in library',
                    'message': 'This resource is already in your library'
                }
            
            # Add to library
            library_id = str(uuid.uuid4())
            query = """
                INSERT INTO user_resource_library (
                    id, user_id, resource_id, folder_name, tags,
                    personal_notes, is_favorite
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """
            
            cursor.execute(query, (
                library_id,
                user_id,
                resource_id,
                library_data.get('folder_name', 'Default') if library_data else 'Default',
                library_data.get('tags', []) if library_data else [],
                library_data.get('personal_notes', '') if library_data else '',
                library_data.get('is_favorite', False) if library_data else False
            ))
            
            library_item = dict(cursor.fetchone())
            
            # Track usage
            self._track_resource_usage(resource_id, user_id, 'favorite')
            
            conn.commit()
            
            logger.info(f"Added resource {resource_id} to user {user_id} library")
            return {
                'success': True,
                'library_item': library_item,
                'message': 'Resource added to your library successfully'
            }
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Error adding to user library: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to add resource to library'
            }
        finally:
            if cursor:
                cursor.close()
    
    def get_user_library(self, user_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get user's personal resource library"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            base_query = """
                SELECT ur.*, er.resource_title, er.resource_type, er.subject,
                       er.grade_levels, er.thumbnail_url, er.quality_rating
                FROM user_resource_library ur
                JOIN educational_resources er ON ur.resource_id = er.id
                WHERE ur.user_id = %s
            """
            
            params = [user_id]
            conditions = []
            
            if filters:
                if filters.get('folder_name'):
                    conditions.append("ur.folder_name = %s")
                    params.append(filters['folder_name'])
                
                if filters.get('is_favorite'):
                    conditions.append("ur.is_favorite = %s")
                    params.append(filters['is_favorite'])
                
                if filters.get('tags'):
                    conditions.append("ur.tags && %s")
                    params.append(filters['tags'])
                
                if filters.get('subject'):
                    conditions.append("er.subject = %s")
                    params.append(filters['subject'])
            
            if conditions:
                base_query += " AND " + " AND ".join(conditions)
            
            base_query += " ORDER BY ur.added_date DESC"
            
            cursor.execute(base_query, params)
            library_items = [dict(row) for row in cursor.fetchall()]
            
            # Get folder summary
            cursor.execute("""
                SELECT folder_name, COUNT(*) as resource_count
                FROM user_resource_library
                WHERE user_id = %s
                GROUP BY folder_name
                ORDER BY folder_name
            """, (user_id,))
            
            folders = [dict(row) for row in cursor.fetchall()]
            
            logger.info(f"Retrieved {len(library_items)} library items for user {user_id}")
            return {
                'success': True,
                'library_items': library_items,
                'folders': folders,
                'total_count': len(library_items)
            }
            
        except Exception as e:
            logger.error(f"Error getting user library: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to get user library'
            }
        finally:
            if cursor:
                cursor.close()
    
    # ==================== ANALYTICS AND REPORTING ====================
    
    def get_resource_analytics(self, resource_id: str, user_id: str) -> Dict[str, Any]:
        """Get analytics for a specific resource"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Verify resource ownership or access
            cursor.execute("""
                SELECT created_by FROM educational_resources WHERE id = %s
            """, (resource_id,))
            
            resource = cursor.fetchone()
            if not resource:
                return {
                    'success': False,
                    'error': 'Resource not found',
                    'message': 'The specified resource does not exist'
                }
            
            # Get usage analytics
            cursor.execute("""
                SELECT 
                    usage_type,
                    COUNT(*) as usage_count,
                    AVG(session_duration_minutes) as avg_duration,
                    COUNT(DISTINCT user_id) as unique_users
                FROM resource_usage_analytics
                WHERE resource_id = %s
                GROUP BY usage_type
                ORDER BY usage_count DESC
            """, (resource_id,))
            
            usage_stats = [dict(row) for row in cursor.fetchall()]
            
            # Get rating analytics
            cursor.execute("""
                SELECT 
                    AVG(rating) as average_rating,
                    COUNT(*) as total_reviews,
                    COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews
                FROM resource_reviews
                WHERE resource_id = %s AND is_approved = true
            """, (resource_id,))
            
            rating_stats = dict(cursor.fetchone())
            
            # Get usage trends (last 30 days)
            cursor.execute("""
                SELECT 
                    usage_date,
                    COUNT(*) as daily_usage
                FROM resource_usage_analytics
                WHERE resource_id = %s 
                AND usage_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY usage_date
                ORDER BY usage_date
            """, (resource_id,))
            
            usage_trends = [dict(row) for row in cursor.fetchall()]
            
            logger.info(f"Retrieved analytics for resource {resource_id}")
            return {
                'success': True,
                'analytics': {
                    'usage_stats': usage_stats,
                    'rating_stats': rating_stats,
                    'usage_trends': usage_trends
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting resource analytics: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to get resource analytics'
            }
        finally:
            if cursor:
                cursor.close()
    
    def _track_resource_usage(self, resource_id: str, user_id: str, usage_type: str):
        """Track resource usage for analytics"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            analytics_id = str(uuid.uuid4())
            query = """
                INSERT INTO resource_usage_analytics (
                    id, resource_id, user_id, usage_type, usage_date
                ) VALUES (%s, %s, %s, %s, CURRENT_DATE)
            """
            
            cursor.execute(query, (analytics_id, resource_id, user_id, usage_type))
            
            # Update resource usage count
            cursor.execute("""
                UPDATE educational_resources 
                SET usage_count = usage_count + 1,
                    last_accessed = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (resource_id,))
            
            # Update user library access count if exists
            cursor.execute("""
                UPDATE user_resource_library 
                SET access_count = access_count + 1,
                    last_accessed = CURRENT_TIMESTAMP
                WHERE resource_id = %s AND user_id = %s
            """, (resource_id, user_id))
            
            conn.commit()
            
        except Exception as e:
            logger.error(f"Error tracking resource usage: {str(e)}")
            if conn:
                conn.rollback()
        finally:
            if cursor:
                cursor.close()
    
    # ==================== UTILITY METHODS ====================
    
    def get_resource_categories(self) -> Dict[str, Any]:
        """Get all resource categories"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM resource_categories 
                WHERE is_active = true
                ORDER BY category_level, display_order, category_name
            """)
            
            categories = [dict(row) for row in cursor.fetchall()]
            
            return {
                'success': True,
                'categories': categories
            }
            
        except Exception as e:
            logger.error(f"Error getting resource categories: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to get resource categories'
            }
        finally:
            if cursor:
                cursor.close()
    
    def get_featured_resources(self, limit: int = 10) -> Dict[str, Any]:
        """Get featured educational resources"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT er.*, u.first_name || ' ' || u.last_name as creator_name
                FROM educational_resources er
                LEFT JOIN users u ON er.created_by = u.id
                WHERE er.featured = true AND er.approval_status = 'approved'
                ORDER BY er.quality_rating DESC, er.usage_count DESC
                LIMIT %s
            """, (limit,))
            
            resources = [dict(row) for row in cursor.fetchall()]
            
            return {
                'success': True,
                'featured_resources': resources
            }
            
        except Exception as e:
            logger.error(f"Error getting featured resources: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to get featured resources'
            }
        finally:
            if cursor:
                cursor.close()
