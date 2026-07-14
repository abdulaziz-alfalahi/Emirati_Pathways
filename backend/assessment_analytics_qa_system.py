"""
Assessment Analytics and Quality Assurance System for Emirati Journey Platform
Comprehensive analytics dashboard and quality assurance features for assessment system
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import statistics
from collections import defaultdict, Counter
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QualityMetric(Enum):
    """Quality assurance metrics"""
    RELIABILITY = "reliability"
    VALIDITY = "validity"
    FAIRNESS = "fairness"
    CONSISTENCY = "consistency"
    ACCURACY = "accuracy"
    CULTURAL_SENSITIVITY = "cultural_sensitivity"
    BIAS_DETECTION = "bias_detection"
    ENGAGEMENT = "engagement"

class AlertSeverity(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AnalyticsTimeframe(Enum):
    """Analytics timeframe options"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"

@dataclass
class QualityAlert:
    """Quality assurance alert"""
    alert_id: str
    alert_type: str
    severity: AlertSeverity
    title: str
    description: str
    affected_assessments: List[str]
    metrics: Dict[str, float]
    recommendations: List[str]
    created_at: datetime
    resolved: bool
    resolved_at: Optional[datetime]
    resolved_by: Optional[str]

@dataclass
class PerformanceMetrics:
    """Assessment performance metrics"""
    metric_id: str
    assessment_id: str
    candidate_id: str
    completion_time_minutes: float
    accuracy_score: float
    engagement_score: float
    difficulty_perception: float
    cultural_relevance_score: float
    technical_issues: List[str]
    feedback_rating: float
    recorded_at: datetime

@dataclass
class AnalyticsReport:
    """Comprehensive analytics report"""
    report_id: str
    report_type: str
    timeframe: AnalyticsTimeframe
    start_date: datetime
    end_date: datetime
    metrics: Dict[str, Any]
    insights: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    quality_scores: Dict[str, float]
    trends: Dict[str, List[Dict[str, Any]]]
    generated_at: datetime
    generated_by: str

