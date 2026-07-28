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

from flask_jwt_extended import jwt_required, get_jwt_identity

try:
    from backend.auth.access_control import require_roles, resolve_roles, OPERATOR_ROLES, ADMIN_ROLES
except ImportError:
    from auth.access_control import require_roles, resolve_roles, OPERATOR_ROLES, ADMIN_ROLES

# Who may act as a skill-verifying mentor / manage mentor profiles for others.
_MENTOR_ROLES = tuple(OPERATOR_ROLES | {'mentor'})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
mentor_bp = Blueprint('mentor', __name__, url_prefix='/api/mentor')


def _caller_owns_or_manages_mentor(mentor_id: str) -> bool:
    """True if the authenticated caller owns this mentor profile (its user_id
    matches) or holds a mentor/operator/admin role. Fails closed."""
    try:
        if resolve_roles() & set(_MENTOR_ROLES):
            return True
        caller = str(get_jwt_identity())
        profile = mentor_system.get_mentor_profile(mentor_id)
        owner = None
        if profile is not None:
            d = profile.to_dict() if hasattr(profile, 'to_dict') else {}
            owner = str(d.get('user_id')) if d.get('user_id') is not None else None
        return owner is not None and owner == caller
    except Exception as e:
        logger.warning(f"mentor ownership check failed: {e}")
        return False


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
@jwt_required()
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

        # A user may only create their OWN mentor profile; operators/admins may
        # create on behalf of others (audit B1 — this route was anonymous).
        caller = str(get_jwt_identity())
        if not (resolve_roles() & set(_MENTOR_ROLES)):
            data['user_id'] = caller

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
@jwt_required()  # was unauthenticated — returned a mentor's full profile (PII) to anyone
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
@jwt_required()
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

        # Ownership: only the profile's own user, or an operator/admin, may
        # edit it (audit B1 — this route was anonymous + unscoped).
        if not _caller_owns_or_manages_mentor(mentor_id):
            return jsonify({'success': False, 'error': 'Forbidden',
                            'message': 'You may only edit your own mentor profile'}), 403

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
@jwt_required()  # was unauthenticated — exposed a mentor's dashboard/PII to anyone
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
@jwt_required()
def update_mentor_availability(mentor_id: str):
    """Update mentor availability"""
    try:
        if not _caller_owns_or_manages_mentor(mentor_id):
            return jsonify({'success': False, 'error': 'Forbidden',
                            'message': 'You may only edit your own mentor profile'}), 403
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

# ═══════════════════════════════════════════
# MENTOR PROGRESS / SKILL VERIFICATION
# (backed by mentor_skill_verifications, migration 017 — the frontend
#  MentorDashboard has always called these paths; they 404'd before)
# ═══════════════════════════════════════════

from flask_jwt_extended import jwt_required, get_jwt_identity  # noqa: E402

try:
    from backend.db_utils import execute_query as _msv_query
except ImportError:
    from db_utils import execute_query as _msv_query

import re as _re
try:
    from backend.user_helpers import user_display_name as _display_name
except ImportError:
    from user_helpers import user_display_name as _display_name
try:
    from backend.notification_helper import create_notification as _notify
except ImportError:  # pragma: no cover
    try:
        from notification_helper import create_notification as _notify
    except ImportError:
        _notify = None


def _safe_notify(user_id, ntype, title, message='', metadata=None):
    """Best-effort notification — a failure must never break the primary action."""
    try:
        if _notify and user_id:
            _notify(str(user_id), ntype, title, message, metadata or {})
    except Exception as _ne:
        logger.warning(f"notification '{ntype}' skipped: {_ne}")


_INCENTIVE_POINTS_PER_VERIFICATION = 10
_INCENTIVE_TIERS = [(200, 'Gold'), (80, 'Silver'), (0, 'Bronze')]


