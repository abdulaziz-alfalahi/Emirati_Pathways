import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/auth'
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to auth');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Get user data from authService
  const userData = authService.getUser();
  if (!userData) {
    console.log('❌ No user data found, redirecting to auth');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0) {
    const userRole = userData.user_type || userData.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.log(`❌ Access denied. User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('✅ Access granted to protected route');
  return <>{children}</>;
};

export default ProtectedRoute;
