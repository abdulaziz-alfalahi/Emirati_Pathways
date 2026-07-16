"""
Mentor Routes for Emirati Journey Platform
API endpoints for mentor profile management and operations
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from typing import Dict, Any, Optional
import json

from mentor_system import (
    mentor_system,
    ExpertiseArea,
    MentorshipLevel,
    MentorshipType,
    AvailabilityStatus
)

try:
    from backend.auth.access_control import require_roles, OPERATOR_ROLES
except ImportError:
    from auth.access_control import require_roles, OPERATOR_ROLES

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
mentor_bp = Blueprint('mentor', __name__, url_prefix='/api/mentor')

@mentor_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        stats = mentor_system.get_mentor_statistics()
        
        return jsonify({
            'status': 'healthy',
            'service': 'Mentor System',
            'timestamp': datetime.now().isoformat(),
            'statistics': stats,
            'features': {
                'profile_management': True,
                'expertise_tracking': True,
                'availability_management': True,
                'uae_cultural_intelligence': True,
                'emiratization_support': True,
                'multi_language': True
            }
        })
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@mentor_bp.route('/profile', methods=['POST'])
def create_mentor_profile():
    """Create a new mentor profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No profile data provided',
                'message': 'Mentor profile data is required'
            }), 400
        
        # Validate required fields
        required_fields = ['user_id', 'full_name', 'email', 'current_position', 'company', 'industry', 'total_experience_years']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}',
                    'message': f'Field {field} is required for mentor profile creation'
                }), 400
        
        # Create mentor profile
        mentor_id = mentor_system.create_mentor_profile(data)
        
        # Get created profile
        mentor_profile = mentor_system.get_mentor_profile(mentor_id)
        
        return jsonify({
            'success': True,
            'mentor_id': mentor_id,
            'profile': mentor_profile.to_dict() if mentor_profile else None,
            'message': 'Mentor profile created successfully'
        })
        
    except Exception as e:
        logger.error(f"Error creating mentor profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to create mentor profile'
        }), 500

@mentor_bp.route('/profile/<mentor_id>', methods=['GET'])
def get_mentor_profile(mentor_id: str):
    """Get mentor profile by ID"""
    try:
        mentor_profile = mentor_system.get_mentor_profile(mentor_id)
        
        if not mentor_profile:
            return jsonify({
                'success': False,
                'error': 'Mentor not found',
                'message': f'Mentor with ID {mentor_id} not found'
            }), 404
        
        return jsonify({
            'success': True,
            'profile': mentor_profile.to_dict(),
            'message': 'Mentor profile retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting mentor profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to retrieve mentor profile'
        }), 500

