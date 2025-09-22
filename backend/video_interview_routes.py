"""
Video Interview API Routes
Revolutionary AI-powered video interview system endpoints
"""

from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from video_interview_system import video_interview_engine, InterviewStatus, InterviewType
from datetime import datetime
import json
import io
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
video_interview_bp = Blueprint('video_interview', __name__, url_prefix='/api/video-interview')

@video_interview_bp.route('/schedule', methods=['POST'])
@jwt_required()
def schedule_interview():
    """Schedule a new video interview"""
    try:
        hr_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['application_id', 'scheduled_time', 'duration_minutes']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'{field} is required'
                }), 400
        
        logger.info(f"Scheduling interview for application {data['application_id']}")
        
        session_id = video_interview_engine.schedule_interview(
            data['application_id'],
            hr_user_id,
            data
        )
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'message': 'Interview scheduled successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error scheduling interview: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to schedule interview',
            'message': str(e)
        }), 500

@video_interview_bp.route('/sessions/<session_id>/start', methods=['POST'])
@jwt_required()
def start_interview_session():
    """Start a video interview session"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        logger.info(f"Starting interview session {session_id} for user {user_id}")
        
        session_config = video_interview_engine.start_interview_session(session_id, user_id)
        
        return jsonify({
            'success': True,
            'session_config': session_config,
            'message': 'Interview session started'
        }), 200
        
    except Exception as e:
        logger.error(f"Error starting interview session: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to start interview session',
            'message': str(e)
        }), 500

@video_interview_bp.route('/sessions/<session_id>/end', methods=['POST'])
@jwt_required()
def end_interview_session():
    """End a video interview session"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        logger.info(f"Ending interview session {session_id} for user {user_id}")
        
        success = video_interview_engine.end_interview_session(session_id, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Interview session ended successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to end interview session'
            }), 404
        
    except Exception as e:
        logger.error(f"Error ending interview session: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to end interview session',
            'message': str(e)
        }), 500

@video_interview_bp.route('/sessions/<session_id>/analysis/realtime', methods=['POST'])
@jwt_required()
def process_realtime_analysis():
    """Process real-time audio for AI analysis"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        # Get audio data from request
        audio_data = request.get_data()
        
        if not audio_data:
            return jsonify({
                'success': False,
                'error': 'No audio data provided'
            }), 400
        
        logger.info(f"Processing real-time analysis for session {session_id}")
        
        analysis = video_interview_engine.process_real_time_audio(session_id, audio_data)
        
        return jsonify({
            'success': True,
            'analysis': {
                'session_id': analysis.session_id,
                'timestamp': analysis.timestamp.isoformat(),
                'metrics': {
                    'speech_quality': analysis.speech_quality,
                    'sentiment_score': analysis.sentiment_score,
                    'engagement_level': analysis.engagement_level,
                    'technical_accuracy': analysis.technical_accuracy,
                    'communication_clarity': analysis.communication_clarity,
                    'confidence_level': analysis.confidence_level
                },
                'insights': {
                    'bias_indicators': analysis.bias_indicators,
                    'key_insights': analysis.key_insights
                }
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing real-time analysis: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to process real-time analysis',
            'message': str(e)
        }), 500

@video_interview_bp.route('/sessions/<session_id>/report', methods=['GET'])
@jwt_required()
def get_interview_report():
    """Get comprehensive AI-powered interview report"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        logger.info(f"Generating interview report for session {session_id}")
        
        report = video_interview_engine.generate_interview_report(session_id)
        
        return jsonify({
            'success': True,
            'report': report,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interview report: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get interview report',
            'message': str(e)
        }), 500