@mentor_bp.route('/progress/pending-verifications', methods=['GET'])
@require_roles(*_MENTOR_ROLES)
def pending_verifications():
    """Skill-verification requests awaiting a mentor decision."""
    try:
        rows = _msv_query(
            """SELECT v.id, v.skill_name, v.skill_level, v.skill_category,
                      TRIM(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS candidate_name,
                      v.requested_at
               FROM mentor_skill_verifications v
               JOIN users u ON u.id = v.candidate_id
               WHERE v.status = 'pending'
               ORDER BY v.requested_at ASC""") or []
        return jsonify({'success': True, 'pending': [{
            'skill_id': r['id'],
            'skill_name': r['skill_name'],
            'skill_level': r['skill_level'],
            'skill_category': r['skill_category'],
            'candidate_name': r['candidate_name'] or 'Candidate',
            'requested_at': r['requested_at'].isoformat() if r['requested_at'] else None,
        } for r in rows]})
    except Exception as e:
        logger.error(f"pending-verifications failed: {e}")
        return jsonify({'success': False, 'error': 'Failed to load pending verifications'}), 500


@mentor_bp.route('/progress/incentives', methods=['GET'])
@jwt_required()
def mentor_incentives():
    """Honest incentive figures derived from this mentor's real activity."""
    try:
        mentor_id = get_jwt_identity()
        rows = _msv_query(
            """SELECT id, skill_name, status, decided_at
               FROM mentor_skill_verifications
               WHERE mentor_id = %s AND status IN ('approved', 'rejected')
               ORDER BY decided_at DESC LIMIT 50""", (mentor_id,)) or []
        approved = sum(1 for r in rows if r['status'] == 'approved')
        points = approved * _INCENTIVE_POINTS_PER_VERIFICATION
        tier = next(name for threshold, name in _INCENTIVE_TIERS if points >= threshold)
        return jsonify({
            'success': True,
            'incentive_points': points,
            'incentive_tier': tier,
            'history': [{
                'skill_name': r['skill_name'],
                'action': r['status'],
                'points': _INCENTIVE_POINTS_PER_VERIFICATION if r['status'] == 'approved' else 0,
                'date': r['decided_at'].isoformat() if r['decided_at'] else None,
            } for r in rows],
        })
    except Exception as e:
        logger.error(f"incentives failed: {e}")
        return jsonify({'success': False, 'error': 'Failed to load incentives'}), 500


