
import React from 'react';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { Users, TrendingUp, Calendar, MessageSquare, Award, Activity } from 'lucide-react';
import CommunityAnalyticsDashboard from '@/components/communities/analytics/CommunityAnalyticsDashboard';

const CommunityAnalyticsPage: React.FC = () => {
  const stats = [
    {
      value: "2,847",
      label: "Active Members",
      icon: Users
    },
    {
      value: "156",
      label: "Professional Groups",
      icon: TrendingUp
    },
    {
      value: "42",
      label: "Upcoming Events",
      icon: Calendar
    },
    {
      value: "1,203",
      label: "Active Discussions",
      icon: MessageSquare
    }
  ];

  const tabs = [
    {
      id: 'my-communities',
      label: 'My Communities',
      icon: <Users className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="My Professional Communities"
          description="Manage your community memberships and track your engagement across professional networks"
          icon={<Users className="h-5 w-5" />}
        >
          <CommunityAnalyticsDashboard />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Discover Communities"
          description="Find and join professional communities that align with your career goals and interests"
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <CommunityAnalyticsDashboard />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Community Events"
          description="Browse upcoming networking events, workshops, and professional development opportunities"
          icon={<Calendar className="h-5 w-5" />}
        >
          <CommunityAnalyticsDashboard />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: 'discussions',
      label: 'Discussions',
      icon: <MessageSquare className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Active Discussions"
          description="Participate in ongoing professional discussions and knowledge sharing sessions"
          icon={<MessageSquare className="h-5 w-5" />}
        >
          <CommunityAnalyticsDashboard />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Professional Communities"
      description="Connect, collaborate, and grow with UAE's professional community network. Join discussions, attend events, and build meaningful career connections."
      icon={<Users className="h-8 w-8" />}
      stats={stats}
      tabs={tabs}
      defaultTab="my-communities"
      ctaTitle="Ready to expand your professional network?"
      ctaDescription="Join our vibrant community of professionals and unlock new opportunities for growth and collaboration."
      ctaActionLabel="Explore Communities"
      ctaActionHref="/communities"
    />
  );
};

export default CommunityAnalyticsPage;
