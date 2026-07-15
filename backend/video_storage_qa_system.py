"""
Secure Video Storage and Quality Assurance System
Enterprise-grade video storage with comprehensive QA workflows
"""

import os
import json
import logging
import hashlib
import hmac
import base64
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import psycopg2
from psycopg2.extras import RealDictCursor
# Qwen / DashScope client (replaces google.generativeai)
try:
    from backend.services.qwen_client import chat_completion, QwenParsingError, QwenClientError
    from backend.config.qwen_config import DASHSCOPE_API_KEY
    _qwen_available = bool(DASHSCOPE_API_KEY)
except ImportError:
    _qwen_available = False
from dataclasses import dataclass, asdict
import uuid
import boto3
from botocore.exceptions import ClientError
import cv2
import numpy as np
from cryptography.fernet import Fernet
import tempfile
import subprocess
import threading
import queue
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StorageStatus(Enum):
    UPLOADING = "uploading"
    STORED = "stored"
    PROCESSING = "processing"
    READY = "ready"
    ARCHIVED = "archived"
    DELETED = "deleted"
    ERROR = "error"

class QAStatus(Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"
    REQUIRES_ATTENTION = "requires_attention"

class VideoQuality(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"
    UNACCEPTABLE = "unacceptable"
    PENDING = "pending_review"  # not auto-assessed — awaiting manual QA

@dataclass
class VideoMetadata:
    session_id: str
    file_id: str
    original_filename: str
    file_size: int
    duration_seconds: float
    resolution: str
    bitrate: int
    codec: str
    audio_quality: str
    created_at: datetime
    storage_path: str
    encryption_key_id: str
    checksum: str

@dataclass
class QualityAssessment:
    session_id: str
    video_quality: VideoQuality
    audio_quality: float
    technical_score: float
    content_appropriateness: float
    bias_indicators: List[str]
    flagged_content: List[str]
    recommendations: List[str]
    reviewer_notes: str
    assessed_at: datetime
    assessed_by: str

@dataclass
class AccessLog:
    session_id: str
    user_id: str
    access_type: str  # view, download, stream
    timestamp: datetime
    ip_address: str
    user_agent: str
    duration_seconds: Optional[float]
    success: bool

class SecureVideoStorageSystem:
    def __init__(self):
        """Initialize the Secure Video Storage System"""
        # Database connection
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'emirati_journey'),
            'user': os.getenv('DB_USER', 'emirati_user'),
            'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
            'port': os.getenv('DB_PORT', '5432')
        }
        
        # AWS S3 configuration for video storage
        self.aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        self.aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.aws_region = os.getenv('AWS_REGION', 'me-south-1')  # Middle East (Bahrain)
        self.s3_bucket = os.getenv('VIDEO_STORAGE_BUCKET', 'emirati-interview-videos')
        
        # Initialize S3 client
        if self.aws_access_key and self.aws_secret_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
                region_name=self.aws_region
            )
        else:
            logger.warning("AWS credentials not found - using mock storage")
            self.s3_client = None
        
        # Encryption configuration
        # Video-recording encryption key. No hardcoded fallback (was the publicly-known
        # 'default_key_change_in_production'), and derive a proper 32-byte Fernet key via
        # SHA-256 rather than space-pad/truncate. Required in production; ephemeral dev key
        # (with a loud warning) otherwise. (audit SEC-04)
        _vk = os.getenv('VIDEO_ENCRYPTION_KEY')
        if not _vk:
            if os.getenv('FLASK_ENV') == 'production':
                raise RuntimeError("VIDEO_ENCRYPTION_KEY is required in production to encrypt interview recordings")
            logger.warning("VIDEO_ENCRYPTION_KEY not set — using an ephemeral dev key; recordings will not be decryptable after a restart")
            _vk = base64.urlsafe_b64encode(os.urandom(32)).decode()
        self.master_key = _vk
        self.encryption_suite = Fernet(base64.urlsafe_b64encode(hashlib.sha256(_vk.encode()).digest()))
        
        # Qwen AI (lazy-loaded via qwen_client module)
        if _qwen_available:
            logger.info("Qwen AI ready for content analysis")
        else:
            logger.warning("DASHSCOPE_API_KEY not found - AI analysis will be limited")
        
        # Processing queue
        self.processing_queue = queue.Queue()
        self.qa_queue = queue.Queue()
        
        # Start background workers
        self._start_background_workers()
        
        logger.info("Secure Video Storage System initialized")

    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)

    def _start_background_workers(self):
        """Start background worker threads"""
        # Video processing worker
        processing_worker = threading.Thread(
            target=self._video_processing_worker,
            daemon=True
        )
        processing_worker.start()
        
        # QA worker
        qa_worker = threading.Thread(
            target=self._qa_processing_worker,
            daemon=True
        )
        qa_worker.start()
        
        logger.info("Background workers started")

    def store_interview_recording(self, session_id: str, video_file_path: str, 
                                metadata: Dict[str, Any]) -> str:
        """Store interview recording securely"""
        try:
            # Generate unique file ID
            file_id = f"video_{uuid.uuid4().hex}"
            
            # Extract video metadata
            video_metadata = self._extract_video_metadata(video_file_path, session_id, file_id)
            
            # Encrypt video file
            encrypted_file_path = self._encrypt_video_file(video_file_path)
            
            # Upload to secure storage
            storage_path = self._upload_to_storage(encrypted_file_path, file_id)
            
            # Store metadata in database
            self._store_video_metadata(video_metadata, storage_path)
            
            # Add to processing queue for quality analysis
            self.processing_queue.put({
                'session_id': session_id,
                'file_id': file_id,
                'storage_path': storage_path,
                'metadata': metadata
            })
            
            logger.info(f"Stored video recording for session {session_id}")
            return file_id
            
        except Exception as e:
            logger.error(f"Error storing interview recording: {e}")
            raise

    def _extract_video_metadata(self, video_file_path: str, session_id: str, 
                               file_id: str) -> VideoMetadata:
        """Extract metadata from video file"""
        try:
            # Use OpenCV to extract video metadata
            cap = cv2.VideoCapture(video_file_path)
            
            if not cap.isOpened():
                raise ValueError("Could not open video file")
            
            # Get video properties
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = frame_count / fps if fps > 0 else 0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            cap.release()
            
            # Get file size
            file_size = os.path.getsize(video_file_path)
            
            # Calculate checksum
            checksum = self._calculate_file_checksum(video_file_path)
            
            return VideoMetadata(
                session_id=session_id,
                file_id=file_id,
                original_filename=os.path.basename(video_file_path),
                file_size=file_size,
                duration_seconds=duration,
                resolution=f"{width}x{height}",
                bitrate=0,  # Would be extracted from ffmpeg in production
                codec="unknown",  # Would be extracted from ffmpeg in production
                audio_quality="unknown",  # Would be analyzed in production
                created_at=datetime.now(),
                storage_path="",  # Will be set after upload
                encryption_key_id="master",  # In production, use key rotation
                checksum=checksum
            )
            
        except Exception as e:
            logger.error(f"Error extracting video metadata: {e}")
            raise

    def _calculate_file_checksum(self, file_path: str) -> str:
        """Calculate SHA-256 checksum of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def _encrypt_video_file(self, video_file_path: str) -> str:
        """Encrypt video file"""
        try:
            with open(video_file_path, 'rb') as original_file:
                original_data = original_file.read()
            
            # Encrypt the data
            encrypted_data = self.encryption_suite.encrypt(original_data)
            
            # Write encrypted data to temporary file
            encrypted_file_path = video_file_path + '.encrypted'
            with open(encrypted_file_path, 'wb') as encrypted_file:
                encrypted_file.write(encrypted_data)
            
            return encrypted_file_path
            
        except Exception as e:
            logger.error(f"Error encrypting video file: {e}")
            raise

    def _upload_to_storage(self, encrypted_file_path: str, file_id: str) -> str:
        """Upload encrypted file to secure storage"""
        try:
            if not self.s3_client:
                # No storage backend configured (no AWS credentials). Do NOT pretend to
                # store the file at a fake mock_storage/ path — fail honestly so callers
                # know the recording was not persisted. (#26)
                raise RuntimeError(
                    "Video storage backend not configured (no AWS S3 credentials). "
                    "Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/VIDEO_STORAGE_BUCKET to enable."
                )

            # Generate storage path
            storage_path = f"interview-recordings/{datetime.now().year}/{datetime.now().month}/{file_id}.encrypted"
            
            # Upload to S3 with server-side encryption
            self.s3_client.upload_file(
                encrypted_file_path,
                self.s3_bucket,
                storage_path,
                ExtraArgs={
                    'ServerSideEncryption': 'AES256',
                    'StorageClass': 'STANDARD_IA',  # Infrequent Access for cost optimization
                    'Metadata': {
                        'file_id': file_id,
                        'encrypted': 'true',
                        'uploaded_at': datetime.now().isoformat()
                    }
                }
            )
            
            # Clean up temporary encrypted file
            os.remove(encrypted_file_path)
            
            logger.info(f"Uploaded video to S3: {storage_path}")
            return storage_path
            
        except Exception as e:
            logger.error(f"Error uploading to storage: {e}")
            raise

    def _store_video_metadata(self, metadata: VideoMetadata, storage_path: str):
        """Store video metadata in database"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO video_recordings (
                            session_id, file_id, original_filename, file_size,
                            duration_seconds, resolution, bitrate, codec,
                            audio_quality, created_at, storage_path,
                            encryption_key_id, checksum, status
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        metadata.session_id,
                        metadata.file_id,
                        metadata.original_filename,
                        metadata.file_size,
                        metadata.duration_seconds,
                        metadata.resolution,
                        metadata.bitrate,
                        metadata.codec,
                        metadata.audio_quality,
                        metadata.created_at,
                        storage_path,
                        metadata.encryption_key_id,
                        metadata.checksum,
                        StorageStatus.STORED.value
                    ))
                    
                    conn.commit()
                    logger.info(f"Stored video metadata for {metadata.file_id}")
                    
        except Exception as e:
            logger.error(f"Error storing video metadata: {e}")
            raise

    def _video_processing_worker(self):
        """Background worker for video processing"""
        while True:
            try:
                # Get next item from queue (blocks until available)
                item = self.processing_queue.get(timeout=5)
                
                # Process video
                self._process_video_quality(item)
                
                # Mark task as done
                self.processing_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in video processing worker: {e}")

    def _process_video_quality(self, item: Dict[str, Any]):
        """Process video for quality assessment"""
        try:
            session_id = item['session_id']
            file_id = item['file_id']
            
            logger.info(f"Processing video quality for {file_id}")
            
            # Update status to processing
            self._update_video_status(file_id, StorageStatus.PROCESSING)
            
            # Perform quality analysis (mock implementation)
            quality_assessment = self._analyze_video_quality(session_id, file_id)
            
            # Store quality assessment
            self._store_quality_assessment(quality_assessment)
            
            # Add to QA queue if needed
            if quality_assessment.video_quality in [VideoQuality.POOR, VideoQuality.UNACCEPTABLE]:
                self.qa_queue.put({
                    'session_id': session_id,
                    'file_id': file_id,
                    'priority': 'high'
                })
            
            # Update status to ready
            self._update_video_status(file_id, StorageStatus.READY)
            
            logger.info(f"Completed video processing for {file_id}")
            
        except Exception as e:
            logger.error(f"Error processing video quality: {e}")
            self._update_video_status(item['file_id'], StorageStatus.ERROR)

    def _analyze_video_quality(self, session_id: str, file_id: str) -> QualityAssessment:
        """Return an HONEST automated quality assessment.

        Automated deep video/audio analysis is NOT wired here — it requires a
        video-processing backend (ffprobe/ffmpeg + frame/audio analysis) that is not
        configured, and an LLM cannot inspect a raw video file. So instead of fabricating
        scores (the previous version used random.uniform), we return a PENDING assessment
        with null scores that flags the recording for manual QA review. (#26)
        """
        return self._pending_quality_assessment(session_id)

    def _pending_quality_assessment(self, session_id: str) -> QualityAssessment:
        """Honest 'not auto-assessed' placeholder — null scores, awaiting manual review."""
        return QualityAssessment(
            session_id=session_id,
            video_quality=VideoQuality.PENDING,
            audio_quality=None,
            technical_score=None,
            content_appropriateness=None,
            bias_indicators=[],
            flagged_content=[],
            recommendations=[
                "Automated deep video/audio analysis is not configured — manual QA review required."
            ],
            reviewer_notes="Automated analysis unavailable (no video-processing backend). Awaiting manual QA review.",
            assessed_at=datetime.now(),
            assessed_by="system_pending"
        )

    def _store_quality_assessment(self, assessment: QualityAssessment):
        """Store quality assessment in database"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO video_quality_assessments (
                            session_id, video_quality, audio_quality, technical_score,
                            content_appropriateness, bias_indicators, flagged_content,
                            recommendations, reviewer_notes, assessed_at, assessed_by
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        assessment.session_id,
                        assessment.video_quality.value,
                        assessment.audio_quality,
                        assessment.technical_score,
                        assessment.content_appropriateness,
                        json.dumps(assessment.bias_indicators),
                        json.dumps(assessment.flagged_content),
                        json.dumps(assessment.recommendations),
                        assessment.reviewer_notes,
                        assessment.assessed_at,
                        assessment.assessed_by
                    ))
                    
                    conn.commit()
                    logger.info(f"Stored quality assessment for {assessment.session_id}")
                    
        except Exception as e:
            logger.error(f"Error storing quality assessment: {e}")

    def _qa_processing_worker(self):
        """Background worker for QA processing"""
        while True:
            try:
                # Get next item from queue
                item = self.qa_queue.get(timeout=10)
                
                # Process QA review
                self._process_qa_review(item)
                
                # Mark task as done
                self.qa_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in QA processing worker: {e}")

    def _process_qa_review(self, item: Dict[str, Any]):
        """Process QA review"""
        try:
            session_id = item['session_id']
            file_id = item['file_id']
            priority = item.get('priority', 'normal')
            
            logger.info(f"Processing QA review for {file_id} (priority: {priority})")
            
            # Update QA status
            self._update_qa_status(session_id, QAStatus.PENDING)
            
            # In production, this would trigger human review workflow
            # For demo, simulate automated QA
            time.sleep(2)  # Simulate processing time
            
            # Auto-approve if no issues detected
            self._update_qa_status(session_id, QAStatus.APPROVED)
            
            logger.info(f"Completed QA review for {file_id}")
            
        except Exception as e:
            logger.error(f"Error processing QA review: {e}")

    def _update_video_status(self, file_id: str, status: StorageStatus):
        """Update video storage status"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE video_recordings 
                        SET status = %s, updated_at = %s
                        WHERE file_id = %s
                    """, (status.value, datetime.now(), file_id))
                    
                    conn.commit()
                    
        except Exception as e:
            logger.error(f"Error updating video status: {e}")

    def _update_qa_status(self, session_id: str, status: QAStatus):
        """Update QA status"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO video_qa_status (session_id, status, updated_at)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (session_id) DO UPDATE SET
                        status = EXCLUDED.status,
                        updated_at = EXCLUDED.updated_at
                    """, (session_id, status.value, datetime.now()))
                    
                    conn.commit()
                    
        except Exception as e:
            logger.error(f"Error updating QA status: {e}")

    def get_secure_video_url(self, session_id: str, user_id: str, 
                           access_duration_hours: int = 24) -> Dict[str, Any]:
        """Generate secure, time-limited video access URL"""
        try:
            # Verify user has access to this session
            if not self._verify_user_access(session_id, user_id):
                raise ValueError("Access denied")
            
            # Get video metadata
            video_metadata = self._get_video_metadata(session_id)
            if not video_metadata:
                raise ValueError("Video not found")
            
            # Generate secure access token
            access_token = self._generate_video_access_token(
                session_id, user_id, access_duration_hours
            )
            
            # Log access attempt
            self._log_video_access(session_id, user_id, "generate_url", True)
            
            return {
                'session_id': session_id,
                'access_token': access_token,
                'streaming_url': f"/api/video-storage/stream/{session_id}?token={access_token}",
                'download_url': f"/api/video-storage/download/{session_id}?token={access_token}",
                'expires_at': (datetime.now() + timedelta(hours=access_duration_hours)).isoformat(),
                'video_metadata': {
                    'duration_seconds': video_metadata.get('duration_seconds'),
                    'resolution': video_metadata.get('resolution'),
                    'file_size': video_metadata.get('file_size')
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating secure video URL: {e}")
            self._log_video_access(session_id, user_id, "generate_url", False)
            raise

    def _verify_user_access(self, session_id: str, user_id: str) -> bool:
        """Verify user has access to video"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT 1 FROM video_interview_sessions 
                        WHERE id = %s AND (interviewer_id = %s OR candidate_id = %s)
                    """, (session_id, user_id, user_id))
                    
                    return cur.fetchone() is not None
                    
        except Exception as e:
            logger.error(f"Error verifying user access: {e}")
            return False

    def _get_video_metadata(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get video metadata from database"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT * FROM video_recordings 
                        WHERE session_id = %s AND status = %s
                    """, (session_id, StorageStatus.READY.value))
                    
                    result = cur.fetchone()
                    return dict(result) if result else None
                    
        except Exception as e:
            logger.error(f"Error getting video metadata: {e}")
            return None

    def _generate_video_access_token(self, session_id: str, user_id: str, 
                                   duration_hours: int) -> str:
        """Generate secure video access token"""
        try:
            payload = {
                'session_id': session_id,
                'user_id': user_id,
                'expires': int(time.time()) + (duration_hours * 3600),
                'permissions': ['stream', 'download']
            }
            
            # Create HMAC signature
            message = json.dumps(payload, sort_keys=True)
            signature = hmac.new(
                self.master_key.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Encode token
            token = base64.urlsafe_b64encode(
                json.dumps({**payload, 'signature': signature}).encode()
            ).decode()
            
            return token
            
        except Exception as e:
            logger.error(f"Error generating video access token: {e}")
            return "invalid_token"

    def _log_video_access(self, session_id: str, user_id: str, access_type: str, 
                         success: bool, duration_seconds: Optional[float] = None):
        """Log video access for audit trail"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO video_access_logs (
                            session_id, user_id, access_type, timestamp,
                            ip_address, user_agent, duration_seconds, success
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        session_id,
                        user_id,
                        access_type,
                        datetime.now(),
                        "127.0.0.1",  # Would get from request in production
                        "Mock User Agent",  # Would get from request in production
                        duration_seconds,
                        success
                    ))
                    
                    conn.commit()
                    
        except Exception as e:
            logger.error(f"Error logging video access: {e}")

    def get_qa_dashboard_data(self, user_id: str) -> Dict[str, Any]:
        """Get quality assurance dashboard data"""
        try:
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get QA statistics
                    cur.execute("""
                        SELECT 
                            COUNT(*) as total_videos,
                            COUNT(CASE WHEN vqa.video_quality = 'excellent' THEN 1 END) as excellent_quality,
                            COUNT(CASE WHEN vqa.video_quality = 'good' THEN 1 END) as good_quality,
                            COUNT(CASE WHEN vqa.video_quality = 'acceptable' THEN 1 END) as acceptable_quality,
                            COUNT(CASE WHEN vqa.video_quality = 'poor' THEN 1 END) as poor_quality,
                            AVG(vqa.technical_score) as avg_technical_score,
                            AVG(vqa.audio_quality) as avg_audio_quality
                        FROM video_recordings vr
                        LEFT JOIN video_quality_assessments vqa ON vr.session_id = vqa.session_id
                        WHERE vr.created_at >= NOW() - INTERVAL '30 days'
                    """)
                    
                    stats = cur.fetchone()
                    
                    # Get pending reviews
                    cur.execute("""
                        SELECT COUNT(*) as pending_reviews
                        FROM video_qa_status 
                        WHERE status = %s
                    """, (QAStatus.PENDING.value,))
                    
                    pending = cur.fetchone()
                    
                    return {
                        'statistics': dict(stats) if stats else {},
                        'pending_reviews': pending['pending_reviews'] if pending else 0,
                        'quality_distribution': {
                            'excellent': stats['excellent_quality'] if stats else 0,
                            'good': stats['good_quality'] if stats else 0,
                            'acceptable': stats['acceptable_quality'] if stats else 0,
                            'poor': stats['poor_quality'] if stats else 0
                        },
                        'performance_metrics': {
                            'avg_technical_score': float(stats['avg_technical_score'] or 0),
                            'avg_audio_quality': float(stats['avg_audio_quality'] or 0),
                            'total_videos_processed': stats['total_videos'] if stats else 0
                        }
                    }
                    
        except Exception as e:
            logger.error(f"Error getting QA dashboard data: {e}")
            return {'error': 'Failed to get QA dashboard data'}

    def archive_old_videos(self, days_old: int = 365) -> int:
        """Archive videos older than specified days"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            archived_count = 0
            
            with self.get_db_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Get videos to archive
                    cur.execute("""
                        SELECT file_id, storage_path FROM video_recordings 
                        WHERE created_at < %s AND status = %s
                    """, (cutoff_date, StorageStatus.READY.value))
                    
                    videos_to_archive = cur.fetchall()
                    
                    for video in videos_to_archive:
                        # Move to archive storage class
                        if self.s3_client:
                            try:
                                self.s3_client.copy_object(
                                    CopySource={'Bucket': self.s3_bucket, 'Key': video['storage_path']},
                                    Bucket=self.s3_bucket,
                                    Key=video['storage_path'],
                                    StorageClass='GLACIER'
                                )
                            except ClientError:
                                continue
                        
                        # Update status
                        cur.execute("""
                            UPDATE video_recordings 
                            SET status = %s, updated_at = %s
                            WHERE file_id = %s
                        """, (StorageStatus.ARCHIVED.value, datetime.now(), video['file_id']))
                        
                        archived_count += 1
                    
                    conn.commit()
                    
            logger.info(f"Archived {archived_count} videos")
            return archived_count
            
        except Exception as e:
            logger.error(f"Error archiving old videos: {e}")
            return 0

# Initialize the Secure Video Storage System
video_storage_qa_system = SecureVideoStorageSystem()
