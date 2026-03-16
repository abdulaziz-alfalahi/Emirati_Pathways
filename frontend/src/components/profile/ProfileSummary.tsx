
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAuthToken } from '@/utils/tokenUtils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserRole } from '@/context/AuthContext';

const roleLabels: Record<UserRole, string> = {
  school_student: 'School Student',
  national_service_participant: 'National Service Participant',
  university_student: 'University Student',
  intern: 'Internship Trainee',
  full_time_employee: 'Full-Time Employee',
  part_time_employee: 'Part-Time Employee',
  gig_worker: 'Gig Worker',
  jobseeker: 'Jobseeker',
  lifelong_learner: 'Lifelong Learner',
  entrepreneur: 'Entrepreneur',
  retiree: 'Retiree',
  educational_institution: 'Educational Institution',
  parent: 'Parent',
  private_sector_recruiter: 'Private Sector Recruiter',
  government_representative: 'Government Representative',
  retiree_advocate: 'Retiree Advocate',
  training_center: 'Training Center',
  assessment_center: 'Assessment Center',
  mentor: 'Mentor',
  career_advisor: 'Career Advisor',
  platform_operator: 'Platform Operator',
  administrator: 'Administrator',
  super_user: 'Super User'
};

interface ProfileSummaryProps {
  refreshCounter?: number;
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ refreshCounter }) => {
  const { user } = useAuth();
  const roles = user?.roles || user?.user_metadata?.roles || [];
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    fetchProfile();
  }, [refreshCounter]);

  const fetchProfile = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data.profile_photo_url) {
        setProfilePhotoUrl(data.data.profile_photo_url);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/profile/candidate/photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProfilePhotoUrl(data.data.photo_url);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user) return 'U';

    if (!user.user_metadata || !user.user_metadata.full_name) {
      return user.email?.substring(0, 2).toUpperCase() || 'U';
    }

    const fullName = user.user_metadata.full_name as string;
    const names = fullName.split(' ');

    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }

    return fullName.substring(0, 2).toUpperCase();
  };

  const getBio = () => {
    return (user?.user_metadata?.bio as string) || 'No bio provided';
  };

  const getContact = () => {
    return (user?.user_metadata?.contact as string) || 'No contact information provided';
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-center">
        <div className="relative group cursor-pointer" onClick={() => document.getElementById('summary-photo-upload')?.click()}>
          <Avatar className="h-24 w-24 border-4 border-emirati-teal">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-emirati-teal text-white text-2xl">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <span className="text-white text-xs">...</span>
            ) : (
              <span className="text-white text-xs">Change</span>
            )}
          </div>
          <input
            type="file"
            id="summary-photo-upload"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
        </div>
        <CardTitle className="mt-4 text-xl text-center">
          {user?.user_metadata?.full_name || 'Your Name'}
        </CardTitle>
        <CardDescription className="text-center">{user?.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Roles</h3>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emirati-teal/10 text-emirati-teal"
                >
                  {roleLabels[role]}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
            <p className="text-sm">{getBio()}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
            <p className="text-sm">{getContact()}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Created</h3>
            <p className="text-sm">{user ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSummary;
