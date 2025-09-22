import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { getDashboardPath } from './ProtectedRoute';

const DashboardSelector: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeRole, availableRoles } = useRole();

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If no active role is set, try to set one from available roles
  if (!activeRole && availableRoles.length > 0) {
    // For now, we'll show a loading state while the role context initializes
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  // Get the appropriate dashboard path for the user's role
  const dashboardPath = getDashboardPath(activeRole);

  // Redirect to the appropriate dashboard
  return <Navigate to={dashboardPath} replace />;
};

export default DashboardSelector;

