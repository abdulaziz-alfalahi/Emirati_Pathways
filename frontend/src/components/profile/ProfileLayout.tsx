
import React from 'react';
import ProfileSummary from '@/components/profile/ProfileSummary';
import ProfileForm from '@/components/profile/ProfileForm';

interface ProfileLayoutProps {
  refreshCounter: number;
  onProfileUpdate: () => void;
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ 
  refreshCounter, 
  onProfileUpdate 
}) => {
  return (
    <div className="container mx-auto px-4 py-24 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <div className="md:col-span-1">
          <ProfileSummary refreshCounter={refreshCounter} />
        </div>
        
        {/* Edit Profile Form */}
        <div className="md:col-span-2">
          <ProfileForm onProfileUpdate={onProfileUpdate} />
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