@mentor_bp.route('/profile/<mentor_id>', methods=['PUT'])
def update_mentor_profile(mentor_id: str):
    """Update mentor profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No update data provided',
                'message': 'Update data is required'
            }), 400
        
        # Update mentor profile
        success = mentor_system.update_mentor_profile(mentor_id, data)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Mentor not found or update failed',
                'message': f'Failed to update mentor with ID {mentor_id}'
            }), 404
        
        # Get updated profile
        mentor_profile = mentor_system.get_mentor_profile(mentor_id)
        
        return jsonify({
            'success': True,
            'profile': mentor_profile.to_dict() if mentor_profile else None,
            'message': 'Mentor profile updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating mentor profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to update mentor profile'
        }), 500

@mentor_bp.route('/search', methods=['POST'])
def search_mentors():
    """Search mentors based on criteria"""
    try:
        data = request.get_json() or {}
        
        # Search mentors
        mentors = mentor_system.search_mentors(data)
        
        # Convert to dict format
        mentor_list = [mentor.to_dict() for mentor in mentors]
        
        return jsonify({
            'success': True,
            'mentors': mentor_list,
            'count': len(mentor_list),
            'message': f'Found {len(mentor_list)} mentors matching criteria'
        })
        
    except Exception as e:
        logger.error(f"Error searching mentors: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to search mentors'
        }), 500

@mentor_bp.route('/available', methods=['GET'])
def get_available_mentors():
    """Get available mentors"""
    try:
        # Get expertise area filter if provided
        expertise_area = request.args.get('expertise_area')
        expertise_filter = None
        
        if expertise_area:
            try:
                expertise_filter = ExpertiseArea(expertise_area)
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid expertise area',
                    'message': f'Expertise area {expertise_area} is not valid'
                }), 400
        
        # Get available mentors
        mentors = mentor_system.get_available_mentors(expertise_filter)
        
        # Convert to dict format
        mentor_list = [mentor.to_dict() for mentor in mentors]
        
        return jsonify({
            'success': True,
            'mentors': mentor_list,
            'count': len(mentor_list),
            'message': f'Found {len(mentor_list)} available mentors'
        })
        
    except Exception as e:
        logger.error(f"Error getting available mentors: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get available mentors'
        }), 500

@mentor_bp.route('/uae-nationals', methods=['GET'])
def get_uae_national_mentors():
    """Get UAE national mentors for Emiratization support"""
    try:
        mentors = mentor_system.get_uae_national_mentors()
        
        # Convert to dict format
        mentor_list = [mentor.to_dict() for mentor in mentors]
        
        return jsonify({
            'success': True,
            'mentors': mentor_list,
            'count': len(mentor_list),
            'message': f'Found {len(mentor_list)} UAE national mentors'
        })
        
    except Exception as e:
        logger.error(f"Error getting UAE national mentors: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get UAE national mentors'
        }), 500

@mentor_bp.route('/statistics', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def get_mentor_statistics():
    """Get comprehensive mentor statistics"""
    try:
        stats = mentor_system.get_mentor_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'message': 'Mentor statistics retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting mentor statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get mentor statistics'
        }), 500

@mentor_bp.route('/expertise-areas', methods=['GET'])
def get_expertise_areas():
    """Get available expertise areas"""
    try:
        expertise_areas = [
            {
                'value': area.value,
                'label': area.value.replace('_', ' ').title(),
                'description': f'{area.value.replace("_", " ").title()} expertise area'
            }
            for area in ExpertiseArea
        ]
        
        return jsonify({
            'success': True,
            'expertise_areas': expertise_areas,
            'message': 'Expertise areas retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting expertise areas: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get expertise areas'
        }), 500

@mentor_bp.route('/mentorship-levels', methods=['GET'])
def get_mentorship_levels():
    """Get available mentorship levels"""
    try:
        levels = [
            {
                'value': level.value,
                'label': level.value.replace('_', ' ').title(),
                'description': f'{level.value.replace("_", " ").title()} mentorship level'
            }
            for level in MentorshipLevel
        ]
        
        return jsonify({
            'success': True,
            'mentorship_levels': levels,
            'message': 'Mentorship levels retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting mentorship levels: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get mentorship levels'
        }), 500

@mentor_bp.route('/mentorship-types', methods=['GET'])
def get_mentorship_types():
    """Get available mentorship types"""
    try:
        types = [
            {
                'value': mtype.value,
                'label': mtype.value.replace('_', ' ').title(),
                'description': f'{mtype.value.replace("_", " ").title()} mentorship type'
            }
            for mtype in MentorshipType
        ]
        
        return jsonify({
            'success': True,
            'mentorship_types': types,
            'message': 'Mentorship types retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting mentorship types: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get mentorship types'
        }), 500

@mentor_bp.route('/availability-statuses', methods=['GET'])
def get_availability_statuses():
    """Get available availability statuses"""
    try:
        statuses = [
            {
                'value': status.value,
                'label': status.value.title(),
                'description': f'{status.value.title()} availability status'
            }
            for status in AvailabilityStatus
        ]
        
        return jsonify({
            'success': True,
            'availability_statuses': statuses,
            'message': 'Availability statuses retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting availability statuses: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get availability statuses'
        }), 500

@mentor_bp.route('/dashboard/<mentor_id>', methods=['GET'])
def get_mentor_dashboard(mentor_id: str):
    """Get mentor dashboard data"""
    try:
        mentor_profile = mentor_system.get_mentor_profile(mentor_id)
        
        if not mentor_profile:
            return jsonify({
                'success': False,
                'error': 'Mentor not found',
                'message': f'Mentor with ID {mentor_id} not found'
            }), 404
        
        # Create dashboard data
        dashboard = {
            'mentor_info': {
                'name': mentor_profile.full_name,
                'position': mentor_profile.current_position,
                'company': mentor_profile.company,
                'rating': mentor_profile.rating,
                'total_mentees': mentor_profile.total_mentees,
                'successful_placements': mentor_profile.successful_placements
            },
            'availability': {
                'status': mentor_profile.availability.status.value,
                'current_mentees': mentor_profile.availability.current_mentees,
                'max_mentees': mentor_profile.availability.max_mentees,
                'hours_per_week': mentor_profile.availability.hours_per_week,
                'capacity_utilization': (mentor_profile.availability.current_mentees / mentor_profile.availability.max_mentees) * 100
            },
            'performance_metrics': {
                'session_completion_rate': mentor_profile.session_completion_rate,
                'response_time_hours': mentor_profile.response_time_hours,
                'rating': mentor_profile.rating,
                'testimonials_count': len(mentor_profile.testimonials)
            },
            'expertise_areas': [exp.area.value for exp in mentor_profile.primary_expertise],
            'mentorship_types': [mt.value for mt in mentor_profile.mentorship_types],
            'recent_activity': {
                'last_active': mentor_profile.last_active.isoformat(),
                'profile_updated': mentor_profile.updated_at.isoformat()
            }
        }
        
        return jsonify({
            'success': True,
            'dashboard': dashboard,
            'message': 'Mentor dashboard retrieved successfully'
        })
        
    except Exception as e:
        logger.error(f"Error getting mentor dashboard: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get mentor dashboard'
        }), 500

@mentor_bp.route('/profile/<mentor_id>/availability', methods=['PUT'])
def update_mentor_availability(mentor_id: str):
    """Update mentor availability"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No availability data provided',
                'message': 'Availability data is required'
            }), 400
        
        mentor_profile = mentor_system.get_mentor_profile(mentor_id)
        
        if not mentor_profile:
            return jsonify({
                'success': False,
                'error': 'Mentor not found',
                'message': f'Mentor with ID {mentor_id} not found'
            }), 404
        
        # Update availability fields
        availability_updates = {}
        if 'status' in data:
            availability_updates['availability'] = mentor_profile.availability
            availability_updates['availability'].status = AvailabilityStatus(data['status'])
        
        if 'hours_per_week' in data:
            if 'availability' not in availability_updates:
                availability_updates['availability'] = mentor_profile.availability
            availability_updates['availability'].hours_per_week = data['hours_per_week']
        
        if 'max_mentees' in data:
            if 'availability' not in availability_updates:
                availability_updates['availability'] = mentor_profile.availability
            availability_updates['availability'].max_mentees = data['max_mentees']
        
        # Update profile
        success = mentor_system.update_mentor_profile(mentor_id, availability_updates)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to update availability',
                'message': 'Could not update mentor availability'
            }), 500
        
        # Get updated profile
        updated_profile = mentor_system.get_mentor_profile(mentor_id)
        
        return jsonify({
            'success': True,
            'availability': updated_profile.availability.to_dict() if updated_profile else None,
            'message': 'Mentor availability updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating mentor availability: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to update mentor availability'
        }), 500

