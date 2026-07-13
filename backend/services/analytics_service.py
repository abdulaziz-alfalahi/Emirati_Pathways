"""
Advanced Analytics Service for Emirati Journey Platform
Real-time analytics, insights, and predictive analytics for UAE workforce development
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
import logging
from collections import defaultdict, Counter
from dataclasses import dataclass
from enum import Enum

# Initialize logger
logger = logging.getLogger(__name__)

class AnalyticsTimeframe(Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class MetricType(Enum):
    COUNT = "count"
    PERCENTAGE = "percentage"
    AVERAGE = "average"
    TREND = "trend"
    DISTRIBUTION = "distribution"

@dataclass
class AnalyticsMetric:
    name: str
    value: Any
    metric_type: MetricType
    timeframe: AnalyticsTimeframe
    timestamp: datetime
    metadata: Dict[str, Any] = None

@dataclass
class TrendData:
    period: str
    value: float
    change_percentage: float
    change_direction: str  # "up", "down", "stable"

class EmiratiJourneyAnalytics:
    """
    Comprehensive analytics service for the Emirati Journey Platform
    Provides real-time insights, trends, and predictive analytics
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # In production, these would connect to actual databases
        self.jobs_db = {}
        self.applications_db = {}
        self.companies_db = {}
        self.users_db = {}
        
    def set_data_sources(self, jobs_db, applications_db, companies_db, users_db=None):
        """Set data sources for analytics calculations"""
        self.jobs_db = jobs_db
        self.applications_db = applications_db
        self.companies_db = companies_db
        self.users_db = users_db or {}
    
    def get_platform_overview(self, timeframe: AnalyticsTimeframe = AnalyticsTimeframe.MONTHLY) -> Dict[str, Any]:
        """
        Get comprehensive platform overview with key metrics
        """
        try:
            current_time = datetime.utcnow()
            
            # Calculate time boundaries
            if timeframe == AnalyticsTimeframe.DAILY:
                start_time = current_time - timedelta(days=1)
            elif timeframe == AnalyticsTimeframe.WEEKLY:
                start_time = current_time - timedelta(weeks=1)
            elif timeframe == AnalyticsTimeframe.MONTHLY:
                start_time = current_time - timedelta(days=30)
            elif timeframe == AnalyticsTimeframe.QUARTERLY:
                start_time = current_time - timedelta(days=90)
            else:  # YEARLY
                start_time = current_time - timedelta(days=365)
            
            # Core metrics
            total_jobs = len(self.jobs_db)
            active_jobs = len([j for j in self.jobs_db.values() if j.status.value == 'published'])
            total_applications = len(self.applications_db)
            total_companies = len(self.companies_db)
            verified_companies = len([c for c in self.companies_db.values() if c.verification.is_verified])
            
            # Recent activity (within timeframe)
            recent_jobs = len([j for j in self.jobs_db.values() if j.created_at >= start_time])
            recent_applications = len([a for a in self.applications_db.values() if a.created_at >= start_time])
            
            # Success metrics
            successful_applications = len([a for a in self.applications_db.values() 
                                        if a.status.value in ['offer_accepted', 'hired']])
            
            # Emiratization metrics
            emiratization_data = self._calculate_emiratization_metrics()
            
            # Application success rate
            success_rate = (successful_applications / total_applications * 100) if total_applications > 0 else 0
            
            # Average time to hire (mock calculation)
            avg_time_to_hire = self._calculate_average_time_to_hire()
            
            return {
                'overview': {
                    'total_jobs': total_jobs,
                    'active_jobs': active_jobs,
                    'total_applications': total_applications,
                    'total_companies': total_companies,
                    'verified_companies': verified_companies,
                    'success_rate': round(success_rate, 2),
                    'avg_time_to_hire_days': avg_time_to_hire
                },
                'recent_activity': {
                    'new_jobs': recent_jobs,
                    'new_applications': recent_applications,
                    'timeframe': timeframe.value
                },
                'emiratization': emiratization_data,
                'trends': self._calculate_platform_trends(timeframe),
                'generated_at': current_time.isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating platform overview: {str(e)}")
            return {'error': 'Failed to generate platform overview'}
    
    def get_job_analytics(self, company_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get detailed job posting analytics
        """
        try:
            # Filter jobs by company if specified
            jobs = list(self.jobs_db.values())
            if company_id:
                jobs = [j for j in jobs if j.company_id == company_id]
            
            if not jobs:
                return {'message': 'No jobs found', 'data': {}}
            
            # Job status distribution
            status_distribution = Counter([job.status.value for job in jobs])
            
            # Employment type distribution
            employment_type_distribution = Counter([job.employment_type.value for job in jobs])
            
            # Location distribution (by emirate)
            emirate_distribution = Counter([job.location.emirate for job in jobs if job.location])
            
            # Industry distribution
            industry_distribution = Counter([job.industry for job in jobs if job.industry])
            
            # Salary analysis
            salary_data = self._analyze_salary_data(jobs)
            
            # Application metrics per job
            job_performance = []
            for job in jobs[:10]:  # Top 10 jobs
                applications = [a for a in self.applications_db.values() if a.job_id == job.id]
                job_performance.append({
                    'job_id': job.id,
                    'title': job.title,
                    'applications_count': len(applications),
                    'views': job.views,
                    'conversion_rate': (len(applications) / max(job.views, 1)) * 100,
                    'avg_match_score': sum([a.match_score for a in applications if a.match_score]) / len(applications) if applications else 0
                })
            
            # Sort by performance
            job_performance.sort(key=lambda x: x['conversion_rate'], reverse=True)
            
            return {
                'summary': {
                    'total_jobs': len(jobs),
                    'active_jobs': status_distribution.get('published', 0),
                    'draft_jobs': status_distribution.get('draft', 0),
                    'closed_jobs': status_distribution.get('closed', 0)
                },
                'distributions': {
                    'status': dict(status_distribution),
                    'employment_type': dict(employment_type_distribution),
                    'emirate': dict(emirate_distribution),
                    'industry': dict(industry_distribution)
                },
                'salary_analysis': salary_data,
                'top_performing_jobs': job_performance,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating job analytics: {str(e)}")
            return {'error': 'Failed to generate job analytics'}
    
    def get_application_analytics(self, candidate_id: Optional[str] = None, company_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get detailed application analytics
        """
        try:
            # Filter applications
            applications = list(self.applications_db.values())
            
            if candidate_id:
                applications = [a for a in applications if a.candidate_id == candidate_id]
            elif company_id:
                # Filter by company jobs
                company_jobs = [j.id for j in self.jobs_db.values() if j.company_id == company_id]
                applications = [a for a in applications if a.job_id in company_jobs]
            
            if not applications:
                return {'message': 'No applications found', 'data': {}}
            
            # Status distribution
            status_distribution = Counter([app.status.value for app in applications])
            
            # Source distribution
            source_distribution = Counter([app.source.value for app in applications])
            
            # Timeline analysis
            timeline_data = self._analyze_application_timeline(applications)
            
            # Success metrics
            successful_apps = [a for a in applications if a.status.value in ['offer_accepted', 'hired']]
            rejected_apps = [a for a in applications if a.status.value == 'rejected']
            
            success_rate = (len(successful_apps) / len(applications)) * 100 if applications else 0
            rejection_rate = (len(rejected_apps) / len(applications)) * 100 if applications else 0
            
            # Match score analysis
            match_scores = [a.match_score for a in applications if a.match_score is not None]
            avg_match_score = sum(match_scores) / len(match_scores) if match_scores else 0
            
            # Interview analysis
            interview_data = self._analyze_interview_data(applications)
            
            return {
                'summary': {
                    'total_applications': len(applications),
                    'success_rate': round(success_rate, 2),
                    'rejection_rate': round(rejection_rate, 2),
                    'avg_match_score': round(avg_match_score, 2),
                    'pending_applications': status_distribution.get('submitted', 0) + status_distribution.get('under_review', 0)
                },
                'distributions': {
                    'status': dict(status_distribution),
                    'source': dict(source_distribution)
                },
                'timeline_analysis': timeline_data,
                'interview_analysis': interview_data,
                'match_score_distribution': self._get_match_score_distribution(match_scores),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating application analytics: {str(e)}")
            return {'error': 'Failed to generate application analytics'}
    
    def get_emiratization_analytics(self) -> Dict[str, Any]:
        """
        Get comprehensive Emiratization analytics and compliance tracking
        """
        try:
            # Company Emiratization data
            companies_with_data = [c for c in self.companies_db.values() if c.emiratization]
            
            if not companies_with_data:
                return {'message': 'No Emiratization data available', 'data': {}}
            
            # Calculate overall metrics
            total_employees = sum([c.emiratization.total_employees for c in companies_with_data if c.emiratization.total_employees])
            total_emirati_employees = sum([c.emiratization.emirati_employees for c in companies_with_data if c.emiratization.emirati_employees])
            
            overall_rate = (total_emirati_employees / total_employees) * 100 if total_employees > 0 else 0
            
            # Compliance analysis
            compliant_companies = len([c for c in companies_with_data if c.is_emiratization_compliant()])
            compliance_rate = (compliant_companies / len(companies_with_data)) * 100
            
            # Industry breakdown
            industry_emiratization = defaultdict(lambda: {'total_employees': 0, 'emirati_employees': 0, 'companies': 0})
            
            for company in companies_with_data:
                if company.industry and company.emiratization:
                    industry = company.industry
                    industry_emiratization[industry]['total_employees'] += company.emiratization.total_employees or 0
                    industry_emiratization[industry]['emirati_employees'] += company.emiratization.emirati_employees or 0
                    industry_emiratization[industry]['companies'] += 1
            
            # Calculate rates per industry
            industry_rates = {}
            for industry, data in industry_emiratization.items():
                if data['total_employees'] > 0:
                    rate = (data['emirati_employees'] / data['total_employees']) * 100
                    industry_rates[industry] = {
                        'emiratization_rate': round(rate, 2),
                        'total_employees': data['total_employees'],
                        'emirati_employees': data['emirati_employees'],
                        'companies_count': data['companies']
                    }
            
            # Emirate breakdown
            emirate_data = defaultdict(lambda: {'companies': 0, 'total_rate': 0})
            for company in companies_with_data:
                primary_location = company.get_primary_location()
                if primary_location and company.emiratization.current_emiratization_rate:
                    emirate = primary_location.emirate
                    emirate_data[emirate]['companies'] += 1
                    emirate_data[emirate]['total_rate'] += company.emiratization.current_emiratization_rate
            
            # Calculate average rates per emirate
            emirate_rates = {}
            for emirate, data in emirate_data.items():
                if data['companies'] > 0:
                    avg_rate = data['total_rate'] / data['companies']
                    emirate_rates[emirate] = {
                        'avg_emiratization_rate': round(avg_rate, 2),
                        'companies_count': data['companies']
                    }
            
            # Trends (mock data for demonstration)
            trends = self._generate_emiratization_trends()
            
            return {
                'overall_metrics': {
                    'overall_emiratization_rate': round(overall_rate, 2),
                    'total_employees': total_employees,
                    'total_emirati_employees': total_emirati_employees,
                    'compliance_rate': round(compliance_rate, 2),
                    'compliant_companies': compliant_companies,
                    'total_companies': len(companies_with_data)
                },
                'industry_breakdown': industry_rates,
                'emirate_breakdown': emirate_rates,
                'trends': trends,
                'targets': {
                    'uae_vision_2071_target': 75.0,
                    'current_progress': round(overall_rate, 2),
                    'gap_to_target': round(75.0 - overall_rate, 2)
                },
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating Emiratization analytics: {str(e)}")
            return {'error': 'Failed to generate Emiratization analytics'}
    
    def get_matching_analytics(self) -> Dict[str, Any]:
        """
        Get job-candidate matching analytics and algorithm performance
        """
        try:
            applications_with_scores = [a for a in self.applications_db.values() if a.match_score is not None]
            
            if not applications_with_scores:
                return {'message': 'No matching data available', 'data': {}}
            
            # Match score distribution
            score_ranges = {
                '90-100%': 0, '80-89%': 0, '70-79%': 0, 
                '60-69%': 0, '50-59%': 0, 'Below 50%': 0
            }
            
            for app in applications_with_scores:
                score = app.match_score
                if score >= 90:
                    score_ranges['90-100%'] += 1
                elif score >= 80:
                    score_ranges['80-89%'] += 1
                elif score >= 70:
                    score_ranges['70-79%'] += 1
                elif score >= 60:
                    score_ranges['60-69%'] += 1
                elif score >= 50:
                    score_ranges['50-59%'] += 1
                else:
                    score_ranges['Below 50%'] += 1
            
            # Success correlation with match scores
            high_score_apps = [a for a in applications_with_scores if a.match_score >= 80]
            high_score_success = len([a for a in high_score_apps if a.status.value in ['offer_accepted', 'hired']])
            high_score_success_rate = (high_score_success / len(high_score_apps)) * 100 if high_score_apps else 0
            
            low_score_apps = [a for a in applications_with_scores if a.match_score < 60]
            low_score_success = len([a for a in low_score_apps if a.status.value in ['offer_accepted', 'hired']])
            low_score_success_rate = (low_score_success / len(low_score_apps)) * 100 if low_score_apps else 0
            
            # Average scores by industry
            industry_scores = defaultdict(list)
            for app in applications_with_scores:
                job = self.jobs_db.get(app.job_id)
                if job and job.industry:
                    industry_scores[job.industry].append(app.match_score)
            
            industry_avg_scores = {}
            for industry, scores in industry_scores.items():
                industry_avg_scores[industry] = round(sum(scores) / len(scores), 2)
            
            # Algorithm performance metrics
            total_matches = len(applications_with_scores)
            avg_match_score = sum([a.match_score for a in applications_with_scores]) / total_matches
            
            return {
                'algorithm_performance': {
                    'total_matches_analyzed': total_matches,
                    'average_match_score': round(avg_match_score, 2),
                    'high_quality_matches': score_ranges['90-100%'] + score_ranges['80-89%'],
                    'algorithm_accuracy': round(high_score_success_rate, 2)
                },
                'score_distribution': score_ranges,
                'success_correlation': {
                    'high_score_success_rate': round(high_score_success_rate, 2),
                    'low_score_success_rate': round(low_score_success_rate, 2),
                    'correlation_strength': 'Strong' if (high_score_success_rate - low_score_success_rate) > 20 else 'Moderate'
                },
                'industry_performance': industry_avg_scores,
                'recommendations': self._generate_matching_recommendations(applications_with_scores),
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error generating matching analytics: {str(e)}")
            return {'error': 'Failed to generate matching analytics'}
    
    def _calculate_emiratization_metrics(self) -> Dict[str, Any]:
        """Calculate Emiratization-specific metrics"""
        companies_with_data = [c for c in self.companies_db.values() if c.emiratization]
        
        if not companies_with_data:
            # No data -> "not available", never a fabricated figure. (#26)
            return {'overall_rate': None, 'compliant_companies': 0, 'total_companies': 0}

        # Calculate weighted average
        total_employees = sum([c.emiratization.total_employees for c in companies_with_data if c.emiratization.total_employees])
        total_emirati = sum([c.emiratization.emirati_employees for c in companies_with_data if c.emiratization.emirati_employees])

        overall_rate = (total_emirati / total_employees) * 100 if total_employees > 0 else None
        compliant = len([c for c in companies_with_data if c.is_emiratization_compliant()])

        return {
            'overall_rate': round(overall_rate, 1) if overall_rate is not None else None,
            'compliant_companies': compliant,
            'total_companies': len(companies_with_data),
            'compliance_percentage': round((compliant / len(companies_with_data)) * 100, 1)
        }
    
    def _calculate_average_time_to_hire(self) -> int:
        """Calculate average time from application to hire"""
        hired_applications = [a for a in self.applications_db.values() if a.status.value == 'hired']
        
        if not hired_applications:
            return 21  # Default mock value
        
        # Mock calculation - in production, would calculate actual time differences
        return 18  # Average days
    
    def _calculate_platform_trends(self, timeframe: AnalyticsTimeframe) -> Dict[str, TrendData]:
        """Calculate platform growth trends"""
        # Mock trend data - in production, would calculate from historical data
        return {
            'jobs': TrendData(
                period=timeframe.value,
                value=len(self.jobs_db),
                change_percentage=12.5,
                change_direction="up"
            ).__dict__,
            'applications': TrendData(
                period=timeframe.value,
                value=len(self.applications_db),
                change_percentage=8.3,
                change_direction="up"
            ).__dict__,
            'companies': TrendData(
                period=timeframe.value,
                value=len(self.companies_db),
                change_percentage=5.7,
                change_direction="up"
            ).__dict__
        }
    
    def _analyze_salary_data(self, jobs: List) -> Dict[str, Any]:
        """Analyze salary data from jobs"""
        jobs_with_salary = [j for j in jobs if j.salary and j.salary.min_salary]
        
        if not jobs_with_salary:
            return {'message': 'No salary data available'}
        
        salaries = []
        for job in jobs_with_salary:
            if job.salary.min_salary and job.salary.max_salary:
                avg_salary = (job.salary.min_salary + job.salary.max_salary) / 2
                salaries.append(avg_salary)
            elif job.salary.min_salary:
                salaries.append(job.salary.min_salary)
        
        if not salaries:
            return {'message': 'No valid salary data'}
        
        return {
            'average_salary': round(sum(salaries) / len(salaries), 2),
            'min_salary': min(salaries),
            'max_salary': max(salaries),
            'median_salary': sorted(salaries)[len(salaries) // 2],
            'jobs_with_salary_data': len(jobs_with_salary),
            'currency': 'AED'
        }
    
    def _analyze_application_timeline(self, applications: List) -> Dict[str, Any]:
        """Analyze application processing timeline"""
        # Mock timeline analysis
        return {
            'avg_time_to_first_response': 3.2,  # days
            'avg_time_to_interview': 8.5,  # days
            'avg_time_to_decision': 15.3,  # days
            'fastest_processing': 2,  # days
            'slowest_processing': 45  # days
        }
    
    def _analyze_interview_data(self, applications: List) -> Dict[str, Any]:
        """Analyze interview data and success rates"""
        apps_with_interviews = [a for a in applications if a.interviews]
        
        if not apps_with_interviews:
            return {'message': 'No interview data available'}
        
        total_interviews = sum([len(a.interviews) for a in apps_with_interviews])
        completed_interviews = sum([len([i for i in a.interviews if i.completed]) for a in apps_with_interviews])
        
        # Interview types
        interview_types = []
        for app in apps_with_interviews:
            for interview in app.interviews:
                interview_types.append(interview.interview_type.value)
        
        type_distribution = Counter(interview_types)
        
        return {
            'total_interviews_scheduled': total_interviews,
            'completed_interviews': completed_interviews,
            'completion_rate': round((completed_interviews / total_interviews) * 100, 2) if total_interviews > 0 else 0,
            'interview_type_distribution': dict(type_distribution),
            'avg_interviews_per_application': round(total_interviews / len(apps_with_interviews), 2)
        }
    
    def _get_match_score_distribution(self, scores: List[float]) -> Dict[str, int]:
        """Get distribution of match scores"""
        if not scores:
            return {}
        
        distribution = {'Excellent (90-100)': 0, 'Good (80-89)': 0, 'Fair (70-79)': 0, 'Poor (60-69)': 0, 'Very Poor (<60)': 0}
        
        for score in scores:
            if score >= 90:
                distribution['Excellent (90-100)'] += 1
            elif score >= 80:
                distribution['Good (80-89)'] += 1
            elif score >= 70:
                distribution['Fair (70-79)'] += 1
            elif score >= 60:
                distribution['Poor (60-69)'] += 1
            else:
                distribution['Very Poor (<60)'] += 1
        
        return distribution
    
    def _generate_emiratization_trends(self) -> Dict[str, Any]:
        """Generate Emiratization trend data"""
        # Mock trend data - in production, would be calculated from historical data
        return {
            # Mock quarterly trend removed — no real historical data source. (#26)
            'quarterly_progress': [],
            'projection_2025': 72.5,
            'vision_2071_target': 75.0
        }
    
    def _generate_matching_recommendations(self, applications: List) -> List[str]:
        """Generate recommendations for improving matching algorithm"""
        avg_score = sum([a.match_score for a in applications]) / len(applications)
        
        recommendations = []
        
        if avg_score < 70:
            recommendations.append("Consider refining matching criteria to improve overall match quality")
        
        if len([a for a in applications if a.match_score >= 90]) < len(applications) * 0.2:
            recommendations.append("Increase weight on critical skills to identify top candidates")
        
        recommendations.extend([
            "Implement machine learning to improve matching accuracy over time",
            "Add candidate preference weighting to matching algorithm",
            "Consider location proximity in matching calculations"
        ])
        
        return recommendations

# Global analytics instance
analytics_service = EmiratiJourneyAnalytics()

