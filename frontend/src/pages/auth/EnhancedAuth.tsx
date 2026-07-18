import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LogIn, UserPlus, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { authService, RegisterData, LoginData, AVAILABLE_ROLES } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import HybridGovernmentNav from '@/components/layout/HybridGovernmentNav';
import WelcomeMessage from '@/components/auth/WelcomeMessage';
import SignUpProgress from '@/components/auth/SignUpProgress';
import RoleSelection from '@/components/auth/RoleSelection';

const EnhancedAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sign-up form states
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [emirate, setEmirate] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Sign-in form states (separate from sign-up to prevent leakage)
  const [loginPhone, setLoginPhone] = useState('');

  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [signUpStep, setSignUpStep] = useState(1);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [uaePassLoading, setUaePassLoading] = useState(false);

  // Show OTP login only when explicitly enabled (development/staging)
  const showDevOtp = (import.meta as any).env?.VITE_ENABLE_DEV_OTP === 'true';

  // UAE Emirates list
  const emirates = [
    'Abu Dhabi',
    'Dubai',
    'Sharjah',
    'Ajman',
    'Umm Al Quwain',
    'Ras Al Khaimah',
    'Fujairah'
  ];

  // Use AuthContext for consistent state
  const { isAuthenticated, user, isLoading: isAuthLoading, setUser } = useAuth(); // Renamed to avoid exact conflict if needed, or just use it

  // Redirect if already logged in - Sync with AuthContext
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      console.log('User already authenticated (Context), determining dashboard route...');

      const determineRoute = async () => {
        try {
          const dashboardRoute = await authService.getDashboardRoute();
          const from = location.state?.from?.pathname || dashboardRoute;
          console.log('Redirecting to:', from);

          if (from !== '/auth') {
            navigate(from, { replace: true });
          }
        } catch (error) {
          console.error('Error determining route:', error);
        }
      };

      determineRoute();
    }
  }, [isAuthLoading, isAuthenticated, user, navigate, location]);

  // Check for UAE Pass error in URL params (redirected back from callback)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const uaePassError = searchParams.get('error');
    const uaePassMessage = searchParams.get('message');
    if (uaePassError) {
      if (uaePassError === 'SOP1' || uaePassError === 'sop1') {
        setError("Requestee is not eligible to use this service. Requestee's account is either not upgraded or have a visitor account. Please contact Emirati Human Development Platform to use the services.");
      } else if (uaePassError === 'access_denied' || uaePassError === 'user_cancelled' || uaePassError === 'uaepass_denied') {
        setError("User cancelled the login");
      } else {
        setError(uaePassMessage || 'UAE Pass authentication failed. Please try again.');
      }
      // Clean the URL
      navigate('/auth', { replace: true });
    }
  }, [location.search]);

  const handleUAEPassLogin = async () => {
    setError('');
    setUaePassLoading(true);
    try {
      const authUrl = await authService.getUAEPassLoginUrl();
      // Redirect to UAE Pass
      window.location.href = authUrl;
    } catch (err: any) {
      console.error('UAE Pass login error:', err);
      setError('Failed to connect to UAE PASS. Please try again.');
      setUaePassLoading(false);
    }
  };

  const handleRoleSelection = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinueFromRoleSelection = () => {
    if (selectedRole) {
      setSignUpStep(2);
    }
  };

  const handleBackToRoleSelection = () => {
    setSignUpStep(1);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !firstName || !lastName || !phone || !emirate || !selectedRole) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!phone.match(/^(\+971|971|0)(50|51|52|55|56|58|2|3|4|6|7|9)\d{7}$/)) {
      setError('Please enter a valid UAE phone number');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting registration with role:', selectedRole);
      const registerData: RegisterData = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        emirate,
        user_type: selectedRole
      };

      const response = await authService.register(registerData);

      if (response.success) {
        setSuccess('Registration successful! Please verify your email and phone number.');
        setSignUpStep(3);

        // For registration, we might need to login first to get the role
        console.log('Registration successful, determining dashboard route...');

        // Simulate user data for route determination
        const tempUser = { user_type: selectedRole };
        localStorage.setItem('user', JSON.stringify(tempUser));

        // Update context if we want to redirect logged in
        // setUser(tempUser as any); // Probably safer to wait for login or verification

        const dashboardRoute = await authService.getDashboardRoute();
        console.log('Dashboard route for new user:', dashboardRoute);

        // Show verification UI or redirect to verification page
        setTimeout(() => {
          navigate(dashboardRoute, { replace: true });
        }, 3000);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Network error occurred during registration');
    } finally {
      setIsLoading(false);
    }

  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginPhone) {
      setError('Phone number is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestOtp(loginPhone);
      if (res.success) {
        setSuccess(res.message + (res.debug_otp ? ` (Code: ${res.debug_otp})` : ''));
        setOtpSent(true);
        setResendCooldown(60);
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to request OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await authService.requestOtp(loginPhone);
      if (res.success) {
        setSuccess('New code sent!' + (res.debug_otp ? ` (Code: ${res.debug_otp})` : ''));
        setResendCooldown(60);
      } else {
        setError(res.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Reset OTP state when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    setOtpSent(false);
    setOtpCode('');
    setResendCooldown(0);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode) {
      setError('OTP Code is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.loginWithOtp(loginPhone, otpCode);
      if (response.success && response.data) {
        // Store auth data
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Includes is_new_user

        // Update Auth Context Immediately!
        setUser(response.data.user);

        setSuccess('Login successful!');

        // Redirect logic
        if (response.data.user.is_new_user) {
          console.log('New user detected, redirecting to welcome page...');
          setTimeout(() => {
            navigate('/welcome', { replace: true });
          }, 1000);
        } else {
          // Check for a saved return URL (deep-link preservation)
          const returnUrl = sessionStorage.getItem('returnUrl');
          if (returnUrl) {
            sessionStorage.removeItem('returnUrl');
            setTimeout(() => {
              navigate(returnUrl, { replace: true });
            }, 1000);
          } else {
            const dashboardRoute = await authService.getDashboardRoute();
            setTimeout(() => {
              navigate(dashboardRoute, { replace: true });
            }, 1000);
          }
        }
      } else {
        setError(response.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignUpContent = () => {
    switch (signUpStep) {
      case 1:
        return (
          <div className="space-y-6">
            <WelcomeMessage />
            <RoleSelection
              selectedRole={selectedRole}
              onRoleSelect={handleRoleSelection}
              onContinue={handleContinueFromRoleSelection}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToRoleSelection}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 me-2" />
                Back to Role Selection
              </Button>
            </div>

            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">
                Tell us about yourself to complete your {AVAILABLE_ROLES.find(r => r.id === selectedRole)?.name} profile
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ahmed"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Al Emirati"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0501234567"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter UAE phone number (e.g., 0501234567)
                </p>
              </div>

              <div>
                <Label htmlFor="emirate">Emirate</Label>
                <Select value={emirate} onValueChange={setEmirate} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your emirate" />
                  </SelectTrigger>
                  <SelectContent>
                    {emirates.map((emirate) => (
                      <SelectItem key={emirate} value={emirate}>
                        {emirate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>



              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="me-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Account Created Successfully!</h2>
              <p className="text-gray-600">
                Welcome to the Emirati Human Development Platform! You can now sign in using your WhatsApp number.
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                You will be redirected to your dashboard shortly...
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <HybridGovernmentNav showAuthButtons={false} currentPage="auth" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Emirati Human Development Platform
            </h1>
            <p className="text-slate-600">
              UAE Nationals Career Development Platform
            </p>
          </div>

          {isAuthLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
            </div>
          ) : (
            <>

              {/* Alerts */}
              {error && (
                <Alert className="border-red-200 bg-red-50 mb-6 max-w-2xl mx-auto">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 mb-6 max-w-2xl mx-auto">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <Card className="max-w-md mx-auto shadow-xl border-0">
                <CardContent className="p-8">
                  <div className="text-center pb-6">
                    <h2 className="text-2xl font-semibold tracking-tight">Welcome Back</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Sign in securely with your UAE PASS identity
                    </p>
                  </div>

                  {/* ── UAE PASS Login Button (Official Black Variant) ── */}
                  <div className="space-y-4 mb-6">
                    <button
                      id="uaepass-login-btn"
                      type="button"
                      onClick={handleUAEPassLogin}
                      disabled={uaePassLoading}
                      className="w-full flex items-center justify-center transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {uaePassLoading ? (
                        <div className="h-[50px] w-[264px] flex items-center justify-center bg-gray-50 rounded-[12px] border border-gray-200">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <img 
                          src="/uae-pass-en.svg" 
                          alt="Sign in using UAE PASS" 
                          className="h-[50px] w-[264px] object-contain drop-shadow-sm hover:drop-shadow-md transition-all rounded-[12px]"
                        />
                      )}
                    </button>

                    <p className="text-xs text-center text-gray-500">
                      Secure national digital identity verification
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="text-center mt-8">
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
                  <Shield className="h-4 w-4 text-teal-600" />
                  <span>UAE Nationals Only - Secure Platform</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default EnhancedAuthPage;
