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

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [emirate, setEmirate] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [signUpStep, setSignUpStep] = useState(1);

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

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

    if (!email || !password || !firstName || !lastName || !phone || !emirate || !selectedRole) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
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
        password,
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

    if (!phone) {
      setError('Phone number is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestOtp(phone);
      if (res.success) {
        setSuccess(res.message + (res.debug_otp ? ` (Code: ${res.debug_otp})` : ''));
        setOtpSent(true);
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to request OTP');
    } finally {
      setIsLoading(false);
    }
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
      const response = await authService.loginWithOtp(phone, otpCode);
      if (response.success && response.data) {
        // Store auth data
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Includes is_new_user

        // Update Auth Context Immediately!
        setUser(response.data.user);

        setSuccess('Login successful!');

        // Redirect
        const dashboardRoute = await authService.getDashboardRoute();
        // If new user, maybe redirect to profile? But dashboard handles empty profile usually.
        // Or we check is_new_user
        setTimeout(() => {
          navigate(dashboardRoute, { replace: true });
        }, 1000);
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
                <ArrowLeft className="h-4 w-4 mr-2" />
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

              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 characters with letters and numbers
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
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
                Welcome to the Emirati Journey Platform! Please check your email and phone for verification instructions.
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
              Emirati Journey Platform
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

              <Card className="max-w-4xl mx-auto shadow-xl border-0">
                <CardContent className="p-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                      <TabsTrigger value="signin" className="text-lg py-3">Sign In</TabsTrigger>
                      <TabsTrigger value="signup" className="text-lg py-3">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin">
                      <div className="max-w-md mx-auto">
                        <CardHeader className="text-center pb-6">
                          <CardTitle className="text-2xl">Welcome Back</CardTitle>
                          <CardDescription>
                            Sign in with your mobile number
                          </CardDescription>
                        </CardHeader>

                        <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-4">
                          <div>
                            <Label htmlFor="login-phone">Mobile Number</Label>
                            <Input
                              id="login-phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="0501234567"
                              required
                              disabled={otpSent}
                              className="h-12"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Format: 0501234567 or +971501234567
                            </p>
                          </div>

                          {otpSent && (
                            <div>
                              <Label htmlFor="otp-code">Verification Code</Label>
                              <Input
                                id="otp-code"
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="123456"
                                required
                                className="h-12 text-center text-lg tracking-widest"
                              />
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {otpSent ? 'Verifying...' : 'Sending Code...'}
                              </>
                            ) : (
                              <>
                                {otpSent ? 'Verify & Login' : 'Send Verification Code'}
                              </>
                            )}
                          </Button>

                          {otpSent && (
                            <Button
                              type="button"
                              variant="link"
                              className="w-full"
                              onClick={() => setOtpSent(false)}
                            >
                              Change Phone Number
                            </Button>
                          )}
                        </form>
                      </div>
                    </TabsContent>

                    <TabsContent value="signup">
                      {/* Progress Indicator */}
                      {signUpStep <= 3 && (
                        <SignUpProgress currentStep={signUpStep} totalSteps={3} />
                      )}

                      {/* Sign Up Content */}
                      {renderSignUpContent()}
                    </TabsContent>
                  </Tabs>
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
