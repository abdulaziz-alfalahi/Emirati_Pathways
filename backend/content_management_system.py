"""
Content Management System Core Module

This module provides comprehensive content management functionality including
content creation, editing, versioning, media handling, and workflow management.
"""

import os
import json
import uuid
import logging
import mimetypes
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, BinaryIO
from dataclasses import dataclass
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from PIL import Image
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ContentItem:
    """Data class for content items"""
    id: int
    uuid: str
    title: str
    slug: str
    content_type: str
    status: str
    language: str
    content_data: Dict[str, Any]
    meta_data: Optional[Dict[str, Any]]
    created_by: int
    created_at: datetime
    updated_at: datetime

@dataclass
class MediaAsset:
    """Data class for media assets"""
    id: int
    uuid: str
    filename: str
    original_name: str
    mime_type: str
    file_size: int
    storage_path: str
    alt_text: Optional[str]
    uploaded_by: int
    uploaded_at: datetime

class ContentManagementSystem:
    """Comprehensive content management system"""
    
    def __init__(self, db_config: Dict[str, str], storage_config: Dict[str, str]):
        """Initialize the CMS with database and storage configuration"""
        self.db_config = db_config
        self.storage_config = storage_config
        self.connection = None
        self.media_storage_path = storage_config.get('media_path', '/tmp/cms_media')
        self.max_file_size = storage_config.get('max_file_size', 50 * 1024 * 1024)  # 50MB
        self.allowed_mime_types = storage_config.get('allowed_mime_types', [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ])
        
        self._connect_to_database()
        self._ensure_storage_directories()
    
    def _connect_to_database(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(
                host=self.db_config.get('host', 'localhost'),
                database=self.db_config.get('database', 'emirati_journey'),
                user=self.db_config.get('user', 'postgres'),
                password=self.db_config.get('password', ''),
                port=self.db_config.get('port', 5432)
            )
            logger.info("Successfully connected to database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}")
            raise
    
    def _ensure_storage_directories(self):
        """Ensure storage directories exist"""
        try:
            Path(self.media_storage_path).mkdir(parents=True, exist_ok=True)
            Path(os.path.join(self.media_storage_path, 'images')).mkdir(exist_ok=True)
            Path(os.path.join(self.media_storage_path, 'documents')).mkdir(exist_ok=True)
            Path(os.path.join(self.media_storage_path, 'thumbnails')).mkdir(exist_ok=True)
            logger.info("Storage directories ensured")
        except Exception as e:
            logger.error(f"Failed to create storage directories: {str(e)}")
            raise
    
    def _execute_query(self, query: str, params: tuple = None, fetch: bool = True) -> List[Dict]:
        """Execute database query with error handling"""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                if fetch:
                    return [dict(row) for row in cursor.fetchall()]
                else:
                    self.connection.commit()
                    return []
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Database query failed: {str(e)}")
            raise
    
    def _generate_slug(self, title: str, content_id: int = None) -> str:
        """Generate URL-friendly slug from title"""
        import re
        
        # Convert to lowercase and replace spaces with hyphens
        slug = re.sub(r'[^\w\s-]', '', title.lower())
        slug = re.sub(r'[-\s]+', '-', slug).strip('-')
        
        # Ensure uniqueness
        base_slug = slug
        counter = 1
        
        while True:
            # Check if slug exists (excluding current content if updating)
            query = "SELECT id FROM cms_content WHERE slug = %s"
            params = [slug]
            
            if content_id:
                query += " AND id != %s"
                params.append(content_id)
            
            existing = self._execute_query(query, tuple(params))
            
            if not existing:
                break
            
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug
    
    def _create_content_version(self, content_id: int, title: str, content_data: Dict[str, Any],
                              meta_data: Dict[str, Any], created_by: int, change_summary: str = None):
        """Create a new version of content"""
        try:
            # Get current version number
            version_query = """
                SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
                FROM cms_content_versions
                WHERE content_id = %s
            """
            version_result = self._execute_query(version_query, (content_id,))
            next_version = version_result[0]['next_version']
            
            # Create version
            insert_query = """
                INSERT INTO cms_content_versions 
                (content_id, version_number, title, content_data, meta_data, change_summary, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            params = (content_id, next_version, title, json.dumps(content_data),
                     json.dumps(meta_data) if meta_data else None, change_summary, created_by)
            
            self._execute_query(insert_query, params, fetch=False)
            logger.info(f"Created version {next_version} for content {content_id}")
            
        except Exception as e:
            logger.error(f"Failed to create content version: {str(e)}")
            raise
    
    # Content Management Methods
    
    def create_content(self, title: str, content_type: str, content_data: Dict[str, Any],
                      language: str = 'en', meta_data: Dict[str, Any] = None,
                      category: str = None, tags: List[str] = None,
                      created_by: int = None) -> ContentItem:
        """Create new content item"""
        try:
            # Generate slug
            slug = self._generate_slug(title)
            
            # Create content
            query = """
                INSERT INTO cms_content 
                (uuid, title, slug, content_type, language, content_data, meta_data, 
                 category, tags, created_by, updated_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, uuid, title, slug, content_type, status, language, 
                         content_data, meta_data, created_by, created_at, updated_at
            """
            
            content_uuid = str(uuid.uuid4())
            params = (
                content_uuid, title, slug, content_type, language,
                json.dumps(content_data), json.dumps(meta_data) if meta_data else None,
                category, tags, created_by, created_by
            )
            
            result = self._execute_query(query, params)
            
            if not result:
                raise Exception("Failed to create content")
            
            content_row = result[0]
            content_id = content_row['id']
            
            # Create initial version
            self._create_content_version(
                content_id, title, content_data, meta_data, created_by, "Initial version"
            )
            
            # Convert to ContentItem
            content_item = ContentItem(
                id=content_row['id'],
                uuid=content_row['uuid'],
                title=content_row['title'],
                slug=content_row['slug'],
                content_type=content_row['content_type'],
                status=content_row['status'],
                language=content_row['language'],
                content_data=json.loads(content_row['content_data']),
                meta_data=json.loads(content_row['meta_data']) if content_row['meta_data'] else None,
                created_by=content_row['created_by'],
                created_at=content_row['created_at'],
                updated_at=content_row['updated_at']
            )
            
            logger.info(f"Created content item: {content_id}")
            return content_item
            
        except Exception as e:
            logger.error(f"Failed to create content: {str(e)}")
            raise
    
    def get_content(self, content_id: int = None, slug: str = None, 
                   include_drafts: bool = False) -> Optional[ContentItem]:
        """Get content item by ID or slug"""
        try:
            if not content_id and not slug:
                raise ValueError("Either content_id or slug must be provided")
            
            query = """
                SELECT id, uuid, title, slug, content_type, status, language, 
                       content_data, meta_data, created_by, created_at, updated_at
                FROM cms_content
                WHERE 
            """
            
            if content_id:
                query += "id = %s"
                params = (content_id,)
            else:
                query += "slug = %s"
                params = (slug,)
            
            if not include_drafts:
                query += " AND status = 'published'"
            
            result = self._execute_query(query, params)
            
            if not result:
                return None
            
            content_row = result[0]
            
            return ContentItem(
                id=content_row['id'],
                uuid=content_row['uuid'],
                title=content_row['title'],
                slug=content_row['slug'],
                content_type=content_row['content_type'],
                status=content_row['status'],
                language=content_row['language'],
                content_data=json.loads(content_row['content_data']),
                meta_data=json.loads(content_row['meta_data']) if content_row['meta_data'] else None,
                created_by=content_row['created_by'],
                created_at=content_row['created_at'],
                updated_at=content_row['updated_at']
            )
            
        except Exception as e:
            logger.error(f"Failed to get content: {str(e)}")
            raise
    
    def update_content(self, content_id: int, updates: Dict[str, Any], 
                      updated_by: int, change_summary: str = None) -> Optional[ContentItem]:
        """Update content item"""
        try:
            # Get current content for versioning
            current_content = self.get_content(content_id, include_drafts=True)
            if not current_content:
                raise Exception("Content not found")
            
            # Build update query
            update_fields = []
            params = []
            
            allowed_fields = ['title', 'content_data', 'meta_data', 'status', 
                            'category', 'tags', 'publish_date', 'expire_date']
            
            for field, value in updates.items():
                if field in allowed_fields:
                    if field in ['content_data', 'meta_data']:
                        update_fields.append(f"{field} = %s")
                        params.append(json.dumps(value) if value else None)
                    else:
                        update_fields.append(f"{field} = %s")
                        params.append(value)
            
            if 'title' in updates:
                # Update slug if title changed
                new_slug = self._generate_slug(updates['title'], content_id)
                update_fields.append("slug = %s")
                params.append(new_slug)
            
            if not update_fields:
                raise Exception("No valid fields to update")
            
            # Add updated_by and timestamp
            update_fields.extend(["updated_by = %s", "updated_at = CURRENT_TIMESTAMP"])
            params.extend([updated_by, content_id])
            
            query = f"""
                UPDATE cms_content 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, uuid, title, slug, content_type, status, language, 
                         content_data, meta_data, created_by, created_at, updated_at
            """
            
            result = self._execute_query(query, tuple(params))
            
            if not result:
                raise Exception("Failed to update content")
            
            # Create new version
            new_title = updates.get('title', current_content.title)
            new_content_data = updates.get('content_data', current_content.content_data)
            new_meta_data = updates.get('meta_data', current_content.meta_data)
            
            self._create_content_version(
                content_id, new_title, new_content_data, new_meta_data, 
                updated_by, change_summary
            )
            
            content_row = result[0]
            
            return ContentItem(
                id=content_row['id'],
                uuid=content_row['uuid'],
                title=content_row['title'],
                slug=content_row['slug'],
                content_type=content_row['content_type'],
                status=content_row['status'],
                language=content_row['language'],
                content_data=json.loads(content_row['content_data']),
                meta_data=json.loads(content_row['meta_data']) if content_row['meta_data'] else None,
                created_by=content_row['created_by'],
                created_at=content_row['created_at'],
                updated_at=content_row['updated_at']
            )
            
        except Exception as e:
            logger.error(f"Failed to update content: {str(e)}")
            raise
    
    def delete_content(self, content_id: int, deleted_by: int) -> bool:
        """Delete content item (soft delete by setting status to archived)"""
        try:
            query = """
                UPDATE cms_content 
                SET status = 'archived', updated_by = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            self._execute_query(query, (deleted_by, content_id), fetch=False)
            
            logger.info(f"Archived content item: {content_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete content: {str(e)}")
            return False
    
    def list_content(self, page: int = 1, per_page: int = 20, content_type: str = None,
                    status: str = None, language: str = None, category: str = None,
                    search: str = None, created_by: int = None) -> Dict[str, Any]:
        """List content items with filtering and pagination"""
        try:
            offset = (page - 1) * per_page
            
            # Build base query
            base_query = """
                SELECT id, uuid, title, slug, content_type, status, language, 
                       category, tags, excerpt, view_count, created_by, created_at, updated_at
                FROM cms_content
            """
            
            conditions = []
            params = []
            
            if content_type:
                conditions.append("content_type = %s")
                params.append(content_type)
            
            if status:
                conditions.append("status = %s")
                params.append(status)
            
            if language:
                conditions.append("language = %s")
                params.append(language)
            
            if category:
                conditions.append("category = %s")
                params.append(category)
            
            if created_by:
                conditions.append("created_by = %s")
                params.append(created_by)
            
            if search:
                conditions.append("(title ILIKE %s OR excerpt ILIKE %s)")
                search_param = f"%{search}%"
                params.extend([search_param, search_param])
            
            if conditions:
                base_query += " WHERE " + " AND ".join(conditions)
            
            base_query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
            params.extend([per_page, offset])
            
            content_items = self._execute_query(base_query, tuple(params))
            
            # Get total count
            count_query = "SELECT COUNT(*) FROM cms_content"
            if conditions:
                count_query += " WHERE " + " AND ".join(conditions)
            
            count_params = params[:-2]  # Remove limit and offset
            total_count = self._execute_query(count_query, tuple(count_params))[0]['count']
            
            return {
                'content': content_items,
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
            
        except Exception as e:
            logger.error(f"Failed to list content: {str(e)}")
            raise
    
    def get_content_versions(self, content_id: int) -> List[Dict[str, Any]]:
        """Get version history for content item"""
        try:
            query = """
                SELECT version_number, title, change_summary, created_by, created_at
                FROM cms_content_versions
                WHERE content_id = %s
                ORDER BY version_number DESC
            """
            
            return self._execute_query(query, (content_id,))
            
        except Exception as e:
            logger.error(f"Failed to get content versions: {str(e)}")
            return []
    
    def restore_content_version(self, content_id: int, version_number: int, 
                               restored_by: int) -> Optional[ContentItem]:
        """Restore content to a specific version"""
        try:
            # Get version data
            version_query = """
                SELECT title, content_data, meta_data
                FROM cms_content_versions
                WHERE content_id = %s AND version_number = %s
            """
            version_result = self._execute_query(version_query, (content_id, version_number))
            
            if not version_result:
                raise Exception("Version not found")
            
            version_data = version_result[0]
            
            # Update content with version data
            updates = {
                'title': version_data['title'],
                'content_data': json.loads(version_data['content_data']),
                'meta_data': json.loads(version_data['meta_data']) if version_data['meta_data'] else None
            }
            
            return self.update_content(
                content_id, updates, restored_by, 
                f"Restored to version {version_number}"
            )
            
        except Exception as e:
            logger.error(f"Failed to restore content version: {str(e)}")
            raise
    
    # Media Management Methods
    
    def _generate_file_hash(self, file_data: bytes) -> str:
        """Generate SHA-256 hash of file data"""
        return hashlib.sha256(file_data).hexdigest()
    
    def _get_file_category(self, mime_type: str) -> str:
        """Determine file category based on MIME type"""
        if mime_type.startswith('image/'):
            return 'images'
        elif mime_type in ['application/pdf', 'text/plain', 'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            return 'documents'
        else:
            return 'other'
    
    def _create_thumbnail(self, image_path: str, thumbnail_path: str, size: Tuple[int, int] = (300, 300)):
        """Create thumbnail for image files"""
        try:
            with Image.open(image_path) as img:
                img.thumbnail(size, Image.Resampling.LANCZOS)
                img.save(thumbnail_path, optimize=True, quality=85)
                logger.info(f"Created thumbnail: {thumbnail_path}")
        except Exception as e:
            logger.error(f"Failed to create thumbnail: {str(e)}")
    
    def upload_media(self, file_data: BinaryIO, original_filename: str, 
                    alt_text: str = None, caption: str = None, 
                    description: str = None, tags: List[str] = None,
                    uploaded_by: int = None) -> MediaAsset:
        """Upload and process media file"""
        try:
            # Read file data
            file_content = file_data.read()
            file_size = len(file_content)
            
            # Validate file size
            if file_size > self.max_file_size:
                raise Exception(f"File size exceeds maximum allowed size of {self.max_file_size} bytes")
            
            # Determine MIME type
            mime_type, _ = mimetypes.guess_type(original_filename)
            if not mime_type:
                mime_type = 'application/octet-stream'
            
            # Validate MIME type
            if mime_type not in self.allowed_mime_types:
                raise Exception(f"File type {mime_type} is not allowed")
            
            # Generate unique filename
            file_hash = self._generate_file_hash(file_content)
            file_extension = Path(original_filename).suffix
            unique_filename = f"{file_hash}{file_extension}"
            
            # Determine storage category and path
            category = self._get_file_category(mime_type)
            storage_dir = os.path.join(self.media_storage_path, category)
            storage_path = os.path.join(storage_dir, unique_filename)
            
            # Check if file already exists
            if os.path.exists(storage_path):
                logger.info(f"File already exists: {storage_path}")
            else:
                # Save file
                with open(storage_path, 'wb') as f:
                    f.write(file_content)
                logger.info(f"Saved file: {storage_path}")
            
            # Create thumbnail for images
            thumbnail_path = None
            if mime_type.startswith('image/'):
                thumbnail_filename = f"thumb_{unique_filename}"
                thumbnail_path = os.path.join(self.media_storage_path, 'thumbnails', thumbnail_filename)
                self._create_thumbnail(storage_path, thumbnail_path)
            
            # Get image dimensions for images
            dimensions = None
            if mime_type.startswith('image/'):
                try:
                    with Image.open(storage_path) as img:
                        dimensions = {'width': img.width, 'height': img.height}
                except Exception as e:
                    logger.error(f"Failed to get image dimensions: {str(e)}")
            
            # Save to database
            media_uuid = str(uuid.uuid4())
            query = """
                INSERT INTO cms_media 
                (uuid, filename, original_name, mime_type, file_size, storage_path,
                 alt_text, caption, description, tags, dimensions, uploaded_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, uuid, filename, original_name, mime_type, file_size, 
                         storage_path, alt_text, uploaded_by, uploaded_at
            """
            
            params = (
                media_uuid, unique_filename, original_filename, mime_type, file_size,
                storage_path, alt_text, caption, description, tags,
                json.dumps(dimensions) if dimensions else None, uploaded_by
            )
            
            result = self._execute_query(query, params)
            
            if not result:
                raise Exception("Failed to save media to database")
            
            media_row = result[0]
            
            return MediaAsset(
                id=media_row['id'],
                uuid=media_row['uuid'],
                filename=media_row['filename'],
                original_name=media_row['original_name'],
                mime_type=media_row['mime_type'],
                file_size=media_row['file_size'],
                storage_path=media_row['storage_path'],
                alt_text=media_row['alt_text'],
                uploaded_by=media_row['uploaded_by'],
                uploaded_at=media_row['uploaded_at']
            )
            
        except Exception as e:
            logger.error(f"Failed to upload media: {str(e)}")
            raise
    
    def get_media(self, media_id: int = None, media_uuid: str = None) -> Optional[MediaAsset]:
        """Get media asset by ID or UUID"""
        try:
            if not media_id and not media_uuid:
                raise ValueError("Either media_id or media_uuid must be provided")
            
            query = """
                SELECT id, uuid, filename, original_name, mime_type, file_size, 
                       storage_path, alt_text, uploaded_by, uploaded_at
                FROM cms_media
                WHERE 
            """
            
            if media_id:
                query += "id = %s"
                params = (media_id,)
            else:
                query += "uuid = %s"
                params = (media_uuid,)
            
            result = self._execute_query(query, params)
            
            if not result:
                return None
            
            media_row = result[0]
            
            return MediaAsset(
                id=media_row['id'],
                uuid=media_row['uuid'],
                filename=media_row['filename'],
                original_name=media_row['original_name'],
                mime_type=media_row['mime_type'],
                file_size=media_row['file_size'],
                storage_path=media_row['storage_path'],
                alt_text=media_row['alt_text'],
                uploaded_by=media_row['uploaded_by'],
                uploaded_at=media_row['uploaded_at']
            )
            
        except Exception as e:
            logger.error(f"Failed to get media: {str(e)}")
            raise
    
    def list_media(self, page: int = 1, per_page: int = 20, mime_type_filter: str = None,
                  uploaded_by: int = None, search: str = None) -> Dict[str, Any]:
        """List media assets with filtering and pagination"""
        try:
            offset = (page - 1) * per_page
            
            base_query = """
                SELECT id, uuid, filename, original_name, mime_type, file_size, 
                       alt_text, uploaded_by, uploaded_at
                FROM cms_media
            """
            
            conditions = []
            params = []
            
            if mime_type_filter:
                if mime_type_filter == 'images':
                    conditions.append("mime_type LIKE 'image/%'")
                elif mime_type_filter == 'documents':
                    conditions.append("mime_type IN ('application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')")
                else:
                    conditions.append("mime_type = %s")
                    params.append(mime_type_filter)
            
            if uploaded_by:
                conditions.append("uploaded_by = %s")
                params.append(uploaded_by)
            
            if search:
                conditions.append("(original_name ILIKE %s OR alt_text ILIKE %s)")
                search_param = f"%{search}%"
                params.extend([search_param, search_param])
            
            if conditions:
                base_query += " WHERE " + " AND ".join(conditions)
            
            base_query += " ORDER BY uploaded_at DESC LIMIT %s OFFSET %s"
            params.extend([per_page, offset])
            
            media_items = self._execute_query(base_query, tuple(params))
            
            # Get total count
            count_query = "SELECT COUNT(*) FROM cms_media"
            if conditions:
                count_query += " WHERE " + " AND ".join(conditions)
            
            count_params = params[:-2]
            total_count = self._execute_query(count_query, tuple(count_params))[0]['count']
            
            return {
                'media': media_items,
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
            
        except Exception as e:
            logger.error(f"Failed to list media: {str(e)}")
            raise
    
    def delete_media(self, media_id: int) -> bool:
        """Delete media asset"""
        try:
            # Get media info
            media = self.get_media(media_id)
            if not media:
                raise Exception("Media not found")
            
            # Delete file from storage
            if os.path.exists(media.storage_path):
                os.remove(media.storage_path)
                logger.info(f"Deleted file: {media.storage_path}")
            
            # Delete thumbnail if exists
            if media.mime_type.startswith('image/'):
                thumbnail_path = os.path.join(
                    self.media_storage_path, 'thumbnails', f"thumb_{media.filename}"
                )
                if os.path.exists(thumbnail_path):
                    os.remove(thumbnail_path)
                    logger.info(f"Deleted thumbnail: {thumbnail_path}")
            
            # Delete from database
            query = "DELETE FROM cms_media WHERE id = %s"
            self._execute_query(query, (media_id,), fetch=False)
            
            logger.info(f"Deleted media asset: {media_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete media: {str(e)}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")
