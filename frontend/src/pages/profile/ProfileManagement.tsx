import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import HybridGovernmentNav from '@/components/layout/HybridGovernmentNav';
import { useNavigate, useLocation } from 'react-router-dom';
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
  RefreshCw,
  BookOpen,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { restClient } from '@/utils/api';
import { normalizeRole } from '@/types/auth'; // Import normalization helper
import { RoleRequestDialog } from '@/components/profile/RoleRequestDialog';
import { useAuth } from '@/context/AuthContext';

// Import persona-specific components
import ProfileForm from '@/components/candidate/ProfileForm';
import HRProfileForm from '@/components/recruiter/HRProfileForm';
import CompanyProfileSetup from '@/components/recruiter/CompanyProfileSetup';
import EducatorProfileForm from '@/components/educator/EducatorProfileForm';
import { StudentProfileForm } from '@/components/student/StudentProfileForm';
import InstitutionProfileSetup from '@/components/educator/InstitutionProfileSetup';
import AssessorProfileForm from '@/components/assessor/AssessorProfileForm';
import CertificationTracking from '@/components/assessor/CertificationTracking';

import { RecruiterPreferences } from '@/components/recruiter/RecruiterPreferences';

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
  profilePhotoUrl?: string;
}

interface ProfileManagementProps {
  userProfile?: UserProfile;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ userProfile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
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
  const [candidateData, setCandidateData] = useState<any>({});

  // Dialog state for role requests
  const [requestDialog, setRequestDialog] = useState({ isOpen: false, role: '' });

  // Track all roles the user actually possesses, separate from the 'active' view role
  const [possessedRoles, setPossessedRoles] = useState<string[]>([
    userProfile?.primaryRole || 'Job Seeker',
    ...(userProfile?.secondaryRoles || [])
  ]);

  // Fetch generic user roles (account data) on mount
  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const { data } = await restClient.get('/api/auth/roles');
        if (data.success) {
          const allRoles = [data.data.role, ...(data.data.secondary_roles || [])].filter(Boolean);
          setPossessedRoles(allRoles);

          setCurrentUser(prev => ({
            ...prev,
            secondaryRoles: data.data.secondary_roles || [],
            primaryRole: data.data.role // Sync primary role too
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user roles", error);
      }
    };
    fetchUserRoles();
  }, []);

  // Fetch profile for ALL roles
  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await restClient.get('/api/auth/profile');

