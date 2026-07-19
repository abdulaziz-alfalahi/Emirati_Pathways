import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Settings,
  Edit
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  active_connections: number;
  response_time: number;
  uptime: number;
  error_rate: number;
}

interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_users_today: number;
  user_growth_rate: number;
  user_retention_rate: number;
  avg_session_duration: number;
}

interface ContentAnalytics {
  total_content: number;
  published_content: number;
  draft_content: number;
  content_views: number;
  popular_content: Array<{
    title: string;
    views: number;
    engagement: number;
  }>;
}

interface PerformanceData {
  timestamp: string;
  response_time: number;
  cpu_usage: number;
  memory_usage: number;
  active_users: number;
}

const SystemAnalytics: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_io: 0,
    active_connections: 0,
    response_time: 0,
    uptime: 0,
    error_rate: 0
  });

  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics>({
    total_users: 0,
    active_users: 0,
    new_users_today: 0,
    user_growth_rate: 0,
    user_retention_rate: 0,
    avg_session_duration: 0
  });

  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics>({
    total_content: 0,
    published_content: 0,
    draft_content: 0,
    content_views: 0,
    popular_content: []
  });

  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchAnalyticsData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTimeRange, autoRefresh]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API calls
      const mockSystemMetrics: SystemMetrics = {
        cpu_usage: Math.random() * 100,
        memory_usage: 65 + Math.random() * 20,
        disk_usage: 45 + Math.random() * 10,
        network_io: Math.random() * 1000,
        active_connections: 150 + Math.floor(Math.random() * 50),
        response_time: 120 + Math.random() * 80,
        uptime: 99.8,
        error_rate: Math.random() * 2
      };

      const mockUserAnalytics: UserAnalytics = {
        total_users: 1247,
        active_users: 892,
        new_users_today: 23,
        user_growth_rate: 12.5,
        user_retention_rate: 78.3,
        avg_session_duration: 1845 // seconds
      };

      const mockContentAnalytics: ContentAnalytics = {
        total_content: 156,
        published_content: 134,
        draft_content: 22,
        content_views: 45678,
        popular_content: [
          { title: 'UAE Career Development Guide 2024', views: 1247, engagement: 85.2 },
          { title: 'Interview Preparation Checklist', views: 892, engagement: 78.9 },
          { title: 'Job Market Trends Analysis', views: 756, engagement: 72.1 },
          { title: 'Professional Skills Assessment', views: 634, engagement: 69.8 },
          { title: 'Networking Strategies for Emiratis', views: 523, engagement: 65.4 }
        ]
      };

      // Generate mock performance data
      const mockPerformanceData: PerformanceData[] = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        mockPerformanceData.push({
          timestamp: timestamp.toISOString(),
          response_time: 100 + Math.random() * 100,
          cpu_usage: 30 + Math.random() * 40,
          memory_usage: 50 + Math.random() * 30,
          active_users: 100 + Math.floor(Math.random() * 200)
        });
      }

      setSystemMetrics(mockSystemMetrics);
      setUserAnalytics(mockUserAnalytics);
      setContentAnalytics(mockContentAnalytics);
      setPerformanceData(mockPerformanceData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return { color: 'text-red-600 bg-red-100', status: 'critical' };
    if (value >= thresholds.warning) return { color: 'text-yellow-600 bg-yellow-100', status: 'warning' };
    return { color: 'text-green-600 bg-green-100', status: 'healthy' };
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const pieData = [
    { name: 'Job Seekers', value: 45, color: '#3B82F6' },
    { name: 'HR/Recruiters', value: 25, color: '#10B981' },
    { name: 'Mentors', value: 15, color: '#F59E0B' },
    { name: 'Educators', value: 10, color: '#EF4444' },
    { name: 'Assessors', value: 5, color: '#8B5CF6' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Real-time system monitoring and performance analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>
              
              <button
                onClick={fetchAnalyticsData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4 me-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${getMetricStatus(systemMetrics.cpu_usage, { warning: 70, critical: 90 }).color}`}>
                  <Cpu className="w-6 h-6" />
                </div>
                <div className="ms-4">
                  <p className="text-sm font-medium text-gray-500">CPU Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.cpu_usage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${getMetricStatus(systemMetrics.memory_usage, { warning: 80, critical: 95 }).color}`}>
                  <HardDrive className="w-6 h-6" />
                </div>
                <div className="ms-4">
                  <p className="text-sm font-medium text-gray-500">Memory Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.memory_usage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${getMetricStatus(systemMetrics.response_time, { warning: 200, critical: 500 }).color}`}>
                  <Activity className="w-6 h-6" />
                </div>
                <div className="ms-4">
                  <p className="text-sm font-medium text-gray-500">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.response_time.toFixed(0)}ms</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${getMetricStatus(100 - systemMetrics.uptime, { warning: 1, critical: 5 }).color}`}>
                  <Server className="w-6 h-6" />
                </div>
                <div className="ms-4">
                  <p className="text-sm font-medium text-gray-500">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">{formatUptime(systemMetrics.uptime)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number, name: string) => [
                    name === 'response_time' ? `${value.toFixed(0)}ms` : `${value.toFixed(1)}%`,
                    name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  ]}
                />
                <Legend />
                <Line type="monotone" dataKey="response_time" stroke="#3B82F6" name="Response Time (ms)" />
                <Line type="monotone" dataKey="cpu_usage" stroke="#10B981" name="CPU Usage (%)" />
                <Line type="monotone" dataKey="memory_usage" stroke="#F59E0B" name="Memory Usage (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Users</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [value, 'Active Users']}
                />
                <Area type="monotone" dataKey="active_users" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">User Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userAnalytics.total_users.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userAnalytics.active_users.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">+{userAnalytics.new_users_today}</p>
                <p className="text-sm text-gray-500">New Today</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userAnalytics.user_growth_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Growth Rate</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-teal-100 rounded-lg mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-teal-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{userAnalytics.user_retention_rate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Retention Rate</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mx-auto mb-3">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(userAnalytics.avg_session_duration)}</p>
                <p className="text-sm text-gray-500">Avg. Session</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Content Analytics</h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{contentAnalytics.total_content}</p>
                <p className="text-sm text-gray-500">Total Content</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{contentAnalytics.published_content}</p>
                <p className="text-sm text-gray-500">Published</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-3">
                  <Edit className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{contentAnalytics.draft_content}</p>
                <p className="text-sm text-gray-500">Drafts</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{contentAnalytics.content_views.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Views</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Content</h3>
            <div className="space-y-4">
              {contentAnalytics.popular_content.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">{item.views.toLocaleString()} views</span>
                      <span className="text-xs text-gray-500">{item.engagement}% engagement</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;
