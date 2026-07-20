/**
 * UAE Pass OAuth Callback Handler
 * ================================
 * This component handles the redirect from the backend after UAE Pass authentication.
 * 
 * Under Secure Cookie Delivery (T4.1), the backend delivers JWT tokens via Secure, 
 * HttpOnly cookies and redirects to the frontend callback URL with search parameters.
 *
 * This component:
 *   1. Extracts parameters (is_new_user, role, return_url) from window.location.search
 *   2. Sets a placeholder token 'cookie_authenticated' in localStorage to satisfy existing guards
 *   3. Fetches the full user profile from the backend (which automatically uses the secure cookies)
 *   4. Updates AuthContext
 *   5. Redirects to the appropriate dashboard (or /welcome for new users)
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const UAEPassCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing authentication...');
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    handleCallback();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCallback = async () => {
    try {
      // Parse the URL query parameters (T4.1)
      const params = new URLSearchParams(window.location.search);

      const isNewUser = params.get('is_new_user') === 'true';
      const role = params.get('role');
      const returnUrl = params.get('return_url');

      // Company-invitation redemption (magic link → UAE Pass handoff, #90).
      // The backend redeems the invitation inside the OAuth callback and
      // reports the outcome here; a failed redemption does NOT fail the
      // sign-in itself.
      const invitationAccepted = params.get('invitation') === 'accepted';
      const invitedRole = params.get('invited_role');
      const invitationCompany = params.get('company');
      const invitationError = params.get('invitation_error');

      // Secure cookie delivery means the browser holds the JWT.
      // We set a placeholder in localStorage so existing frontend auth guards pass.
      const accessToken = 'cookie_authenticated';
      const userId = 'uaepass_user';

      if (!userId) {
        // Safe fallback: check if we are already authenticated in localStorage
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
          console.log('Already authenticated (tokens in storage), redirecting...');
          try {
            const dashboardRoute = await authService.getDashboardRoute();
            navigate(dashboardRoute, { replace: true });
          } catch {
            navigate('/candidate-dashboard', { replace: true });
          }
          return;
        }
        throw new Error('Missing authentication data from UAE Pass');
      }

      setMessage('Securing your session...');

      // Store token placeholder. Auth is cookie-based (the browser holds the JWT
      // via a secure cookie), so there is no refresh token to persist here — the
      // previous `if (refreshToken)` referenced an undeclared variable and threw
      // a ReferenceError that aborted the callback after backend auth succeeded.
      localStorage.setItem('access_token', accessToken);

      // Fetch full user profile from our backend
      setMessage('Loading your profile...');
      
      let userData: any = null;
      try {
        const profileResponse = await authService.getProfile();
        if (profileResponse.success && profileResponse.data) {
          userData = profileResponse.data;
        }
      } catch (profileError) {
        console.warn('Profile fetch failed, using basic data:', profileError);
      }

      // Fallback: construct minimal user data from URL params
      if (!userData) {
        userData = {
          id: userId,
          email: `${userId}@uaepass.local`,
          role: role || 'candidate',
          user_type: role || 'candidate',
          is_new_user: isNewUser,
        };
      }

      // Add UAE Pass metadata
      userData.auth_method = 'uaepass';
      userData.is_new_user = isNewUser;

      // Store user data and update context
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      setStatus('success');
      if (invitationAccepted) {
        setMessage(
          invitationCompany
            ? `Welcome to ${invitationCompany}! Your account is ready — redirecting...`
            : 'Invitation accepted! Redirecting...'
        );
      } else if (invitationError) {
        // Signed in fine, but the invitation link was stale/used — say so
        // instead of silently landing them on a candidate dashboard.
        setMessage(`Signed in, but your invitation could not be applied: ${invitationError}`);
      } else {
        setMessage('Authentication successful! Redirecting...');
      }

      // Clean the URL (remove hash fragment with tokens)
      window.history.replaceState(null, '', '/auth/uaepass/callback');

      // Redirect based on user status
      timeoutRef.current = setTimeout(async () => {
        if (invitationAccepted) {
          // Invited company staff go straight to their working dashboard —
          // /welcome's role selection does not apply (the operator already
          // fixed the role on the invitation, #89).
          navigate(invitedRole === 'employer_admin' ? '/hr-dashboard' : '/recruiter-dashboard', { replace: true });
        } else if (isNewUser) {
          // New users go to welcome/role selection
          navigate('/welcome', { replace: true });
        } else if (returnUrl) {
          // Return to the page they were trying to access
          navigate(returnUrl, { replace: true });
        } else {
          // Existing users go to their dashboard
          try {
            const dashboardRoute = await authService.getDashboardRoute();
            navigate(dashboardRoute, { replace: true });
          } catch {
            navigate('/candidate-dashboard', { replace: true });
          }
        }
      }, invitationError ? 3500 : 1500);

    } catch (error: any) {
      console.error('UAE Pass callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Authentication failed. Please try again.');

      // Redirect back to login after showing error
      timeoutRef.current = setTimeout(() => {
        navigate('/auth?error=callback_failed', { replace: true });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
        {/* UAE Pass Logo */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">UAE</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">UAE PASS Authentication</h2>
        </div>

        {/* Status Indicator */}
        <div className="flex flex-col items-center space-y-4">
          {status === 'processing' && (
            <Loader2 className="h-10 w-10 text-teal-600 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-10 w-10 text-green-600" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-10 w-10 text-red-600" />
          )}

          <p className={`text-sm ${
            status === 'error' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {message}
          </p>

          {status === 'processing' && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
              <div className="bg-teal-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UAEPassCallback;
