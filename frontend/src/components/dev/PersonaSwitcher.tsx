/**
 * Development Persona Switcher
 * Allows easy switching between different user personas during development
 */

import React, { useState } from 'react';
import { MockAuthService, MOCK_USERS } from '@/services/mockAuthService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Users, 
  ClipboardCheck, 
  Settings,
  UserCheck,
  Building
} from 'lucide-react';

const PersonaSwitcher: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(MockAuthService.getCurrentUser());
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUserSwitch = (userType: string) => {
    const newUser = MockAuthService.setUser(userType);
    setCurrentUser(newUser);
    
    // Trigger page reload to update all components
    window.location.reload();
  };

  const getRoleIcon = (userType: string) => {
    switch (userType) {
      case 'candidate': return <User className="w-4 h-4" />;
      case 'hr_manager': return <Building className="w-4 h-4" />;
      case 'recruiter': return <Briefcase className="w-4 h-4" />;
      case 'educator': return <GraduationCap className="w-4 h-4" />;
      case 'mentor': return <UserCheck className="w-4 h-4" />;
      case 'assessor': return <ClipboardCheck className="w-4 h-4" />;
      case 'admin': return <Settings className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (userType: string) => {
    switch (userType) {
      case 'candidate': return 'bg-blue-500';
      case 'hr_manager': return 'bg-green-500';
      case 'recruiter': return 'bg-purple-500';
      case 'educator': return 'bg-orange-500';
      case 'mentor': return 'bg-teal-500';
      case 'assessor': return 'bg-pink-500';
      case 'admin': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatRoleName = (userType: string) => {
    return userType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!currentUser) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Compact View */}
      {!isExpanded && (
        <Card className="w-64 shadow-lg border-2 border-dashed border-orange-300 bg-orange-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs font-mono">
                🚧 DEV MODE
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="h-6 px-2 text-xs"
              >
                Switch Persona
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full ${getRoleColor(currentUser.user_type)} flex items-center justify-center text-white text-xs font-bold`}>
                {currentUser.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.full_name}</p>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(currentUser.user_type)}
                  <p className="text-xs text-gray-500 truncate">
                    {formatRoleName(currentUser.user_type)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <Card className="w-80 shadow-xl border-2 border-dashed border-orange-300 bg-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>🎭</span>
                <span>Development Personas</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 px-2 text-xs"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current User Display */}
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-xs text-gray-500 mb-2">Currently logged in as:</p>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${getRoleColor(currentUser.user_type)} flex items-center justify-center text-white font-bold`}>
                  {currentUser.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{currentUser.full_name}</p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {getRoleIcon(currentUser.user_type)}
                    <Badge variant="secondary" className="text-xs">
                      {formatRoleName(currentUser.user_type)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Persona Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Switch to different persona:</label>
              <Select onValueChange={handleUserSwitch} value={currentUser.user_type}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MOCK_USERS).map(([key, user]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.user_type)}
                        <span>{user.full_name}</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {formatRoleName(user.user_type)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = MockAuthService.getDashboardRoute()}
                className="text-xs"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  MockAuthService.logout();
                  window.location.href = '/auth';
                }}
                className="text-xs"
              >
                Logout
              </Button>
            </div>

            {/* Development Info */}
            <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded border border-yellow-200">
              <p className="font-medium mb-1">🚧 Development Mode Active</p>
              <p>Authentication is mocked. Switch personas to test different user roles and dashboards.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonaSwitcher;
