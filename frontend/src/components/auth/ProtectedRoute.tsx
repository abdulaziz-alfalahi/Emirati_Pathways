import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

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

  // Debug logging
  console.log('🔍 ProtectedRoute Debug:', {
    path: location.pathname,
    isAuthenticated,
    user: user,
    allowedRoles,
    userRole: getUserRole()
  });

  // Check if user is authenticated
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to auth');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If no specific roles required, just check authentication
  if (allowedRoles.length === 0) {
    console.log('✅ No role restrictions, allowing access');
    return <>{children}</>;
  }

  // Get user role from various possible sources
  function getUserRole(): string | null {
    // Try roles array first
    if (user?.roles && user.roles.length > 0) {
      return user.roles[0]; // Return primary role
    }

    // Try user_type field
    if (user?.user_type) {
      return user.user_type;
    }

    // Try to get from localStorage as fallback
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        const userData = JSON.parse(storedUser);
        if (userData && userData.user_type) {
          return userData.user_type;
        }
        if (userData && userData.roles && userData.roles.length > 0) {
          return userData.roles[0];
        }
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      // Clear invalid data
      localStorage.removeItem('user');
    }

    return null;
  }

  const userRole = getUserRole();
  console.log('👤 User role detected:', userRole);
  
  // Check if user has required role
  const hasRequiredRole = allowedRoles.some(role => 
    userRole?.toLowerCase() === role.toLowerCase()
  );

  console.log('🎯 Role check:', { userRole, allowedRoles, hasRequiredRole });

  if (!hasRequiredRole) {
    // Redirect to appropriate dashboard based on user's actual role
    const dashboardRoute = getDashboardRouteForRole(userRole);
    console.log(`❌ User role "${userRole}" not allowed for this route. Redirecting to: ${dashboardRoute}`);
    return <Navigate to={dashboardRoute} replace />;
  }

  console.log('✅ Access granted to protected route');
  return <>{children}</>;
};

// Helper function to determine dashboard route based on role
const getDashboardRouteForRole = (role: string | null): string => {
  if (!role) return '/candidate-dashboard';
  
  switch (role.toLowerCase()) {
    case 'hr_manager':
    case 'hr manager':
    case 'hr':
      return '/hr-dashboard';
    case 'recruiter':
      return '/recruiter-dashboard';
    case 'administrator':
    case 'admin':
      return '/admin-dashboard';
    case 'job_seeker':
    case 'candidate':
    case 'job seeker':
    default:
      return '/candidate-dashboard';
  }
};

export default ProtectedRoute;
