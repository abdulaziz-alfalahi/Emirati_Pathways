
import React from 'react';
import { useAuth } from '@/context/AuthContext';
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
  const { user, roles } = useAuth();
  
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
        <Avatar className="h-24 w-24 border-4 border-emirati-teal">
          <AvatarFallback className="bg-emirati-teal text-white text-2xl">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
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
