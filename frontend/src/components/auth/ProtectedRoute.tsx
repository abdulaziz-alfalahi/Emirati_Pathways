import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import AccessDenied from './AccessDenied';
import { ROLE_DASHBOARD_MAP, normalizeRole } from '@/types/auth';

// Exported helper: map a role string to the correct dashboard path
export const getDashboardPath = (role: string): string => {
  const normalized = normalizeRole(role);
  return (ROLE_DASHBOARD_MAP as Record<string, string>)[normalized] || '/candidate-dashboard';
};

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
  const location = useLocation();
  const { isAuthenticated, user, isLoading, getUserRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log('🛡️ Protected Route: Not authenticated, redirecting to auth');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0) {
    const userRole = getUserRole();

    const userRoleNormalized = normalizeRole(userRole || '');

    // Administrators can access any route
    const adminRoles = ['admin', 'admin', 'super_admin', 'platform_administrator'];
    const isAdmin = adminRoles.includes(userRoleNormalized) ||
      (user.roles && user.roles.some(r => adminRoles.includes(normalizeRole(r))));

    // Check match
    const hasPermission = isAdmin || allowedRoles.some(allowed => {
      const allowedNorm = normalizeRole(allowed);
      return allowedNorm === userRoleNormalized ||
        (user.roles && user.roles.some(r => normalizeRole(r) === allowedNorm)) ||
        (user.secondary_roles && user.secondary_roles.some(r => normalizeRole(r) === allowedNorm));
    });

    if (!hasPermission) {
      console.log(`🛡️ Protected Route: Access denied. User role: ${userRole}, Required: ${allowedRoles.join(', ')}`);

      // Previously `<Navigate to="/" replace />` — a silent bounce to the home
      // page with no message. The refusal was correct every time; the problem
      // was that nothing SAID a refusal had happened, so six separate feedback
      // reports described working guards as broken buttons (#353).
      //
      // Say so instead, and leave the URL alone so the user — and anyone
      // reading their screenshot — can still see which page was refused.
      const myRoles = [
        userRole,
        ...(((user as any).roles as string[]) || []),
        ...(((user as any).secondary_roles as string[]) || []),
      ].filter(Boolean) as string[];

      return (
        <AccessDenied
          allowedRoles={allowedRoles}
          userRoles={myRoles}
          dashboardPath={getDashboardPath(userRole || '')}
        />
      );
    }
  }

  console.log(`🛡️ Protected Route: Access granted to ${user.email} (${user.user_type || user.role})`);
  return <>{children}</>;
};

export default ProtectedRoute;