@mentor_bp.route('/progress/verify-skill', methods=['POST'])
@require_roles(*_MENTOR_ROLES)
def verify_skill():
    """Approve/reject a pending skill verification; approval stamps the
    candidate's career passport when one exists."""
    try:
        mentor_id = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        skill_id = data.get('skill_id')
        approved = bool(data.get('is_approved'))
        if not skill_id:
            return jsonify({'success': False, 'error': 'skill_id is required'}), 400
        row = _msv_query("SELECT id, candidate_id, mentor_id, skill_name, status "
                         "FROM mentor_skill_verifications WHERE id = %s",
                         (skill_id,), fetch_one=True)
        if not row:
            return jsonify({'success': False, 'error': 'Verification request not found'}), 404
        if row['status'] != 'pending':
            return jsonify({'success': False, 'error': 'Request already decided'}), 409
        # Authz (M1): a mentor may only verify a candidate they are actually linked
        # to — the request was assigned to them, OR they have an active mentorship
        # with that candidate. Otherwise any mentor could approve any candidate's
        # skill and stamp their passport (BOLA). Admins bypass.
        if not (resolve_roles() & ({'admin', 'administrator', 'super_admin', 'super_user',
                                    'platform_administrator'})):
            assigned = (row.get('mentor_id') or '').strip() in ('', str(mentor_id))
            # mentorship_matching.mentor_id is a UUID (mentor_profiles.id), so join
            # via mentor_profiles.user_id (the mentor's EID) rather than comparing
            # the EID to a uuid column.
            linked = _msv_query(
                "SELECT 1 FROM mentorship_matching mm "
                "JOIN mentor_profiles mp ON mp.id = mm.mentor_id "
                "WHERE mp.user_id = %s AND mm.mentee_user_id = %s "
                "AND COALESCE(mm.is_active, TRUE) IS TRUE LIMIT 1",
                (str(mentor_id), row['candidate_id']), fetch_one=True)
            if not (row.get('mentor_id') and assigned) and not linked:
                return jsonify({'success': False,
                                'error': 'You are not this candidate\'s mentor'}), 403
        new_status = 'approved' if approved else 'rejected'
        _msv_query(
            "UPDATE mentor_skill_verifications SET status = %s, mentor_id = %s, decided_at = NOW() WHERE id = %s",
            (new_status, mentor_id, skill_id), fetch_all=False)
        if approved:
            try:
                passport = _msv_query("SELECT id FROM career_passports WHERE user_id = %s",
                                      (row['candidate_id'],), fetch_one=True)
                if passport:
                    _msv_query(
                        """INSERT INTO passport_stamps (id, passport_id, category, title_en, title_ar,
                               description_en, issuer, icon, color, earned_at, verified)
                           VALUES (gen_random_uuid(), %s, 'skill', %s, %s,
                                   'Skill verified by a platform mentor', 'Mentor verification',
                                   'award', '#006E6D', NOW(), TRUE)""",
                        (passport['id'], row['skill_name'], row['skill_name']), fetch_all=False)
            except Exception as stamp_err:
                logger.warning(f"passport stamp on verification skipped: {stamp_err}")
            # C3-MEE-3: actually flip the candidate's skill to VERIFIED — a passport
            # stamp alone left user_skills self_reported/unverified forever, so the
            # core "mentor endorsement → verified skill" outcome never landed.
            # Mirrors the assessment flow (assessor_dashboard_api). Best-effort.
            try:
                cand = row['candidate_id']
                sname = row['skill_name']
                existing_sk = _msv_query(
                    "SELECT id FROM user_skills WHERE user_id = %s AND LOWER(skill_name) = LOWER(%s) LIMIT 1",
                    (cand, sname), fetch_one=True)
                if existing_sk:
                    _msv_query(
                        "UPDATE user_skills SET verified = TRUE, source = 'mentor', "
                        "last_assessed = NOW(), updated_at = NOW() WHERE id = %s",
                        (existing_sk['id'],), fetch_all=False)
                else:
                    slug = _re.sub(r'[^a-z0-9]+', '_', sname.lower()).strip('_') or sname.lower()
                    _msv_query(
                        "INSERT INTO user_skills (user_id, skill_id, skill_name, proficiency, source, "
                        "verified, last_assessed, created_at, updated_at) "
                        "VALUES (%s, %s, %s, 'intermediate', 'mentor', TRUE, NOW(), NOW(), NOW())",
                        (cand, 'mentor_' + slug, sname), fetch_all=False)
            except Exception as sk_err:
                logger.warning(f"user_skills verify flip skipped: {sk_err}")
            _safe_notify(row['candidate_id'], 'skill_verified', 'Skill verified',
                         f"Your skill \"{row['skill_name']}\" was verified by your mentor.",
                         {'skill_name': row['skill_name']})
        return jsonify({'success': True,
                        'message': 'Skill verified successfully' if approved else 'Skill verification rejected'})
    except Exception as e:
        logger.error(f"verify-skill failed: {e}")
        return jsonify({'success': False, 'error': 'Failed to process verification'}), 500

logger.info("✅ Mentor routes loaded successfully")


# ─────────────────────────────────────────────────────────────────────────────
# Mentorship enrollment operator (Cluster-3 M2). The mentorship_operator enrols
# mentors (persisted to the DB mentor_profiles — NOT the legacy in-memory store —
# so they appear in discovery/matching) and coaches (granted the coach role), and
# manages mentorship programs. Mirrors the education/training/assessment operator
# onboarding patterns. Guard: admin + mentorship_operator.
# ─────────────────────────────────────────────────────────────────────────────

_MENTOR_OPERATOR_ROLES = tuple(ADMIN_ROLES | {'mentorship_operator'})


def _grant_secondary_role(user_id, role):
    _msv_query(
        "UPDATE users SET secondary_roles = COALESCE(secondary_roles, '[]'::jsonb) "
        "|| jsonb_build_array(%s) WHERE id = %s "
        "AND NOT (COALESCE(secondary_roles, '[]'::jsonb) ? %s)",
        (role, str(user_id), role), fetch_all=False)


