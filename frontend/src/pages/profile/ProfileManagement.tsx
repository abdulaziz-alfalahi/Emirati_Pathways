import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HybridGovernmentNav from '@/components/layout/HybridGovernmentNav';
import { 
  User, 
  Building, 
  GraduationCap, 
  ClipboardCheck, 
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Shield,
  Bell,
  Save,
  RefreshCw
} from 'lucide-react';

// Import persona-specific components
import HRProfileForm from '@/components/recruiter/HRProfileForm';
import CompanyProfileSetup from '@/components/recruiter/CompanyProfileSetup';
import EducatorProfileForm from '@/components/educator/EducatorProfileForm';
import InstitutionProfileSetup from '@/components/educator/InstitutionProfileSetup';
import AssessorProfileForm from '@/components/assessor/AssessorProfileForm';
import CertificationTracking from '@/components/assessor/CertificationTracking';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  primaryRole: string;
  secondaryRoles: string[];
  profileCompletion: number;
  lastUpdated: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  profileVisibility: 'public' | 'professional' | 'organization' | 'private';
}

interface ProfileManagementProps {
  userProfile?: UserProfile;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ userProfile }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: '1',
    firstName: 'Ahmed',
    lastName: 'Al Emirati',
    email: 'ahmed.alemirati@example.ae',
    primaryRole: 'Job Seeker',
    secondaryRoles: [],
    profileCompletion: 75,
    lastUpdated: '2024-01-15',
    verificationStatus: 'verified',
    profileVisibility: 'professional',
    ...userProfile
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const roleConfigs = {
    'Job Seeker': {
      icon: User,
      color: 'bg-blue-500',
      tabs: ['overview', 'personal', 'career', 'skills'],
      components: {
        personal: () => <div>Job Seeker Personal Profile (Already implemented)</div>,
        career: () => <div>Career Preferences (Already implemented)</div>,
        skills: () => <div>Skills & Experience (Already implemented)</div>
      }
    },
    'HR/Recruiter': {
      icon: Users,
      color: 'bg-green-500',
      tabs: ['overview', 'personal', 'company', 'preferences'],
      components: {
        personal: HRProfileForm,
        company: CompanyProfileSetup,
        preferences: () => <div>Hiring Preferences Component</div>
      }
    },
    'Educator': {
      icon: GraduationCap,
      color: 'bg-purple-500',
      tabs: ['overview', 'personal', 'institution', 'curriculum'],
      components: {
        personal: EducatorProfileForm,
        institution: InstitutionProfileSetup,
        curriculum: () => <div>Curriculum Management Component</div>
      }
    },
    'Mentor': {
      icon: Star,
      color: 'bg-orange-500',
      tabs: ['overview', 'personal', 'expertise', 'mentoring'],
      components: {
        personal: () => <div>Mentor Personal Profile (Already implemented)</div>,
        expertise: () => <div>Expertise Areas (Already implemented)</div>,
        mentoring: () => <div>Mentoring Preferences (Already implemented)</div>
      }
    },
    'Assessor': {
      icon: ClipboardCheck,
      color: 'bg-red-500',
      tabs: ['overview', 'personal', 'certifications', 'methodology'],
      components: {
        personal: AssessorProfileForm,
        certifications: CertificationTracking,
        methodology: () => <div>Assessment Methodology Component</div>
      }
    }
  };

  const getCurrentRoleConfig = () => {
    return roleConfigs[currentUser.primaryRole as keyof typeof roleConfigs] || roleConfigs['Job Seeker'];
  };

  const handleRoleSwitch = (newRole: string) => {
    setCurrentUser(prev => ({
      ...prev,
      primaryRole: newRole
    }));
    setActiveTab('overview');
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentUser(prev => ({
        ...prev,
        lastUpdated: new Date().toISOString().split('T')[0]
      }));
      
      setSaveStatus('success');
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVerificationBadge = () => {
    switch (currentUser.verificationStatus) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Unverified</Badge>;
    }
  };

  const roleConfig = getCurrentRoleConfig();
  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <HybridGovernmentNav showAuthButtons={false} currentPage="profile" userRole={currentUser.primaryRole} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${roleConfig.color} text-white`}>
                <RoleIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {currentUser.firstName} {currentUser.lastName}
                </CardTitle>
                <CardDescription className="text-lg">
                  {currentUser.primaryRole} • {currentUser.email}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getVerificationBadge()}
              <Badge variant="outline">
                <Shield className="h-3 w-3 mr-1" />
                {currentUser.profileVisibility}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Completion */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className={`text-sm font-bold ${getCompletionColor(currentUser.profileCompletion)}`}>
                  {currentUser.profileCompletion}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentUser.profileCompletion}%` }}
                />
              </div>
            </div>

            {/* Role Switching */}
            <div>
              <span className="text-sm font-medium mb-2 block">Switch Role</span>
              <div className="flex flex-wrap gap-1">
                {Object.keys(roleConfigs).map(role => {
                  const config = roleConfigs[role as keyof typeof roleConfigs];
                  const Icon = config.icon;
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant={currentUser.primaryRole === role ? "default" : "outline"}
                      onClick={() => handleRoleSwitch(role)}
                      className="text-xs"
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {role}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Last Updated */}
            <div>
              <span className="text-sm font-medium mb-2 block">Last Updated</span>
              <p className="text-sm text-gray-600">
                {new Date(currentUser.lastUpdated).toLocaleDateString()}
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleProfileUpdate}
                disabled={isSaving}
                className="mt-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Status Alert */}
      {saveStatus !== 'idle' && (
        <Alert className={saveStatus === 'success' ? 'border-green-500' : 'border-red-500'}>
          {saveStatus === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            {saveStatus === 'success' 
              ? 'Profile updated successfully!' 
              : 'Failed to update profile. Please try again.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Role-Specific Profile Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RoleIcon className="h-5 w-5" />
            {currentUser.primaryRole} Profile Management
          </CardTitle>
          <CardDescription>
            Manage your {currentUser.primaryRole.toLowerCase()} profile settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              {roleConfig.tabs.map(tab => (
                <TabsTrigger key={tab} value={tab} className="capitalize">
                  {tab === 'overview' && <TrendingUp className="h-4 w-4 mr-2" />}
                  {tab === 'personal' && <User className="h-4 w-4 mr-2" />}
                  {tab === 'company' && <Building className="h-4 w-4 mr-2" />}
                  {tab === 'institution' && <GraduationCap className="h-4 w-4 mr-2" />}
                  {tab === 'certifications' && <ClipboardCheck className="h-4 w-4 mr-2" />}
                  {tab === 'preferences' && <Settings className="h-4 w-4 mr-2" />}
                  {tab === 'methodology' && <Settings className="h-4 w-4 mr-2" />}
                  {tab === 'curriculum' && <BookOpen className="h-4 w-4 mr-2" />}
                  {tab === 'career' && <TrendingUp className="h-4 w-4 mr-2" />}
                  {tab === 'skills' && <Star className="h-4 w-4 mr-2" />}
                  {tab === 'expertise' && <Star className="h-4 w-4 mr-2" />}
                  {tab === 'mentoring' && <Users className="h-4 w-4 mr-2" />}
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Overview</CardTitle>
                    <CardDescription>
                      Summary of your {currentUser.primaryRole.toLowerCase()} profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{currentUser.profileCompletion}%</div>
                        <div className="text-sm text-gray-500">Profile Complete</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {currentUser.verificationStatus === 'verified' ? '✓' : '○'}
                        </div>
                        <div className="text-sm text-gray-500">Verification Status</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{currentUser.secondaryRoles.length}</div>
                        <div className="text-sm text-gray-500">Additional Roles</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.floor((Date.now() - new Date(currentUser.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))}
                        </div>
                        <div className="text-sm text-gray-500">Days Since Update</div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => setActiveTab('personal')}>
                          <User className="h-4 w-4 mr-2" />
                          Update Personal Information
                        </Button>
                        {currentUser.primaryRole === 'HR/Recruiter' && (
                          <Button variant="outline" onClick={() => setActiveTab('company')}>
                            <Building className="h-4 w-4 mr-2" />
                            Manage Company Profile
                          </Button>
                        )}
                        {currentUser.primaryRole === 'Educator' && (
                          <Button variant="outline" onClick={() => setActiveTab('institution')}>
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Manage Institution Profile
                          </Button>
                        )}
                        {currentUser.primaryRole === 'Assessor' && (
                          <Button variant="outline" onClick={() => setActiveTab('certifications')}>
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            Manage Certifications
                          </Button>
                        )}
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Privacy Settings
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Role-specific insights */}
                {currentUser.primaryRole === 'Assessor' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Certification Status</CardTitle>
                      <CardDescription>
                        Overview of your professional certifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600">5</div>
                          <div className="text-sm text-gray-500">Active Certifications</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">2</div>
                          <div className="text-sm text-gray-500">Expiring Soon</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">85%</div>
                          <div className="text-sm text-gray-500">CEU Progress</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Dynamic Role-Specific Tabs */}
            {roleConfig.tabs.slice(1).map(tab => (
              <TabsContent key={tab} value={tab}>
                <div className="space-y-6">
                  {roleConfig.components[tab as keyof typeof roleConfig.components] ? (
                    React.createElement(roleConfig.components[tab as keyof typeof roleConfig.components], {
                      onProfileUpdate: handleProfileUpdate
                    })
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <div className="text-gray-400 mb-4">
                          <Settings className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {tab.charAt(0).toUpperCase() + tab.slice(1)} Settings
                        </h3>
                        <p className="text-gray-500 mb-4">
                          This section is under development. Advanced {tab} management features will be available soon.
                        </p>
                        <Button variant="outline">
                          <Bell className="h-4 w-4 mr-2" />
                          Notify When Available
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Multi-Role Management */}
      {currentUser.secondaryRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Roles</CardTitle>
            <CardDescription>
              Manage your secondary professional roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentUser.secondaryRoles.map(role => {
                const config = roleConfigs[role as keyof typeof roleConfigs];
                const Icon = config.icon;
                return (
                  <div key={role} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${config.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-medium">{role}</h4>
                        <p className="text-sm text-gray-500">Secondary role</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRoleSwitch(role)}>
                        Switch to Primary
                      </Button>
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default ProfileManagement;
