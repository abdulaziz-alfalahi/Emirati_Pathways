"""
Video Storage and Quality Assurance API Routes
Secure video storage, streaming, and QA management endpoints
"""

from flask import Blueprint, request, jsonify, Response, stream_with_context, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from video_storage_qa_system import video_storage_qa_system, StorageStatus, QAStatus, VideoQuality
from datetime import datetime
import json
import base64
import hmac
import hashlib
import tempfile
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
video_storage_bp = Blueprint('video_storage', __name__, url_prefix='/api/video-storage')

@video_storage_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_video():
    """Upload interview video recording"""
    try:
        user_id = get_jwt_identity()
        
        # Check if file is present
        if 'video' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No video file provided'
            }), 400
        
        video_file = request.files['video']
        session_id = request.form.get('session_id')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'session_id is required'
            }), 400
        
        if video_file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            video_file.save(temp_file.name)
            temp_file_path = temp_file.name
        
        try:
            # Store the video recording
            file_id = video_storage_qa_system.store_interview_recording(
                session_id=session_id,
                video_file_path=temp_file_path,
                metadata={
                    'uploaded_by': user_id,
                    'original_filename': video_file.filename,
                    'upload_timestamp': datetime.now().isoformat()
                }
            )
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'session_id': session_id,
                'message': 'Video uploaded successfully',
                'status': 'processing'
            }), 201
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        
    except Exception as e:
        logger.error(f"Error uploading video: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to upload video',
            'message': str(e)
        }), 500

