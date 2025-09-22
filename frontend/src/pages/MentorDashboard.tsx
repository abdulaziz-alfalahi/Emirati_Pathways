import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const MentorDashboard = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    mentoring: {
      activeMentees: 0,
      totalMentees: 0,
      sessionsThisMonth: 0,
      averageRating: 0
    },
    impact: {
      successfulPlacements: 0,
      careerTransitions: 0,
      skillsDeveloped: 0,
      networkConnections: 0
    },
    schedule: {
      upcomingSessions: 0,
      availableSlots: 0,
      completedSessions: 0,
      cancelledSessions: 0
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
    if (!user) return 'Mentor';
    
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'Mentor';
  };

  // Logout functionality
  const handleLogout = async () => {
    try {
      console.log('🚪 Mentor logout process...');
      await signOut();
      console.log('✅ Mentor logout completed');
      window.location.replace('/auth');
    } catch (error) {
      console.error('Mentor logout error:', error);
      window.location.href = '/auth';
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/mentor/dashboard', {
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
      console.error('Error loading mentor dashboard data:', error);
      // Set mock data for demonstration
      setDashboardData({
        mentoring: {
          activeMentees: 12,
          totalMentees: 47,
          sessionsThisMonth: 28,
          averageRating: 4.8
        },
        impact: {
          successfulPlacements: 23,
          careerTransitions: 15,
          skillsDeveloped: 89,
          networkConnections: 156
        },
        schedule: {
          upcomingSessions: 8,
          availableSlots: 15,
          completedSessions: 234,
          cancelledSessions: 3
        },
        activity: [
          { type: 'session', message: 'Mentoring session with Sara Al-Mahmoud completed', time: '2h ago' },
          { type: 'placement', message: 'Mentee Ahmed secured position at ADNOC', time: '1d ago' },
          { type: 'feedback', message: 'Received 5-star rating from Fatima Al-Zahra', time: '2d ago' },
          { type: 'connection', message: 'Connected mentee with industry expert', time: '3d ago' }
        ]
      });
    }
  };

  const quickActions = [
    {
      title: 'My Mentees',
      description: 'View and manage mentee relationships',
      icon: '👥',
      action: () => navigate('/mentor/mentees'),
      color: 'bg-blue-500'
    },
    {
      title: 'Schedule Sessions',
      description: 'Manage mentoring calendar',
      icon: '📅',
      action: () => navigate('/mentor/schedule'),
      color: 'bg-green-500'
    },
    {
      title: 'Resource Library',
      description: 'Access mentoring resources',
      icon: '📚',
      action: () => navigate('/mentor/resources'),
      color: 'bg-purple-500'
    },
    {
      title: 'Network Hub',
      description: 'Connect with industry professionals',
      icon: '🌐',
      action: () => navigate('/mentor/network'),
      color: 'bg-orange-500'
    },
    {
      title: 'Impact Reports',
      description: 'View mentoring impact analytics',
      icon: '📊',
      action: () => navigate('/mentor/analytics'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Logout',
      description: 'Sign out of mentor portal',
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
      {/* Mentor Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Mentor Portal
              </h1>
              <span className="ml-3 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                Career Mentor
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
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
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
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
              Guide and empower the next generation of Emirati professionals
            </p>
          </div>

          {/* Key Mentoring Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Mentees</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.mentoring.activeMentees}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">📅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sessions This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.mentoring.sessionsThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.mentoring.averageRating}/5</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Successful Placements</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.impact.successfulPlacements}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mentoring Impact */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Mentoring Impact & Achievements</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Career Transitions</p>
                        <p className="text-sm text-gray-600">Mentees who changed career paths</p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{dashboardData.impact.careerTransitions}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Skills Developed</p>
                        <p className="text-sm text-gray-600">New skills acquired by mentees</p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{dashboardData.impact.skillsDeveloped}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Network Connections</p>
                        <p className="text-sm text-gray-600">Professional connections facilitated</p>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{dashboardData.impact.networkConnections}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Total Mentees Guided</p>
                        <p className="text-sm text-gray-600">Lifetime mentoring relationships</p>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">{dashboardData.mentoring.totalMentees}</span>
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

              {/* Schedule Overview */}
              <div className="bg-white rounded-lg shadow mt-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Schedule Overview</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Upcoming Sessions</span>
                      <span className="text-sm font-medium text-blue-600">
                        {dashboardData.schedule.upcomingSessions} sessions
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Available Slots</span>
                      <span className="text-sm font-medium text-green-600">
                        {dashboardData.schedule.availableSlots} slots
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completed Sessions</span>
                      <span className="text-sm font-medium text-purple-600">
                        {dashboardData.schedule.completedSessions} total
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cancelled Sessions</span>
                      <span className="text-sm font-medium text-orange-600">
                        {dashboardData.schedule.cancelledSessions} this month
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200">
                    Manage Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Mentoring Activity */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Mentoring Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.activity.map((activity, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'session' ? 'bg-blue-500' :
                          activity.type === 'placement' ? 'bg-green-500' :
                          activity.type === 'feedback' ? 'bg-purple-500' :
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

export default MentorDashboard;

