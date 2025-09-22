import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const EducatorDashboard = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    students: {
      totalStudents: 0,
      activeStudents: 0,
      graduatingStudents: 0,
      placementRate: 0
    },
    programs: {
      totalPrograms: 0,
      activePrograms: 0,
      industryPartnerships: 0,
      certificationPrograms: 0
    },
    outcomes: {
      employmentRate: 0,
      averageSalary: 0,
      skillsMatchRate: 0,
      industryReadiness: 0
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
    if (!user) return 'Educator';
    
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'Educator';
  };

  // Logout functionality
  const handleLogout = async () => {
    try {
      console.log('🚪 Educator logout process...');
      await signOut();
      console.log('✅ Educator logout completed');
      window.location.replace('/auth');
    } catch (error) {
      console.error('Educator logout error:', error);
      window.location.href = '/auth';
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/educator/dashboard', {
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
      console.error('Error loading educator dashboard data:', error);
      // Set mock data for demonstration
      setDashboardData({
        students: {
          totalStudents: 2847,
          activeStudents: 2634,
          graduatingStudents: 456,
          placementRate: 87.3
        },
        programs: {
          totalPrograms: 34,
          activePrograms: 28,
          industryPartnerships: 67,
          certificationPrograms: 15
        },
        outcomes: {
          employmentRate: 89.2,
          averageSalary: 8500,
          skillsMatchRate: 78.4,
          industryReadiness: 82.1
        },
        activity: [
          { type: 'partnership', message: 'New partnership with Emirates NBD for fintech program', time: '2h ago' },
          { type: 'graduation', message: '45 students graduated from AI & Data Science program', time: '1d ago' },
          { type: 'placement', message: '23 students placed in government positions', time: '2d ago' },
          { type: 'program', message: 'Cybersecurity certification program launched', time: '3d ago' }
        ]
      });
    }
  };

  const quickActions = [
    {
      title: 'Student Management',
      description: 'Manage student records and progress',
      icon: '👨‍🎓',
      action: () => navigate('/educator/students'),
      color: 'bg-blue-500'
    },
    {
      title: 'Program Development',
      description: 'Create and manage academic programs',
      icon: '📚',
      action: () => navigate('/educator/programs'),
      color: 'bg-green-500'
    },
    {
      title: 'Industry Partnerships',
      description: 'Manage employer partnerships',
      icon: '🤝',
      action: () => navigate('/educator/partnerships'),
      color: 'bg-purple-500'
    },
    {
      title: 'Career Services',
      description: 'Student placement and career support',
      icon: '💼',
      action: () => navigate('/educator/career-services'),
      color: 'bg-orange-500'
    },
    {
      title: 'Analytics',
      description: 'View educational outcomes',
      icon: '📊',
      action: () => navigate('/educator/analytics'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Logout',
      description: 'Sign out of educator portal',
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
      {/* Educator Dashboard Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Education Portal
              </h1>
              <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Educational Institution
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
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
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
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
              Monitor student progress and educational outcomes
            </p>
          </div>

          {/* Key Educational Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👨‍🎓</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.students.totalStudents.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Programs</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.programs.activePrograms}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">💼</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Employment Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.outcomes.employmentRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">🤝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Industry Partners</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.programs.industryPartnerships}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Outcomes */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Student Outcomes & Performance</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Employment Rate</p>
                        <p className="text-sm text-gray-600">Graduates employed within 6 months</p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{dashboardData.outcomes.employmentRate}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Average Starting Salary</p>
                        <p className="text-sm text-gray-600">Monthly salary in AED</p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{dashboardData.outcomes.averageSalary.toLocaleString()} AED</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Skills Match Rate</p>
                        <p className="text-sm text-gray-600">Job-skill alignment percentage</p>
                      </div>
                      <span className="text-2xl font-bold text-purple-600">{dashboardData.outcomes.skillsMatchRate}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Industry Readiness</p>
                        <p className="text-sm text-gray-600">Employer satisfaction score</p>
                      </div>
                      <span className="text-2xl font-bold text-orange-600">{dashboardData.outcomes.industryReadiness}%</span>
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

              {/* Program Statistics */}
              <div className="bg-white rounded-lg shadow mt-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Program Statistics</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Students</span>
                      <span className="text-sm font-medium text-blue-600">
                        {dashboardData.students.activeStudents.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Graduating This Year</span>
                      <span className="text-sm font-medium text-green-600">
                        {dashboardData.students.graduatingStudents}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Certification Programs</span>
                      <span className="text-sm font-medium text-purple-600">
                        {dashboardData.programs.certificationPrograms}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Placement Rate</span>
                      <span className="text-sm font-medium text-orange-600">
                        {dashboardData.students.placementRate}%
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
                    View Detailed Reports
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Educational Activity */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Educational Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.activity.map((activity, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'partnership' ? 'bg-blue-500' :
                          activity.type === 'graduation' ? 'bg-green-500' :
                          activity.type === 'placement' ? 'bg-purple-500' :
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

export default EducatorDashboard;

