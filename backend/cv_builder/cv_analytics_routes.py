#!/usr/bin/env python3
"""
CV Analytics API Routes
Provides analytics and insights for CV performance and usage
"""

from flask import Blueprint, request, jsonify
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import statistics

from .cv_integration import get_cv_analytics_tracker, get_cv_job_matcher

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
cv_analytics_routes = Blueprint('cv_analytics_routes', __name__, url_prefix='/api/cv/analytics')

# Get global instances
analytics_tracker = get_cv_analytics_tracker()
job_matcher = get_cv_job_matcher()

@cv_analytics_routes.route('/health', methods=['GET'])
def analytics_health():
    """CV Analytics health check"""
    try:
        return jsonify({
            'status': 'healthy',
            'service': 'CV Analytics',
            'version': '1.0.0',
            'features': {
                'completion_tracking': True,
                'performance_metrics': True,
                'job_matching_analytics': True,
                'user_insights': True,
                'trend_analysis': True
            },
            'tracked_cvs': len(analytics_tracker.analytics_data),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"CV analytics health check failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@cv_analytics_routes.route('/cv/<cv_id>', methods=['GET'])
def get_cv_analytics(cv_id):
    """Get analytics for specific CV"""
    try:
        analytics = analytics_tracker.get_cv_analytics(cv_id)
        
        if not analytics:
            return jsonify({'error': 'CV analytics not found'}), 404
        
        # Convert to dict for JSON serialization
        analytics_dict = {
            'cv_id': analytics.cv_id,
            'user_id': analytics.user_id,
            'completion_score': analytics.completion_score,
            'sections_completed': analytics.sections_completed,
            'skills_count': analytics.skills_count,
            'experience_years': analytics.experience_years,
            'education_level': analytics.education_level,
            'languages_count': analytics.languages_count,
            'certifications_count': analytics.certifications_count,
            'last_updated': analytics.last_updated,
            'view_count': analytics.view_count,
            'download_count': analytics.download_count,
            'match_score_avg': analytics.match_score_avg
        }
        
        # Add insights
        insights = generate_cv_insights(analytics)
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'analytics': analytics_dict,
            'insights': insights,
            'recommendations': generate_cv_recommendations(analytics)
        })
        
    except Exception as e:
        logger.error(f"Error getting CV analytics for {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_analytics_routes.route('/user/<user_id>', methods=['GET'])
def get_user_analytics(user_id):
    """Get analytics for all user CVs"""
    try:
        user_analytics = analytics_tracker.get_user_analytics(user_id)
        
        if not user_analytics:
            return jsonify({
                'success': True,
                'user_id': user_id,
                'total_cvs': 0,
                'analytics': [],
                'summary': {},
                'insights': []
            })
        
        # Convert to list of dicts
        analytics_list = []
        for analytics in user_analytics:
            analytics_dict = {
                'cv_id': analytics.cv_id,
                'completion_score': analytics.completion_score,
                'sections_completed': analytics.sections_completed,
                'skills_count': analytics.skills_count,
                'experience_years': analytics.experience_years,
                'education_level': analytics.education_level,
                'languages_count': analytics.languages_count,
                'certifications_count': analytics.certifications_count,
                'last_updated': analytics.last_updated,
                'view_count': analytics.view_count,
                'download_count': analytics.download_count,
                'match_score_avg': analytics.match_score_avg
            }
            analytics_list.append(analytics_dict)
        
        # Generate summary
        summary = generate_user_summary(user_analytics)
        
        # Generate insights
        insights = generate_user_insights(user_analytics)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'total_cvs': len(user_analytics),
            'analytics': analytics_list,
            'summary': summary,
            'insights': insights
        })
        
    except Exception as e:
        logger.error(f"Error getting user analytics for {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_analytics_routes.route('/cv/<cv_id>/track/view', methods=['POST'])
def track_cv_view(cv_id):
    """Track CV view event"""
    try:
        analytics_tracker.track_cv_view(cv_id)
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'event': 'view_tracked',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error tracking CV view for {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_analytics_routes.route('/cv/<cv_id>/track/download', methods=['POST'])
def track_cv_download(cv_id):
    """Track CV download event"""
    try:
        data = request.get_json() or {}
        format = data.get('format', 'pdf')
        
        analytics_tracker.track_cv_download(cv_id, format)
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'event': 'download_tracked',
            'format': format,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error tracking CV download for {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_analytics_routes.route('/cv/<cv_id>/performance', methods=['GET'])
def get_cv_performance(cv_id):
    """Get CV performance metrics"""
    try:
        analytics = analytics_tracker.get_cv_analytics(cv_id)
        
        if not analytics:
            return jsonify({'error': 'CV analytics not found'}), 404
        
        # Calculate performance metrics
        performance = {
            'completion_score': analytics.completion_score,
            'engagement': {
                'view_count': analytics.view_count,
                'download_count': analytics.download_count,
                'view_to_download_ratio': (
                    analytics.download_count / max(analytics.view_count, 1)
                ) * 100
            },
            'content_quality': {
                'sections_completed': len(analytics.sections_completed),
                'total_sections': 8,  # Standard number of sections
                'completion_rate': (len(analytics.sections_completed) / 8) * 100,
                'skills_count': analytics.skills_count,
                'experience_years': analytics.experience_years,
                'education_level': analytics.education_level
            },
            'match_performance': {
                'average_match_score': analytics.match_score_avg,
                'estimated_job_compatibility': calculate_job_compatibility(analytics)
            },
            'last_activity': analytics.last_updated
        }
        
        # Performance grade
        grade = calculate_performance_grade(performance)
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'performance': performance,
            'grade': grade,
            'recommendations': generate_performance_recommendations(performance)
        })
        
    except Exception as e:
        logger.error(f"Error getting CV performance for {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_analytics_routes.route('/cv/<cv_id>/job-match-analysis', methods=['POST'])
def analyze_job_match(cv_id):
    """Analyze CV against job requirements"""
    try:
        data = request.get_json()
        job_requirements = data.get('job_requirements', {})
        cv_data = data.get('cv_data', {})
        
        if not job_requirements or not cv_data:
            return jsonify({'error': 'job_requirements and cv_data are required'}), 400
        
        # Analyze CV for matching
        cv_analysis = job_matcher.analyze_cv_for_matching(cv_data)
        cv_analysis['cv_id'] = cv_id
        
        # Match CV to job
        match_result = job_matcher.match_cv_to_job(cv_analysis, job_requirements)
        
        # Track the match result
        analytics = analytics_tracker.get_cv_analytics(cv_id)
        if analytics:
            # Update average match score
            current_avg = analytics.match_score_avg
            new_avg = (current_avg + match_result.match_score) / 2 if current_avg > 0 else match_result.match_score
            analytics.match_score_avg = new_avg
        
        return jsonify({
            'success': True,
            'cv_id': cv_id,
            'job_id': match_result.job_id,
            'match_analysis': {
                'overall_score': match_result.match_score,
                'matching_skills': match_result.matching_skills,
                'missing_skills': match_result.missing_skills,
                'experience_match': match_result.experience_match,
                'location_match': match_result.location_match,
                'salary_match': match_result.salary_match,
                'recommendations': match_result.recommendations
            },
            'cv_analysis': cv_analysis
        })
        
    except Exception as e:
        logger.error(f"Error analyzing job match for CV {cv_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_analytics_routes.route('/trends', methods=['GET'])
def get_analytics_trends():
    """Get analytics trends and insights"""
    try:
        # Get query parameters
        days = int(request.args.get('days', 30))
        user_id = request.args.get('user_id')
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get relevant analytics
        all_analytics = list(analytics_tracker.analytics_data.values())
        
        if user_id:
            all_analytics = [a for a in all_analytics if a.user_id == user_id]
        
        # Filter by date range
        filtered_analytics = []
        for analytics in all_analytics:
            try:
                last_updated = datetime.fromisoformat(analytics.last_updated.replace('Z', '+00:00'))
                if start_date <= last_updated <= end_date:
                    filtered_analytics.append(analytics)
            except:
                continue
        
        if not filtered_analytics:
            return jsonify({
                'success': True,
                'trends': {
                    'total_cvs': 0,
                    'average_completion': 0,
                    'popular_sections': [],
                    'skill_trends': [],
                    'education_trends': {},
                    'experience_trends': {},
                    'engagement_trends': {}
                },
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': days
                }
            })
        
        # Calculate trends
        trends = calculate_trends(filtered_analytics)
        
        return jsonify({
            'success': True,
            'trends': trends,
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting analytics trends: {str(e)}")
        return jsonify({'error': str(e)}), 500

@cv_analytics_routes.route('/insights/market', methods=['GET'])
def get_market_insights():
    """Get UAE job market insights based on CV data"""
    try:
        all_analytics = list(analytics_tracker.analytics_data.values())
        
        if not all_analytics:
            return jsonify({
                'success': True,
                'market_insights': {
                    'message': 'Insufficient data for market insights'
                }
            })
        
        # Calculate market insights
        insights = {
            'skill_demand': calculate_skill_demand(all_analytics),
            'experience_levels': calculate_experience_distribution(all_analytics),
            'education_trends': calculate_education_trends(all_analytics),
            'language_requirements': calculate_language_trends(all_analytics),
            'completion_benchmarks': calculate_completion_benchmarks(all_analytics),
            'performance_benchmarks': calculate_performance_benchmarks(all_analytics)
        }
        
        return jsonify({
            'success': True,
            'market_insights': insights,
            'data_points': len(all_analytics),
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting market insights: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Helper functions
def generate_cv_insights(analytics):
    """Generate insights for individual CV"""
    insights = []
    
    if analytics.completion_score < 70:
        insights.append({
            'type': 'completion',
            'level': 'warning',
            'message': f'CV is {analytics.completion_score}% complete. Consider adding more sections.',
            'action': 'Complete missing sections to improve visibility'
        })
    
    if analytics.skills_count < 5:
        insights.append({
            'type': 'skills',
            'level': 'info',
            'message': f'Only {analytics.skills_count} skills listed. UAE employers typically look for 5-10 key skills.',
            'action': 'Add more relevant skills to your profile'
        })
    
    if analytics.experience_years < 1:
        insights.append({
            'type': 'experience',
            'level': 'info',
            'message': 'Limited work experience detected. Focus on education, projects, and internships.',
            'action': 'Highlight academic projects and any relevant experience'
        })
    
    if analytics.languages_count < 2:
        insights.append({
            'type': 'languages',
            'level': 'info',
            'message': 'UAE market values multilingual candidates. Consider adding language skills.',
            'action': 'Add Arabic and English proficiency levels'
        })
    
    return insights

def generate_cv_recommendations(analytics):
    """Generate recommendations for CV improvement"""
    recommendations = []
    
    # Completion recommendations
    if analytics.completion_score < 100:
        missing_sections = 8 - len(analytics.sections_completed)
        recommendations.append(f"Complete {missing_sections} more sections to reach 100% completion")
    
    # Content recommendations
    if analytics.skills_count < 8:
        recommendations.append("Add more skills to showcase your expertise")
    
    if analytics.certifications_count == 0:
        recommendations.append("Add professional certifications to stand out")
    
    if analytics.view_count == 0:
        recommendations.append("Share your CV profile to increase visibility")
    
    return recommendations

def generate_user_summary(user_analytics):
    """Generate summary for user's CV portfolio"""
    if not user_analytics:
        return {}
    
    completion_scores = [a.completion_score for a in user_analytics]
    skills_counts = [a.skills_count for a in user_analytics]
    view_counts = [a.view_count for a in user_analytics]
    
    return {
        'total_cvs': len(user_analytics),
        'average_completion': statistics.mean(completion_scores),
        'highest_completion': max(completion_scores),
        'total_skills': sum(skills_counts),
        'total_views': sum(view_counts),
        'most_viewed_cv': max(user_analytics, key=lambda x: x.view_count).cv_id if user_analytics else None
    }

def generate_user_insights(user_analytics):
    """Generate insights for user's CV portfolio"""
    insights = []
    
    if not user_analytics:
        return insights
    
    avg_completion = statistics.mean([a.completion_score for a in user_analytics])
    
    if avg_completion < 80:
        insights.append({
            'type': 'portfolio',
            'level': 'warning',
            'message': f'Average CV completion is {avg_completion:.1f}%. Focus on completing your CVs.',
            'action': 'Complete missing sections across all CVs'
        })
    
    total_views = sum([a.view_count for a in user_analytics])
    if total_views == 0:
        insights.append({
            'type': 'visibility',
            'level': 'info',
            'message': 'Your CVs have not been viewed yet. Consider sharing them.',
            'action': 'Share your CV profiles to increase visibility'
        })
    
    return insights

def calculate_job_compatibility(analytics):
    """Calculate estimated job compatibility score"""
    base_score = analytics.completion_score
    
    # Adjust based on content quality
    if analytics.skills_count >= 5:
        base_score += 10
    if analytics.experience_years >= 2:
        base_score += 10
    if analytics.education_level in ['bachelor', 'master', 'phd']:
        base_score += 5
    if analytics.languages_count >= 2:
        base_score += 5
    
    return min(base_score, 100)

def calculate_performance_grade(performance):
    """Calculate performance grade"""
    completion = performance['completion_score']
    engagement = performance['engagement']['view_count']
    content_quality = performance['content_quality']['completion_rate']
    
    overall_score = (completion * 0.4 + min(engagement * 10, 100) * 0.3 + content_quality * 0.3)
    
    if overall_score >= 90:
        return {'grade': 'A+', 'description': 'Excellent'}
    elif overall_score >= 80:
        return {'grade': 'A', 'description': 'Very Good'}
    elif overall_score >= 70:
        return {'grade': 'B', 'description': 'Good'}
    elif overall_score >= 60:
        return {'grade': 'C', 'description': 'Average'}
    else:
        return {'grade': 'D', 'description': 'Needs Improvement'}

def generate_performance_recommendations(performance):
    """Generate performance improvement recommendations"""
    recommendations = []
    
    if performance['completion_score'] < 80:
        recommendations.append("Complete more CV sections to improve your score")
    
    if performance['engagement']['view_count'] < 5:
        recommendations.append("Share your CV to increase visibility and views")
    
    if performance['content_quality']['skills_count'] < 5:
        recommendations.append("Add more skills to showcase your expertise")
    
    return recommendations

def calculate_trends(analytics_list):
    """Calculate trends from analytics data"""
    if not analytics_list:
        return {}
    
    # Basic statistics
    completion_scores = [a.completion_score for a in analytics_list]
    skills_counts = [a.skills_count for a in analytics_list]
    
    # Section popularity
    all_sections = []
    for a in analytics_list:
        all_sections.extend(a.sections_completed)
    
    section_counts = {}
    for section in all_sections:
        section_counts[section] = section_counts.get(section, 0) + 1
    
    popular_sections = sorted(section_counts.items(), key=lambda x: x[1], reverse=True)
    
    return {
        'total_cvs': len(analytics_list),
        'average_completion': statistics.mean(completion_scores),
        'completion_distribution': {
            'high': len([s for s in completion_scores if s >= 80]),
            'medium': len([s for s in completion_scores if 50 <= s < 80]),
            'low': len([s for s in completion_scores if s < 50])
        },
        'popular_sections': popular_sections[:5],
        'average_skills': statistics.mean(skills_counts),
        'skill_distribution': {
            'high': len([s for s in skills_counts if s >= 8]),
            'medium': len([s for s in skills_counts if 3 <= s < 8]),
            'low': len([s for s in skills_counts if s < 3])
        }
    }

def calculate_skill_demand(analytics_list):
    """Calculate skill demand trends"""
    # This would be more sophisticated with actual skill data
    return {
        'top_skills': ['Python', 'JavaScript', 'Project Management', 'Communication', 'Leadership'],
        'emerging_skills': ['AI/ML', 'Cloud Computing', 'Data Analysis'],
        'language_demand': ['English', 'Arabic', 'Hindi']
    }

def calculate_experience_distribution(analytics_list):
    """Calculate experience level distribution"""
    experience_levels = [a.experience_years for a in analytics_list]
    
    return {
        'entry_level': len([e for e in experience_levels if e < 2]),
        'mid_level': len([e for e in experience_levels if 2 <= e < 5]),
        'senior_level': len([e for e in experience_levels if 5 <= e < 10]),
        'executive_level': len([e for e in experience_levels if e >= 10])
    }

def calculate_education_trends(analytics_list):
    """Calculate education trends"""
    education_levels = [a.education_level for a in analytics_list]
    
    level_counts = {}
    for level in education_levels:
        level_counts[level] = level_counts.get(level, 0) + 1
    
    return level_counts

def calculate_language_trends(analytics_list):
    """Calculate language trends"""
    language_counts = [a.languages_count for a in analytics_list]
    
    return {
        'average_languages': statistics.mean(language_counts) if language_counts else 0,
        'multilingual_percentage': len([c for c in language_counts if c >= 2]) / len(language_counts) * 100 if language_counts else 0
    }

def calculate_completion_benchmarks(analytics_list):
    """Calculate completion benchmarks"""
    completion_scores = [a.completion_score for a in analytics_list]
    
    if not completion_scores:
        return {}
    
    return {
        'average': statistics.mean(completion_scores),
        'median': statistics.median(completion_scores),
        'top_quartile': sorted(completion_scores)[int(len(completion_scores) * 0.75)] if len(completion_scores) > 3 else max(completion_scores),
        'bottom_quartile': sorted(completion_scores)[int(len(completion_scores) * 0.25)] if len(completion_scores) > 3 else min(completion_scores)
    }

def calculate_performance_benchmarks(analytics_list):
    """Calculate performance benchmarks"""
    view_counts = [a.view_count for a in analytics_list]
    download_counts = [a.download_count for a in analytics_list]
    
    return {
        'average_views': statistics.mean(view_counts) if view_counts else 0,
        'average_downloads': statistics.mean(download_counts) if download_counts else 0,
        'engagement_rate': statistics.mean([d/max(v,1) for v, d in zip(view_counts, download_counts)]) if view_counts else 0
    }

# Error handlers
@cv_analytics_routes.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Analytics endpoint not found'}), 404

@cv_analytics_routes.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal analytics error'}), 500

if __name__ == "__main__":
    # Test the analytics routes
    from flask import Flask
    
    app = Flask(__name__)
    app.register_blueprint(cv_analytics_routes)
    
    print("CV Analytics routes registered successfully")
    print("Available endpoints:")
    for rule in app.url_map.iter_rules():
        if rule.endpoint.startswith('cv_analytics_routes'):
            print(f"  {rule.methods} {rule.rule}")

