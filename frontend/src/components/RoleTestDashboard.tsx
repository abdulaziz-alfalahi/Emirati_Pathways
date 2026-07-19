import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw,
  Users,
  Briefcase,
  Settings,
  Crown
} from 'lucide-react';

const RoleTestDashboard: React.FC = () => {
  const { user, getUserRole, hasRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [testRole, setTestRole] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);

  const currentRole = getUserRole();

  const roles = [
    { value: 'candidate', label: 'Job Seeker / Candidate', icon: User, color: 'bg-blue-100 text-blue-800', route: '/candidate-dashboard' },
    { value: 'employer_admin', label: 'HR Manager', icon: Users, color: 'bg-green-100 text-green-800', route: '/hr-dashboard' },
    { value: 'recruiter', label: 'Recruiter', icon: Briefcase, color: 'bg-purple-100 text-purple-800', route: '/recruiter-dashboard' },
    { value: 'admin', label: 'Administrator', icon: Crown, color: 'bg-red-100 text-red-800', route: '/admin-dashboard' }
  ];

  const getCurrentRoleInfo = () => {
    return roles.find(role => role.value === currentRole?.toLowerCase()) || roles[0];
  };

  const simulateRole = (roleValue: string) => {
    setIsSimulating(true);
    
    // Simulate user with different role
    const mockUser = {
      ...user,
      user_type: roleValue,
      roles: [roleValue]
    };
    
    // Store temporarily for testing
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Navigate to appropriate dashboard
    const roleInfo = roles.find(r => r.value === roleValue);
    if (roleInfo) {
      setTimeout(() => {
        navigate(roleInfo.route);
      }, 1000);
    }
  };

  const resetToOriginal = async () => {
    setIsSimulating(false);
    // Sign out and redirect to auth to reset properly
    await signOut();
    navigate('/auth');
  };

  const currentRoleInfo = getCurrentRoleInfo();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-ehrdc-teal" />
              <span>Role-Based Routing Test Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This component helps test and demonstrate the role-based routing functionality for the showcase.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">User Details:</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> {user?.email || 'Not available'}</div>
                  <div><strong>Name:</strong> {user?.full_name || user?.first_name || 'Not available'}</div>
                  <div><strong>ID:</strong> {user?.id || 'Not available'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Role Information:</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <currentRoleInfo.icon className="h-4 w-4" />
                    <Badge className={currentRoleInfo.color}>
                      {currentRoleInfo.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Route:</strong> {currentRoleInfo.route}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Test Different Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Select Role to Test:</h3>
                <Select value={testRole} onValueChange={setTestRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role to simulate" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center space-x-2">
                          <role.icon className="h-4 w-4" />
                          <span>{role.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={() => testRole && simulateRole(testRole)}
                  disabled={!testRole || isSimulating}
                  className="w-full"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 me-2" />
                      Test This Role
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Capabilities Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Role Capabilities Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((role) => (
                <div key={role.value} className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <role.icon className="h-5 w-5" />
                    <span className="font-medium">{role.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {hasRole(role.value) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300" />
                    )}
                    <span className="text-sm text-gray-600">
                      {hasRole(role.value) ? 'Current Role' : 'Available'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Route: {role.route}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Raw User Data */}
        <Card>
          <CardHeader>
            <CardTitle>Raw User Data (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button onClick={resetToOriginal} variant="outline">
                Reset & Sign Out
              </Button>
              <Button onClick={() => navigate(currentRoleInfo.route)}>
                Go to My Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleTestDashboard;
