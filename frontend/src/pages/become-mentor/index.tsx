
import React, { useState, useEffect } from 'react';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { AuthenticationRequired } from '@/components/auth/AuthenticationRequired';
import { 
  Users, UserPlus, Calendar, BookOpen, Award, 
  Clock, CheckCircle, XCircle 
} from 'lucide-react';
import { MentorProfileForm } from '@/components/become-mentor/MentorProfileForm';
import { MentorshipOpportunities } from '@/components/become-mentor/MentorshipOpportunities';
import { MentorSessions } from '@/components/become-mentor/MentorSessions';
import { MentorResources } from '@/components/become-mentor/MentorResources';
import { useAuth } from '@/context/AuthContext';
import { useMentorProfile } from '@/hooks/useMentorProfile';

const BecomeMentorPage: React.FC = () => {
  const { user } = useAuth();
  const { mentorProfile, loading, stats } = useMentorProfile();

  if (!user) {
    return (
      <ProfessionalGrowthLayout
        title="Become a Mentor"
        description="Share your expertise and guide the next generation of Emirati professionals"
        icon={<UserPlus className="h-8 w-8 text-white" />}
        tabs={[]}
      >
        <AuthenticationRequired 
          message="Please log in to access the mentorship platform and start your journey as a mentor" 
          icon={<UserPlus className="h-12 w-12 text-muted-foreground mb-4" />}
        />
      </ProfessionalGrowthLayout>
    );
  }

  if (loading) {
    return (
      <ProfessionalGrowthLayout
        title="Become a Mentor"
        description="Share your expertise and guide the next generation of Emirati professionals"
        icon={<UserPlus className="h-8 w-8 text-white" />}
        tabs={[]}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </ProfessionalGrowthLayout>
    );
  }

  const statsItems: StatItem[] = [
    {
      value: stats.totalMentors.toString(),
      label: "Active Mentors",
      icon: Users
    },
    {
      value: stats.totalSessions.toString(),
      label: "Total Sessions",
      icon: Calendar
    },
    {
      value: stats.completedSessions.toString(),
      label: "Completed Sessions",
      icon: CheckCircle
    },
    {
      value: `${stats.averageRating}/5.0`,
      label: "Average Rating",
      icon: Award
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "profile",
      label: "Mentor Profile",
      icon: <UserPlus className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={mentorProfile ? "Update Profile" : "Create Mentor Profile"}
          icon={<UserPlus className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={mentorProfile ? "Update your mentor profile and availability" : "Create your mentor profile to start helping others"}
        >
          <MentorProfileForm mentorProfile={mentorProfile} />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "opportunities",
      label: "Opportunities",
      icon: <Users className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Mentorship Opportunities"
          icon={<Users className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Discover mentees seeking guidance in your area of expertise"
        >
          <MentorshipOpportunities />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "sessions",
      label: "My Sessions",
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="My Mentorship Sessions"
          icon={<Calendar className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Manage your scheduled, completed, and upcoming mentorship sessions"
        >
          <MentorSessions />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "resources",
      label: "Resources",
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Mentor Resources"
          icon={<BookOpen className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Access guides, best practices, and tools for effective mentoring"
        >
          <MentorResources />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Become a Mentor"
      description="Share your expertise and guide the next generation of Emirati professionals"
      icon={<UserPlus className="h-8 w-8 text-white" />}
      stats={statsItems}
      tabs={tabs}
      defaultTab="profile"
    />
  );
};

export default BecomeMentorPage;
