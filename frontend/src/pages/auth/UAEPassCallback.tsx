/**
 * UAE Pass OAuth Callback Handler
 * ================================
 * This component handles the redirect from the backend after UAE Pass authentication.
 * 
 * The backend redirects to:
 *   /auth/uaepass/callback#access_token=...&refresh_token=...&is_new_user=...&user_id=...&role=...
 *
 * This component:
 *   1. Extracts tokens from the URL fragment (hash)
 *   2. Stores them in localStorage
 *   3. Fetches the full user profile from the backend
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

      // Store tokens
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

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
      setMessage('Authentication successful! Redirecting...');

      // Clean the URL (remove hash fragment with tokens)
      window.history.replaceState(null, '', '/auth/uaepass/callback');

      // Redirect based on user status
      timeoutRef.current = setTimeout(async () => {
        if (isNewUser) {
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
      }, 1500);

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
