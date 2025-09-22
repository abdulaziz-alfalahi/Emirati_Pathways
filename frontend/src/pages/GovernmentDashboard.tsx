import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const GovernmentDashboard = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    emiratization: {
      totalEmiratiEmployees: 0,
      emiratizationRate: 0,
      targetRate: 0,
      monthlyGrowth: 0,
      sectorBreakdown: []
    },
    workforce: {
      totalWorkforce: 0,
      unemploymentRate: 0,
      skillsGapIndex: 0,
      trainingPrograms: 0
    },
    initiatives: {
      activePrograms: 0,
      beneficiaries: 0,
      completionRate: 0,
      successStories: 0
    },
    activity: []
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, navigate]);

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Government Representative';
    
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'Government Representative';
  };

  // Logout functionality
  const handleLogout = async () => {
    try {
      console.log('🚪 Government logout process...');
      await signOut();
      console.log('✅ Government logout completed');
      window.location.replace('/auth');
    } catch (error) {
      console.error('Government logout error:', error);
      window.location.href = '/auth';
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/government/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading government dashboard data:', error);
      // Set mock data for demonstration
      setDashboardData({
        emiratization: {
          totalEmiratiEmployees: 45678,
          emiratizationRate: 67.3,
          targetRate: 75.0,
          monthlyGrowth: 2.1,
          sectorBreakdown: [
            { sector: 'Banking', rate: 78.5 },
            { sector: 'Government', rate: 89.2 },
            { sector: 'Healthcare', rate: 45.7 },
            { sector: 'Technology', rate: 52.3 }
          ]
        },
        workforce: {
          totalWorkforce: 156789,
          unemploymentRate: 3.2,
          skillsGapIndex: 23.4,
          trainingPrograms: 47
        },
        initiatives: {
          activePrograms: 23,
          beneficiaries: 8934,
          completionRate: 84.7,
          successStories: 156
        },
        activity: [
          { type: 'policy', message: 'New Emiratization policy approved for tech sector', time: '2h ago' },
          { type: 'program', message: 'Digital Skills Program launched in Abu Dhabi', time: '1d ago' },
          { type: 'milestone', message: 'Banking sector reached 78% Emiratization', time: '2d ago' },
          { type: 'report', message: 'Q3 Workforce Development Report published', time: '3d ago' }
        ]
      });
    }
  };

  const quickActions = [
    {
      title: 'Policy Management',
      description: 'Create and manage workforce policies',
      icon: '📋',
      action: () => navigate('/government/policies'),
      color: 'bg-blue-500'
    },
    {
      title: 'Emiratization Tracking',
      description: 'Monitor Emiratization progress',
      icon: '🇦🇪',
      action: () => navigate('/government/emiratization'),
      color: 'bg-green-500'
    },
    {
      title: 'Training Programs',
      description: 'Manage national training initiatives',
      icon: '🎓',
      action: () => navigate('/government/training'),
      color: 'bg-purple-500'
    },
    {
      title: 'Workforce Analytics',
      description: 'View comprehensive workforce data',
      icon: '📊',
      action: () => navigate('/government/analytics'),
      color: 'bg-orange-500'
    },
    {
      title: 'Reports',
      description: 'Generate official reports',
      icon: '📈',
      action: () => navigate('/government/reports'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Logout',
      description: 'Sign out of government portal',
      icon: '🚪',
      action: handleLogout,
      color: 'bg-red-500'
    }
  ];

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {/* Government Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Government Portal
              </h1>
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Government Representative
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {getUserDisplayName()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {getUserDisplayName()}!
            </h1>
            <p className="text-gray-600 mt-2">
              Monitor national workforce development and Emiratization progress
            </p>
          </div>

          {/* Key National Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">🇦🇪</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Emiratization Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.emiratization.emiratizationRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Workforce</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.workforce.totalWorkforce.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                  <p className="text-2xl font-bold text-gray-900">+{dashboardData.emiratization.monthlyGrowth}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Target Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round((dashboardData.emiratization.emiratizationRate / dashboardData.emiratization.targetRate) * 100)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Emiratization Progress */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Emiratization by Sector</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData.emiratization.sectorBreakdown.map((sector, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{sector.sector}</p>
                          <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${sector.rate}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-green-600">{sector.rate}%</span>
                      </div>
                    ))}
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">National Target</p>
                          <p className="text-sm text-gray-600">2025 Emiratization Goal</p>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">{dashboardData.emiratization.targetRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 ${
                          action.title === 'Logout' ? 'bg-red-50 hover:bg-red-100 hover:border-red-300' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg ${action.color} text-white`}>
                            <span className="text-lg">{action.icon}</span>
                          </div>
                          <div className="ml-4">
                            <p className="font-medium text-gray-900">{action.title}</p>
                            <p className="text-sm text-gray-600">{action.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* National Initiatives */}
              <div className="bg-white rounded-lg shadow mt-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">National Initiatives</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Programs</span>
                      <span className="text-sm font-medium text-blue-600">
                        {dashboardData.initiatives.activePrograms} programs
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Beneficiaries</span>
                      <span className="text-sm font-medium text-green-600">
                        {dashboardData.initiatives.beneficiaries.toLocaleString()} citizens
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completion Rate</span>
                      <span className="text-sm font-medium text-purple-600">
                        {dashboardData.initiatives.completionRate}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Success Stories</span>
                      <span className="text-sm font-medium text-orange-600">
                        {dashboardData.initiatives.successStories} stories
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                    View All Initiatives
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Policy Activity */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Policy & Program Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.activity.map((activity, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'policy' ? 'bg-blue-500' :
                          activity.type === 'program' ? 'bg-green-500' :
                          activity.type === 'milestone' ? 'bg-purple-500' :
                          'bg-orange-500'
                        }`}></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GovernmentDashboard;