@mentor_bp.route('/list', methods=['GET'])
def list_mentors():
    """List all mentors with optional filtering"""
    try:
        # Get query parameters
        industry = request.args.get('industry')
        expertise_area = request.args.get('expertise_area')
        availability_status = request.args.get('availability_status')
        uae_national = request.args.get('uae_national')
        min_rating = request.args.get('min_rating')
        
        # Build search criteria
        criteria = {}
        if industry:
            criteria['industry'] = industry
        if expertise_area:
            criteria['expertise_area'] = expertise_area
        if availability_status:
            criteria['availability_status'] = availability_status
        if uae_national:
            criteria['uae_national'] = uae_national.lower() == 'true'
        if min_rating:
            try:
                criteria['min_rating'] = float(min_rating)
            except ValueError:
                pass
        
        # Search mentors
        mentors = mentor_system.search_mentors(criteria)
        
        # Convert to dict format
        mentor_list = [mentor.to_dict() for mentor in mentors]
        
        return jsonify({
            'success': True,
            'mentors': mentor_list,
            'count': len(mentor_list),
            'filters_applied': criteria,
            'message': f'Found {len(mentor_list)} mentors'
        })
        
    except Exception as e:
        logger.error(f"Error listing mentors: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to list mentors'
        }), 500

# ═══════════════════════════════════════════
# MENTORSHIP OPERATOR ENDPOINTS
# ═══════════════════════════════════════════

@mentor_bp.route('/operator/stats', methods=['GET'])
@require_roles(*OPERATOR_ROLES)
def mentorship_operator_stats():
    """Aggregate statistics for the Mentorship Operator Dashboard."""
    try:
        stats = mentor_system.get_mentor_statistics()
        all_mentors = mentor_system.search_mentors({})

        active_count = sum(1 for m in all_mentors if m.availability.status.value == 'available')
        total_mentees = sum(m.total_mentees for m in all_mentors)
        avg_rating = round(sum(m.rating for m in all_mentors if m.rating > 0) / max(len([m for m in all_mentors if m.rating > 0]), 1), 1)

        # Build mentor list summary for the Mentors tab
        mentor_list = []
        for m in all_mentors:
            mentor_list.append({
                'name': m.full_name,
                'expertise': [e.area.value.replace('_', ' ').title() for e in m.primary_expertise][:2],
                'company': m.company,
                'mentees': m.total_mentees,
                'rating': m.rating,
                'status': m.availability.status.value,
                'sessions': len(m.testimonials)
            })

        return jsonify({
            'success': True,
            'stats': {
                'total_mentors': len(all_mentors),
                'active_mentors': active_count,
                'total_mentee_pairs': total_mentees,
                'average_rating': avg_rating,
                'pending_matches': stats.get('pending_matches', 0),
            },
            'mentors': mentor_list,
            'message': 'Mentorship operator stats retrieved successfully'
        })

    except Exception as e:
        logger.error(f"Error getting mentorship operator stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to get mentorship operator stats'
        }), 500

# Error handlers
@mentor_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested mentor endpoint was not found'
    }), 404

@mentor_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'success': False,
        'error': 'Method not allowed',
        'message': 'The HTTP method is not allowed for this endpoint'
    }), 405

@mentor_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An internal error occurred in the mentor system'
    }), 500

logger.info("✅ Mentor routes loaded successfully")