@mentor_bp.route('/operator/mentors', methods=['POST'])
@require_roles(*_MENTOR_OPERATOR_ROLES)
def operator_enrol_mentor():
    """Enrol/verify a mentor: upsert mentor_profiles (DB) + grant the mentor role."""
    data = request.get_json() or {}
    user_id = (data.get('user_id') or '').strip()
    if not user_id:
        return jsonify({'success': False, 'message': 'user_id is required'}), 400
    if not _msv_query("SELECT id FROM users WHERE id = %s", (user_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'User not found'}), 404
    expertise = json.dumps(data.get('expertise_areas') or [])
    specializations = json.dumps(data.get('mentoring_specializations') or [])
    existing = _msv_query("SELECT id FROM mentor_profiles WHERE user_id = %s", (user_id,), fetch_one=True)
    if existing:
        _msv_query(
            "UPDATE mentor_profiles SET professional_title=%s, industry=%s, "
            "years_of_experience=%s, expertise_areas=%s::jsonb, mentoring_specializations=%s::jsonb, "
            "is_available=TRUE, is_verified=TRUE, updated_at=NOW() WHERE user_id=%s",
            (data.get('professional_title'), data.get('industry'), data.get('years_of_experience'),
             expertise, specializations, user_id), fetch_all=False)
    else:
        _msv_query(
            "INSERT INTO mentor_profiles (user_id, professional_title, industry, years_of_experience, "
            "expertise_areas, mentoring_specializations, is_available, is_verified, created_at, updated_at) "
            "VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, TRUE, TRUE, NOW(), NOW())",
            (user_id, data.get('professional_title'), data.get('industry'),
             data.get('years_of_experience'), expertise, specializations), fetch_all=False)
    _grant_secondary_role(user_id, 'mentor')
    return jsonify({'success': True, 'message': f'{user_id} enrolled as a mentor',
                    'data': {'user_id': user_id}}), 201


@mentor_bp.route('/operator/mentors', methods=['GET'])
@require_roles(*_MENTOR_OPERATOR_ROLES)
def operator_list_mentors():
    rows = _msv_query(
        f"SELECT mp.user_id, {_display_name('full_name', 'u')}, mp.professional_title, "
        "mp.industry, mp.expertise_areas, mp.is_available, mp.is_verified "
        "FROM mentor_profiles mp LEFT JOIN users u ON u.id = mp.user_id "
        "ORDER BY mp.updated_at DESC NULLS LAST") or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@mentor_bp.route('/operator/mentors/<user_id>', methods=['DELETE'])
@require_roles(*_MENTOR_OPERATOR_ROLES)
def operator_remove_mentor(user_id):
    """Retire a mentor (unavailable + unverified; role left intact)."""
    _msv_query("UPDATE mentor_profiles SET is_available=FALSE, is_verified=FALSE, updated_at=NOW() "
               "WHERE user_id=%s", (str(user_id).strip(),), fetch_all=False)
    return jsonify({'success': True, 'message': 'Mentor retired'})


@mentor_bp.route('/operator/coaches', methods=['POST'])
@require_roles(*_MENTOR_OPERATOR_ROLES)
def operator_enrol_coach():
    """Enrol a career coach: grant the coach role (coaches have no profile table;
    they work through coach_client_assignments)."""
    data = request.get_json() or {}
    user_id = (data.get('user_id') or '').strip()
    if not user_id:
        return jsonify({'success': False, 'message': 'user_id is required'}), 400
    if not _msv_query("SELECT id FROM users WHERE id = %s", (user_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'User not found'}), 404
    _grant_secondary_role(user_id, 'coach')
    return jsonify({'success': True, 'message': f'{user_id} enrolled as a coach',
                    'data': {'user_id': user_id}}), 201


@mentor_bp.route('/operator/coaches', methods=['GET'])
@require_roles(*_MENTOR_OPERATOR_ROLES)
def operator_list_coaches():
    rows = _msv_query(
        f"SELECT u.id AS user_id, {_display_name('full_name', 'u')} FROM users u "
        "WHERE u.role = 'coach' OR COALESCE(u.secondary_roles, '[]'::jsonb) ? 'coach' "
        "ORDER BY full_name") or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@mentor_bp.route('/operator/programs', methods=['POST'])
