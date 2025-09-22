import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { getDashboardPath } from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import DashboardLoading from '@/components/dashboard/DashboardLoading';

const DashboardPage = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { activeRole, availableRoles } = useRole();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    // If authenticated and has active role, redirect to appropriate dashboard
    if (isAuthenticated && activeRole) {
      const dashboardPath = getDashboardPath(activeRole);
      navigate(dashboardPath, { replace: true });
      return;
    }

    // If authenticated but no active role, wait for role initialization
    if (isAuthenticated && availableRoles.length > 0 && !activeRole) {
      // Role context is still initializing, show loading
      return;
    }
  }, [user, isLoading, isAuthenticated, activeRole, availableRoles, navigate]);

  console.log("Dashboard Page - Current user:", user);
  console.log("Dashboard Page - Active role:", activeRole);
  console.log("Dashboard Page - Available roles:", availableRoles);

  if (isLoading) {
    return <DashboardLoading />;
  }

  // Show loading while role is being determined
  if (isAuthenticated && !activeRole) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // This should not be reached due to the redirect above, but just in case
  return <DashboardLoading />;
};

export default DashboardPage;
