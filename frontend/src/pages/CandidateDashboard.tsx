import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { 
  User, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Upload,
  CheckCircle,
  AlertCircle,
  Target,
  Calendar,
  Star,
  Award,
  MapPin,
  Phone,
  Mail,
  Eye,
  Edit,
  Download,
  Share,
  Bell,
  Settings
} from 'lucide-react';

// Import your existing components
import CVUpload from '@/components/candidate/CVUpload';
import ProfileForm from '@/components/candidate/ProfileForm';
import JobMatches from '@/components/candidate/JobMatches';
import ApplicationTracker from '@/components/candidate/ApplicationTracker';
import Layout from '@/components/layout/Layout';

interface DashboardData {
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    completionPercentage: number;
    cvUploaded: boolean;
    profilePicture?: string;
  };
  stats: {
    profileViews: number;
    jobMatches: number;
    applications: number;
    interviews: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'application' | 'interview' | 'profile_view' | 'job_match';
    title: string;
    description: string;
    timestamp: string;
  }>;
}

const CandidateDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    profile: {
      name: 'Ahmed Al Emirati',
      email: 'ahmed.alemirati@hrdc.ae',
      phone: '+971501234567',
      location: 'Dubai, UAE',
      completionPercentage: 75,
      cvUploaded: false
    },
    stats: {
      profileViews: 24,
      jobMatches: 8,
      applications: 5,
      interviews: 2
    },
    recentActivity: [
      {
        id: '1',
        type: 'job_match',
        title: 'New Job Match',
        description: 'Senior Software Engineer at Emirates Technology',
        timestamp: '2 hours ago'
      },
      {
        id: '2',
        type: 'profile_view',
        title: 'Profile Viewed',
        description: 'Your profile was viewed by ADNOC Digital',
        timestamp: '5 hours ago'
      },
      {
        id: '3',
        type: 'interview',
        title: 'Interview Scheduled',
        description: 'Technical interview with Careem on Sept 20',
        timestamp: '1 day ago'
      }
    ]
  });

  const [parsedCVData, setParsedCVData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCVSuccess, setShowCVSuccess] = useState(false);

  // Handle CV upload completion
  const handleCVUploadComplete = (cvData: any) => {
    console.log('CV Upload completed:', cvData);
    setDashboardData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        cvUploaded: true,
        completionPercentage: Math.min(prev.profile.completionPercentage + 20, 100)
      }
    }));
    setShowCVSuccess(true);
    setTimeout(() => setShowCVSuccess(false), 5000);
  };

  // Handle CV parsing completion - this is the key integration!
  const handleCVParsingComplete = (parsedData: any) => {
    console.log('CV Parsing completed:', parsedData);
    setParsedCVData(parsedData);
    
    // Update dashboard stats
    setDashboardData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: parsedData.name || prev.profile.name,
        email: parsedData.email || prev.profile.email,
        phone: parsedData.phone || prev.profile.phone,
        location: parsedData.location || prev.profile.location,
        completionPercentage: Math.min(prev.profile.completionPercentage + 15, 100)
      }
    }));

    // Automatically switch to Profile tab to show the populated form
    setActiveTab('profile');
    setShowCVSuccess(true);
    setTimeout(() => setShowCVSuccess(false), 5000);
  };

  // Handle profile form updates
  const handleProfileUpdate = (profileData: any) => {
    console.log('Profile updated:', profileData);
    setDashboardData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: profileData.name || prev.profile.name,
        email: profileData.email || prev.profile.email,
        phone: profileData.phone || prev.profile.phone,
        location: profileData.location || prev.profile.location,
        completionPercentage: calculateProfileCompletion(profileData)
      }
    }));
  };

  // Calculate profile completion based on filled fields
  const calculateProfileCompletion = (profileData: any) => {
    const fields = [
      profileData.name,
      profileData.email,
      profileData.phone,
      profileData.location,
      profileData.summary,
      profileData.skills?.length > 0,
      profileData.education,
      profileData.years_of_experience > 0
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'profile_view':
        return <Eye className="h-4 w-4 text-green-500" />;
      case 'job_match':
        return <Target className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <HybridGovernmentNavFixed showAuthButtons={false} currentPage="dashboard" userRole="job seeker" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {dashboardData.profile.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {dashboardData.profile.name.split(' ')[0]}!
              </h1>
              <p className="text-gray-600">Your career journey continues here</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Job Seeker
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {showCVSuccess && (
          <div className="pt-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                🎉 CV processed successfully! Your profile has been automatically updated with the parsed information.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="jobs">Job Matches</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Eye className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Profile Views</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.profileViews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Target className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Job Matches</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.jobMatches}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Applications</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.applications}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Interviews</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.interviews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Profile Completion
                    </CardTitle>
                    <CardDescription>
                      Complete your profile to get better job matches
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-gray-600">{dashboardData.profile.completionPercentage}%</span>
                      </div>
                      <Progress value={dashboardData.profile.completionPercentage} className="h-3" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            CV Upload
                          </span>
                          {dashboardData.profile.cvUploaded ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <Button 
                          onClick={() => setActiveTab('profile')}
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        >
                          {dashboardData.profile.cvUploaded ? 'Update Profile' : 'Upload CV & Complete Profile'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      Common tasks to boost your job search
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => setActiveTab('jobs')}
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Browse Job Matches ({dashboardData.stats.jobMatches})
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('applications')}
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Track Applications ({dashboardData.stats.applications})
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('profile')}
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {dashboardData.profile.cvUploaded ? 'Update CV' : 'Upload CV'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest job search activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6 mt-6">
                <CVUpload onUploadComplete={handleCVUploadComplete} onParsingComplete={handleCVParsingComplete} />
                <ProfileForm initialData={parsedCVData} onProfileUpdate={handleProfileUpdate} />
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6 mt-6">
                <JobMatches />
            </TabsContent>

            <TabsContent value="applications" className="space-y-6 mt-6">
                <ApplicationTracker />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