      if (data.success && data.data) {
        const apiData = data.data;
        const personalInfo = apiData.personal_info || {};

        // Basic Mapping (Shared)
        const baseData = {
          name: `${apiData.first_name || ''} ${apiData.last_name || ''}`.trim() || 'User',
          email: apiData.email || '',
          phone: personalInfo.phone || apiData.phone || '',
          location: personalInfo.location || apiData.location || '',
          latitude: apiData.latitude || personalInfo.latitude,
          longitude: apiData.longitude || personalInfo.longitude,

          // HR / Professional Fields
          jobTitle: apiData.job_title || apiData.position || apiData.current_position || '',
          companyName: apiData.company || apiData.company_name || apiData.current_company || '',
          industry: apiData.industry || '',
          companySize: apiData.company_size || '',
          companyLocation: apiData.company_location || '',

          // Candidate Fields
          summary: apiData.professional_summary || '',
          years_of_experience: apiData.experience_years || 0,

          // Arrays (safe fallbacks)
          skills: Array.isArray(apiData.skills) ? apiData.skills : [],
          languages: Array.isArray(apiData.languages) ? apiData.languages : [],
          certifications: Array.isArray(apiData.certifications) ? apiData.certifications : [],

          // Pass through everything else for specific forms
          ...apiData
        };

        setCandidateData(baseData);

        // Update current user state with photo and basic info
        setCurrentUser(prev => ({
          ...prev,
          firstName: apiData.first_name || prev.firstName,
          lastName: apiData.last_name || prev.lastName,
          email: apiData.email || prev.email,
          profilePhotoUrl: apiData.profile_photo_url || prev.profilePhotoUrl,
          // Sync role if backend returns it
          primaryRole: apiData.role ? normalizeRole(apiData.role) : prev.primaryRole,
          // Calculate completion if needed or use backend
          profileCompletion: apiData.profile_completion || prev.profileCompletion
        }));
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
      toast({
        title: "Error loading profile",
        description: "Could not load your profile data.",
        variant: "destructive"
      });
    }
  }, [currentUser.primaryRole, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Pointer Component for Job Seekers to Redirect to Profile Studio
  const CandidateStudioPointer = ({ section }: { section: string }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
        <User className="h-8 w-8 text-teal-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        Manage your Job Seeker Profile in the Studio
      </h3>
      <p className="text-slate-600 max-w-md mb-6">
        We've created a dedicated experience for you to build your CV, manage your skills, and verify your identity.
      </p>
      <Button
        onClick={() => navigate(`/candidate/profile/${section}`)}
        className="bg-teal-600 hover:bg-teal-700"
      >
        Go to Profile Studio
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );

  // Consolidated Role Configurations
  const roleConfigs: Record<string, any> = {
    'job_seeker': {
      label: 'Job Seeker',
      icon: User,
      color: 'bg-blue-500',
      tabs: ['overview', 'personal', 'career', 'skills'],
      components: {
        personal: () => <CandidateStudioPointer section="identity" />,
        career: () => <CandidateStudioPointer section="compass" />,
        skills: () => <CandidateStudioPointer section="skills" />
      }
    },
    'student': {
      label: 'Student',
      icon: GraduationCap,
      color: 'bg-teal-500',
      tabs: ['overview', 'personal', 'academic', 'interests'],
      components: {
        personal: StudentProfileForm, // Pass reference, don't wrap in closure
        academic: () => <div>Academic Records & Transcripts</div>,
        interests: () => <div>Extracurricular Interests</div>
      }
    },
    'recruiter': {
      label: 'HR Recruiter',
      icon: Users,
      color: 'bg-green-500',
      tabs: ['overview', 'personal', 'company', 'preferences'],
      components: {
        personal: HRProfileForm,
        company: CompanyProfileSetup,
        preferences: RecruiterPreferences
      }
    },
    'hr_manager': {
      label: 'HR Manager',
      icon: Users,
      color: 'bg-green-600',
      tabs: ['overview', 'personal', 'company', 'preferences', 'team'],
      components: {
        personal: HRProfileForm, // Reuse HR form for now
        company: CompanyProfileSetup,
        preferences: () => <div>Hiring Preferences</div>,
        team: () => <div>Team Management</div>
      }
    },
    'educator': {
      label: 'Educator',
      icon: GraduationCap,
      color: 'bg-purple-500',
      tabs: ['overview', 'personal', 'institution', 'curriculum'],
      components: {
        personal: EducatorProfileForm,
        institution: InstitutionProfileSetup,
        curriculum: () => <div>Curriculum Management</div>
      }
    },
    'mentor': {
      label: 'Mentor',
      icon: Star,
      color: 'bg-orange-500',
      tabs: ['overview', 'personal', 'expertise', 'mentoring'],
      components: {
        personal: () => <div>Mentor Personal Profile</div>,
        expertise: () => <div>Expertise Areas</div>,
        mentoring: () => <div>Mentoring Preferences</div>
      }
    },
    'assessor': {
      label: 'Assessor',
      icon: ClipboardCheck,
      color: 'bg-red-500',
      tabs: ['overview', 'personal', 'certifications', 'methodology'],
      components: {
        personal: AssessorProfileForm,
        certifications: CertificationTracking,
        methodology: () => <div>Assessment Methodology</div>
      }
    },
    'guardian': {
      label: 'Guardian',
      icon: Shield,
      color: 'bg-slate-500',
      tabs: ['overview', 'personal', 'dependents'],
      components: {
        personal: () => <div>Guardian Personal Profile</div>,
        dependents: () => <div>Dependents Management</div>
      }
    }
  };

  // Helper to normalize role keys for config lookup 
  const getRoleConfigKey = (role: string) => {
    const normalized = normalizeRole(role) as string;
    if (normalized === 'candidate') return 'job_seeker';
    // Map variations to the config key 'recruiter'
    if (normalized === 'hr/recruiter' || normalized === 'hr_recruiter') return 'recruiter';
    return normalized;
  };

  const getCurrentRoleConfig = () => {
    const configKey = getRoleConfigKey(currentUser.primaryRole);
    return roleConfigs[configKey] || roleConfigs['job_seeker'];
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
      // Real API call to refresh profile
      await fetchProfile();

      // Update global auth context to reflect changes (like name updates) in the header
      await refreshUser();

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

  // Check if "New Member"
  const isNewMember = currentUser.firstName === 'New' && currentUser.lastName === 'Member';
  const displayRole = isNewMember ? 'New Member' : (roleConfig.label || currentUser.primaryRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50" >
      <HybridGovernmentNav showAuthButtons={false} currentPage="profile" userRole={currentUser.primaryRole} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentUser.profilePhotoUrl ? (
                  <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                    <AvatarImage src={currentUser.profilePhotoUrl} alt="Profile" className="object-cover" />
                    <AvatarFallback className={`${roleConfig.color} text-white`}>
                      {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className={`p-3 rounded-full ${roleConfig.color} text-white`}>
                    <RoleIcon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">
                    {currentUser.firstName} {currentUser.lastName}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {displayRole} • {currentUser.email}
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
                <span className="text-sm font-medium mb-2 block">Switch Persona</span>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(roleConfigs).map(roleKey => {
                    const config = roleConfigs[roleKey];
                    const Icon = config.icon;
                    const label = config.label;

                    const normalizedPrimary = getRoleConfigKey(currentUser.primaryRole);
                    // Use possessedRoles to check ownership instead of mutating currentUser state
                    const normalizedPossessed = possessedRoles.map(getRoleConfigKey);

                    const hasRole = normalizedPossessed.includes(roleKey);
                    const isCurrent = normalizedPrimary === roleKey;

                    if (isCurrent) {
                      return (
                        <Button
                          key={roleKey}
                          size="sm"
                          variant="default"
                          className="text-xs cursor-default"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {label}
                        </Button>
                      );
                    }

                    if (hasRole) {
                      return (
                        <Button
                          key={roleKey}
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleSwitch(roleKey)}
                          className="text-xs"
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {label}
                        </Button>
                      );
                    }

                    // Don't have role -> Show Request option
                    return (
                      <Button
                        key={roleKey}
                        size="sm"
                        variant="ghost"
                        onClick={() => setRequestDialog({ isOpen: true, role: label })}
                        className="text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300"
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        Request {label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <RoleRequestDialog
                isOpen={requestDialog.isOpen}
                role={requestDialog.role}
                onClose={() => setRequestDialog({ ...requestDialog, isOpen: false })}
                onRequestSubmitted={async () => {
                  // Refresh roles to pick up auto-approved roles (e.g., Job Seeker)
                  try {
                    const { data } = await restClient.get('/api/auth/roles');
                    if (data.success) {
                      const allRoles = [data.data.role, ...(data.data.secondary_roles || [])].filter(Boolean);
                      setPossessedRoles(allRoles);
                      setCurrentUser(prev => ({
                        ...prev,
                        primaryRole: data.data.role || 'Job Seeker',
                        secondaryRoles: data.data.secondary_roles || []
                      }));
                    }
                  } catch (e) {
                    console.error('Failed to refresh roles after request', e);
                  }
                }}
              />

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
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Data
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
                    {/* Explicitly render ProfileForm for Job Seeker to avoid re-mounting issues */}
                    {currentUser.primaryRole === 'Job Seeker' && tab === 'personal' ? (
                      <CandidateStudioPointer section="identity" />
                    ) : currentUser.primaryRole === 'student' && tab === 'personal' ? (
                      <StudentProfileForm
                        initialData={candidateData}
                        onSave={async (data) => {
                          try {
                            // Save to backend using the generic profile endpoint which now supports student fields
                            await restClient.put('/api/auth/profile', data);

                            // Refresh profile data
                            await handleProfileUpdate();

                            toast({
                              title: "Success",
                              description: "Student profile updated successfully",
                            });
                          } catch (error) {
                            console.error("Error saving student profile:", error);
                            toast({
                              title: "Error",
                              description: "Failed to save profile changes",
                              variant: "destructive"
                            });
                          }
                        }}
                      />
                    ) : roleConfig.components[tab as keyof typeof roleConfig.components] ? (
                      React.createElement(roleConfig.components[tab as keyof typeof roleConfig.components], {
                        onProfileUpdate: handleProfileUpdate,
                        initialData: candidateData // Provide loaded data to component
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
                  const configKey = getRoleConfigKey(role);
                  const config = roleConfigs[configKey] || roleConfigs['job_seeker'];
                  const Icon = config?.icon || User;
                  const displayName = role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                  return (
                    <div key={role} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${config.color || 'bg-gray-400'} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{displayName}</h4>
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
    </div >
  );
};

export default ProfileManagement;
