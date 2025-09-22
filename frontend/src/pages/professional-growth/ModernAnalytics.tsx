import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowRight,
  Eye,
  PieChart,
  LineChart,
  Activity,
  Award,
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { UnifiedPageLayout } from '../../components/design-system/UnifiedPageLayout';
import { StandardCard, StatsCard } from '../../components/design-system/StandardCard';
import '../../styles/design-system.css';

const ModernAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const breadcrumbs = [
    { label: t('navigation.professional_growth') },
    { label: t('pages.analytics.title') }
  ];

  const periodFilters = [
    { id: 'week', label: t('pages.analytics.filters.this_week') },
    { id: 'month', label: t('pages.analytics.filters.this_month') },
    { id: 'quarter', label: t('pages.analytics.filters.this_quarter') },
    { id: 'year', label: t('pages.analytics.filters.this_year') }
  ];

  const keyMetrics = [
    {
      title: t('pages.analytics.metrics.job_applications'),
      value: '1,247',
      change: '+18%',
      changeType: 'positive' as const,
      icon: Briefcase,
      description: t('pages.analytics.metrics.job_applications_desc'),
      trend: [65, 78, 82, 95, 88, 92, 105]
    },
    {
      title: t('pages.analytics.metrics.profile_views'),
      value: '3,892',
      change: '+25%',
      changeType: 'positive' as const,
      icon: Eye,
      description: t('pages.analytics.metrics.profile_views_desc'),
      trend: [120, 135, 148, 162, 175, 188, 195]
    },
    {
      title: t('pages.analytics.metrics.skill_assessments'),
      value: '456',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Award,
      description: t('pages.analytics.metrics.skill_assessments_desc'),
      trend: [25, 32, 28, 35, 42, 38, 45]
    },
    {
      title: t('pages.analytics.metrics.interview_success'),
      value: '89%',
      change: '+5%',
      changeType: 'positive' as const,
      icon: CheckCircle,
      description: t('pages.analytics.metrics.interview_success_desc'),
      trend: [82, 85, 87, 86, 88, 89, 91]
    }
  ];

  const emiratizationMetrics = [
    {
      title: t('pages.analytics.emiratization.uae_nationals_hired'),
      value: '2,156',
      target: '2,500',
      percentage: 86,
      change: '+15%',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: t('pages.analytics.emiratization.government_placements'),
      value: '892',
      target: '1,000',
      percentage: 89,
      change: '+22%',
      changeType: 'positive' as const,
      icon: Target
    },
    {
      title: t('pages.analytics.emiratization.private_sector_growth'),
      value: '1,264',
      target: '1,500',
      percentage: 84,
      change: '+18%',
      changeType: 'positive' as const,
      icon: TrendingUp
    }
  ];

  const industryBreakdown = [
    { name: t('pages.analytics.industries.technology'), value: 28, color: '#3B82F6' },
    { name: t('pages.analytics.industries.finance'), value: 22, color: '#10B981' },
    { name: t('pages.analytics.industries.healthcare'), value: 18, color: '#F59E0B' },
    { name: t('pages.analytics.industries.education'), value: 15, color: '#8B5CF6' },
    { name: t('pages.analytics.industries.government'), value: 12, color: '#EF4444' },
    { name: t('pages.analytics.industries.other'), value: 5, color: '#6B7280' }
  ];

  const recentActivities = [
    {
      type: 'application',
      title: t('pages.analytics.activities.new_application'),
      description: 'Software Engineer at Emirates NBD',
      time: '2 hours ago',
      icon: Briefcase,
      status: 'pending'
    },
    {
      type: 'assessment',
      title: t('pages.analytics.activities.skill_assessment'),
      description: 'Python Programming Assessment',
      time: '5 hours ago',
      icon: Award,
      status: 'completed'
    },
    {
      type: 'interview',
      title: t('pages.analytics.activities.interview_scheduled'),
      description: 'Data Analyst at ADNOC',
      time: '1 day ago',
      icon: Calendar,
      status: 'scheduled'
    },
    {
      type: 'profile',
      title: t('pages.analytics.activities.profile_updated'),
      description: 'Added new certification',
      time: '2 days ago',
      icon: Users,
      status: 'completed'
    }
  ];

  const insights = [
    {
      type: 'success',
      title: t('pages.analytics.insights.strong_performance'),
      description: t('pages.analytics.insights.strong_performance_desc'),
      icon: CheckCircle,
      action: t('pages.analytics.insights.view_details')
    },
    {
      type: 'warning',
      title: t('pages.analytics.insights.skill_gap'),
      description: t('pages.analytics.insights.skill_gap_desc'),
      icon: AlertTriangle,
      action: t('pages.analytics.insights.take_assessment')
    },
    {
      type: 'info',
      title: t('pages.analytics.insights.market_trend'),
      description: t('pages.analytics.insights.market_trend_desc'),
      icon: TrendingUp,
      action: t('pages.analytics.insights.explore_opportunities')
    }
  ];

  return (
    <UnifiedPageLayout
      title={t('pages.analytics.title')}
      subtitle={t('pages.analytics.subtitle')}
      breadcrumbs={breadcrumbs}
      headerActions={
        <div className="flex items-center space-x-3">
          <button className="btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('pages.analytics.refresh')}
          </button>
          <button className="btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            {t('pages.analytics.export')}
          </button>
          <button className="btn-primary">
            {t('pages.analytics.view_report')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      }
    >
      {/* Hero Section with Period Selector */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8 mb-12">
        <div className="flex flex-col lg:flex-row items-start justify-between">
          <div className="flex-1 mb-6 lg:mb-0">
            <h2 className="text-display-2 text-gray-900 mb-4">
              {t('pages.analytics.hero.title')}
            </h2>
            <p className="text-body-large text-gray-600 mb-6">
              {t('pages.analytics.hero.description')}
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex space-x-2 bg-white rounded-lg p-1 shadow-sm">
            {periodFilters.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedPeriod === period.id
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {keyMetrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-teal-100 rounded-lg">
                <metric.icon className="h-6 w-6 text-teal-600" />
              </div>
              <span className={`text-sm font-medium ${
                metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {metric.value}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {metric.title}
            </p>
            
            {/* Mini Trend Chart */}
            <div className="flex items-end space-x-1 h-8">
              {metric.trend.map((value, idx) => (
                <div
                  key={idx}
                  className="bg-teal-200 rounded-sm flex-1"
                  style={{ height: `${(value / Math.max(...metric.trend)) * 100}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Emiratization Dashboard */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('pages.analytics.emiratization.title')}
            </h2>
            <p className="text-gray-600">
              {t('pages.analytics.emiratization.description')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {t('pages.analytics.emiratization.on_track')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {emiratizationMetrics.map((metric, index) => {
            const Icon = metric.icon;
            
            return (
              <div key={index} className="p-6 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8 text-teal-600" />
                  <span className={`text-sm font-medium ${
                    metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {metric.title}
                </h3>
                
                <div className="flex items-baseline space-x-2 mb-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </span>
                  <span className="text-sm text-gray-500">
                    / {metric.target}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {metric.percentage}% {t('common.of_target')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Industry Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('pages.analytics.industry_breakdown.title')}
            </h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {industryBreakdown.map((industry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: industry.color }}
                  />
                  <span className="text-sm text-gray-700">{industry.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${industry.value}%`,
                        backgroundColor: industry.color 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">
                    {industry.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('pages.analytics.recent_activities.title')}
            </h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              
              return (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg ${
                    activity.status === 'completed' ? 'bg-green-100' :
                    activity.status === 'pending' ? 'bg-yellow-100' :
                    activity.status === 'scheduled' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      activity.status === 'completed' ? 'text-green-600' :
                      activity.status === 'pending' ? 'text-yellow-600' :
                      activity.status === 'scheduled' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button className="w-full mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium">
            {t('pages.analytics.view_all_activities')}
          </button>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('pages.analytics.ai_insights.title')}
          </h2>
          <p className="text-gray-600">
            {t('pages.analytics.ai_insights.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            
            return (
              <div
                key={index}
                className={`p-6 rounded-xl border-2 ${
                  insight.type === 'success' ? 'border-green-200 bg-green-50' :
                  insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  insight.type === 'success' ? 'bg-green-100' :
                  insight.type === 'warning' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {insight.description}
                </p>
                
                <button className={`text-sm font-medium ${
                  insight.type === 'success' ? 'text-green-600 hover:text-green-700' :
                  insight.type === 'warning' ? 'text-yellow-600 hover:text-yellow-700' :
                  'text-blue-600 hover:text-blue-700'
                }`}>
                  {insight.action} →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">
          {t('pages.analytics.cta.title')}
        </h2>
        <p className="text-lg mb-6 opacity-90">
          {t('pages.analytics.cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-teal-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            {t('pages.analytics.cta.schedule_consultation')}
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-teal-600 transition-colors">
            {t('pages.analytics.cta.download_report')}
          </button>
        </div>
      </div>
    </UnifiedPageLayout>
  );
};

export default ModernAnalytics;
