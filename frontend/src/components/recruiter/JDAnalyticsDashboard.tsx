import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Target,
  Briefcase,
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Award,
  Globe,
  Zap
} from 'lucide-react';

interface JDAnalyticsData {
  overview: {
    totalJDs: number;
    activeJDs: number;
    totalViews: number;
    totalApplications: number;
    avgTimeToFill: number;
    conversionRate: number;
    topPerformingJD: string;
    worstPerformingJD: string;
  };
  performance: {
    jdId: string;
    title: string;
    views: number;
    applications: number;
    conversionRate: number;
    timeToFill: number;
    qualityScore: number;
    complianceScore: number;
    uaeAlignment: number;
    status: string;
    createdDate: string;
    lastUpdated: string;
  }[];
  trends: {
    date: string;
    views: number;
    applications: number;
    newJDs: number;
    filledPositions: number;
  }[];
  skillsAnalysis: {
    skill: string;
    demand: number;
    supply: number;
    gap: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  locationAnalysis: {
    emirate: string;
    jobCount: number;
    applicationRate: number;
    avgSalary: number;
    topSkills: string[];
  }[];
  industryAnalysis: {
    industry: string;
    jobCount: number;
    avgQualityScore: number;
    avgComplianceScore: number;
    avgTimeToFill: number;
    conversionRate: number;
  }[];
  qualityMetrics: {
    metric: string;
    score: number;
    benchmark: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  complianceMetrics: {
    category: string;
    compliantJDs: number;
    totalJDs: number;
    complianceRate: number;
    criticalIssues: number;
  }[];
  uaeSpecificMetrics: {
    emiratizationMentioned: number;
    arabicRequirement: number;
    visaSponsorshipOffered: number;
    culturalFitAssessed: number;
    localMarketAlignment: number;
  };
}

const JDAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<JDAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedEmirate, setSelectedEmirate] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedIndustry, selectedEmirate]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date_range: dateRange,
        industry: selectedIndustry,
        emirate: selectedEmirate
      });

      const response = await fetch(`/api/jd/enhanced/analytics/dashboard?${params}`);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        date_range: dateRange,
        industry: selectedIndustry,
        emirate: selectedEmirate
      });

      const response = await fetch(`/api/jd/enhanced/analytics/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jd-analytics-${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Available</h3>
        <p className="text-gray-600">Unable to load analytics data. Please try again later.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'performance', label: 'JD Performance', icon: TrendingUp },
    { id: 'trends', label: 'Trends', icon: Activity },
    { id: 'skills', label: 'Skills Analysis', icon: Target },
    { id: 'location', label: 'Location Analysis', icon: MapPin },
    { id: 'industry', label: 'Industry Analysis', icon: Briefcase },
    { id: 'quality', label: 'Quality Metrics', icon: Star },
    { id: 'compliance', label: 'UAE Compliance', icon: Award },
    { id: 'uae-specific', label: 'UAE Insights', icon: Globe }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Description Analytics</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into JD performance and market trends</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </button>
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mt-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Industries</option>
            <option value="technology">Technology</option>
            <option value="banking">Banking & Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="government">Government</option>
            <option value="education">Education</option>
            <option value="oil-gas">Oil & Gas</option>
          </select>

          <select
            value={selectedEmirate}
            onChange={(e) => setSelectedEmirate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Emirates</option>
            <option value="dubai">Dubai</option>
            <option value="abu-dhabi">Abu Dhabi</option>
            <option value="sharjah">Sharjah</option>
            <option value="ajman">Ajman</option>
            <option value="ras-al-khaimah">Ras Al Khaimah</option>
            <option value="fujairah">Fujairah</option>
            <option value="umm-al-quwain">Umm Al Quwain</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Job Descriptions</p>
                    <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalJDs}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {analyticsData.overview.activeJDs} active
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12% from last month
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalApplications.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm text-purple-600 mt-2">
                  {analyticsData.overview.conversionRate}% conversion rate
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Time to Fill</p>
                    <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.avgTimeToFill}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600 mt-2">days</p>
              </div>
            </div>

            {/* Performance Overview Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">JD Performance Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.performance.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3B82F6" name="Views" />
                  <Bar dataKey="applications" fill="#10B981" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-8">
            {/* Performance Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Job Description Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quality Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UAE Compliance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.performance.map((jd) => (
                      <tr key={jd.jdId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{jd.title}</div>
                          <div className="text-sm text-gray-500">ID: {jd.jdId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {jd.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {jd.applications.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm text-gray-900">{jd.conversionRate}%</div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${Math.min(jd.conversionRate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{jd.qualityScore}/100</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Award className="h-4 w-4 text-green-400 mr-1" />
                            <span className="text-sm text-gray-900">{jd.complianceScore}/100</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            jd.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : jd.status === 'filled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {jd.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-8">
            {/* Trends Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} name="Views" />
                  <Line type="monotone" dataKey="applications" stroke="#10B981" strokeWidth={2} name="Applications" />
                  <Line type="monotone" dataKey="newJDs" stroke="#F59E0B" strokeWidth={2} name="New JDs" />
                  <Line type="monotone" dataKey="filledPositions" stroke="#EF4444" strokeWidth={2} name="Filled Positions" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Area Chart for Applications vs Views */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Conversion Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="views" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Views" />
                  <Area type="monotone" dataKey="applications" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Applications" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-8">
            {/* Skills Demand vs Supply */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Demand vs Supply Analysis</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.skillsAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="demand" fill="#EF4444" name="Demand" />
                  <Bar dataKey="supply" fill="#10B981" name="Supply" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Skills Gap Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Gap Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.skillsAnalysis.map((skill, index) => (
                  <div key={skill.skill} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{skill.skill}</h4>
                      <div className={`flex items-center ${
                        skill.trend === 'up' ? 'text-green-600' : 
                        skill.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {skill.trend === 'up' ? <TrendingUp className="h-4 w-4" /> :
                         skill.trend === 'down' ? <TrendingDown className="h-4 w-4" /> :
                         <Activity className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Demand:</span>
                        <span className="font-medium">{skill.demand}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Supply:</span>
                        <span className="font-medium">{skill.supply}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Gap:</span>
                        <span className={`font-medium ${skill.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {skill.gap > 0 ? '+' : ''}{skill.gap}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-8">
            {/* Location Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs by Emirate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.locationAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ emirate, percent }) => `${emirate} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="jobCount"
                    >
                      {analyticsData.locationAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Rates by Emirate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.locationAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emirate" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="applicationRate" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Location Analysis Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Emirate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Application Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Salary (AED)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Top Skills
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.locationAnalysis.map((location) => (
                      <tr key={location.emirate} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{location.emirate}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {location.jobCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {location.applicationRate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {location.avgSalary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {location.topSkills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'industry' && (
          <div className="space-y-8">
            {/* Industry Performance Radar Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={analyticsData.industryAnalysis}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="industry" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Quality Score" dataKey="avgQualityScore" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Radar name="Compliance Score" dataKey="avgComplianceScore" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Industry Metrics Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Industry Analysis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Quality Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Compliance Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Time to Fill
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.industryAnalysis.map((industry) => (
                      <tr key={industry.industry} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900 capitalize">{industry.industry}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {industry.jobCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{industry.avgQualityScore}/100</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Award className="h-4 w-4 text-green-400 mr-1" />
                            <span className="text-sm text-gray-900">{industry.avgComplianceScore}/100</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {industry.avgTimeToFill} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {industry.conversionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="space-y-8">
            {/* Quality Metrics Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics vs Benchmarks</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.qualityMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#3B82F6" name="Current Score" />
                  <Bar dataKey="benchmark" fill="#10B981" name="Industry Benchmark" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quality Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsData.qualityMetrics.map((metric, index) => (
                <div key={metric.metric} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{metric.metric}</h4>
                    <div className={`flex items-center ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.trend === 'up' ? <TrendingUp className="h-4 w-4" /> :
                       metric.trend === 'down' ? <TrendingDown className="h-4 w-4" /> :
                       <Activity className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Score:</span>
                      <span className="font-semibold text-gray-900">{metric.score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Benchmark:</span>
                      <span className="font-semibold text-gray-900">{metric.benchmark}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric.score >= metric.benchmark ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${(metric.score / 100) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {metric.score >= metric.benchmark ? 'Above' : 'Below'} benchmark by {Math.abs(metric.score - metric.benchmark)} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-8">
            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsData.complianceMetrics.map((compliance, index) => (
                <div key={compliance.category} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{compliance.category}</h4>
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Compliant:</span>
                      <span className="font-semibold text-green-600">{compliance.compliantJDs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-semibold text-gray-900">{compliance.totalJDs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rate:</span>
                      <span className="font-semibold text-blue-600">{compliance.complianceRate}%</span>
                    </div>
                    {compliance.criticalIssues > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Critical Issues:</span>
                        <span className="font-semibold text-red-600">{compliance.criticalIssues}</span>
                      </div>
                    )}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${compliance.complianceRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Compliance Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Rates by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.complianceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="complianceRate" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'uae-specific' && (
          <div className="space-y-8">
            {/* UAE-Specific Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Emiratization Mentioned</h4>
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {analyticsData.uaeSpecificMetrics.emiratizationMentioned}
                </div>
                <div className="text-sm text-gray-600">
                  {((analyticsData.uaeSpecificMetrics.emiratizationMentioned / analyticsData.overview.totalJDs) * 100).toFixed(1)}% of total JDs
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Arabic Requirement</h4>
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {analyticsData.uaeSpecificMetrics.arabicRequirement}
                </div>
                <div className="text-sm text-gray-600">
                  {((analyticsData.uaeSpecificMetrics.arabicRequirement / analyticsData.overview.totalJDs) * 100).toFixed(1)}% of total JDs
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Visa Sponsorship</h4>
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {analyticsData.uaeSpecificMetrics.visaSponsorshipOffered}
                </div>
                <div className="text-sm text-gray-600">
                  {((analyticsData.uaeSpecificMetrics.visaSponsorshipOffered / analyticsData.overview.totalJDs) * 100).toFixed(1)}% of total JDs
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Cultural Fit Assessed</h4>
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {analyticsData.uaeSpecificMetrics.culturalFitAssessed}
                </div>
                <div className="text-sm text-gray-600">
                  {((analyticsData.uaeSpecificMetrics.culturalFitAssessed / analyticsData.overview.totalJDs) * 100).toFixed(1)}% of total JDs
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Local Market Alignment</h4>
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {analyticsData.uaeSpecificMetrics.localMarketAlignment}
                </div>
                <div className="text-sm text-gray-600">
                  {((analyticsData.uaeSpecificMetrics.localMarketAlignment / analyticsData.overview.totalJDs) * 100).toFixed(1)}% of total JDs
                </div>
              </div>
            </div>

            {/* UAE-Specific Metrics Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">UAE-Specific Features Adoption</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { feature: 'Emiratization', count: analyticsData.uaeSpecificMetrics.emiratizationMentioned },
                  { feature: 'Arabic Requirement', count: analyticsData.uaeSpecificMetrics.arabicRequirement },
                  { feature: 'Visa Sponsorship', count: analyticsData.uaeSpecificMetrics.visaSponsorshipOffered },
                  { feature: 'Cultural Fit', count: analyticsData.uaeSpecificMetrics.culturalFitAssessed },
                  { feature: 'Local Alignment', count: analyticsData.uaeSpecificMetrics.localMarketAlignment }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JDAnalyticsDashboard;