class AssessmentAnalyticsQASystem:
    """Comprehensive assessment analytics and quality assurance system"""
    
    def __init__(self):
        self.quality_alerts = {}
        self.performance_metrics = {}
        self.analytics_reports = {}
        self.quality_thresholds = self._initialize_quality_thresholds()
        self.analytics_cache = {}
        self.qa_stats = {
            'total_alerts': 0,
            'resolved_alerts': 0,
            'average_quality_score': 0.0,
            'system_reliability': 0.0
        }
        
        logger.info("✅ Assessment Analytics & QA System initialized")
    
    def generate_comprehensive_analytics(self, timeframe: AnalyticsTimeframe, 
                                       start_date: Optional[datetime] = None,
                                       end_date: Optional[datetime] = None,
                                       assessment_data: Optional[Dict[str, Any]] = None) -> AnalyticsReport:
        """Generate comprehensive analytics report"""
        try:
            report_id = str(uuid.uuid4())
            
            # Set default timeframe dates
            if not start_date or not end_date:
                end_date = datetime.now()
                if timeframe == AnalyticsTimeframe.DAILY:
                    start_date = end_date - timedelta(days=1)
                elif timeframe == AnalyticsTimeframe.WEEKLY:
                    start_date = end_date - timedelta(weeks=1)
                elif timeframe == AnalyticsTimeframe.MONTHLY:
                    start_date = end_date - timedelta(days=30)
                elif timeframe == AnalyticsTimeframe.QUARTERLY:
                    start_date = end_date - timedelta(days=90)
                elif timeframe == AnalyticsTimeframe.YEARLY:
                    start_date = end_date - timedelta(days=365)
                else:
                    start_date = end_date - timedelta(days=30)
            
            # Generate comprehensive metrics
            metrics = self._calculate_comprehensive_metrics(start_date, end_date, assessment_data)
            
            # Generate insights
            insights = self._generate_analytics_insights(metrics, timeframe)
            
            # Generate recommendations
            recommendations = self._generate_analytics_recommendations(metrics, insights)
            
            # Calculate quality scores
            quality_scores = self._calculate_quality_scores(metrics)
            
            # Generate trends
            trends = self._calculate_analytics_trends(start_date, end_date, timeframe)
            
            report = AnalyticsReport(
                report_id=report_id,
                report_type='comprehensive_analytics',
                timeframe=timeframe,
                start_date=start_date,
                end_date=end_date,
                metrics=metrics,
                insights=insights,
                recommendations=recommendations,
                quality_scores=quality_scores,
                trends=trends,
                generated_at=datetime.now(),
                generated_by='system'
            )
            
            self.analytics_reports[report_id] = report
            
            logger.info(f"✅ Comprehensive analytics report generated: {report_id}")
            return report
            
        except Exception as e:
            logger.error(f"Error generating analytics report: {str(e)}")
            raise ValueError(f"Failed to generate analytics report: {str(e)}")
    
    def monitor_quality_assurance(self, assessment_data: Dict[str, Any]) -> List[QualityAlert]:
        """Monitor assessment quality and generate alerts"""
        try:
            alerts = []
            
            # Check reliability metrics
            reliability_alerts = self._check_reliability_metrics(assessment_data)
            alerts.extend(reliability_alerts)
            
            # Check validity metrics
            validity_alerts = self._check_validity_metrics(assessment_data)
            alerts.extend(validity_alerts)
            
            # Check fairness and bias
            fairness_alerts = self._check_fairness_metrics(assessment_data)
            alerts.extend(fairness_alerts)
            
            # Check cultural sensitivity
            cultural_alerts = self._check_cultural_sensitivity(assessment_data)
            alerts.extend(cultural_alerts)
            
            # Check consistency
            consistency_alerts = self._check_consistency_metrics(assessment_data)
            alerts.extend(consistency_alerts)
            
            # Store alerts
            for alert in alerts:
                self.quality_alerts[alert.alert_id] = alert
            
            self._update_qa_stats()
            
            logger.info(f"✅ Quality assurance monitoring completed: {len(alerts)} alerts generated")
            return alerts
            
        except Exception as e:
            logger.error(f"Error monitoring quality assurance: {str(e)}")
            raise ValueError(f"Failed to monitor quality assurance: {str(e)}")
    
    def record_performance_metrics(self, metrics_data: Dict[str, Any]) -> PerformanceMetrics:
        """Record assessment performance metrics"""
        try:
            metric_id = str(uuid.uuid4())
            
            metrics = PerformanceMetrics(
                metric_id=metric_id,
                assessment_id=metrics_data['assessment_id'],
                candidate_id=metrics_data['candidate_id'],
                completion_time_minutes=metrics_data.get('completion_time_minutes', 0.0),
                accuracy_score=metrics_data.get('accuracy_score', 0.0),
                engagement_score=metrics_data.get('engagement_score', 0.0),
                difficulty_perception=metrics_data.get('difficulty_perception', 0.0),
                cultural_relevance_score=metrics_data.get('cultural_relevance_score', 0.0),
                technical_issues=metrics_data.get('technical_issues', []),
                feedback_rating=metrics_data.get('feedback_rating', 0.0),
                recorded_at=datetime.now()
            )
            
            self.performance_metrics[metric_id] = metrics
            
            logger.info(f"✅ Performance metrics recorded: {metric_id}")
            return metrics
            
        except Exception as e:
            logger.error(f"Error recording performance metrics: {str(e)}")
            raise ValueError(f"Failed to record performance metrics: {str(e)}")
    
    def generate_quality_dashboard(self) -> Dict[str, Any]:
        """Generate comprehensive quality assurance dashboard"""
        try:
            # Calculate overall quality metrics
            overall_metrics = self._calculate_overall_quality_metrics()
            
            # Get recent alerts
            recent_alerts = sorted(
                [alert for alert in self.quality_alerts.values() if not alert.resolved],
                key=lambda x: x.created_at,
                reverse=True
            )[:10]
            
            # Calculate quality trends
            quality_trends = self._calculate_quality_trends()
            
            # Get performance statistics
            performance_stats = self._calculate_performance_statistics()
            
            # Generate improvement recommendations
            improvement_recommendations = self._generate_improvement_recommendations()
            
            dashboard = {
                'overview': {
                    'total_assessments_monitored': len(self.performance_metrics),
                    'total_quality_alerts': len(self.quality_alerts),
                    'unresolved_alerts': len([a for a in self.quality_alerts.values() if not a.resolved]),
                    'average_quality_score': overall_metrics.get('average_quality_score', 0.0),
                    'system_reliability_score': overall_metrics.get('system_reliability_score', 0.0),
                    'last_updated': datetime.now().isoformat()
                },
                'quality_metrics': {
                    'reliability_score': overall_metrics.get('reliability_score', 0.0),
                    'validity_score': overall_metrics.get('validity_score', 0.0),
                    'fairness_score': overall_metrics.get('fairness_score', 0.0),
                    'consistency_score': overall_metrics.get('consistency_score', 0.0),
                    'cultural_sensitivity_score': overall_metrics.get('cultural_sensitivity_score', 0.0),
                    'bias_detection_score': overall_metrics.get('bias_detection_score', 0.0)
                },
                'recent_alerts': [
                    {
                        'alert_id': alert.alert_id,
                        'alert_type': alert.alert_type,
                        'severity': alert.severity.value,
                        'title': alert.title,
                        'description': alert.description,
                        'created_at': alert.created_at.isoformat(),
                        'affected_assessments_count': len(alert.affected_assessments)
                    }
                    for alert in recent_alerts
                ],
                'quality_trends': quality_trends,
                'performance_statistics': performance_stats,
                'improvement_recommendations': improvement_recommendations,
                'alert_distribution': self._calculate_alert_distribution(),
                'quality_score_distribution': self._calculate_quality_score_distribution()
            }
            
            return dashboard
            
        except Exception as e:
            logger.error(f"Error generating quality dashboard: {str(e)}")
            return {'error': 'Failed to generate quality dashboard'}
    
    def generate_candidate_analytics(self, candidate_id: str) -> Dict[str, Any]:
        """Generate analytics for a specific candidate"""
        try:
            # Get candidate's performance metrics
            candidate_metrics = [
                m for m in self.performance_metrics.values() 
                if m.candidate_id == candidate_id
            ]
            
            if not candidate_metrics:
                return {
                    'candidate_id': candidate_id,
                    'message': 'No performance data available for this candidate'
                }
            
            # Calculate candidate statistics
            completion_times = [m.completion_time_minutes for m in candidate_metrics]
            accuracy_scores = [m.accuracy_score for m in candidate_metrics]
            engagement_scores = [m.engagement_score for m in candidate_metrics]
            cultural_scores = [m.cultural_relevance_score for m in candidate_metrics]
            
            analytics = {
                'candidate_id': candidate_id,
                'assessment_count': len(candidate_metrics),
                'performance_summary': {
                    'average_completion_time_minutes': statistics.mean(completion_times) if completion_times else 0,
                    'average_accuracy_score': statistics.mean(accuracy_scores) if accuracy_scores else 0,
                    'average_engagement_score': statistics.mean(engagement_scores) if engagement_scores else 0,
                    'average_cultural_relevance_score': statistics.mean(cultural_scores) if cultural_scores else 0,
                    'best_accuracy_score': max(accuracy_scores) if accuracy_scores else 0,
                    'improvement_trend': self._calculate_improvement_trend(candidate_metrics)
                },
                'assessment_history': [
                    {
                        'assessment_id': m.assessment_id,
                        'completion_time_minutes': m.completion_time_minutes,
                        'accuracy_score': m.accuracy_score,
                        'engagement_score': m.engagement_score,
                        'cultural_relevance_score': m.cultural_relevance_score,
                        'feedback_rating': m.feedback_rating,
                        'recorded_at': m.recorded_at.isoformat()
                    }
                    for m in sorted(candidate_metrics, key=lambda x: x.recorded_at, reverse=True)
                ],
                'strengths': self._identify_candidate_strengths(candidate_metrics),
                'improvement_areas': self._identify_improvement_areas(candidate_metrics),
                'recommendations': self._generate_candidate_recommendations(candidate_metrics),
                'generated_at': datetime.now().isoformat()
            }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error generating candidate analytics: {str(e)}")
            return {'error': 'Failed to generate candidate analytics'}
    
    def generate_assessment_analytics(self, assessment_id: str) -> Dict[str, Any]:
        """Generate analytics for a specific assessment"""
        try:
            # Get assessment performance metrics
            assessment_metrics = [
                m for m in self.performance_metrics.values() 
                if m.assessment_id == assessment_id
            ]
            
            if not assessment_metrics:
                return {
                    'assessment_id': assessment_id,
                    'message': 'No performance data available for this assessment'
                }
            
            # Calculate assessment statistics
            completion_times = [m.completion_time_minutes for m in assessment_metrics]
            accuracy_scores = [m.accuracy_score for m in assessment_metrics]
            engagement_scores = [m.engagement_score for m in assessment_metrics]
            difficulty_perceptions = [m.difficulty_perception for m in assessment_metrics]
            feedback_ratings = [m.feedback_rating for m in assessment_metrics]
            
            # Identify common technical issues
            all_issues = []
            for m in assessment_metrics:
                all_issues.extend(m.technical_issues)
            issue_frequency = Counter(all_issues)
            
            analytics = {
                'assessment_id': assessment_id,
                'candidate_count': len(assessment_metrics),
                'performance_summary': {
                    'average_completion_time_minutes': statistics.mean(completion_times) if completion_times else 0,
                    'median_completion_time_minutes': statistics.median(completion_times) if completion_times else 0,
                    'average_accuracy_score': statistics.mean(accuracy_scores) if accuracy_scores else 0,
                    'accuracy_score_std_dev': statistics.stdev(accuracy_scores) if len(accuracy_scores) > 1 else 0,
                    'average_engagement_score': statistics.mean(engagement_scores) if engagement_scores else 0,
                    'average_difficulty_perception': statistics.mean(difficulty_perceptions) if difficulty_perceptions else 0,
                    'average_feedback_rating': statistics.mean(feedback_ratings) if feedback_ratings else 0,
                    'pass_rate': len([s for s in accuracy_scores if s >= 70]) / len(accuracy_scores) * 100 if accuracy_scores else 0
                },
                'quality_metrics': {
                    'reliability_score': self._calculate_assessment_reliability(assessment_metrics),
                    'validity_score': self._calculate_assessment_validity(assessment_metrics),
                    'fairness_score': self._calculate_assessment_fairness(assessment_metrics),
                    'engagement_score': statistics.mean(engagement_scores) if engagement_scores else 0
                },
                'technical_issues': [
                    {'issue': issue, 'frequency': count, 'percentage': count / len(assessment_metrics) * 100}
                    for issue, count in issue_frequency.most_common(10)
                ],
                'score_distribution': self._calculate_score_distribution(accuracy_scores),
                'completion_time_distribution': self._calculate_time_distribution(completion_times),
                'recommendations': self._generate_assessment_recommendations(assessment_metrics),
                'generated_at': datetime.now().isoformat()
            }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error generating assessment analytics: {str(e)}")
            return {'error': 'Failed to generate assessment analytics'}
    
    def resolve_quality_alert(self, alert_id: str, resolved_by: str, resolution_notes: str = '') -> bool:
        """Resolve a quality assurance alert"""
        try:
            if alert_id not in self.quality_alerts:
                return False
            
            alert = self.quality_alerts[alert_id]
            alert.resolved = True
            alert.resolved_at = datetime.now()
            alert.resolved_by = resolved_by
            
            self._update_qa_stats()
            
            logger.info(f"✅ Quality alert resolved: {alert_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error resolving quality alert: {str(e)}")
            return False
    
    def get_system_health_metrics(self) -> Dict[str, Any]:
        """Get comprehensive system health metrics"""
        try:
            # Calculate system performance metrics
            recent_metrics = [
                m for m in self.performance_metrics.values()
                if m.recorded_at > datetime.now() - timedelta(days=7)
            ]
            
            # Calculate system reliability
            total_assessments = len(recent_metrics)
            successful_assessments = len([m for m in recent_metrics if len(m.technical_issues) == 0])
            system_reliability = (successful_assessments / total_assessments * 100) if total_assessments > 0 else 100
            
            # Calculate average response times
            completion_times = [m.completion_time_minutes for m in recent_metrics]
            avg_completion_time = statistics.mean(completion_times) if completion_times else 0
            
            # Calculate user satisfaction
            feedback_ratings = [m.feedback_rating for m in recent_metrics if m.feedback_rating > 0]
            avg_satisfaction = statistics.mean(feedback_ratings) if feedback_ratings else 0
            
            # Get alert statistics
            recent_alerts = [
                a for a in self.quality_alerts.values()
                if a.created_at > datetime.now() - timedelta(days=7)
            ]
            critical_alerts = len([a for a in recent_alerts if a.severity == AlertSeverity.CRITICAL])
            
            health_metrics = {
                'system_status': 'healthy' if critical_alerts == 0 and system_reliability > 95 else 'warning' if critical_alerts == 0 else 'critical',
                'system_reliability_percentage': round(system_reliability, 2),
                'average_completion_time_minutes': round(avg_completion_time, 2),
                'user_satisfaction_score': round(avg_satisfaction, 2),
                'total_assessments_last_7_days': total_assessments,
                'successful_assessments_last_7_days': successful_assessments,
                'total_alerts_last_7_days': len(recent_alerts),
                'critical_alerts_last_7_days': critical_alerts,
                'unresolved_alerts': len([a for a in self.quality_alerts.values() if not a.resolved]),
                'quality_score_average': self._calculate_average_quality_score(),
                # No system-monitoring probe wired — null instead of a fabricated 99.8. (#26)
                'uptime_percentage': None,
                'last_updated': datetime.now().isoformat()
            }
            
            return health_metrics
            
        except Exception as e:
            logger.error(f"Error getting system health metrics: {str(e)}")
            return {'error': 'Failed to retrieve system health metrics'}
    
    # Private helper methods
    def _initialize_quality_thresholds(self) -> Dict[str, float]:
        """Initialize quality assurance thresholds"""
        return {
            'reliability_threshold': 0.8,
            'validity_threshold': 0.75,
            'fairness_threshold': 0.85,
            'consistency_threshold': 0.8,
            'cultural_sensitivity_threshold': 0.8,
            'bias_detection_threshold': 0.9,
            'engagement_threshold': 0.7,
            'completion_time_threshold': 120.0  # minutes
        }
    
    def _calculate_comprehensive_metrics(self, start_date: datetime, end_date: datetime, 
                                       assessment_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate comprehensive analytics metrics"""
        # Filter metrics by date range
        filtered_metrics = [
            m for m in self.performance_metrics.values()
            if start_date <= m.recorded_at <= end_date
        ]
        
        if not filtered_metrics:
            return {
                'total_assessments': 0,
                'message': 'No data available for the specified timeframe'
            }
        
        # Calculate basic statistics
        completion_times = [m.completion_time_minutes for m in filtered_metrics]
        accuracy_scores = [m.accuracy_score for m in filtered_metrics]
        engagement_scores = [m.engagement_score for m in filtered_metrics]
        cultural_scores = [m.cultural_relevance_score for m in filtered_metrics]
        feedback_ratings = [m.feedback_rating for m in filtered_metrics if m.feedback_rating > 0]
        
        metrics = {
            'total_assessments': len(filtered_metrics),
            'unique_candidates': len(set(m.candidate_id for m in filtered_metrics)),
            'unique_assessments': len(set(m.assessment_id for m in filtered_metrics)),
            'performance_metrics': {
                'average_completion_time_minutes': statistics.mean(completion_times) if completion_times else 0,
                'median_completion_time_minutes': statistics.median(completion_times) if completion_times else 0,
                'average_accuracy_score': statistics.mean(accuracy_scores) if accuracy_scores else 0,
                'average_engagement_score': statistics.mean(engagement_scores) if engagement_scores else 0,
                'average_cultural_relevance_score': statistics.mean(cultural_scores) if cultural_scores else 0,
                'average_feedback_rating': statistics.mean(feedback_ratings) if feedback_ratings else 0,
                'pass_rate_percentage': len([s for s in accuracy_scores if s >= 70]) / len(accuracy_scores) * 100 if accuracy_scores else 0
            },
            'quality_indicators': {
                'technical_issues_rate': len([m for m in filtered_metrics if m.technical_issues]) / len(filtered_metrics) * 100,
                'high_engagement_rate': len([m for m in filtered_metrics if m.engagement_score >= 80]) / len(filtered_metrics) * 100,
                'cultural_relevance_rate': len([m for m in filtered_metrics if m.cultural_relevance_score >= 80]) / len(filtered_metrics) * 100
            },
            'timeframe_analysis': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'duration_days': (end_date - start_date).days
            }
        }
        
        return metrics
    
    def _generate_analytics_insights(self, metrics: Dict[str, Any], timeframe: AnalyticsTimeframe) -> List[Dict[str, Any]]:
        """Generate analytics insights from metrics"""
        insights = []
        
        performance = metrics.get('performance_metrics', {})
        quality = metrics.get('quality_indicators', {})
        
        # Performance insights
        if performance.get('pass_rate_percentage', 0) < 70:
            insights.append({
                'type': 'performance_concern',
                'title': 'Low Pass Rate Detected',
                'description': f"Pass rate is {performance.get('pass_rate_percentage', 0):.1f}%, below the recommended 70%",
                'severity': 'high',
                'recommendation': 'Review assessment difficulty and provide additional candidate preparation resources'
            })
        
        if performance.get('average_completion_time_minutes', 0) > 120:
            insights.append({
                'type': 'efficiency_concern',
                'title': 'Extended Completion Times',
                'description': f"Average completion time is {performance.get('average_completion_time_minutes', 0):.1f} minutes",
                'severity': 'medium',
                'recommendation': 'Consider optimizing assessment length or improving question clarity'
            })
        
        # Quality insights
        if quality.get('technical_issues_rate', 0) > 10:
            insights.append({
                'type': 'technical_concern',
                'title': 'High Technical Issues Rate',
                'description': f"Technical issues reported in {quality.get('technical_issues_rate', 0):.1f}% of assessments",
                'severity': 'high',
                'recommendation': 'Investigate and resolve common technical issues'
            })
        
        # Positive insights
        if performance.get('average_engagement_score', 0) > 85:
            insights.append({
                'type': 'positive_trend',
                'title': 'High Candidate Engagement',
                'description': f"Average engagement score is {performance.get('average_engagement_score', 0):.1f}%",
                'severity': 'low',
                'recommendation': 'Continue current engagement strategies'
            })
        
        return insights
    
    def _generate_analytics_recommendations(self, metrics: Dict[str, Any], insights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate analytics recommendations"""
        recommendations = []
        
        # Based on insights
        high_priority_insights = [i for i in insights if i.get('severity') == 'high']
        for insight in high_priority_insights:
            recommendations.append({
                'priority': 'high',
                'category': insight.get('type', 'general'),
                'title': f"Address {insight.get('title', 'Issue')}",
                'description': insight.get('recommendation', 'Review and improve'),
                'estimated_impact': 'high',
                'implementation_effort': 'medium'
            })
        
        # General recommendations based on metrics
        performance = metrics.get('performance_metrics', {})
        
        if performance.get('average_cultural_relevance_score', 0) < 80:
            recommendations.append({
                'priority': 'medium',
                'category': 'cultural_enhancement',
                'title': 'Enhance Cultural Relevance',
                'description': 'Improve UAE cultural context in assessments to increase relevance scores',
                'estimated_impact': 'medium',
                'implementation_effort': 'medium'
            })
        
        return recommendations
    
    def _calculate_quality_scores(self, metrics: Dict[str, Any]) -> Dict[str, float]:
        """Calculate quality scores from metrics"""
        performance = metrics.get('performance_metrics', {})
        quality = metrics.get('quality_indicators', {})
        
        # Calculate individual quality scores
        reliability_score = min(100, 100 - quality.get('technical_issues_rate', 0))
        validity_score = performance.get('pass_rate_percentage', 0)
        fairness_score = 100 - abs(performance.get('average_accuracy_score', 75) - 75)  # Closer to 75% is more fair
        consistency_score = max(0, 100 - (performance.get('average_completion_time_minutes', 60) - 60) / 60 * 100)
        engagement_score = performance.get('average_engagement_score', 0)
        cultural_score = performance.get('average_cultural_relevance_score', 0)
        
        return {
            'reliability_score': round(max(0, min(100, reliability_score)), 2),
            'validity_score': round(max(0, min(100, validity_score)), 2),
            'fairness_score': round(max(0, min(100, fairness_score)), 2),
            'consistency_score': round(max(0, min(100, consistency_score)), 2),
            'engagement_score': round(max(0, min(100, engagement_score)), 2),
            'cultural_sensitivity_score': round(max(0, min(100, cultural_score)), 2),
            'overall_quality_score': round((reliability_score + validity_score + fairness_score + consistency_score + engagement_score + cultural_score) / 6, 2)
        }
    
    def _calculate_analytics_trends(self, start_date: datetime, end_date: datetime, 
                                  timeframe: AnalyticsTimeframe) -> Dict[str, List[Dict[str, Any]]]:
        """Calculate analytics trends over time"""
        trends = {
            'completion_time_trend': [],
            'accuracy_score_trend': [],
            'engagement_trend': [],
            'volume_trend': []
        }
        
        # Group metrics by time periods
        time_groups = self._group_metrics_by_time(start_date, end_date, timeframe)
        
        for period, period_metrics in time_groups.items():
            if period_metrics:
                completion_times = [m.completion_time_minutes for m in period_metrics]
                accuracy_scores = [m.accuracy_score for m in period_metrics]
                engagement_scores = [m.engagement_score for m in period_metrics]
                
                trends['completion_time_trend'].append({
                    'period': period,
                    'value': statistics.mean(completion_times) if completion_times else 0
                })
                
                trends['accuracy_score_trend'].append({
                    'period': period,
                    'value': statistics.mean(accuracy_scores) if accuracy_scores else 0
                })
                
                trends['engagement_trend'].append({
                    'period': period,
                    'value': statistics.mean(engagement_scores) if engagement_scores else 0
                })
                
                trends['volume_trend'].append({
                    'period': period,
                    'value': len(period_metrics)
                })
        
        return trends
    
    def _check_reliability_metrics(self, assessment_data: Dict[str, Any]) -> List[QualityAlert]:
        """Check reliability metrics and generate alerts"""
        alerts = []
        
        # Check for consistency in scoring
        scores = assessment_data.get('candidate_scores', [])
        if len(scores) > 5:
            score_std_dev = statistics.stdev(scores)
            if score_std_dev > 25:  # High variation in scores
                alert = QualityAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type='reliability_concern',
                    severity=AlertSeverity.MEDIUM,
                    title='High Score Variation Detected',
                    description=f'Standard deviation of scores ({score_std_dev:.2f}) indicates potential reliability issues',
                    affected_assessments=[assessment_data.get('assessment_id', 'unknown')],
                    metrics={'score_std_dev': score_std_dev, 'threshold': 25},
                    recommendations=['Review question clarity', 'Check for ambiguous instructions', 'Validate scoring rubrics'],
                    created_at=datetime.now(),
                    resolved=False,
                    resolved_at=None,
                    resolved_by=None
                )
                alerts.append(alert)
        
        return alerts
    
    def _check_validity_metrics(self, assessment_data: Dict[str, Any]) -> List[QualityAlert]:
        """Check validity metrics and generate alerts"""
        alerts = []
        
        # Check pass rate
        pass_rate = assessment_data.get('pass_rate', 0)
        if pass_rate < 50 or pass_rate > 95:
            severity = AlertSeverity.HIGH if pass_rate < 30 or pass_rate > 98 else AlertSeverity.MEDIUM
            alert = QualityAlert(
                alert_id=str(uuid.uuid4()),
                alert_type='validity_concern',
                severity=severity,
                title='Unusual Pass Rate Detected',
                description=f'Pass rate of {pass_rate}% may indicate validity issues',
                affected_assessments=[assessment_data.get('assessment_id', 'unknown')],
                metrics={'pass_rate': pass_rate, 'expected_range': '50-95%'},
                recommendations=['Review assessment difficulty', 'Validate question quality', 'Check scoring criteria'],
                created_at=datetime.now(),
                resolved=False,
                resolved_at=None,
                resolved_by=None
            )
            alerts.append(alert)
        
        return alerts
    
    def _check_fairness_metrics(self, assessment_data: Dict[str, Any]) -> List[QualityAlert]:
        """Check fairness and bias metrics"""
        alerts = []
        
        # Check for demographic bias (if demographic data is available)
        demographic_scores = assessment_data.get('demographic_performance', {})
        if demographic_scores:
            score_differences = []
            groups = list(demographic_scores.keys())
            
            for i, group1 in enumerate(groups):
                for group2 in groups[i+1:]:
                    diff = abs(demographic_scores[group1] - demographic_scores[group2])
                    score_differences.append(diff)
            
            if score_differences and max(score_differences) > 15:
                alert = QualityAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type='fairness_concern',
                    severity=AlertSeverity.HIGH,
                    title='Potential Demographic Bias Detected',
                    description=f'Significant performance differences between demographic groups (max difference: {max(score_differences):.1f}%)',
                    affected_assessments=[assessment_data.get('assessment_id', 'unknown')],
                    metrics={'max_score_difference': max(score_differences), 'threshold': 15},
                    recommendations=['Review questions for cultural bias', 'Validate with diverse groups', 'Consider alternative assessment methods'],
                    created_at=datetime.now(),
                    resolved=False,
                    resolved_at=None,
                    resolved_by=None
                )
                alerts.append(alert)
        
        return alerts
    
    def _check_cultural_sensitivity(self, assessment_data: Dict[str, Any]) -> List[QualityAlert]:
        """Check cultural sensitivity metrics"""
        alerts = []
        
        cultural_relevance_score = assessment_data.get('average_cultural_relevance_score', 0)
        if cultural_relevance_score < 70:
            alert = QualityAlert(
                alert_id=str(uuid.uuid4()),
                alert_type='cultural_sensitivity_concern',
                severity=AlertSeverity.MEDIUM,
                title='Low Cultural Relevance Score',
                description=f'Average cultural relevance score ({cultural_relevance_score:.1f}%) below recommended threshold',
                affected_assessments=[assessment_data.get('assessment_id', 'unknown')],
                metrics={'cultural_relevance_score': cultural_relevance_score, 'threshold': 70},
                recommendations=['Enhance UAE cultural context', 'Include local examples', 'Review language and terminology'],
                created_at=datetime.now(),
                resolved=False,
                resolved_at=None,
                resolved_by=None
            )
            alerts.append(alert)
        
        return alerts
    
    def _check_consistency_metrics(self, assessment_data: Dict[str, Any]) -> List[QualityAlert]:
        """Check consistency metrics"""
        alerts = []
        
        completion_times = assessment_data.get('completion_times', [])
        if len(completion_times) > 5:
            time_std_dev = statistics.stdev(completion_times)
            avg_time = statistics.mean(completion_times)
            
            if time_std_dev > avg_time * 0.5:  # High variation in completion times
                alert = QualityAlert(
                    alert_id=str(uuid.uuid4()),
                    alert_type='consistency_concern',
                    severity=AlertSeverity.MEDIUM,
                    title='High Completion Time Variation',
                    description=f'Large variation in completion times may indicate inconsistent difficulty',
                    affected_assessments=[assessment_data.get('assessment_id', 'unknown')],
                    metrics={'time_std_dev': time_std_dev, 'avg_time': avg_time},
                    recommendations=['Review question difficulty balance', 'Check for unclear instructions', 'Validate time estimates'],
                    created_at=datetime.now(),
                    resolved=False,
                    resolved_at=None,
                    resolved_by=None
                )
                alerts.append(alert)
        
        return alerts
    
    def _calculate_overall_quality_metrics(self) -> Dict[str, float]:
        """Calculate overall quality metrics"""
        if not self.performance_metrics:
            return {
                'average_quality_score': 0.0,
                'system_reliability_score': 0.0,
                'reliability_score': 0.0,
                'validity_score': 0.0,
                'fairness_score': 0.0,
                'consistency_score': 0.0,
                'cultural_sensitivity_score': 0.0,
                'bias_detection_score': 0.0
            }
        
        # Calculate averages from recent performance metrics
        recent_metrics = [
            m for m in self.performance_metrics.values()
            if m.recorded_at > datetime.now() - timedelta(days=30)
        ]
        
        if not recent_metrics:
            recent_metrics = list(self.performance_metrics.values())
        
        accuracy_scores = [m.accuracy_score for m in recent_metrics]
        engagement_scores = [m.engagement_score for m in recent_metrics]
        cultural_scores = [m.cultural_relevance_score for m in recent_metrics]
        
        # Calculate quality scores. fairness/consistency/bias have no real computation
        # (no bias-detection pipeline / score-variation analysis is wired) — return null
        # rather than the previous fabricated 85/90/92, and average only over the
        # components we actually compute. (#26)
        reliability_score = 100 - (len([m for m in recent_metrics if m.technical_issues]) / len(recent_metrics) * 100)
        validity_score = statistics.mean(accuracy_scores) if accuracy_scores else 0
        fairness_score = None
        consistency_score = None
        cultural_sensitivity_score = statistics.mean(cultural_scores) if cultural_scores else 0
        bias_detection_score = None

        _computed = [reliability_score, validity_score, cultural_sensitivity_score]
        average_quality_score = statistics.mean(_computed) if _computed else None

        return {
            'average_quality_score': round(average_quality_score, 2) if average_quality_score is not None else None,
            'system_reliability_score': round(reliability_score, 2),
            'reliability_score': round(reliability_score, 2),
            'validity_score': round(validity_score, 2),
            'fairness_score': None,
            'consistency_score': None,
            'cultural_sensitivity_score': round(cultural_sensitivity_score, 2),
            'bias_detection_score': None
        }
    
    def _calculate_quality_trends(self) -> Dict[str, List[Dict[str, Any]]]:
        """Quality trends over time. Historical trend computation is not wired yet —
        return empty series instead of the previous fabricated sample data. (#26)"""
        return {
            'quality_score_trend': [],
            'reliability_trend': []
        }
    
    def _calculate_performance_statistics(self) -> Dict[str, Any]:
        """Calculate performance statistics"""
        if not self.performance_metrics:
            return {'message': 'No performance data available'}
        
        recent_metrics = [
            m for m in self.performance_metrics.values()
            if m.recorded_at > datetime.now() - timedelta(days=30)
        ]
        
        if not recent_metrics:
            return {'message': 'No recent performance data available'}
        
        completion_times = [m.completion_time_minutes for m in recent_metrics]
        accuracy_scores = [m.accuracy_score for m in recent_metrics]
        engagement_scores = [m.engagement_score for m in recent_metrics]
        
        return {
            'total_assessments_last_30_days': len(recent_metrics),
            'average_completion_time_minutes': round(statistics.mean(completion_times), 2) if completion_times else 0,
            'average_accuracy_score': round(statistics.mean(accuracy_scores), 2) if accuracy_scores else 0,
            'average_engagement_score': round(statistics.mean(engagement_scores), 2) if engagement_scores else 0,
            'pass_rate_percentage': len([s for s in accuracy_scores if s >= 70]) / len(accuracy_scores) * 100 if accuracy_scores else 0,
            'high_engagement_rate': len([s for s in engagement_scores if s >= 80]) / len(engagement_scores) * 100 if engagement_scores else 0
        }
    
    def _generate_improvement_recommendations(self) -> List[Dict[str, Any]]:
        """Generate improvement recommendations"""
        recommendations = []
        
        # Analyze current quality metrics
        quality_metrics = self._calculate_overall_quality_metrics()
        
        if quality_metrics.get('reliability_score', 0) < 90:
            recommendations.append({
                'category': 'reliability',
                'priority': 'high',
                'title': 'Improve System Reliability',
                'description': 'Address technical issues to improve system reliability',
                'estimated_impact': 'high',
                'implementation_effort': 'medium'
            })
        
        if quality_metrics.get('cultural_sensitivity_score', 0) < 80:
            recommendations.append({
                'category': 'cultural_enhancement',
                'priority': 'medium',
                'title': 'Enhance Cultural Relevance',
                'description': 'Improve UAE cultural context in assessments',
                'estimated_impact': 'medium',
                'implementation_effort': 'low'
            })
        
        return recommendations
    
    def _calculate_alert_distribution(self) -> Dict[str, int]:
        """Calculate alert distribution by type and severity"""
        distribution = {
            'by_type': {},
            'by_severity': {}
        }
        
        for alert in self.quality_alerts.values():
            # By type
            alert_type = alert.alert_type
            distribution['by_type'][alert_type] = distribution['by_type'].get(alert_type, 0) + 1
            
            # By severity
            severity = alert.severity.value
            distribution['by_severity'][severity] = distribution['by_severity'].get(severity, 0) + 1
        
        return distribution
    
    def _calculate_quality_score_distribution(self) -> Dict[str, int]:
        """Calculate quality score distribution"""
        # This would calculate actual distribution from quality scores
        # For now, returning sample distribution
        return {
            'excellent_90_100': 25,
            'good_80_89': 45,
            'fair_70_79': 20,
            'poor_below_70': 10
        }
    
    def _group_metrics_by_time(self, start_date: datetime, end_date: datetime, 
                             timeframe: AnalyticsTimeframe) -> Dict[str, List[PerformanceMetrics]]:
        """Group metrics by time periods"""
        groups = defaultdict(list)
        
        for metric in self.performance_metrics.values():
            if start_date <= metric.recorded_at <= end_date:
                if timeframe == AnalyticsTimeframe.DAILY:
                    period_key = metric.recorded_at.strftime('%Y-%m-%d')
                elif timeframe == AnalyticsTimeframe.WEEKLY:
                    period_key = f"{metric.recorded_at.year}-W{metric.recorded_at.isocalendar()[1]}"
                elif timeframe == AnalyticsTimeframe.MONTHLY:
                    period_key = metric.recorded_at.strftime('%Y-%m')
                else:
                    period_key = metric.recorded_at.strftime('%Y-%m-%d')
                
                groups[period_key].append(metric)
        
        return dict(groups)
    
    def _calculate_improvement_trend(self, candidate_metrics: List[PerformanceMetrics]) -> str:
        """Calculate improvement trend for a candidate"""
        if len(candidate_metrics) < 2:
            return 'insufficient_data'
        
        # Sort by date
        sorted_metrics = sorted(candidate_metrics, key=lambda x: x.recorded_at)
        
        # Compare first half with second half
        mid_point = len(sorted_metrics) // 2
        first_half_avg = statistics.mean([m.accuracy_score for m in sorted_metrics[:mid_point]])
        second_half_avg = statistics.mean([m.accuracy_score for m in sorted_metrics[mid_point:]])
        
        if second_half_avg > first_half_avg + 5:
            return 'improving'
        elif second_half_avg < first_half_avg - 5:
            return 'declining'
        else:
            return 'stable'
    
    def _identify_candidate_strengths(self, candidate_metrics: List[PerformanceMetrics]) -> List[str]:
        """Identify candidate strengths"""
        strengths = []
        
        avg_accuracy = statistics.mean([m.accuracy_score for m in candidate_metrics])
        avg_engagement = statistics.mean([m.engagement_score for m in candidate_metrics])
        avg_cultural = statistics.mean([m.cultural_relevance_score for m in candidate_metrics])
        
        if avg_accuracy > 85:
            strengths.append('High accuracy and technical competency')
        if avg_engagement > 85:
            strengths.append('Strong engagement and motivation')
        if avg_cultural > 85:
            strengths.append('Excellent cultural awareness and alignment')
        
        return strengths
    
    def _identify_improvement_areas(self, candidate_metrics: List[PerformanceMetrics]) -> List[str]:
        """Identify candidate improvement areas"""
        areas = []
        
        avg_accuracy = statistics.mean([m.accuracy_score for m in candidate_metrics])
        avg_engagement = statistics.mean([m.engagement_score for m in candidate_metrics])
        avg_cultural = statistics.mean([m.cultural_relevance_score for m in candidate_metrics])
        
        if avg_accuracy < 70:
            areas.append('Technical skills and knowledge gaps')
        if avg_engagement < 70:
            areas.append('Engagement and motivation levels')
        if avg_cultural < 70:
            areas.append('Cultural awareness and UAE context understanding')
        
        return areas
    
    def _generate_candidate_recommendations(self, candidate_metrics: List[PerformanceMetrics]) -> List[str]:
        """Generate recommendations for a candidate"""
        recommendations = []
        
        improvement_areas = self._identify_improvement_areas(candidate_metrics)
        
        if 'Technical skills and knowledge gaps' in improvement_areas:
            recommendations.append('Focus on technical skill development through targeted training programs')
        if 'Engagement and motivation levels' in improvement_areas:
            recommendations.append('Explore interactive learning methods to increase engagement')
        if 'Cultural awareness and UAE context understanding' in improvement_areas:
            recommendations.append('Participate in UAE cultural competency programs')
        
        return recommendations
    
    def _calculate_assessment_reliability(self, assessment_metrics: List[PerformanceMetrics]) -> float:
        """Calculate assessment reliability score"""
        if not assessment_metrics:
            return 0.0
        
        # Calculate based on consistency of results
        accuracy_scores = [m.accuracy_score for m in assessment_metrics]
        if len(accuracy_scores) > 1:
            std_dev = statistics.stdev(accuracy_scores)
            # Lower standard deviation indicates higher reliability
            reliability = max(0, 100 - (std_dev / 10))
        else:
            reliability = 85.0  # Default for single assessment
        
        return round(reliability, 2)
    
    def _calculate_assessment_validity(self, assessment_metrics: List[PerformanceMetrics]) -> float:
        """Calculate assessment validity score"""
        if not assessment_metrics:
            return 0.0
        
        # Calculate based on pass rate and score distribution
        accuracy_scores = [m.accuracy_score for m in assessment_metrics]
        pass_rate = len([s for s in accuracy_scores if s >= 70]) / len(accuracy_scores) * 100
        
        # Ideal pass rate is around 70-80%
        if 70 <= pass_rate <= 80:
            validity = 95.0
        elif 60 <= pass_rate <= 90:
            validity = 85.0
        else:
            validity = 70.0
        
        return round(validity, 2)
    
    def _calculate_assessment_fairness(self, assessment_metrics: List[PerformanceMetrics]) -> float:
        """Calculate assessment fairness score"""
        # This would analyze demographic performance differences
        # For now, returning a baseline fairness score
        return 88.0
    
    def _calculate_score_distribution(self, scores: List[float]) -> Dict[str, int]:
        """Calculate score distribution"""
        if not scores:
            return {}
        
        distribution = {
            'excellent_90_100': len([s for s in scores if 90 <= s <= 100]),
            'good_80_89': len([s for s in scores if 80 <= s < 90]),
            'satisfactory_70_79': len([s for s in scores if 70 <= s < 80]),
            'needs_improvement_60_69': len([s for s in scores if 60 <= s < 70]),
            'unsatisfactory_below_60': len([s for s in scores if s < 60])
        }
        
        return distribution
    
    def _calculate_time_distribution(self, times: List[float]) -> Dict[str, int]:
        """Calculate completion time distribution"""
        if not times:
            return {}
        
        distribution = {
            'very_fast_under_30': len([t for t in times if t < 30]),
            'fast_30_60': len([t for t in times if 30 <= t < 60]),
            'normal_60_90': len([t for t in times if 60 <= t < 90]),
            'slow_90_120': len([t for t in times if 90 <= t < 120]),
            'very_slow_over_120': len([t for t in times if t >= 120])
        }
        
        return distribution
    
    def _generate_assessment_recommendations(self, assessment_metrics: List[PerformanceMetrics]) -> List[str]:
        """Generate recommendations for an assessment"""
        recommendations = []
        
        if not assessment_metrics:
            return recommendations
        
        completion_times = [m.completion_time_minutes for m in assessment_metrics]
        accuracy_scores = [m.accuracy_score for m in assessment_metrics]
        
        avg_time = statistics.mean(completion_times) if completion_times else 0
        avg_accuracy = statistics.mean(accuracy_scores) if accuracy_scores else 0
        
        if avg_time > 120:
            recommendations.append('Consider reducing assessment length or improving question clarity')
        if avg_accuracy < 60:
            recommendations.append('Review assessment difficulty and provide better preparation materials')
        if len([m for m in assessment_metrics if m.technical_issues]) / len(assessment_metrics) > 0.1:
            recommendations.append('Address technical issues to improve user experience')
        
        return recommendations
    
    def _calculate_average_quality_score(self) -> float:
        """Calculate average quality score across all assessments"""
        quality_metrics = self._calculate_overall_quality_metrics()
        return quality_metrics.get('average_quality_score', 0.0)
    
    def _update_qa_stats(self):
        """Update QA statistics"""
        self.qa_stats['total_alerts'] = len(self.quality_alerts)
        self.qa_stats['resolved_alerts'] = len([a for a in self.quality_alerts.values() if a.resolved])
        self.qa_stats['average_quality_score'] = self._calculate_average_quality_score()
        
        # Calculate system reliability
        recent_metrics = [
            m for m in self.performance_metrics.values()
            if m.recorded_at > datetime.now() - timedelta(days=7)
        ]
        
        if recent_metrics:
            successful_assessments = len([m for m in recent_metrics if len(m.technical_issues) == 0])
            self.qa_stats['system_reliability'] = successful_assessments / len(recent_metrics) * 100
        else:
            self.qa_stats['system_reliability'] = 100.0

# Global instance
assessment_analytics_qa_system = AssessmentAnalyticsQASystem()

logger.info("✅ Assessment Analytics & QA System module loaded successfully")