@require_roles(*_MENTOR_OPERATOR_ROLES)
def operator_create_program():
    data = request.get_json() or {}
    name = (data.get('program_name') or data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'message': 'program_name is required'}), 400
    row = _msv_query(
        "INSERT INTO mentorship_programs (program_name, program_description, program_type, "
        "target_audience, duration_weeks, is_active, is_published, created_at, updated_at) "
        "VALUES (%s, %s, %s, %s, %s, TRUE, TRUE, NOW(), NOW()) RETURNING id, program_name",
        (name, data.get('program_description'), data.get('program_type') or 'general',
         data.get('target_audience'), data.get('duration_weeks')), fetch_one=True)
    return jsonify({'success': True, 'data': row, 'message': 'Program created'}), 201


@mentor_bp.route('/operator/programs', methods=['GET'])
@require_roles(*_MENTOR_OPERATOR_ROLES)
def operator_list_programs():
    rows = _msv_query(
        "SELECT id, program_name, program_type, target_audience, duration_weeks, is_published "
        "FROM mentorship_programs ORDER BY created_at DESC NULLS LAST") or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


# ─────────────────────────────────────────────────────────────────────────────
# Mentee flow (Cluster-3 M3): a candidate requests a mentor → the mentor accepts
# (mentorship_matching), can book sessions (mentorship_sessions), and the candidate
# can request skill verification (mentor_skill_verifications, consumed by
# /progress/verify-skill). NB mentorship_matching.mentor_id is a UUID
# (mentor_profiles.id); mentor_skill_verifications.mentor_id is the mentor EID.
# ─────────────────────────────────────────────────────────────────────────────

def _mentor_profile_uuid(mentor_user_id):
    row = _msv_query("SELECT id FROM mentor_profiles WHERE user_id = %s", (str(mentor_user_id),), fetch_one=True)
    return (row or {}).get('id')


@mentor_bp.route('/request', methods=['POST'])
@jwt_required()
def request_mentor():
    """Candidate requests a mentor → a pending mentorship_matching."""
    me = str(get_jwt_identity())
    mentor_user_id = ((request.get_json(silent=True) or {}).get('mentor_user_id') or '').strip()
    pid = _mentor_profile_uuid(mentor_user_id)
    if not pid:
        return jsonify({'success': False, 'message': 'Mentor not found'}), 404
    dup = _msv_query("SELECT id FROM mentorship_matching WHERE mentor_id = %s AND mentee_user_id = %s "
                     "AND COALESCE(match_status,'') NOT IN ('declined','ended') LIMIT 1",
                     (pid, me), fetch_one=True)
    if dup:
        return jsonify({'success': False, 'message': 'You already have a request/relationship with this mentor',
                        'matching_id': dup['id']}), 409
    row = _msv_query(
        "INSERT INTO mentorship_matching (mentor_id, mentee_user_id, match_status, is_active, created_at, updated_at) "
        "VALUES (%s, %s, 'requested', FALSE, NOW(), NOW()) RETURNING id",
        (pid, me), fetch_one=True)
    return jsonify({'success': True, 'message': 'Mentorship requested', 'data': {'id': (row or {}).get('id')}}), 201


@mentor_bp.route('/my-mentees', methods=['GET'])
@require_roles(*_MENTOR_ROLES)
def my_mentees():
    """A mentor's requests + active mentees (matchings on their profile)."""
    me = str(get_jwt_identity())
    rows = _msv_query(
        f"SELECT mm.id, mm.mentee_user_id, {_display_name('mentee_name', 'u')}, "
        "mm.match_status, mm.is_active FROM mentorship_matching mm "
        "JOIN mentor_profiles mp ON mp.id = mm.mentor_id "
        "LEFT JOIN users u ON u.id = mm.mentee_user_id "
        "WHERE mp.user_id = %s ORDER BY mm.created_at DESC NULLS LAST", (me,)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@mentor_bp.route('/my-mentors', methods=['GET'])
@jwt_required()
def my_mentors():
    """A candidate's mentor requests/relationships."""
    me = str(get_jwt_identity())
    rows = _msv_query(
        f"SELECT mm.id, mp.user_id AS mentor_user_id, {_display_name('mentor_name', 'u')}, "
        "mp.professional_title, mm.match_status, mm.is_active FROM mentorship_matching mm "
        "JOIN mentor_profiles mp ON mp.id = mm.mentor_id LEFT JOIN users u ON u.id = mp.user_id "
        "WHERE mm.mentee_user_id = %s ORDER BY mm.created_at DESC NULLS LAST", (me,)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})


