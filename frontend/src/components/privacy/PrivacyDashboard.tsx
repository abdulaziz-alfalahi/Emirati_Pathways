
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Eye, 
  Download, 
  Trash2, 
  Settings, 
  Info,
  Lock,
  Globe,
  Users,
  Briefcase
} from 'lucide-react';

interface PrivacySettings {
  dataProcessing: boolean;
  marketingCommunications: boolean;
  analyticsTracking: boolean;
  thirdPartySharing: boolean;
  profileVisibility: 'public' | 'private' | 'contacts';
  activityTracking: boolean;
  locationSharing: boolean;
}

interface DataExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'expired';
  requestedAt: string;
  downloadUrl?: string;
  expiresAt?: string;
}

export const PrivacyDashboard: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataProcessing: true,
    marketingCommunications: false,
    analyticsTracking: true,
    thirdPartySharing: false,
    profileVisibility: 'contacts',
    activityTracking: true,
    locationSharing: false
  });
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // G22/G23: Employment Status state
  const [employmentStatus, setEmploymentStatus] = useState('candidate');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPrivacySettings();
      loadExportRequests();
      loadEmploymentStatus();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    // In a real implementation, this would load from your database
    // For now, we'll use localStorage as a demo
    const saved = localStorage.getItem(`privacy_settings_${user?.id}`);
    if (saved) {
      setPrivacySettings(JSON.parse(saved));
    }
  };

  const loadExportRequests = async () => {
    // In a real implementation, this would load from your database
    const saved = localStorage.getItem(`export_requests_${user?.id}`);
    if (saved) {
      setExportRequests(JSON.parse(saved));
    }
  };

  const updatePrivacySetting = async (key: keyof PrivacySettings, value: boolean | string) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    
    // Save to localStorage (in real implementation, save to database)
    localStorage.setItem(`privacy_settings_${user?.id}`, JSON.stringify(newSettings));
    
    toast({
      title: 'Privacy Settings Updated',
      description: 'Your privacy preferences have been saved'
    });
  };

  // G22/G23: Load employment status from backend
  const loadEmploymentStatus = async () => {
    try {
      const response = await restClient.get('/api/candidate/profile/career-dial/employment-status');
      if (response.data && response.data.employment_status) {
        setEmploymentStatus(response.data.employment_status);
      }
    } catch (error) {
      console.error('Failed to load employment status:', error);
    }
  };

  // G22/G23: Update employment status via backend
  const updateEmploymentStatus = async (status: string) => {
    setIsUpdatingStatus(true);
    const previousStatus = employmentStatus;
    setEmploymentStatus(status); // Optimistic update
    try {
      await restClient.put('/api/candidate/profile/career-dial/employment-status', {
        employment_status: status
      });
      toast({
        title: 'Employment Status Updated',
        description: 'Your employment status has been saved.'
      });
    } catch (error) {
      console.error('Failed to update employment status:', error);
      setEmploymentStatus(previousStatus); // Revert on error
      toast({
        title: 'Update Failed',
        description: 'Failed to update employment status.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const requestDataExport = async () => {
    setIsLoading(true);
    try {
      const newRequest: DataExportRequest = {
        id: crypto.randomUUID(),
        status: 'pending',
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const updatedRequests = [newRequest, ...exportRequests];
      setExportRequests(updatedRequests);
      localStorage.setItem(`export_requests_${user?.id}`, JSON.stringify(updatedRequests));

      toast({
        title: 'Data Export Requested',
        description: 'We will prepare your data export and notify you when ready'
      });

      // Simulate processing
      setTimeout(() => {
        const processedRequest = {
          ...newRequest,
          status: 'ready' as const,
          downloadUrl: '/api/export/data.zip'
        };
        const finalRequests = [processedRequest, ...exportRequests];
        setExportRequests(finalRequests);
        localStorage.setItem(`export_requests_${user?.id}`, JSON.stringify(finalRequests));
        
        toast({
          title: 'Data Export Ready',
          description: 'Your data export is ready for download'
        });
      }, 3000);
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to create data export request',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestDataDeletion = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      // In a real implementation, this would mark account for deletion
      toast({
        title: 'Data Deletion Requested',
        description: 'Your account has been marked for deletion and will be processed within 30 days'
      });
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to process data deletion request',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'contacts':
        return <Users className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Privacy & Data Control</h1>
          <p className="text-muted-foreground">
            Manage your privacy settings and control how your data is used
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          Privacy Protected
        </Badge>
      </div>

      {/* G22/G23: Employment Status / Career Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Employment Status
          </CardTitle>
          <CardDescription>
            Let recruiters know your current career status. This helps match you with the right opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            { value: 'candidate', label: 'Active Job Seeker', desc: 'Actively looking for new opportunities' },
            { value: 'employed_open', label: 'Open to Opportunities', desc: 'Currently employed but open to hearing from recruiters' },
            { value: 'employed_not_looking', label: 'Not Looking', desc: 'Currently employed and not interested in new roles' },
            { value: 'freelancer', label: 'Freelancer', desc: 'Available for contract or freelance work' },
          ] as const).map((option) => (
            <button
              key={option.value}
              onClick={() => updateEmploymentStatus(option.value)}
              disabled={isUpdatingStatus}
              className={`flex items-center space-x-3 w-full p-3 border rounded-lg text-left transition-colors ${
                employmentStatus === option.value
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent'
              } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                employmentStatus === option.value ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {employmentStatus === option.value && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.desc}</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Data Processing Consent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Data Processing Preferences
          </CardTitle>
          <CardDescription>
            Control how your personal data is processed and used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Essential Data Processing</p>
                <p className="text-sm text-muted-foreground">
                  Required for basic platform functionality
                </p>
              </div>
              <Switch 
                checked={privacySettings.dataProcessing}
                onCheckedChange={(checked) => updatePrivacySetting('dataProcessing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Marketing Communications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about opportunities and services
                </p>
              </div>
              <Switch 
                checked={privacySettings.marketingCommunications}
                onCheckedChange={(checked) => updatePrivacySetting('marketingCommunications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Analytics & Performance</p>
                <p className="text-sm text-muted-foreground">
                  Help improve the platform through usage analytics
                </p>
              </div>
              <Switch 
                checked={privacySettings.analyticsTracking}
                onCheckedChange={(checked) => updatePrivacySetting('analyticsTracking', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Third-Party Data Sharing</p>
                <p className="text-sm text-muted-foreground">
                  Share anonymized data with partner organizations
                </p>
              </div>
              <Switch 
                checked={privacySettings.thirdPartySharing}
                onCheckedChange={(checked) => updatePrivacySetting('thirdPartySharing', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile and activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(['public', 'contacts', 'private'] as const).map((visibility) => (
              <button
                key={visibility}
                onClick={() => updatePrivacySetting('profileVisibility', visibility)}
                className={`flex items-center space-x-3 w-full p-3 border rounded-lg text-left transition-colors ${
                  privacySettings.profileVisibility === visibility
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent'
                }`}
              >
                {getVisibilityIcon(visibility)}
                <div className="flex-1">
                  <p className="font-medium capitalize">{visibility}</p>
                  <p className="text-sm text-muted-foreground">
                    {visibility === 'public' && 'Anyone can view your profile'}
                    {visibility === 'contacts' && 'Only your connections can view your profile'}
                    {visibility === 'private' && 'Only you can view your profile'}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Activity Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Track your learning progress and achievements
                </p>
              </div>
              <Switch 
                checked={privacySettings.activityTracking}
                onCheckedChange={(checked) => updatePrivacySetting('activityTracking', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Location Sharing</p>
                <p className="text-sm text-muted-foreground">
                  Share your location for nearby opportunities
                </p>
              </div>
              <Switch 
                checked={privacySettings.locationSharing}
                onCheckedChange={(checked) => updatePrivacySetting('locationSharing', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Export & Deletion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or delete your personal data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You have the right to export or delete your personal data at any time. 
              Data exports include all your profile information, activity history, and uploaded content.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your personal data
              </p>
              <Button 
                onClick={requestDataExport}
                disabled={isLoading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Request Data Export
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Delete Your Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
              <Button 
                variant="destructive"
                onClick={requestDataDeletion}
                disabled={isLoading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </div>
          </div>

          {exportRequests.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Export Requests</h4>
              <div className="space-y-2">
                {exportRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        Requested {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.status === 'ready' && request.expiresAt &&
                          `Expires ${new Date(request.expiresAt).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      {request.status === 'ready' && request.downloadUrl && (
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
