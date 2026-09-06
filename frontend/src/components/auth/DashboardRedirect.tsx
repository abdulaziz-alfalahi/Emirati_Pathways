import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getDashboardRoute, normalizeRole } from '@/types/auth';

/**
 * `/dashboard` — the header, the main nav and the mobile menu all link here,
 * but nothing served it, so every click was a 404 (found 2026-09-06 while
 * testing the recruiter overview). Resolve the user's dashboard from ALL
 * their roles the way the nav does (primary + user_type + roles[] +
 * secondary_roles): the first role that maps to a non-candidate dashboard
 * wins, otherwise the candidate dashboard. A self-serve-granted operator
 * keeps `candidate` as primary, so the primary role alone misroutes them.
 */
export const resolveDashboardPath = (user: any): string => {
  const raw = [
    ...(user?.roles || []),
    user?.role,
    user?.user_type,
    ...(user?.secondary_roles || []),
  ].filter(Boolean) as string[];
  const roles = Array.from(new Set(raw.map(r => String(normalizeRole(r) || r).toLowerCase())));
  const operator = roles.find(r => {
    const d = getDashboardRoute(r);
    return d && d !== '/candidate-dashboard';
  });
  return operator ? getDashboardRoute(operator) : '/candidate-dashboard';
};

const DashboardRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/auth" replace />;
  return <Navigate to={resolveDashboardPath(user)} replace />;
};

export default DashboardRedirect;