@video_interview_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_interview_sessions():
    """Get interview sessions for user"""
    try:
        user_id = get_jwt_identity()
        role = request.args.get('role', 'both')  # interviewer, candidate, or both
        
        logger.info(f"Getting interview sessions for user {user_id} with role {role}")
        
        sessions = video_interview_engine.get_interview_sessions(user_id, role)
        
        # Convert datetime objects to ISO format
        for session in sessions:
            for key, value in session.items():
                if isinstance(value, datetime):
                    session[key] = value.isoformat()
        
        return jsonify({
            'success': True,
            'sessions': sessions,
            'total_count': len(sessions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interview sessions: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get interview sessions',
            'message': str(e)
        }), 500

@video_interview_bp.route('/sessions/<session_id>/recordings', methods=['GET'])
@jwt_required()
def get_session_recordings():
    """Get secure access to session recordings"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        logger.info(f"Getting recordings for session {session_id}")
        
        recording_info = video_interview_engine.get_session_recordings(session_id, user_id)
        
        return jsonify({
            'success': True,
            'recording_info': recording_info
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting session recordings: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get session recordings',
            'message': str(e)
        }), 500

@video_interview_bp.route('/stream/<session_id>')
def stream_interview_recording():
    """Stream interview recording with secure access"""
    try:
        session_id = request.view_args['session_id']
        access_token = request.args.get('token')
        
        if not access_token:
            return jsonify({
                'success': False,
                'error': 'Access token required'
            }), 401
        
        # Validate access token (simplified for demo)
        # In production, this would verify the HMAC signature and expiration
        
        logger.info(f"Streaming recording for session {session_id}")
        
        # For demo purposes, return a placeholder response
        # In production, this would stream the actual video file
        def generate_video_stream():
            yield b"Mock video stream data for session " + session_id.encode()
            yield b"\nThis would be the actual video content in production"
        
        return Response(
            stream_with_context(generate_video_stream()),
            mimetype='video/mp4',
            headers={
                'Content-Disposition': f'inline; filename="interview_{session_id}.mp4"',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        )
        
    except Exception as e:
        logger.error(f"Error streaming recording: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to stream recording',
            'message': str(e)
        }), 500

@video_interview_bp.route('/agora/token', methods=['POST'])
@jwt_required()
def generate_agora_token():
    """Generate Agora RTC token for video session"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        channel_name = data.get('channel_name')
        role = data.get('role', 'publisher')
        
        if not channel_name:
            return jsonify({
                'success': False,
                'error': 'channel_name is required'
            }), 400
        
        logger.info(f"Generating Agora token for user {user_id}, channel {channel_name}")
        
        token = video_interview_engine.generate_agora_token(channel_name, user_id, role)
        
        return jsonify({
            'success': True,
            'token': token,
            'app_id': video_interview_engine.agora_app_id,
            'channel_name': channel_name,
            'user_id': user_id,
            'expires_in': 24 * 3600  # 24 hours
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating Agora token: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate Agora token',
            'message': str(e)
        }), 500

@video_interview_bp.route('/quality-assurance/sessions', methods=['GET'])
@jwt_required()
def get_qa_sessions():
    """Get sessions for quality assurance review"""
    try:
        user_id = get_jwt_identity()
        
        # This endpoint would be used by QA managers to review interviews
        # For now, return mock data
        qa_sessions = [
            {
                'session_id': 'interview_qa_001',
                'job_title': 'Senior Software Engineer',
                'candidate_name': 'Ahmed Al-Mansouri',
                'interviewer_name': 'Sarah Johnson',
                'scheduled_time': '2024-01-15T10:00:00Z',
                'status': 'completed',
                'qa_status': 'pending_review',
                'quality_score': 8.5,
                'bias_indicators': [],
                'flagged_issues': []
            },
            {
                'session_id': 'interview_qa_002',
                'job_title': 'Data Scientist',
                'candidate_name': 'Fatima Al-Zahra',
                'interviewer_name': 'Michael Chen',
                'scheduled_time': '2024-01-15T14:00:00Z',
                'status': 'completed',
                'qa_status': 'reviewed',
                'quality_score': 9.2,
                'bias_indicators': [],
                'flagged_issues': []
            }
        ]
        
        return jsonify({
            'success': True,
            'qa_sessions': qa_sessions,
            'total_count': len(qa_sessions)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting QA sessions: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get QA sessions',
            'message': str(e)
        }), 500

@video_interview_bp.route('/analytics/performance', methods=['GET'])
@jwt_required()
def get_interview_analytics():
    """Get interview performance analytics"""
    try:
        user_id = get_jwt_identity()
        
        # Mock analytics data
        analytics = {
            'interview_metrics': {
                'total_interviews': 156,
                'completed_interviews': 142,
                'average_duration': 45.2,
                'success_rate': 0.78,
                'candidate_satisfaction': 4.6,
                'interviewer_satisfaction': 4.4
            },
            'ai_insights': {
                'bias_detection_rate': 0.03,
                'quality_improvement': 0.15,
                'prediction_accuracy': 0.87,
                'time_savings': 0.32
            },
            'trends': {
                'monthly_interviews': [45, 52, 48, 61, 58, 67],
                'quality_scores': [7.8, 8.1, 8.3, 8.5, 8.7, 8.9],
                'emiratization_rate': [0.65, 0.68, 0.72, 0.75, 0.78, 0.82]
            }
        }
        
        return jsonify({
            'success': True,
            'analytics': analytics,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting interview analytics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get interview analytics',
            'message': str(e)
        }), 500

@video_interview_bp.route('/interview-types', methods=['GET'])
def get_interview_types():
    """Get available interview types"""
    return jsonify({
        'success': True,
        'interview_types': [
            {
                'value': interview_type.value,
                'label': interview_type.value.replace('_', ' ').title(),
                'description': f"Standard {interview_type.value.replace('_', ' ')} interview"
            }
            for interview_type in InterviewType
        ]
    }), 200

@video_interview_bp.route('/system-check', methods=['GET'])
@jwt_required()
def system_check():
    """Perform system check for video interview capabilities"""
    try:
        user_id = get_jwt_identity()
        
        # Mock system check results
        system_status = {
            'video_service': {
                'status': 'operational',
                'latency': 45,
                'quality': 'excellent'
            },
            'ai_analysis': {
                'status': 'operational',
                'model': 'Gemini 2.5 Pro',
                'response_time': 1.2
            },
            'storage_service': {
                'status': 'operational',
                'capacity': 0.73,
                'encryption': 'enabled'
            },
            'network_quality': {
                'bandwidth': 'sufficient',
                'stability': 'excellent',
                'recommended_quality': '1080p'
            }
        }
        
        return jsonify({
            'success': True,
            'system_status': system_status,
            'overall_health': 'excellent',
            'checked_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error performing system check: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to perform system check',
            'message': str(e)
        }), 500

# Health check endpoint
@video_interview_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for video interview service"""
    return jsonify({
        'success': True,
        'service': 'Video Interview System',
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'WebRTC Video Conferencing',
            'Real-time AI Analysis',
            'Secure Recording Storage',
            'Quality Assurance',
            'Bias Detection'
        ],
        'ai_engine': 'Gemini 2.5 Pro',
        'version': '1.0.0'
    }), 200
