import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { getDisplayName } from '@/utils/nameUtils';

const EmployerDashboard = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    recruitment: {
      activeJobs: 0,
      totalApplications: 0,
      shortlistedCandidates: 0,
      interviewsScheduled: 0,
      hiredCandidates: 0,
      pendingOffers: 0
    },
    analytics: {
      applicationRate: 0,
      responseRate: 0,
      hireRate: 0,
      timeToHire: 0
    },
    candidates: {
      newApplications: 0,
      qualifiedCandidates: 0,
      emiratiCandidates: 0,
      diversityScore: 0
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
  const getUserDisplayName = () => getDisplayName(user, 'Recruiter');

  // Logout functionality
  const handleLogout = async () => {
    try {
      console.log('🚪 Employer logout process...');
      await signOut();
      console.log('✅ Employer logout completed');
      navigate('/auth');
    } catch (error) {
      console.error('Employer logout error:', error);
      navigate('/auth');
    }
  };

  const loadDashboardData = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_BASE}/api/education/employer/dashboard`);

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading employer dashboard data:', error);
      // Set mock data for demonstration
      setDashboardData({
        recruitment: {
          activeJobs: 8,
          totalApplications: 156,
          shortlistedCandidates: 23,
          interviewsScheduled: 12,
          hiredCandidates: 5,
          pendingOffers: 3
        },
        analytics: {
          applicationRate: 19.5,
          responseRate: 78.2,
          hireRate: 14.7,
          timeToHire: 18
        },
        candidates: {
          newApplications: 12,
          qualifiedCandidates: 34,
          emiratiCandidates: 89,
          diversityScore: 85
        },
        activity: [
          { type: 'application', message: '12 new applications received', time: '2h ago' },
          { type: 'interview', message: 'Interview scheduled with Ahmed Al-Mansouri', time: '4h ago' },
          { type: 'hire', message: 'Offer accepted by Fatima Al-Zahra', time: '1d ago' },
          { type: 'job_post', message: 'New Software Engineer position posted', time: '2d ago' }
        ]
      });
    }
  };

  const quickActions = [
    {
      title: 'Post New Job',
      description: 'Create and publish job openings',
      icon: '📝',
      action: () => navigate('/employer/post-job'),
      color: 'bg-blue-500'
    },
    {
      title: 'Review Applications',
      description: 'View and manage applications',
      icon: '📋',
      action: () => navigate('/employer/applications'),
      color: 'bg-green-500'
    },
    {
      title: 'Schedule Interviews',
      description: 'Manage interview calendar',
      icon: '📅',
      action: () => navigate('/employer/interviews'),
      color: 'bg-purple-500'
    },
    {
      title: 'Candidate Search',
      description: 'Search and discover talent',
      icon: '🔍',
      action: () => navigate('/employer/candidate-search'),
      color: 'bg-orange-500'
    },
    {
      title: 'Analytics',
      description: 'View recruitment analytics',
      icon: '📊',
      action: () => navigate('/employer/analytics'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Logout',
      description: 'Sign out of employer portal',
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
      {/* Employer Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Employer Portal
              </h1>
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Recruiter
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
              Welcome back, {getUserDisplayName()}!
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your recruitment pipeline and discover top Emirati talent
            </p>
          </div>

          {/* Key Recruitment Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">💼</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.recruitment.activeJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.recruitment.totalApplications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Shortlisted</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.recruitment.shortlistedCandidates}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hired</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.recruitment.hiredCandidates}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recruitment Pipeline */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Recruitment Pipeline</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">New Applications</p>
                        <p className="text-sm text-gray-600">Awaiting initial review</p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{dashboardData.candidates.newApplications}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Interviews Scheduled</p>
                        <p className="text-sm text-gray-600">Upcoming interviews</p>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{dashboardData.recruitment.interviewsScheduled}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Pending Offers</p>
                        <p className="text-sm text-gray-600">Offers awaiting response</p>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">{dashboardData.recruitment.pendingOffers}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Emirati Candidates</p>
                        <p className="text-sm text-gray-600">UAE nationals in pipeline</p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{dashboardData.candidates.emiratiCandidates}%</span>
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
                        className={`w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 ${action.title === 'Logout' ? 'bg-red-50 hover:bg-red-100 hover:border-red-300' : ''
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

              {/* Performance Metrics */}
              <div className="bg-white rounded-lg shadow mt-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Performance Metrics</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Application Rate</span>
                      <span className="text-sm font-medium text-blue-600">
                        {dashboardData.analytics.applicationRate} per day
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Response Rate</span>
                      <span className="text-sm font-medium text-green-600">
                        {dashboardData.analytics.responseRate}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hire Rate</span>
                      <span className="text-sm font-medium text-purple-600">
                        {dashboardData.analytics.hireRate}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Time to Hire</span>
                      <span className="text-sm font-medium text-orange-600">
                        {dashboardData.analytics.timeToHire} days
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    View Detailed Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Recruitment Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.activity.map((activity, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${activity.type === 'application' ? 'bg-blue-500' :
                          activity.type === 'interview' ? 'bg-purple-500' :
                            activity.type === 'hire' ? 'bg-green-500' :
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

export default EmployerDashboard;