@mentor_bp.route('/requests/<matching_id>/decision', methods=['POST'])
@require_roles(*_MENTOR_ROLES)
def mentor_decide_request(matching_id):
    """The requested mentor accepts/declines. Only that mentor may decide."""
    me = str(get_jwt_identity())
    decision = (request.get_json(silent=True) or {}).get('decision')
    if decision not in ('accept', 'decline'):
        return jsonify({'success': False, 'message': "decision must be 'accept' or 'decline'"}), 400
    row = _msv_query(
        "SELECT mm.id, mp.user_id AS mentor_user_id, mm.mentee_user_id, mm.match_status "
        "FROM mentorship_matching mm "
        "JOIN mentor_profiles mp ON mp.id = mm.mentor_id WHERE mm.id = %s", (matching_id,), fetch_one=True)
    if not row:
        return jsonify({'success': False, 'message': 'Request not found'}), 404
    if not (resolve_roles() & ADMIN_ROLES) and str(row['mentor_user_id']) != me:
        return jsonify({'success': False, 'message': 'Not your mentorship request'}), 403
    if decision == 'accept':
        _msv_query("UPDATE mentorship_matching SET match_status='active', is_active=TRUE, "
                   "start_date=COALESCE(start_date, NOW()), updated_at=NOW() WHERE id=%s",
                   (matching_id,), fetch_all=False)
        _safe_notify(row.get('mentee_user_id'), 'mentorship_accepted',
                     'Mentor accepted your request',
                     'Your mentorship request was accepted — you can now book sessions.',
                     {'matching_id': str(matching_id)})
    else:
        _msv_query("UPDATE mentorship_matching SET match_status='declined', is_active=FALSE, updated_at=NOW() "
                   "WHERE id=%s", (matching_id,), fetch_all=False)
    return jsonify({'success': True, 'message': f'Request {decision}ed'})


