/**
 * Mock Login Page for Development
 * Allows easy persona selection instead of traditional login
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockAuthService, MOCK_USERS } from '@/services/mockAuthService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  UserCheck, 
  ClipboardCheck, 
  Settings,
  Building,
  ArrowRight
} from 'lucide-react';

const MockLogin: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPersona, setSelectedPersona] = useState<string>('candidate');

  const handleLogin = (userType: string) => {
    const user = MockAuthService.setUser(userType);
    const dashboardRoute = MockAuthService.getDashboardRoute(userType);
    
    console.log(`🎭 Mock Login: Logging in as ${user.full_name}, redirecting to ${dashboardRoute}`);
    navigate(dashboardRoute);
  };

  const getRoleIcon = (userType: string) => {
    switch (userType) {
      case 'candidate': return <User className="w-6 h-6" />;
      case 'hr_manager': return <Building className="w-6 h-6" />;
      case 'recruiter': return <Briefcase className="w-6 h-6" />;
      case 'educator': return <GraduationCap className="w-6 h-6" />;
      case 'mentor': return <UserCheck className="w-6 h-6" />;
      case 'assessor': return <ClipboardCheck className="w-6 h-6" />;
      case 'admin': return <Settings className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  const getRoleColor = (userType: string) => {
    switch (userType) {
      case 'candidate': return 'border-blue-200 hover:border-blue-400 bg-blue-50';
      case 'hr_manager': return 'border-green-200 hover:border-green-400 bg-green-50';
      case 'recruiter': return 'border-purple-200 hover:border-purple-400 bg-purple-50';
      case 'educator': return 'border-orange-200 hover:border-orange-400 bg-orange-50';
      case 'mentor': return 'border-teal-200 hover:border-teal-400 bg-teal-50';
      case 'assessor': return 'border-pink-200 hover:border-pink-400 bg-pink-50';
      case 'admin': return 'border-red-200 hover:border-red-400 bg-red-50';
      default: return 'border-gray-200 hover:border-gray-400 bg-gray-50';
    }
  };

  const formatRoleName = (userType: string) => {
    return userType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-orange-100 border border-orange-300 rounded-full px-4 py-2 mb-4">
            <span className="text-2xl">🚧</span>
            <span className="font-mono text-sm font-medium text-orange-800">DEVELOPMENT MODE</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Persona</h1>
          <p className="text-gray-600">Select a user persona to test different roles and dashboards</p>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(MOCK_USERS).map(([key, user]) => (
            <Card 
              key={key}
              className={`cursor-pointer transition-all duration-200 ${getRoleColor(user.user_type)} ${
                selectedPersona === key ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPersona(key)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {getRoleIcon(user.user_type)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{user.full_name}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {formatRoleName(user.user_type)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-3">
                  {user.profile_data.bio}
                </CardDescription>
                <div className="space-y-1 text-xs text-gray-600">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Location:</strong> {user.emirate}, UAE</p>
                  {user.profile_data.company && (
                    <p><strong>Company:</strong> {user.profile_data.company}</p>
                  )}
                  {user.profile_data.institution && (
                    <p><strong>Institution:</strong> {user.profile_data.institution}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Login Button */}
        <div className="text-center">
          <Button
            onClick={() => handleLogin(selectedPersona)}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            Login as {MOCK_USERS[selectedPersona]?.full_name}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p className="font-medium mb-1">🎭 Development Mode Information</p>
            <p>This is a mock authentication system for development purposes. 
               You can switch between different user personas using the persona switcher 
               that appears in the top-right corner of each page.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockLogin;
