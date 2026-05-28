"""
AI Analysis API Routes
Advanced real-time AI analysis endpoints for interview monitoring
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from ai_analysis_engine import ai_analysis_engine, AnalysisType, BiasType
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
ai_analysis_bp = Blueprint('ai_analysis', __name__, url_prefix='/api/ai-analysis')

@ai_analysis_bp.route('/sessions/<session_id>/start-monitoring', methods=['POST'])
@jwt_required()
def start_session_monitoring():
    """Start real-time AI monitoring for interview session"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        data = request.get_json()
        
        participants = data.get('participants', [])
        if not participants:
            return jsonify({
                'success': False,
                'error': 'participants list is required'
            }), 400
        
        logger.info(f"Starting AI monitoring for session {session_id}")
        
        success = ai_analysis_engine.start_session_monitoring(session_id, participants)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'AI monitoring started successfully',
                'session_id': session_id,
                'monitoring_features': [
                    'Real-time speech analysis',
                    'Sentiment monitoring',
                    'Bias detection',
                    'Engagement tracking',
                    'Performance assessment',
                    'Cultural fit analysis'
                ]
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to start AI monitoring'
            }), 500
        
    except Exception as e:
        logger.error(f"Error starting session monitoring: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to start session monitoring',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/sessions/<session_id>/stop-monitoring', methods=['POST'])
@jwt_required()
def stop_session_monitoring():
    """Stop AI monitoring and get final analysis"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        logger.info(f"Stopping AI monitoring for session {session_id}")
        
        final_analysis = ai_analysis_engine.stop_session_monitoring(session_id)
        
        return jsonify({
            'success': True,
            'message': 'AI monitoring stopped successfully',
            'final_analysis': final_analysis
        }), 200
        
    except Exception as e:
        logger.error(f"Error stopping session monitoring: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to stop session monitoring',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/sessions/<session_id>/process-audio', methods=['POST'])
@jwt_required()
def process_audio_chunk():
    """Process audio chunk for real-time analysis"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        # Get audio data and metadata
        audio_data = request.get_data()
        speaker_id = request.headers.get('X-Speaker-ID', user_id)
        timestamp = datetime.now()
        
        if not audio_data:
            return jsonify({
                'success': False,
                'error': 'No audio data provided'
            }), 400
        
        logger.info(f"Processing audio chunk for session {session_id}")
        
        metrics = ai_analysis_engine.process_audio_chunk(
            session_id, audio_data, speaker_id, timestamp
        )
        
        return jsonify({
            'success': True,
            'metrics': {
                'session_id': metrics.session_id,
                'timestamp': metrics.timestamp.isoformat(),
                'speech_quality': metrics.speech_quality,
                'sentiment_score': metrics.sentiment_score,
                'engagement_level': metrics.engagement_level,
                'technical_accuracy': metrics.technical_accuracy,
                'communication_clarity': metrics.communication_clarity,
                'confidence_level': metrics.confidence_level,
                'stress_indicators': metrics.stress_indicators,
                'cultural_alignment': metrics.cultural_alignment,
                'bias_risk_score': metrics.bias_risk_score,
                'overall_performance': metrics.overall_performance
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error processing audio chunk: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to process audio chunk',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/sessions/<session_id>/analysis', methods=['GET'])
@jwt_required()
def get_session_analysis():
    """Get comprehensive session analysis"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        logger.info(f"Getting analysis for session {session_id}")
        
        analysis = ai_analysis_engine.get_session_analysis(session_id)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting session analysis: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get session analysis',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/sessions/<session_id>/realtime-metrics', methods=['GET'])
@jwt_required()
def get_realtime_metrics():
    """Get current real-time metrics for active session"""
    try:
        user_id = get_jwt_identity()
        session_id = request.view_args['session_id']
        
        # Check if session is active
        if session_id not in ai_analysis_engine.active_sessions:
            return jsonify({
                'success': False,
                'error': 'Session not found or not active'
            }), 404
        
        session_data = ai_analysis_engine.active_sessions[session_id]
        metrics_history = list(session_data['metrics_history'])
        
        # Get latest metrics
        latest_metrics = metrics_history[-1] if metrics_history else None
        
        # Get recent insights
        recent_insights = ai_analysis_engine.insights_cache.get(session_id, [])[-5:]
        
        # Get bias alerts
        bias_alerts = ai_analysis_engine.bias_alerts.get(session_id, [])
        
        response_data = {
            'session_id': session_id,
            'status': session_data['status'],
            'start_time': session_data['start_time'].isoformat(),
            'total_data_points': len(metrics_history),
            'latest_metrics': {
                'timestamp': latest_metrics.timestamp.isoformat(),
                'speech_quality': latest_metrics.speech_quality,
                'sentiment_score': latest_metrics.sentiment_score,
                'engagement_level': latest_metrics.engagement_level,
                'technical_accuracy': latest_metrics.technical_accuracy,
                'communication_clarity': latest_metrics.communication_clarity,
                'confidence_level': latest_metrics.confidence_level,
                'stress_indicators': latest_metrics.stress_indicators,
                'cultural_alignment': latest_metrics.cultural_alignment,
                'bias_risk_score': latest_metrics.bias_risk_score,
                'overall_performance': latest_metrics.overall_performance
            } if latest_metrics else None,
            'recent_insights': [
                {
                    'timestamp': insight.timestamp.isoformat(),
                    'category': insight.category,
                    'insight': insight.insight,
                    'confidence': insight.confidence,
                    'impact': insight.impact,
                    'actionable': insight.actionable
                }
                for insight in recent_insights
            ],
            'bias_alerts': [
                {
                    'timestamp': alert.timestamp.isoformat(),
                    'bias_type': alert.bias_type.value,
                    'severity': alert.severity,
                    'description': alert.description,
                    'recommendation': alert.recommendation,
                    'confidence': alert.confidence
                }
                for alert in bias_alerts
            ]
        }
        
        return jsonify({
            'success': True,
            'realtime_data': response_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting real-time metrics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get real-time metrics',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/bias-detection/configure', methods=['POST'])
@jwt_required()
def configure_bias_detection():
    """Configure bias detection parameters"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Configuration options
        sensitivity = data.get('sensitivity', 'medium')  # low, medium, high
        bias_types = data.get('bias_types', [bt.value for bt in BiasType])
        alert_threshold = data.get('alert_threshold', 0.7)
        
        # Store configuration (in production, this would be stored in database)
        config = {
            'user_id': user_id,
            'sensitivity': sensitivity,
            'bias_types': bias_types,
            'alert_threshold': alert_threshold,
            'configured_at': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': 'Bias detection configured successfully',
            'configuration': config
        }), 200
        
    except Exception as e:
        logger.error(f"Error configuring bias detection: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to configure bias detection',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/quality-assurance/review', methods=['POST'])
@jwt_required()
def submit_qa_review():
    """Submit quality assurance review for interview"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        session_id = data.get('session_id')
        qa_score = data.get('qa_score')  # 1-10
        qa_notes = data.get('qa_notes', '')
        approved = data.get('approved', False)
        
        if not session_id or qa_score is None:
            return jsonify({
                'success': False,
                'error': 'session_id and qa_score are required'
            }), 400
        
        # Store QA review (mock implementation)
        qa_review = {
            'session_id': session_id,
            'reviewer_id': user_id,
            'qa_score': qa_score,
            'qa_notes': qa_notes,
            'approved': approved,
            'reviewed_at': datetime.now().isoformat()
        }
        
        logger.info(f"QA review submitted for session {session_id}")
        
        return jsonify({
            'success': True,
            'message': 'QA review submitted successfully',
            'review': qa_review
        }), 200
        
    except Exception as e:
        logger.error(f"Error submitting QA review: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to submit QA review',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/analytics/bias-trends', methods=['GET'])
@jwt_required()
def get_bias_trends():
    """Get bias detection trends and analytics"""
    try:
        user_id = get_jwt_identity()
        
        # Mock bias trends data
        bias_trends = {
            'overall_bias_rate': 0.03,  # 3% of interviews show bias indicators
            'trend_direction': 'decreasing',  # improving over time
            'bias_types_distribution': {
                'gender_bias': 0.01,
                'cultural_bias': 0.008,
                'age_bias': 0.005,
                'accent_bias': 0.012,
                'appearance_bias': 0.003,
                'educational_bias': 0.001
            },
            'monthly_trends': [
                {'month': '2024-01', 'bias_rate': 0.05},
                {'month': '2024-02', 'bias_rate': 0.04},
                {'month': '2024-03', 'bias_rate': 0.03},
                {'month': '2024-04', 'bias_rate': 0.03},
                {'month': '2024-05', 'bias_rate': 0.02}
            ],
            'interviewer_performance': {
                'best_performers': [
                    {'interviewer_id': 'hr_001', 'bias_rate': 0.01},
                    {'interviewer_id': 'hr_002', 'bias_rate': 0.015}
                ],
                'needs_training': [
                    {'interviewer_id': 'hr_003', 'bias_rate': 0.08}
                ]
            },
            'recommendations': [
                'Continue bias awareness training',
                'Implement structured interview guides',
                'Regular calibration sessions for interviewers'
            ]
        }
        
        return jsonify({
            'success': True,
            'bias_trends': bias_trends,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting bias trends: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get bias trends',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/performance/benchmarks', methods=['GET'])
@jwt_required()
def get_performance_benchmarks():
    """Get AI analysis performance benchmarks"""
    try:
        user_id = get_jwt_identity()
        
        # Mock performance benchmarks
        benchmarks = {
            'accuracy_metrics': {
                'speech_recognition_accuracy': 0.95,
                'sentiment_analysis_accuracy': 0.89,
                'bias_detection_accuracy': 0.92,
                'technical_assessment_accuracy': 0.87,
                'cultural_fit_accuracy': 0.91
            },
            'processing_metrics': {
                'average_processing_time': 1.2,  # seconds
                'real_time_latency': 0.3,  # seconds
                'analysis_completeness': 0.98,
                'uptime': 0.999
            },
            'prediction_accuracy': {
                'hiring_success_prediction': 0.84,
                'performance_prediction': 0.79,
                'cultural_fit_prediction': 0.88,
                'retention_prediction': 0.76
            },
            'improvement_trends': {
                'accuracy_improvement': 0.15,  # 15% improvement over 6 months
                'speed_improvement': 0.23,  # 23% faster processing
                'bias_reduction': 0.45  # 45% reduction in bias incidents
            }
        }
        
        return jsonify({
            'success': True,
            'benchmarks': benchmarks,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting performance benchmarks: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get performance benchmarks',
            'message': str(e)
        }), 500

@ai_analysis_bp.route('/analysis-types', methods=['GET'])
def get_analysis_types():
    """Get available analysis types"""
    return jsonify({
        'success': True,
        'analysis_types': [
            {
                'value': analysis_type.value,
                'label': analysis_type.value.replace('_', ' ').title(),
                'description': f"AI-powered {analysis_type.value.replace('_', ' ')} analysis"
            }
            for analysis_type in AnalysisType
        ],
        'bias_types': [
            {
                'value': bias_type.value,
                'label': bias_type.value.replace('_', ' ').title(),
                'description': f"Detection of {bias_type.value.replace('_', ' ')} in interviews"
            }
            for bias_type in BiasType
        ]
    }), 200

# Health check endpoint
@ai_analysis_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for AI analysis service"""
    return jsonify({
        'success': True,
        'service': 'AI Analysis Engine',
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'features': [
            'Real-time Speech Analysis',
            'Sentiment Monitoring',
            'Bias Detection',
            'Engagement Tracking',
            'Performance Assessment',
            'Cultural Fit Analysis',
            'Quality Assurance',
            'Predictive Analytics'
        ],
        'ai_model': 'AI Engine',
        'version': '1.0.0'
    }), 200
