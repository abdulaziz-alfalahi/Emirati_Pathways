import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Briefcase, Target, Award, Calendar, Filter, Download, RefreshCw, Eye, Star, MapPin, Building } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation('analytics');
  const [timeRange, setTimeRange] = useState<string>('6months');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sample data for charts
  const profileViewsData = [
    { month: 'Jan', views: 45, applications: 8 },
    { month: 'Feb', views: 52, applications: 12 },
    { month: 'Mar', views: 48, applications: 10 },
    { month: 'Apr', views: 61, applications: 15 },
    { month: 'May', views: 55, applications: 13 },
    { month: 'Jun', views: 67, applications: 18 }
  ];

  const skillsGrowthData = [
    { skill: 'Python', current: 85, target: 90 },
    { skill: 'React', current: 78, target: 85 },
    { skill: 'AWS', current: 72, target: 80 },
    { skill: 'Leadership', current: 68, target: 75 },
    { skill: 'Arabic', current: 95, target: 95 }
  ];

  const industryInterestData = [
    { name: 'Technology', value: 35, color: '#3B82F6' },
    { name: 'Finance', value: 25, color: '#10B981' },
    { name: 'Energy', value: 20, color: '#F59E0B' },
    { name: 'Healthcare', value: 12, color: '#EF4444' },
    { name: 'Aviation', value: 8, color: '#8B5CF6' }
  ];

  const jobMatchData = [
    { company: 'Emirates NBD', position: 'Senior Developer', match: 92, location: 'Dubai' },
    { company: 'ADNOC Digital', position: 'Tech Lead', match: 88, location: 'Abu Dhabi' },
    { company: 'Careem', position: 'Software Engineer', match: 85, location: 'Dubai' },
    { company: 'Noon', position: 'Full Stack Developer', match: 82, location: 'Dubai' },
    { company: 'Etisalat', position: 'Cloud Engineer', match: 79, location: 'Abu Dhabi' }
  ];

  const kpiCards = [
    {
      title: 'Profile Views',
      value: '324',
      change: '+12%',
      trend: 'up',
      icon: Eye,
      color: 'blue',
      description: 'Total profile views this month'
    },
    {
      title: 'Job Matches',
      value: '47',
      change: '+8%',
      trend: 'up',
      icon: Target,
      color: 'green',
      description: 'AI-powered job recommendations'
    },
    {
      title: 'Applications',
      value: '23',
      change: '+15%',
      trend: 'up',
      icon: Briefcase,
      color: 'purple',
      description: 'Job applications submitted'
    },
    {
      title: 'Skill Score',
      value: '78',
      change: '+5%',
      trend: 'up',
      icon: Award,
      color: 'orange',
      description: 'Overall competency rating'
    }
  ];

  const recentActivities = [
    {
      type: 'profile_view',
      company: 'Emirates NBD',
      action: 'viewed your profile',
      time: '2 hours ago',
      icon: '👁️'
    },
    {
      type: 'job_match',
      company: 'ADNOC Digital',
      action: 'matched you with Senior Developer role',
      time: '5 hours ago',
      icon: '🎯'
    },
    {
      type: 'skill_update',
      company: 'System',
      action: 'updated your Python skill rating to 85%',
      time: '1 day ago',
      icon: '📈'
    },
    {
      type: 'application',
      company: 'Careem',
      action: 'received your application',
      time: '2 days ago',
      icon: '📋'
    },
    {
      type: 'interview',
      company: 'Noon',
      action: 'scheduled interview for next week',
      time: '3 days ago',
      icon: '🤝'
    }
  ];

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-dubai">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-dubai-bold text-gray-900">Career Analytics</h1>
              <p className="text-gray-600 mt-2">Track your professional growth and career opportunities</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            const isPositive = kpi.trend === 'up';
            
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getColorClasses(kpi.color)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    {kpi.change}
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-dubai-bold text-gray-900">{kpi.value}</div>
                  <div className="text-sm font-dubai-medium text-gray-700">{kpi.title}</div>
                </div>
                <p className="text-xs text-gray-500">{kpi.description}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Profile Views & Applications Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-dubai-bold text-gray-900">Profile Performance</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Views</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Applications</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profileViewsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="applications" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Industry Interest Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-dubai-bold text-gray-900 mb-6">Industry Interest</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={industryInterestData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {industryInterestData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skills Progress */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-dubai-bold text-gray-900 mb-6">Skills Development</h3>
            <div className="space-y-4">
              {skillsGrowthData.map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-dubai-medium text-gray-700">{skill.skill}</span>
                      <span className="text-sm text-gray-500">{skill.current}% / {skill.target}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full relative"
                        style={{ width: `${(skill.current / skill.target) * 100}%` }}
                      >
                        <div 
                          className="absolute right-0 top-0 h-2 w-1 bg-gray-400 rounded-full"
                          style={{ right: `${100 - (skill.target / 100) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-dubai-bold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-dubai-medium">{activity.company}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Job Matches */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-dubai-bold text-gray-900">Top Job Matches</h3>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
              🤖 AI-Powered
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-dubai-medium text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 font-dubai-medium text-gray-700">Position</th>
                  <th className="text-left py-3 px-4 font-dubai-medium text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 font-dubai-medium text-gray-700">Match Score</th>
                  <th className="text-left py-3 px-4 font-dubai-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobMatchData.map((job, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="font-dubai-medium text-gray-900">{job.company}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{job.position}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${job.match}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-dubai-medium text-green-600">{job.match}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                        View Job
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* UAE Market Insights */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">🇦🇪</span>
            <h3 className="text-lg font-dubai-bold text-gray-900">UAE Market Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-blue-600 mb-2">+18%</div>
              <p className="text-sm text-gray-700">Tech sector growth in UAE</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-green-600 mb-2">2,500+</div>
              <p className="text-sm text-gray-700">New jobs for UAE Nationals</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-dubai-bold text-purple-600 mb-2">85%</div>
              <p className="text-sm text-gray-700">Remote work adoption rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
