"""
Optimized Matching Routes
Enhanced API endpoints with performance optimization and advanced features
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import json

# Import optimized components
from matching.job_matching_engine_optimized import get_enhanced_matching_engine
from matching.advanced_scoring_system import get_advanced_scoring_system
from matching.matching_performance_optimizer import get_performance_optimizer
from matching.uae_matching_criteria import get_uae_criteria

logger = logging.getLogger(__name__)

# Create blueprint
matching_bp = Blueprint('matching_optimized', __name__, url_prefix='/api/matching')

# Get global instances
matching_engine = get_enhanced_matching_engine()
scoring_system = get_advanced_scoring_system()
performance_optimizer = get_performance_optimizer()
uae_criteria = get_uae_criteria()

# Global storage (in production, use database)
stored_cvs = {}
stored_jds = {}
matching_results = {}

@matching_bp.route('/enhanced/single', methods=['POST'])
@jwt_required()
def enhanced_single_match():
    """Enhanced single CV-JD matching with advanced scoring"""
    try:
        current_user = get_jwt_identity()
        start_time = time.time()
        
        data = request.get_json()
        cv_data = data.get('cv_data')
        jd_data = data.get('jd_data')
        
        # Alternative: use stored IDs
        cv_id = data.get('cv_id')
        jd_id = data.get('jd_id')
        
        if cv_id and cv_id in stored_cvs:
            cv_data = stored_cvs[cv_id]
        if jd_id and jd_id in stored_jds:
            jd_data = stored_jds[jd_id]
        
        if not cv_data or not jd_data:
            return jsonify({
                'success': False,
                'error': 'CV and JD data required (provide data or valid IDs)'
            }), 400
        
        logger.info(f"🚀 Enhanced single matching for user: {current_user}")
        
        # Use performance optimizer for caching and monitoring
        def perform_matching(cv, jd):
            # Get AI analysis with AI Engine PRO
            ai_analysis = matching_engine.analyze_with_gemini(cv, jd)
            
            # Calculate advanced scores
            advanced_score = scoring_system.calculate_advanced_score(cv, jd, ai_analysis)
            
            # Apply UAE-specific criteria
            uae_adjustments = uae_criteria.apply_uae_scoring_adjustments(
                cv, jd, advanced_score
            )
            
            return {
                'ai_analysis': ai_analysis,
                'advanced_score': advanced_score,
                'uae_adjustments': uae_adjustments
            }
        
        # Optimize matching pipeline with caching
        matching_data = performance_optimizer.optimize_matching_pipeline(
            cv_data, jd_data, lambda cv, jd: perform_matching(cv, jd)
        )
        
        # Build comprehensive result
        result = {
            'success': True,
            'match_id': f"enhanced_match_{current_user}_{int(time.time())}",
            'user_id': current_user,
            'cv_info': {
                'name': cv_data.get('personalInfo', {}).get('name', 'Unknown'),
                'email': cv_data.get('personalInfo', {}).get('email', ''),
                'location': cv_data.get('personalInfo', {}).get('location', '')
            },
            'jd_info': {
                'title': jd_data.get('title', 'Unknown'),
                'company': jd_data.get('company', 'Unknown'),
                'location': jd_data.get('location', '')
            },
            'enhanced_scoring': {
                'overall_score': matching_data['advanced_score'].overall_score,
                'confidence_score': matching_data['advanced_score'].confidence_score,
                'confidence_level': matching_data['advanced_score'].confidence_level.value,
                'normalized_score': matching_data['advanced_score'].normalized_score,
                'reliability_index': matching_data['advanced_score'].reliability_index,
                'dimensions': {
                    name: {
                        'score': dim.score,
                        'weight': dim.weight,
                        'confidence': dim.confidence,
                        'evidence': dim.evidence,
                        'reasoning': dim.reasoning
                    }
                    for name, dim in matching_data['advanced_score'].dimensions.items()
                }
            },
            'uae_specific': {
                'cultural_fit_score': matching_data['uae_adjustments'].get('cultural_fit_score', 0),
                'location_preference_score': matching_data['uae_adjustments'].get('location_preference_score', 0),
                'industry_alignment_score': matching_data['uae_adjustments'].get('industry_alignment_score', 0),
                'language_bonus': matching_data['uae_adjustments'].get('language_bonus', 0),
                'experience_bonus': matching_data['uae_adjustments'].get('experience_bonus', 0),
                'emirate_match': matching_data['uae_adjustments'].get('emirate_match', False),
                'strategic_industry_bonus': matching_data['uae_adjustments'].get('strategic_industry_bonus', 0)
            },
            'ai_insights': {
                'gemini_analysis': matching_data['ai_analysis'].get('analysis', ''),
                'key_strengths': matching_data['ai_analysis'].get('strengths', []),
                'improvement_areas': matching_data['advanced_score'].improvement_areas,
                'cultural_considerations': matching_data['ai_analysis'].get('cultural_notes', [])
            },
            'recommendations': matching_data['advanced_score'].recommendations,
            'validation_flags': matching_data['advanced_score'].validation_flags,
            'processing_metadata': {
                'processing_time': time.time() - start_time,
                'ai_model': 'gemini-2.5-pro',
                'scoring_version': '2.0',
                'cache_used': matching_data.get('from_cache', False),
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Store result
        matching_results[result['match_id']] = result
        
        logger.info(f"✅ Enhanced matching completed: {result['enhanced_scoring']['overall_score']:.1f}%")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Enhanced matching error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Enhanced matching failed: {str(e)}'
        }), 500

@matching_bp.route('/enhanced/batch', methods=['POST'])
@jwt_required()
def enhanced_batch_matching():
    """Enhanced batch matching with performance optimization"""
    try:
        current_user = get_jwt_identity()
        start_time = time.time()
        
        data = request.get_json()
        
        # Get candidates
        candidate_ids = data.get('candidate_ids', [])
        candidates_data = data.get('candidates', [])
        
        candidates = []
        for cv_id in candidate_ids:
            if cv_id in stored_cvs:
                candidates.append({
                    'candidate_info': {'id': cv_id},
                    'cv_data': stored_cvs[cv_id]
                })
        
        for candidate in candidates_data:
            candidates.append(candidate)
        
        # Get JDs
        jd_ids = data.get('jd_ids', [])
        jds_data = data.get('job_descriptions', [])
        
        job_descriptions = []
        for jd_id in jd_ids:
            if jd_id in stored_jds:
                job_descriptions.append(stored_jds[jd_id])
        
        for jd in jds_data:
            job_descriptions.append(jd)
        
        if not candidates or not job_descriptions:
            return jsonify({
                'success': False,
                'error': 'Both candidates and job descriptions are required'
            }), 400
        
        logger.info(f"🚀 Enhanced batch matching: {len(candidates)} candidates x {len(job_descriptions)} JDs")
        
        # Prepare matching pairs
        matching_pairs = []
        for candidate in candidates:
            for jd in job_descriptions:
                matching_pairs.append({
                    'cv_data': candidate['cv_data'],
                    'jd_data': jd,
                    'candidate_info': candidate.get('candidate_info', {})
                })
        
        # Define enhanced matching function
        def enhanced_match_pair(pair):
            cv_data = pair['cv_data']
            jd_data = pair['jd_data']
            
            # Use performance optimizer
            def perform_matching(cv, jd):
                ai_analysis = matching_engine.analyze_with_gemini(cv, jd)
                advanced_score = scoring_system.calculate_advanced_score(cv, jd, ai_analysis)
                uae_adjustments = uae_criteria.apply_uae_scoring_adjustments(cv, jd, advanced_score)
                
                return {
                    'overall_score': advanced_score.overall_score,
                    'confidence_score': advanced_score.confidence_score,
                    'confidence_level': advanced_score.confidence_level.value,
                    'dimensions': {
                        name: dim.score for name, dim in advanced_score.dimensions.items()
                    },
                    'uae_adjustments': uae_adjustments,
                    'recommendations': advanced_score.recommendations[:3],  # Top 3
                    'cv_info': {
                        'name': cv_data.get('personalInfo', {}).get('name', 'Unknown'),
                        'email': cv_data.get('personalInfo', {}).get('email', '')
                    },
                    'jd_info': {
                        'title': jd_data.get('title', 'Unknown'),
                        'company': jd_data.get('company', 'Unknown')
                    }
                }
            
            return performance_optimizer.optimize_matching_pipeline(
                cv_data, jd_data, lambda cv, jd: perform_matching(cv, jd)
            )
        
        # Use batch processing optimization
        batch_results = performance_optimizer.optimize_batch_processing(
            matching_pairs, enhanced_match_pair
        )
        
        # Filter out None results and sort by score
        valid_results = [r for r in batch_results if r is not None]
        valid_results.sort(key=lambda x: x.get('overall_score', 0), reverse=True)
        
        # Calculate statistics
        qualified_matches = [r for r in valid_results if r.get('overall_score', 0) >= 60]
        high_confidence_matches = [r for r in valid_results if r.get('confidence_score', 0) >= 80]
        
        result = {
            'success': True,
            'batch_id': f"enhanced_batch_{current_user}_{int(time.time())}",
            'user_id': current_user,
            'summary': {
                'total_candidates': len(candidates),
                'total_jobs': len(job_descriptions),
                'total_matches': len(valid_results),
                'qualified_matches': len(qualified_matches),
                'high_confidence_matches': len(high_confidence_matches),
                'average_score': sum(r.get('overall_score', 0) for r in valid_results) / len(valid_results) if valid_results else 0,
                'average_confidence': sum(r.get('confidence_score', 0) for r in valid_results) / len(valid_results) if valid_results else 0
            },
            'matches': valid_results,
            'performance_metrics': performance_optimizer.get_performance_metrics(),
            'processing_metadata': {
                'processing_time': time.time() - start_time,
                'ai_model': 'gemini-2.5-pro',
                'scoring_version': '2.0',
                'batch_optimization': True,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Store result
        matching_results[result['batch_id']] = result
        
        logger.info(f"✅ Enhanced batch matching completed: {len(qualified_matches)}/{len(valid_results)} qualified")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Enhanced batch matching error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Enhanced batch matching failed: {str(e)}'
        }), 500

@matching_bp.route('/enhanced/rank-candidates', methods=['POST'])
@jwt_required()
def enhanced_rank_candidates():
    """Enhanced candidate ranking with comprehensive scoring"""
    try:
        current_user = get_jwt_identity()
        start_time = time.time()
        
        data = request.get_json()
        jd_data = data.get('jd_data')
        jd_id = data.get('jd_id')
        
        # Get JD data
        if jd_id and jd_id in stored_jds:
            jd_data = stored_jds[jd_id]
        
        if not jd_data:
            return jsonify({
                'success': False,
                'error': 'JD data required (provide data or valid jd_id)'
            }), 400
        
        # Get candidates
        candidate_ids = data.get('candidate_ids', [])
        candidates_data = data.get('candidates', [])
        
        candidates = []
        
        # From IDs
        for cv_id in candidate_ids:
            if cv_id in stored_cvs:
                candidates.append({
                    'candidate_info': {'id': cv_id},
                    'cv_data': stored_cvs[cv_id]
                })
        
        # From direct data
        for candidate in candidates_data:
            candidates.append(candidate)
        
        if not candidates:
            return jsonify({
                'success': False,
                'error': 'Candidates required (provide candidate_ids or candidates data)'
            }), 400
        
        logger.info(f"🚀 Enhanced ranking: {len(candidates)} candidates for {jd_data.get('title', 'Unknown')}")
        
        # Define enhanced ranking function
        def enhanced_rank_candidate(candidate):
            cv_data = candidate['cv_data']
            
            def perform_ranking(cv, jd):
                ai_analysis = matching_engine.analyze_with_gemini(cv, jd)
                advanced_score = scoring_system.calculate_advanced_score(cv, jd, ai_analysis)
                uae_adjustments = uae_criteria.apply_uae_scoring_adjustments(cv, jd, advanced_score)
                
                return {
                    'candidate_info': candidate.get('candidate_info', {}),
                    'cv_info': {
                        'name': cv_data.get('personalInfo', {}).get('name', 'Unknown'),
                        'email': cv_data.get('personalInfo', {}).get('email', ''),
                        'location': cv_data.get('personalInfo', {}).get('location', '')
                    },
                    'overall_score': advanced_score.overall_score,
                    'confidence_score': advanced_score.confidence_score,
                    'confidence_level': advanced_score.confidence_level.value,
                    'reliability_index': advanced_score.reliability_index,
                    'dimension_scores': {
                        name: {
                            'score': dim.score,
                            'confidence': dim.confidence,
                            'evidence_count': len(dim.evidence)
                        }
                        for name, dim in advanced_score.dimensions.items()
                    },
                    'uae_specific': {
                        'cultural_fit_score': uae_adjustments.get('cultural_fit_score', 0),
                        'emirate_match': uae_adjustments.get('emirate_match', False),
                        'language_bonus': uae_adjustments.get('language_bonus', 0)
                    },
                    'top_strengths': ai_analysis.get('strengths', [])[:3],
                    'improvement_areas': advanced_score.improvement_areas[:2],
                    'recommendations': advanced_score.recommendations[:2],
                    'validation_flags': advanced_score.validation_flags
                }
            
            return performance_optimizer.optimize_matching_pipeline(
                cv_data, jd_data, lambda cv, jd: perform_ranking(cv, jd)
            )
        
        # Use batch processing for ranking
        ranking_results = performance_optimizer.optimize_batch_processing(
            candidates, enhanced_rank_candidate
        )
        
        # Filter and sort results
        valid_results = [r for r in ranking_results if r is not None]
        valid_results.sort(key=lambda x: (
            x.get('overall_score', 0),
            x.get('confidence_score', 0),
            x.get('reliability_index', 0)
        ), reverse=True)
        
        # Add ranking positions
        for i, candidate in enumerate(valid_results):
            candidate['rank'] = i + 1
            candidate['percentile'] = ((len(valid_results) - i) / len(valid_results)) * 100
        
        # Calculate ranking statistics
        qualified = [c for c in valid_results if c.get('overall_score', 0) >= 60]
        highly_qualified = [c for c in valid_results if c.get('overall_score', 0) >= 80]
        high_confidence = [c for c in valid_results if c.get('confidence_score', 0) >= 80]
        
        result = {
            'success': True,
            'ranking_id': f"enhanced_ranking_{current_user}_{int(time.time())}",
            'user_id': current_user,
            'jd_info': {
                'id': jd_data.get('id', 'unknown'),
                'title': jd_data.get('title', 'Unknown'),
                'company': jd_data.get('company', 'Unknown'),
                'location': jd_data.get('location', '')
            },
            'ranked_candidates': valid_results,
            'ranking_statistics': {
                'total_candidates': len(valid_results),
                'qualified_candidates': len(qualified),
                'highly_qualified_candidates': len(highly_qualified),
                'high_confidence_candidates': len(high_confidence),
                'average_score': sum(c.get('overall_score', 0) for c in valid_results) / len(valid_results) if valid_results else 0,
                'average_confidence': sum(c.get('confidence_score', 0) for c in valid_results) / len(valid_results) if valid_results else 0,
                'score_distribution': {
                    'excellent': len([c for c in valid_results if c.get('overall_score', 0) >= 90]),
                    'very_good': len([c for c in valid_results if 80 <= c.get('overall_score', 0) < 90]),
                    'good': len([c for c in valid_results if 70 <= c.get('overall_score', 0) < 80]),
                    'fair': len([c for c in valid_results if 60 <= c.get('overall_score', 0) < 70]),
                    'below_threshold': len([c for c in valid_results if c.get('overall_score', 0) < 60])
                }
            },
            'performance_metrics': performance_optimizer.get_performance_metrics(),
            'processing_metadata': {
                'processing_time': time.time() - start_time,
                'ai_model': 'gemini-2.5-pro',
                'scoring_version': '2.0',
                'ranking_algorithm': 'multi_dimensional_enhanced',
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Store result
        matching_results[result['ranking_id']] = result
        
        logger.info(f"✅ Enhanced ranking completed: {len(qualified)}/{len(valid_results)} qualified")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"❌ Enhanced ranking error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Enhanced ranking failed: {str(e)}'
        }), 500

@matching_bp.route('/analytics/enhanced', methods=['GET'])
@jwt_required()
def enhanced_analytics():
    """Enhanced analytics with performance metrics"""
    try:
        current_user = get_jwt_identity()
        
        # Filter results by current user
        user_results = {k: v for k, v in matching_results.items() 
                       if v.get('user_id') == current_user}
        
        if not user_results:
            return jsonify({
                'success': True,
                'analytics': {
                    'total_matches': 0,
                    'message': 'No enhanced matching data available yet'
                }
            })
        
        # Calculate enhanced analytics
        all_scores = []
        confidence_scores = []
        reliability_scores = []
        dimension_scores = {}
        uae_specific_metrics = {}
        
        for result in user_results.values():
            if 'enhanced_scoring' in result:
                # Single enhanced match
                score_data = result['enhanced_scoring']
                all_scores.append(score_data['overall_score'])
                confidence_scores.append(score_data['confidence_score'])
                reliability_scores.append(score_data['reliability_index'])
                
                # Collect dimension scores
                for dim_name, dim_data in score_data['dimensions'].items():
                    if dim_name not in dimension_scores:
                        dimension_scores[dim_name] = []
                    dimension_scores[dim_name].append(dim_data['score'])
                
                # UAE-specific metrics
                uae_data = result.get('uae_specific', {})
                for metric, value in uae_data.items():
                    if metric not in uae_specific_metrics:
                        uae_specific_metrics[metric] = []
                    if isinstance(value, (int, float)):
                        uae_specific_metrics[metric].append(value)
            
            elif 'ranked_candidates' in result:
                # Enhanced ranking result
                for candidate in result['ranked_candidates']:
                    all_scores.append(candidate.get('overall_score', 0))
                    confidence_scores.append(candidate.get('confidence_score', 0))
                    reliability_scores.append(candidate.get('reliability_index', 0))
        
        # Calculate dimension analytics
        dimension_analytics = {}
        for dim_name, scores in dimension_scores.items():
            if scores:
                dimension_analytics[dim_name] = {
                    'average_score': sum(scores) / len(scores),
                    'min_score': min(scores),
                    'max_score': max(scores),
                    'score_variance': sum((s - sum(scores)/len(scores))**2 for s in scores) / len(scores)
                }
        
        # Calculate UAE-specific analytics
        uae_analytics = {}
        for metric, values in uae_specific_metrics.items():
            if values:
                uae_analytics[metric] = {
                    'average': sum(values) / len(values),
                    'min': min(values),
                    'max': max(values)
                }
        
        analytics = {
            'total_enhanced_matches': len(all_scores),
            'overall_performance': {
                'average_score': sum(all_scores) / len(all_scores) if all_scores else 0,
                'average_confidence': sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0,
                'average_reliability': sum(reliability_scores) / len(reliability_scores) if reliability_scores else 0,
                'score_distribution': {
                    'excellent': len([s for s in all_scores if s >= 90]),
                    'very_good': len([s for s in all_scores if 80 <= s < 90]),
                    'good': len([s for s in all_scores if 70 <= s < 80]),
                    'fair': len([s for s in all_scores if 60 <= s < 70]),
                    'below_threshold': len([s for s in all_scores if s < 60])
                }
            },
            'dimension_performance': dimension_analytics,
            'uae_specific_performance': uae_analytics,
            'confidence_analysis': {
                'high_confidence_matches': len([c for c in confidence_scores if c >= 80]),
                'medium_confidence_matches': len([c for c in confidence_scores if 60 <= c < 80]),
                'low_confidence_matches': len([c for c in confidence_scores if c < 60])
            },
            'performance_metrics': performance_optimizer.get_performance_metrics(),
            'cache_statistics': performance_optimizer.get_cache_statistics()
        }
        
        return jsonify({
            'success': True,
            'analytics': analytics,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Enhanced analytics error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Enhanced analytics failed: {str(e)}'
        }), 500

@matching_bp.route('/performance/metrics', methods=['GET'])
@jwt_required()
def get_performance_metrics():
    """Get detailed performance metrics"""
    try:
        metrics = performance_optimizer.get_performance_metrics()
        cache_stats = performance_optimizer.get_cache_statistics()
        
        return jsonify({
            'success': True,
            'performance_metrics': metrics,
            'cache_statistics': cache_stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Performance metrics error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Performance metrics failed: {str(e)}'
        }), 500

@matching_bp.route('/performance/reset', methods=['POST'])
@jwt_required()
def reset_performance_metrics():
    """Reset performance metrics"""
    try:
        performance_optimizer.reset_metrics()
        
        return jsonify({
            'success': True,
            'message': 'Performance metrics reset successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Performance reset error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Performance reset failed: {str(e)}'
        }), 500

@matching_bp.route('/cache/cleanup', methods=['POST'])
@jwt_required()
def cleanup_cache():
    """Cleanup expired cache entries"""
    try:
        performance_optimizer.cleanup_cache()
        
        return jsonify({
            'success': True,
            'message': 'Cache cleanup completed successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Cache cleanup error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Cache cleanup failed: {str(e)}'
        }), 500

# Helper function to register the blueprint
def register_optimized_matching_routes(app):
    """Register optimized matching routes with the Flask app"""
    app.register_blueprint(matching_bp)
    logger.info("✅ Optimized matching routes registered successfully")