@mentor_bp.route('/verify-request', methods=['POST'])
@jwt_required()
def request_skill_verification():
    """Candidate asks a specific mentor to verify a skill → pending
    mentor_skill_verifications (the queue /progress/verify-skill consumes)."""
    me = str(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    mentor_user_id = (data.get('mentor_user_id') or '').strip()
    skill_name = (str(data.get('skill_name') or '').strip())[:120]
    if not mentor_user_id or not skill_name:
        return jsonify({'success': False, 'message': 'mentor_user_id and skill_name are required'}), 400
    if not _msv_query("SELECT id FROM users WHERE id = %s", (mentor_user_id,), fetch_one=True):
        return jsonify({'success': False, 'message': 'Mentor not found'}), 404
    # C3-ISO-2 (hygiene): a candidate may only request verification from a mentor
    # they actually have a mentorship with — otherwise anyone could inject pending
    # rows into any mentor's queue. (The row is the caller's own, so not a
    # cross-tenant write, but this closes the spam/abuse vector.) Admins bypass.
    if not (resolve_roles() & ADMIN_ROLES):
        rel = _msv_query(
            "SELECT 1 FROM mentorship_matching mm JOIN mentor_profiles mp ON mp.id = mm.mentor_id "
            "WHERE mp.user_id = %s AND mm.mentee_user_id = %s "
            "AND COALESCE(mm.match_status, '') NOT IN ('declined', 'ended') LIMIT 1",
            (mentor_user_id, me), fetch_one=True)
        if not rel:
            return jsonify({'success': False,
                            'message': 'You can only request verification from your own mentor'}), 403
    dup = _msv_query("SELECT id FROM mentor_skill_verifications WHERE candidate_id=%s AND mentor_id=%s "
                     "AND LOWER(skill_name)=LOWER(%s) AND status='pending' LIMIT 1",
                     (me, mentor_user_id, skill_name), fetch_one=True)
    if dup:
        return jsonify({'success': False, 'message': 'A pending request for this skill already exists'}), 409
    row = _msv_query(
        "INSERT INTO mentor_skill_verifications (candidate_id, mentor_id, skill_name, skill_level, "
        "skill_category, status, requested_at) VALUES (%s, %s, %s, %s, %s, 'pending', NOW()) RETURNING id",
        (me, mentor_user_id, skill_name, data.get('skill_level'), data.get('skill_category')), fetch_one=True)
    return jsonify({'success': True, 'message': 'Verification requested', 'data': {'id': (row or {}).get('id')}}), 201


@mentor_bp.route('/sessions', methods=['POST'])
@jwt_required()
def book_session():
    """Book a mentorship session. Caller must be the mentor or the mentee on an
    active matching (admins bypass)."""
    me = str(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    mentor_user_id = (data.get('mentor_user_id') or '').strip()
    mentee_user_id = (data.get('mentee_user_id') or '').strip() or me
    pid = _mentor_profile_uuid(mentor_user_id)
    if not pid:
        return jsonify({'success': False, 'message': 'Mentor not found'}), 404
    if not (resolve_roles() & ADMIN_ROLES) and me not in (mentor_user_id, mentee_user_id):
        return jsonify({'success': False, 'message': 'You are not a party to this session'}), 403
    link = _msv_query("SELECT 1 FROM mentorship_matching WHERE mentor_id=%s AND mentee_user_id=%s "
                      "AND COALESCE(is_active,FALSE) IS TRUE LIMIT 1", (pid, mentee_user_id), fetch_one=True)
    if not link and not (resolve_roles() & ADMIN_ROLES):
        return jsonify({'success': False, 'message': 'No active mentorship between these users'}), 409
    row = _msv_query(
        "INSERT INTO mentorship_sessions (mentor_id, mentee_user_id, session_title, session_type, "
        "scheduled_date, duration_minutes, session_status, created_at, updated_at) "
        "VALUES (%s, %s, %s, %s, %s, %s, 'scheduled', NOW(), NOW()) RETURNING id",
        (pid, mentee_user_id, data.get('session_title') or 'Mentorship session',
         data.get('session_type') or 'general', data.get('scheduled_date'),
         data.get('duration_minutes') or 60), fetch_one=True)
    # Notify the counterparty (whoever didn't book it) — C3-MEE-5.
    _other = mentor_user_id if me == mentee_user_id else mentee_user_id
    _safe_notify(_other, 'session_booked', 'Mentorship session booked',
                 f"A mentorship session was scheduled for {data.get('scheduled_date') or 'soon'}.",
                 {'session_id': (row or {}).get('id')})
    return jsonify({'success': True, 'message': 'Session booked', 'data': {'id': (row or {}).get('id')}}), 201


@mentor_bp.route('/sessions', methods=['GET'])
@jwt_required()
def list_sessions():
    """List the caller's mentorship sessions — as mentor OR mentee — so both
    sides (esp. the mentee) can see booked sessions (C3-MEE-5: /sessions was
    POST-only, leaving the mentee unable to read them)."""
    me = str(get_jwt_identity())
    rows = _msv_query(
        "SELECT s.id, s.session_title, s.session_type, s.scheduled_date, s.duration_minutes, "
        "s.session_status, s.mentee_user_id, mp.user_id AS mentor_user_id, "
        f"{_display_name('mentee_name', 'um')}, {_display_name('mentor_name', 'up')} "
        "FROM mentorship_sessions s "
        "LEFT JOIN mentor_profiles mp ON mp.id = s.mentor_id "
        "LEFT JOIN users um ON um.id = s.mentee_user_id "
        "LEFT JOIN users up ON up.id = mp.user_id "
        "WHERE s.mentee_user_id = %s OR mp.user_id = %s "
        "ORDER BY s.scheduled_date DESC NULLS LAST", (me, me)) or []
    return jsonify({'success': True, 'data': rows, 'total': len(rows)})