@video_storage_bp.route('/sessions/<session_id>/access-url', methods=['POST'])
@jwt_required()
def generate_access_url():
    """Generate secure access URL for video"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        data = request.get_json() or {}
        
        access_duration_hours = data.get('access_duration_hours', 24)
        
        logger.info(f"Generating access URL for session {session_id}")
        
        access_info = video_storage_qa_system.get_secure_video_url(
            session_id=session_id,
            user_id=user_id,
            access_duration_hours=access_duration_hours
        )
        
        return jsonify({
            'success': True,
            'access_info': access_info
        }), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 403
    except Exception as e:
        logger.error(f"Error generating access URL: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate access URL',
            'message': str(e)
        }), 500

@video_storage_bp.route('/stream/<session_id>')
def stream_video():
    """Stream video with secure access token"""
    try:
        session_id = request.view_args['session_id']
        access_token = request.args.get('token')
        
        if not access_token:
            return jsonify({
                'success': False,
                'error': 'Access token required'
            }), 401
        
        # Validate access token
        if not video_storage_qa_system._validate_access_token(access_token, session_id):
            return jsonify({
                'success': False,
                'error': 'Invalid or expired access token'
            }), 401
        
        logger.info(f"Streaming video for session {session_id}")
        
        # In production, this would stream the actual decrypted video
        # For demo, return a mock video stream
        def generate_video_stream():
            yield b"Mock video stream data for session " + session_id.encode()
            yield b"\nThis would be the actual decrypted video content in production"
            yield b"\nStreaming with secure access control and audit logging"
        
        return Response(
            stream_with_context(generate_video_stream()),
            mimetype='video/mp4',
            headers={
                'Content-Disposition': f'inline; filename="interview_{session_id}.mp4"',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'X-Content-Type-Options': 'nosniff'
            }
        )
        
    except Exception as e:
        logger.error(f"Error streaming video: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to stream video',
            'message': str(e)
        }), 500

@video_storage_bp.route('/download/<session_id>')
def download_video():
    """Download video with secure access token"""
    try:
        session_id = request.view_args['session_id']
        access_token = request.args.get('token')
        
        if not access_token:
            return jsonify({
                'success': False,
                'error': 'Access token required'
            }), 401
        
        # Validate access token
        if not video_storage_qa_system._validate_access_token(access_token, session_id):
            return jsonify({
                'success': False,
                'error': 'Invalid or expired access token'
            }), 401
        
        logger.info(f"Download requested for session {session_id}")
        
        # In production, this would return the actual decrypted video file
        # For demo, return a mock response
        return jsonify({
            'success': True,
            'message': 'Download would start here in production',
            'session_id': session_id,
            'note': 'This would trigger actual file download with proper security'
        }), 200
        
    except Exception as e:
        logger.error(f"Error downloading video: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to download video',
            'message': str(e)
        }), 500

@video_storage_bp.route('/sessions/<session_id>/status', methods=['GET'])
@jwt_required()
def get_video_status():
    """Get video processing and storage status"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        # Get video metadata and status
        video_metadata = video_storage_qa_system._get_video_metadata(session_id)
        
        if not video_metadata:
            return jsonify({
                'success': False,
                'error': 'Video not found'
            }), 404
        
        return jsonify({
            'success': True,
            'video_status': {
                'session_id': session_id,
                'file_id': video_metadata.get('file_id'),
                'status': video_metadata.get('status'),
                'duration_seconds': video_metadata.get('duration_seconds'),
                'resolution': video_metadata.get('resolution'),
                'file_size': video_metadata.get('file_size'),
                'created_at': video_metadata.get('created_at').isoformat() if video_metadata.get('created_at') else None,
                'processing_complete': video_metadata.get('status') == StorageStatus.READY.value
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting video status: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get video status',
            'message': str(e)
        }), 500

@video_storage_bp.route('/qa/dashboard', methods=['GET'])
@jwt_required()
def get_qa_dashboard():
    """Get quality assurance dashboard data"""
    try:
        user_id = get_jwt_identity()
        
        logger.info(f"Getting QA dashboard data for user {user_id}")
        
        dashboard_data = video_storage_qa_system.get_qa_dashboard_data(user_id)
        
        return jsonify({
            'success': True,
            'dashboard_data': dashboard_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting QA dashboard: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get QA dashboard data',
            'message': str(e)
        }), 500

@video_storage_bp.route('/qa/sessions/<session_id>/review', methods=['POST'])
@jwt_required()
def submit_qa_review():
    """Submit quality assurance review"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['video_quality', 'technical_score', 'reviewer_notes']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        # Create quality assessment
        from video_storage_qa_system import QualityAssessment, VideoQuality
        
        try:
            video_quality = VideoQuality(data['video_quality'])
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid video_quality value'
            }), 400
        
        assessment = QualityAssessment(
            session_id=session_id,
            video_quality=video_quality,
            audio_quality=data.get('audio_quality', 0.8),
            technical_score=data['technical_score'],
            content_appropriateness=data.get('content_appropriateness', 1.0),
            bias_indicators=data.get('bias_indicators', []),
            flagged_content=data.get('flagged_content', []),
            recommendations=data.get('recommendations', []),
            reviewer_notes=data['reviewer_notes'],
            assessed_at=datetime.now(),
            assessed_by=user_id
        )
        
        # Store the assessment
        video_storage_qa_system._store_quality_assessment(assessment)
        
        # Update QA status based on assessment
        if video_quality in [VideoQuality.POOR, VideoQuality.UNACCEPTABLE]:
            qa_status = QAStatus.FLAGGED
        elif len(data.get('bias_indicators', [])) > 0:
            qa_status = QAStatus.REQUIRES_ATTENTION
        else:
            qa_status = QAStatus.APPROVED
        
        video_storage_qa_system._update_qa_status(session_id, qa_status)
        
        logger.info(f"QA review submitted for session {session_id}")
        
        return jsonify({
            'success': True,
            'message': 'QA review submitted successfully',
            'assessment': {
                'session_id': session_id,
                'video_quality': video_quality.value,
                'qa_status': qa_status.value,
                'reviewed_by': user_id,
                'reviewed_at': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error submitting QA review: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to submit QA review',
            'message': str(e)
        }), 500

@video_storage_bp.route('/qa/pending-reviews', methods=['GET'])
@jwt_required()
def get_pending_reviews():
    """Get pending QA reviews"""
    try:
        user_id = get_jwt_identity()
        
        # Mock pending reviews data
        pending_reviews = [
            {
                'session_id': 'session_001',
                'candidate_name': 'Ahmed Al-Mansouri',
                'job_title': 'Senior Software Engineer',
                'interview_date': '2024-01-15T10:00:00Z',
                'duration_minutes': 45,
                'priority': 'high',
                'flagged_issues': ['Audio quality concerns'],
                'assigned_reviewer': user_id
            },
            {
                'session_id': 'session_002',
                'candidate_name': 'Fatima Al-Zahra',
                'job_title': 'Data Scientist',
                'interview_date': '2024-01-15T14:00:00Z',
                'duration_minutes': 38,
                'priority': 'normal',
                'flagged_issues': [],
                'assigned_reviewer': user_id
            }
        ]
        
        return jsonify({
            'success': True,
            'pending_reviews': pending_reviews,
            'total_count': len(pending_reviews)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting pending reviews: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get pending reviews',
            'message': str(e)
        }), 500

@video_storage_bp.route('/analytics/storage', methods=['GET'])
@jwt_required()
def get_storage_analytics():
    """Get storage analytics and metrics"""
    try:
        user_id = get_jwt_identity()
        
        # Mock storage analytics
        analytics = {
            'storage_metrics': {
                'total_videos': 1247,
                'total_storage_gb': 2847.5,
                'average_video_size_mb': 234.8,
                'storage_growth_rate': 0.15,  # 15% monthly growth
                'archived_videos': 892,
                'active_videos': 355
            },
            'quality_metrics': {
                'excellent_quality_rate': 0.78,
                'good_quality_rate': 0.18,
                'acceptable_quality_rate': 0.03,
                'poor_quality_rate': 0.01,
                'average_technical_score': 8.7,
                'average_audio_quality': 8.9
            },
            'access_metrics': {
                'total_video_views': 3456,
                'average_views_per_video': 2.8,
                'download_requests': 234,
                'streaming_hours': 1847.3,
                'unique_viewers': 567
            },
            'compliance_metrics': {
                'encryption_compliance': 1.0,
                'access_control_compliance': 1.0,
                'audit_trail_completeness': 1.0,
                'retention_policy_compliance': 0.98
            },
            'cost_metrics': {
                'monthly_storage_cost_usd': 847.32,
                'bandwidth_cost_usd': 123.45,
                'processing_cost_usd': 234.56,
                'total_monthly_cost_usd': 1205.33
            }
        }
        
        return jsonify({
            'success': True,
            'analytics': analytics,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting storage analytics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get storage analytics',
            'message': str(e)
        }), 500

@video_storage_bp.route('/archive/old-videos', methods=['POST'])
@jwt_required()
def archive_old_videos():
    """Archive old videos to reduce storage costs"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        days_old = data.get('days_old', 365)  # Default to 1 year
        
        logger.info(f"Archiving videos older than {days_old} days")
        
        archived_count = video_storage_qa_system.archive_old_videos(days_old)
        
        return jsonify({
            'success': True,
            'message': f'Successfully archived {archived_count} videos',
            'archived_count': archived_count,
            'days_old_threshold': days_old,
            'archived_by': user_id,
            'archived_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error archiving old videos: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to archive old videos',
            'message': str(e)
        }), 500

@video_storage_bp.route('/audit/access-logs', methods=['GET'])
@jwt_required()
def get_access_logs():
    """Get video access audit logs"""
    try:
        user_id = get_jwt_identity()
        
        # Query parameters
        session_id = request.args.get('session_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = int(request.args.get('limit', 100))
        
        # Mock access logs
        access_logs = [
            {
                'session_id': 'session_001',
                'user_id': 'hr_001',
                'access_type': 'stream',
                'timestamp': '2024-01-15T10:30:00Z',
                'ip_address': '192.168.1.100',
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'duration_seconds': 2847,
                'success': True
            },
            {
                'session_id': 'session_001',
                'user_id': 'candidate_001',
                'access_type': 'download',
                'timestamp': '2024-01-15T15:45:00Z',
                'ip_address': '192.168.1.101',
                'user_agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                'duration_seconds': None,
                'success': True
            }
        ]
        
        return jsonify({
            'success': True,
            'access_logs': access_logs,
            'total_count': len(access_logs),
            'filters': {
                'session_id': session_id,
                'start_date': start_date,
                'end_date': end_date,
                'limit': limit
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting access logs: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get access logs',
            'message': str(e)
        }), 500

# Health check endpoint
@video_storage_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for video storage service"""
    return jsonify({
        'success': True,
        'service': 'Video Storage & QA System',
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Secure Video Storage',
            'Encrypted File Management',
            'Quality Assurance Workflows',
            'Access Control & Audit Logging',
            'Video Streaming & Download',
            'Automated Archival',
            'Storage Analytics'
        ],
        'security': {
            'encryption': 'AES-256',
            'access_control': 'HMAC-based tokens',
            'audit_logging': 'Complete access trail',
            'compliance': 'UAE data protection standards'
        },
        'version': '1.0.0'
    }), 200
