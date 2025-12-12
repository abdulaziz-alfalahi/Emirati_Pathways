/**
 * Mobile OTP Login Page for Development
 * Simulates Phone + OTP flow for Soft Launch
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockAuthService, TEST_USERS } from '@/services/mockAuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Smartphone, ArrowRight, Loader2, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MockLogin: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('+971 ');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phoneNumber.length < 8) {
      setError('Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    try {
      await MockAuthService.sendOTP(phoneNumber);
      setStep('otp');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await MockAuthService.verifyOTP(phoneNumber, otp);

      if (result.success && result.user) {
        const dashboardRoute = MockAuthService.getDashboardRoute(result.user.user_type);
        navigate(dashboardRoute);
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err) {
      setError('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col md:flex-row">

      {/* Left Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-teal-600">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-teal-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Emirati Journey Platform</CardTitle>
            <CardDescription>
              {step === 'phone' ? 'Enter your mobile number to sign in or sign up' : 'Enter the verification code sent to your mobile'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-lg h-12"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: +971 50 XXX XXXX
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Get OTP Code'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="text-lg h-12 tracking-widest text-center font-mono"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    Use code <strong>123456</strong> for testing
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Login'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setStep('phone'); setError(''); }}
                >
                  Change Mobile Number
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Side: Dev Helper Sidebar */}
      <div className="hidden md:flex w-80 bg-white border-l p-6 flex-col justify-center overflow-y-auto">
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            Developer Mode
          </h3>
          <p className="text-sm text-gray-500">
            Use these test accounts to verify different user roles. New numbers will create a Candidate account.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(TEST_USERS).map(([phone, user]) => (
            <div key={user.id} className="p-3 border rounded-lg bg-slate-50 hover:border-teal-300 transition-colors group relative">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-slate-800">{user.full_name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase font-semibold">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border text-teal-700">
                  {phone}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    setPhoneNumber(phone);
                    if (step === 'phone') {
                      // optional: auto focus
                    }
                  }}
                  title="Use this number"
                >
                  <Smartphone className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-sm mb-2">New User Sign Up</h4>
            <p className="text-xs text-gray-500 mb-2">
              Enter any unregistered number to test the sign-up flow.
            </p>
            <div className="p-3 border border-dashed rounded-lg bg-yellow-50 flex flex-col items-center gap-2">
              <p className="text-xs font-mono text-yellow-800 text-center">
                e.g. +971 50 999 9999
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-yellow-200 hover:bg-yellow-100 text-yellow-700"
                onClick={() => {
                  const randomNum = `+971 50 ${Math.floor(1000000 + Math.random() * 9000000)}`;
                  setPhoneNumber(randomNum);
                  if (step === 'phone') {
                    setTimeout(() => document.getElementById('phone')?.focus(), 100);
                  }
                }}
              >
                Auto-fill New Number
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockLogin;

