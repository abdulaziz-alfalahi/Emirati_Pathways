"""
JD Analytics Engine for Job Description Performance Tracking
Provides comprehensive analytics, metrics, and performance insights
"""

import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import statistics

logger = logging.getLogger(__name__)

class JDAnalyticsEngine:
    """Analytics engine for job description performance tracking and insights"""
    
    def __init__(self):
        """Initialize the JD analytics engine"""
        self.jd_metrics = {}  # Store JD performance metrics
        self.application_data = {}  # Store application tracking data
        self.matching_results = {}  # Store matching performance data
        self.recruiter_analytics = {}  # Store recruiter-specific analytics
        self.sector_benchmarks = self._initialize_sector_benchmarks()
        
    def _initialize_sector_benchmarks(self) -> Dict[str, Dict[str, float]]:
        """Initialize industry benchmarks for comparison"""
        return {
            'technology': {
                'avg_applications_per_jd': 45.0,
                'avg_time_to_fill': 28.0,  # days
                'avg_quality_score': 78.0,
                'avg_match_score': 82.0,
                'conversion_rate': 0.12  # applications to hires
            },
            'banking_finance': {
                'avg_applications_per_jd': 65.0,
                'avg_time_to_fill': 35.0,
                'avg_quality_score': 85.0,
                'avg_match_score': 88.0,
                'conversion_rate': 0.08
            },
            'healthcare': {
                'avg_applications_per_jd': 38.0,
                'avg_time_to_fill': 42.0,
                'avg_quality_score': 82.0,
                'avg_match_score': 85.0,
                'conversion_rate': 0.15
            },
            'compliance_auditor': {
                'avg_applications_per_jd': 120.0,
                'avg_time_to_fill': 45.0,
                'avg_quality_score': 75.0,
                'avg_match_score': 80.0,
                'conversion_rate': 0.05
            },
            'education': {
                'avg_applications_per_jd': 55.0,
                'avg_time_to_fill': 38.0,
                'avg_quality_score': 80.0,
                'avg_match_score': 83.0,
                'conversion_rate': 0.10
            },
            'oil_gas': {
                'avg_applications_per_jd': 42.0,
                'avg_time_to_fill': 32.0,
                'avg_quality_score': 88.0,
                'avg_match_score': 90.0,
                'conversion_rate': 0.14
            },
            'general': {
                'avg_applications_per_jd': 50.0,
                'avg_time_to_fill': 35.0,
                'avg_quality_score': 75.0,
                'avg_match_score': 80.0,
                'conversion_rate': 0.10
            }
        }
    
    def track_jd_performance(self, jd_id: str, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Track job description performance metrics
        
        Args:
            jd_id: Unique job description identifier
            jd_data: Job description data and metadata
            
        Returns:
            Performance tracking results
        """
        try:
            logger.info(f"Starting JD performance tracking for: {jd_id}")
            
            # Initialize JD metrics if not exists
            if jd_id not in self.jd_metrics:
                self.jd_metrics[jd_id] = self._initialize_jd_metrics(jd_id, jd_data)
            
            # Update performance metrics
            performance_metrics = self._calculate_performance_metrics(jd_id, jd_data)
            
            # Track engagement metrics
            engagement_metrics = self._track_engagement_metrics(jd_id)
            
            # Calculate quality indicators
            quality_indicators = self._calculate_quality_indicators(jd_data)
            
            # Generate performance insights
            performance_insights = self._generate_performance_insights(
                jd_id, performance_metrics, engagement_metrics, quality_indicators
            )
            
            # Update stored metrics
            self.jd_metrics[jd_id].update({
                'last_updated': datetime.now().isoformat(),
                'performance_metrics': performance_metrics,
                'engagement_metrics': engagement_metrics,
                'quality_indicators': quality_indicators,
                'performance_insights': performance_insights
            })
            
            analytics_result = {
                'jd_id': jd_id,
                'timestamp': datetime.now().isoformat(),
                'performance_metrics': performance_metrics,
                'engagement_metrics': engagement_metrics,
                'quality_indicators': quality_indicators,
                'performance_insights': performance_insights,
                'benchmark_comparison': self._compare_to_benchmarks(jd_id, jd_data),
                'recommendations': self._generate_performance_recommendations(jd_id)
            }
            
            logger.info(f"JD performance tracking completed for: {jd_id}")
            return analytics_result
            
        except Exception as e:
            logger.error(f"Error in JD performance tracking: {str(e)}")
            return {
                'error': str(e),
                'jd_id': jd_id,
                'timestamp': datetime.now().isoformat()
            }
    
    def _initialize_jd_metrics(self, jd_id: str, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize metrics tracking for a new JD"""
        return {
            'jd_id': jd_id,
            'created_at': datetime.now().isoformat(),
            'title': jd_data.get('basic_info', {}).get('job_title', 'Unknown'),
            'company': jd_data.get('basic_info', {}).get('company', 'Unknown'),
            'sector': jd_data.get('uae_specifics', {}).get('sector_classification', 'general'),
            'views': 0,
            'applications': 0,
            'shortlisted': 0,
            'interviewed': 0,
            'hired': 0,
            'matching_attempts': 0,
            'avg_match_score': 0.0,
            'quality_score': jd_data.get('quality_metrics', {}).get('overall_quality_score', 0),
            'compliance_score': jd_data.get('compliance_analysis', {}).get('overall_compliance_score', 0)
        }
    
    def _calculate_performance_metrics(self, jd_id: str, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive performance metrics"""
        
        jd_metrics = self.jd_metrics.get(jd_id, {})
        
        # Basic performance metrics
        views = jd_metrics.get('views', 0)
        applications = jd_metrics.get('applications', 0)
        shortlisted = jd_metrics.get('shortlisted', 0)
        interviewed = jd_metrics.get('interviewed', 0)
        hired = jd_metrics.get('hired', 0)
        
        # Calculate conversion rates
        view_to_application_rate = (applications / views * 100) if views > 0 else 0
        application_to_shortlist_rate = (shortlisted / applications * 100) if applications > 0 else 0
        shortlist_to_interview_rate = (interviewed / shortlisted * 100) if shortlisted > 0 else 0
        interview_to_hire_rate = (hired / interviewed * 100) if interviewed > 0 else 0
        overall_conversion_rate = (hired / applications * 100) if applications > 0 else 0
        
        # Calculate time-based metrics
        created_date = datetime.fromisoformat(jd_metrics.get('created_at', datetime.now().isoformat()))
        days_active = (datetime.now() - created_date).days
        
        # Calculate efficiency metrics
        applications_per_day = applications / max(days_active, 1)
        time_to_first_application = self._calculate_time_to_first_application(jd_id)
        
        return {
            'basic_metrics': {
                'views': views,
                'applications': applications,
                'shortlisted': shortlisted,
                'interviewed': interviewed,
                'hired': hired,
                'days_active': days_active
            },
            'conversion_rates': {
                'view_to_application': round(view_to_application_rate, 2),
                'application_to_shortlist': round(application_to_shortlist_rate, 2),
                'shortlist_to_interview': round(shortlist_to_interview_rate, 2),
                'interview_to_hire': round(interview_to_hire_rate, 2),
                'overall_conversion': round(overall_conversion_rate, 2)
            },
            'efficiency_metrics': {
                'applications_per_day': round(applications_per_day, 2),
                'time_to_first_application': time_to_first_application,
                'avg_match_score': jd_metrics.get('avg_match_score', 0)
            },
            'performance_score': self._calculate_overall_performance_score({
                'conversion_rate': overall_conversion_rate,
                'applications_per_day': applications_per_day,
                'avg_match_score': jd_metrics.get('avg_match_score', 0)
            })
        }
    
    def _track_engagement_metrics(self, jd_id: str) -> Dict[str, Any]:
        """Track engagement and interaction metrics"""
        
        # Simulated engagement data - in real implementation, this would come from actual tracking
        engagement_data = {
            'page_views': self.jd_metrics.get(jd_id, {}).get('views', 0),
            'unique_visitors': int(self.jd_metrics.get(jd_id, {}).get('views', 0) * 0.8),
            'avg_time_on_page': 180,  # seconds
            'bounce_rate': 0.35,
            'social_shares': 0,
            'bookmarks': 0,
            'referral_sources': {
                'direct': 0.4,
                'job_boards': 0.3,
                'social_media': 0.15,
                'company_website': 0.15
            }
        }
        
        # Calculate engagement score
        engagement_score = self._calculate_engagement_score(engagement_data)
        
        return {
            'engagement_data': engagement_data,
            'engagement_score': engagement_score,
            'engagement_level': self._get_engagement_level(engagement_score)
        }
    
    def _calculate_quality_indicators(self, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate quality indicators for the JD"""
        
        quality_metrics = jd_data.get('quality_metrics', {})
        compliance_analysis = jd_data.get('compliance_analysis', {})
        skills_analysis = jd_data.get('skills_analysis', {})
        
        # Extract quality scores
        overall_quality = quality_metrics.get('overall_quality_score', 0)
        structure_score = quality_metrics.get('structure_score', 0)
        clarity_score = quality_metrics.get('clarity_score', 0)
        completeness_score = quality_metrics.get('completeness_score', 0)
        
        # Extract compliance scores
        compliance_score = compliance_analysis.get('overall_compliance_score', 0)
        emiratization_score = compliance_analysis.get('emiratization_analysis', {}).get('emiratization_score', 0)
        cultural_score = compliance_analysis.get('cultural_analysis', {}).get('cultural_score', 0)
        
        # Extract skills complexity
        skills_complexity = skills_analysis.get('complexity_score', 0)
        skills_diversity = skills_analysis.get('skill_diversity_score', 0)
        
        # Calculate composite quality indicators
        content_quality = (structure_score + clarity_score + completeness_score) / 3
        uae_alignment = (compliance_score + emiratization_score + cultural_score) / 3
        skills_sophistication = (skills_complexity + skills_diversity) / 2
        
        return {
            'quality_scores': {
                'overall_quality': overall_quality,
                'content_quality': round(content_quality, 2),
                'uae_alignment': round(uae_alignment, 2),
                'skills_sophistication': round(skills_sophistication, 2)
            },
            'detailed_scores': {
                'structure': structure_score,
                'clarity': clarity_score,
                'completeness': completeness_score,
                'compliance': compliance_score,
                'emiratization': emiratization_score,
                'cultural': cultural_score,
                'skills_complexity': skills_complexity,
                'skills_diversity': skills_diversity
            },
            'quality_grade': quality_metrics.get('quality_grade', 'N/A'),
            'improvement_areas': self._identify_improvement_areas(quality_metrics, compliance_analysis)
        }
    
    def _generate_performance_insights(self, jd_id: str, performance_metrics: Dict, 
                                     engagement_metrics: Dict, quality_indicators: Dict) -> List[Dict[str, Any]]:
        """Generate actionable performance insights"""
        
        insights = []
        
        # Performance insights
        conversion_rate = performance_metrics['conversion_rates']['overall_conversion']
        if conversion_rate < 5:
            insights.append({
                'type': 'performance',
                'priority': 'high',
                'title': 'Low Conversion Rate',
                'description': f'Overall conversion rate of {conversion_rate}% is below industry average.',
                'recommendation': 'Review job requirements and consider simplifying application process.',
                'impact': 'Could increase qualified applications by 20-30%'
            })
        
        # Engagement insights
        engagement_score = engagement_metrics['engagement_score']
        if engagement_score < 60:
            insights.append({
                'type': 'engagement',
                'priority': 'medium',
                'title': 'Low Engagement',
                'description': f'Engagement score of {engagement_score} indicates limited candidate interest.',
                'recommendation': 'Enhance job description with more compelling content and benefits.',
                'impact': 'Could improve application quality and quantity'
            })
        
        # Quality insights
        overall_quality = quality_indicators['quality_scores']['overall_quality']
        if overall_quality < 70:
            insights.append({
                'type': 'quality',
                'priority': 'high',
                'title': 'Quality Improvement Needed',
                'description': f'Quality score of {overall_quality} suggests content improvements needed.',
                'recommendation': 'Focus on structure, clarity, and completeness improvements.',
                'impact': 'Higher quality JDs attract 40% more qualified candidates'
            })
        
        # UAE alignment insights
        uae_alignment = quality_indicators['quality_scores']['uae_alignment']
        if uae_alignment < 60:
            insights.append({
                'type': 'compliance',
                'priority': 'high',
                'title': 'UAE Alignment Needed',
                'description': f'UAE alignment score of {uae_alignment} may limit local candidate attraction.',
                'recommendation': 'Add Emiratization statements and cultural alignment content.',
                'impact': 'Better UAE alignment increases local candidate applications by 50%'
            })
        
        return insights
    
    def _compare_to_benchmarks(self, jd_id: str, jd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Compare JD performance to industry benchmarks"""
        
        sector = jd_data.get('uae_specifics', {}).get('sector_classification', 'general')
        benchmarks = self.sector_benchmarks.get(sector, self.sector_benchmarks['general'])
        
        jd_metrics = self.jd_metrics.get(jd_id, {})
        
        # Calculate current performance
        applications = jd_metrics.get('applications', 0)
        days_active = max((datetime.now() - datetime.fromisoformat(
            jd_metrics.get('created_at', datetime.now().isoformat())
        )).days, 1)
        
        current_performance = {
            'applications_per_day': applications / days_active,
            'quality_score': jd_metrics.get('quality_score', 0),
            'match_score': jd_metrics.get('avg_match_score', 0),
            'conversion_rate': jd_metrics.get('hired', 0) / max(applications, 1)
        }
        
        # Compare to benchmarks
        comparison = {}
        for metric, current_value in current_performance.items():
            benchmark_key = f"avg_{metric}" if not metric.endswith('_rate') else metric
            benchmark_value = benchmarks.get(benchmark_key, 0)
            
            if benchmark_value > 0:
                performance_ratio = current_value / benchmark_value
                comparison[metric] = {
                    'current': round(current_value, 2),
                    'benchmark': round(benchmark_value, 2),
                    'ratio': round(performance_ratio, 2),
                    'status': 'above' if performance_ratio > 1.1 else 'below' if performance_ratio < 0.9 else 'on_par'
                }
        
        return {
            'sector': sector,
            'comparison': comparison,
            'overall_benchmark_score': self._calculate_benchmark_score(comparison)
        }
    
    def _generate_performance_recommendations(self, jd_id: str) -> List[Dict[str, Any]]:
        """Generate performance improvement recommendations"""
        
        recommendations = []
        jd_metrics = self.jd_metrics.get(jd_id, {})
        
        # Application volume recommendations
        applications = jd_metrics.get('applications', 0)
        if applications < 20:
            recommendations.append({
                'category': 'visibility',
                'priority': 'high',
                'title': 'Increase Job Visibility',
                'description': 'Low application volume suggests visibility issues.',
                'actions': [
                    'Post on additional job boards',
                    'Share on social media platforms',
                    'Optimize for search keywords',
                    'Consider sponsored job postings'
                ],
                'expected_impact': '2-3x increase in applications'
            })
        
        # Quality recommendations
        quality_score = jd_metrics.get('quality_score', 0)
        if quality_score < 75:
            recommendations.append({
                'category': 'content',
                'priority': 'medium',
                'title': 'Improve Content Quality',
                'description': 'Content quality improvements can attract better candidates.',
                'actions': [
                    'Add clear job responsibilities',
                    'Specify required qualifications',
                    'Include company culture information',
                    'Add growth opportunities'
                ],
                'expected_impact': '30% improvement in candidate quality'
            })
        
        # Compliance recommendations
        compliance_score = jd_metrics.get('compliance_score', 0)
        if compliance_score < 70:
            recommendations.append({
                'category': 'compliance',
                'priority': 'high',
                'title': 'Enhance UAE Compliance',
                'description': 'Better UAE compliance attracts local talent.',
                'actions': [
                    'Add Emiratization statement',
                    'Include Arabic language preferences',
                    'Mention UAE cultural values',
                    'Add visa sponsorship information'
                ],
                'expected_impact': '50% increase in UAE national applications'
            })
        
        return recommendations
    
    def get_recruiter_analytics(self, recruiter_id: str, time_period: str = '30d') -> Dict[str, Any]:
        """Get comprehensive analytics for a specific recruiter"""
        
        # Calculate time range
        end_date = datetime.now()
        if time_period == '7d':
            start_date = end_date - timedelta(days=7)
        elif time_period == '30d':
            start_date = end_date - timedelta(days=30)
        elif time_period == '90d':
            start_date = end_date - timedelta(days=90)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Get recruiter's JDs in time period
        recruiter_jds = self._get_recruiter_jds(recruiter_id, start_date, end_date)
        
        # Calculate aggregate metrics
        aggregate_metrics = self._calculate_aggregate_metrics(recruiter_jds)
        
        # Performance trends
        performance_trends = self._calculate_performance_trends(recruiter_jds, time_period)
        
        # Top performing JDs
        top_performing_jds = self._get_top_performing_jds(recruiter_jds)
        
        # Improvement opportunities
        improvement_opportunities = self._identify_improvement_opportunities(recruiter_jds)
        
        return {
            'recruiter_id': recruiter_id,
            'time_period': time_period,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'aggregate_metrics': aggregate_metrics,
            'performance_trends': performance_trends,
            'top_performing_jds': top_performing_jds,
            'improvement_opportunities': improvement_opportunities,
            'summary': self._generate_recruiter_summary(aggregate_metrics, performance_trends)
        }
    
    # Helper methods for calculations and analysis
    def _calculate_time_to_first_application(self, jd_id: str) -> Optional[int]:
        """Calculate time to first application in hours"""
        # Simulated data - in real implementation, track actual application timestamps
        return 24  # hours
    
    def _calculate_overall_performance_score(self, metrics: Dict[str, float]) -> float:
        """Calculate overall performance score"""
        weights = {
            'conversion_rate': 0.4,
            'applications_per_day': 0.3,
            'avg_match_score': 0.3
        }
        
        normalized_scores = {
            'conversion_rate': min(metrics['conversion_rate'] / 10 * 100, 100),
            'applications_per_day': min(metrics['applications_per_day'] / 2 * 100, 100),
            'avg_match_score': metrics['avg_match_score']
        }
        
        total_score = sum(normalized_scores[metric] * weight 
                         for metric, weight in weights.items())
        
        return round(total_score, 2)
    
    def _calculate_engagement_score(self, engagement_data: Dict[str, Any]) -> float:
        """Calculate engagement score based on various metrics"""
        
        # Normalize metrics to 0-100 scale
        page_views_score = min(engagement_data['page_views'] / 100 * 100, 100)
        time_on_page_score = min(engagement_data['avg_time_on_page'] / 300 * 100, 100)
        bounce_rate_score = (1 - engagement_data['bounce_rate']) * 100
        
        # Weighted average
        engagement_score = (
            page_views_score * 0.4 +
            time_on_page_score * 0.3 +
            bounce_rate_score * 0.3
        )
        
        return round(engagement_score, 2)
    
    def _get_engagement_level(self, score: float) -> str:
        """Get engagement level based on score"""
        if score >= 80:
            return 'high'
        elif score >= 60:
            return 'medium'
        else:
            return 'low'
    
    def _identify_improvement_areas(self, quality_metrics: Dict, compliance_analysis: Dict) -> List[str]:
        """Identify areas needing improvement"""
        
        areas = []
        
        if quality_metrics.get('structure_score', 0) < 70:
            areas.append('structure')
        if quality_metrics.get('clarity_score', 0) < 70:
            areas.append('clarity')
        if quality_metrics.get('completeness_score', 0) < 70:
            areas.append('completeness')
        if compliance_analysis.get('overall_compliance_score', 0) < 70:
            areas.append('uae_compliance')
        
        return areas
    
    def _calculate_benchmark_score(self, comparison: Dict[str, Dict]) -> float:
        """Calculate overall benchmark performance score"""
        
        ratios = [comp['ratio'] for comp in comparison.values()]
        if not ratios:
            return 0.0
        
        avg_ratio = statistics.mean(ratios)
        # Convert ratio to percentage score (1.0 = 100%)
        return round(min(avg_ratio * 100, 150), 2)  # Cap at 150%
    
    def _get_recruiter_jds(self, recruiter_id: str, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Get JDs for a specific recruiter in date range"""
        # In real implementation, filter by recruiter and date range
        return list(self.jd_metrics.values())
    
    def _calculate_aggregate_metrics(self, jds: List[Dict]) -> Dict[str, Any]:
        """Calculate aggregate metrics across multiple JDs"""
        
        if not jds:
            return {}
        
        total_views = sum(jd.get('views', 0) for jd in jds)
        total_applications = sum(jd.get('applications', 0) for jd in jds)
        total_hired = sum(jd.get('hired', 0) for jd in jds)
        
        avg_quality = statistics.mean([jd.get('quality_score', 0) for jd in jds])
        avg_compliance = statistics.mean([jd.get('compliance_score', 0) for jd in jds])
        
        return {
            'total_jds': len(jds),
            'total_views': total_views,
            'total_applications': total_applications,
            'total_hired': total_hired,
            'avg_quality_score': round(avg_quality, 2),
            'avg_compliance_score': round(avg_compliance, 2),
            'overall_conversion_rate': round((total_hired / max(total_applications, 1)) * 100, 2)
        }
    
    def _calculate_performance_trends(self, jds: List[Dict], time_period: str) -> Dict[str, Any]:
        """Calculate performance trends over time"""
        
        # Simulated trend data - in real implementation, calculate actual trends
        return {
            'applications_trend': 'increasing',
            'quality_trend': 'stable',
            'compliance_trend': 'improving',
            'conversion_trend': 'stable'
        }
    
    def _get_top_performing_jds(self, jds: List[Dict], limit: int = 5) -> List[Dict]:
        """Get top performing JDs"""
        
        # Sort by a composite performance score
        sorted_jds = sorted(jds, key=lambda x: (
            x.get('applications', 0) * 0.4 +
            x.get('quality_score', 0) * 0.3 +
            x.get('compliance_score', 0) * 0.3
        ), reverse=True)
        
        return sorted_jds[:limit]
    
    def _identify_improvement_opportunities(self, jds: List[Dict]) -> List[Dict[str, Any]]:
        """Identify improvement opportunities across JDs"""
        
        opportunities = []
        
        # Low quality JDs
        low_quality_jds = [jd for jd in jds if jd.get('quality_score', 0) < 70]
        if len(low_quality_jds) > len(jds) * 0.3:
            opportunities.append({
                'type': 'quality',
                'title': 'Improve JD Quality',
                'description': f'{len(low_quality_jds)} JDs have quality scores below 70%',
                'impact': 'high',
                'effort': 'medium'
            })
        
        # Low compliance JDs
        low_compliance_jds = [jd for jd in jds if jd.get('compliance_score', 0) < 70]
        if len(low_compliance_jds) > len(jds) * 0.2:
            opportunities.append({
                'type': 'compliance',
                'title': 'Enhance UAE Compliance',
                'description': f'{len(low_compliance_jds)} JDs need compliance improvements',
                'impact': 'high',
                'effort': 'low'
            })
        
        return opportunities
    
    def _generate_recruiter_summary(self, aggregate_metrics: Dict, performance_trends: Dict) -> Dict[str, Any]:
        """Generate summary for recruiter analytics"""
        
        return {
            'performance_level': 'good' if aggregate_metrics.get('avg_quality_score', 0) > 75 else 'needs_improvement',
            'key_strengths': ['Quality job descriptions', 'Good compliance scores'],
            'improvement_areas': ['Increase application volume', 'Enhance engagement'],
            'next_actions': ['Focus on JD visibility', 'Improve content quality']
        }

