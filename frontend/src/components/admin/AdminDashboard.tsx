import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Image, 
  Settings, 
  BarChart3, 
  Bell, 
  Shield, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalContent: number;
  publishedContent: number;
  totalMedia: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  newUsersToday: number;
  newContentToday: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'content_published' | 'media_uploaded' | 'system_update';
  description: string;
  user: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalContent: 0,
    publishedContent: 0,
    totalMedia: 0,
    systemHealth: 'healthy',
    newUsersToday: 0,
    newContentToday: 0
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API calls - replace with actual API endpoints
      const mockStats: DashboardStats = {
        totalUsers: 1247,
        activeUsers: 892,
        totalContent: 156,
        publishedContent: 134,
        totalMedia: 89,
        systemHealth: 'healthy',
        newUsersToday: 23,
        newContentToday: 7
      };

      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High Memory Usage',
          message: 'System memory usage is at 85%. Consider optimizing or scaling.',
          timestamp: new Date().toISOString(),
          isRead: false
        },
        {
          id: '2',
          type: 'success',
          title: 'Backup Completed',
          message: 'Daily backup completed successfully at 02:00 AM.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: true
        }
      ];

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'user_created',
          description: 'New user registration: ahmed.hassan@email.com',
          user: 'System',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '2',
          type: 'content_published',
          description: 'Published article: "UAE Career Development Guide"',
          user: 'Sarah Al-Mansouri',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          type: 'media_uploaded',
          description: 'Uploaded new image: career-guidance-infographic.png',
          user: 'Mohammed Al-Zaabi',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      setStats(mockStats);
      setAlerts(mockAlerts);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created': return <Users className="w-4 h-4 text-blue-500" />;
      case 'content_published': return <FileText className="w-4 h-4 text-green-500" />;
      case 'media_uploaded': return <Image className="w-4 h-4 text-purple-500" />;
      case 'system_update': return <Settings className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-700">Loading dashboard...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Emirati Journey Platform - Administrative Control Center
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
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Status */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${getHealthStatusColor(stats.systemHealth)}`}>
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                  <p className="text-sm text-gray-500">Overall platform status</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(stats.systemHealth)}`}>
                  {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{stats.newUsersToday} today
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Published Content</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedContent}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalContent} total items
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Image className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Media Assets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMedia}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Images, documents, files
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Alerts */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {alerts.filter(alert => !alert.isRead).length} unread
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          alert.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${alert.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                              {alert.title}
                            </p>
                            <p className={`text-xs mt-1 ${alert.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                              {alert.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimestamp(alert.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No active alerts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">by {activity.user}</p>
                            <span className="text-xs text-gray-400">•</span>
                            <p className="text-xs text-gray-400">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                <Users className="w-8 h-8 text-gray-600 group-hover:text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Manage Users</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group">
                <FileText className="w-8 h-8 text-gray-600 group-hover:text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Content Manager</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                <Image className="w-8 h-8 text-gray-600 group-hover:text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Media Library</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group">
                <BarChart3 className="w-8 h-8 text-gray-600 group-hover:text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">Analytics</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors group">
                <Settings className="w-8 h-8 text-gray-600 group-hover:text-red-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">System Settings</span>
              </button>
              
              <button className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group">
                <Shield className="w-8 h-8 text-gray-600 group-hover:text-indigo-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Security</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
