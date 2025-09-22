
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProfileLayout from '@/components/profile/ProfileLayout';
import ProfileManagement from './ProfileManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings } from 'lucide-react';

const ProfilePage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [activeView, setActiveView] = useState('enhanced');
  
  useEffect(() => {
    // If no user, redirect to login
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  const handleProfileUpdate = () => {
    // Increment the counter to trigger a refresh of the profile summary
    setRefreshCounter(prev => prev + 1);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Convert user data to ProfileManagement format
  const userProfile = user ? {
    id: user.id || '1',
    firstName: user.firstName || user.name?.split(' ')[0] || 'User',
    lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email || '',
    primaryRole: user.role || 'Job Seeker',
    secondaryRoles: user.secondaryRoles || [],
    profileCompletion: user.profileCompletion || 75,
    lastUpdated: user.lastUpdated || new Date().toISOString().split('T')[0],
    verificationStatus: user.verificationStatus || 'pending',
    profileVisibility: user.profileVisibility || 'professional'
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Management
            </CardTitle>
            <CardDescription>
              Choose your preferred profile management interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="enhanced">
                  <Settings className="h-4 w-4 mr-2" />
                  Enhanced Profile
                </TabsTrigger>
                <TabsTrigger value="classic">
                  <User className="h-4 w-4 mr-2" />
                  Classic View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="enhanced" className="mt-6">
                <ProfileManagement userProfile={userProfile} />
              </TabsContent>

              <TabsContent value="classic" className="mt-6">
                <ProfileLayout refreshCounter={refreshCounter} onProfileUpdate={handleProfileUpdate} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
