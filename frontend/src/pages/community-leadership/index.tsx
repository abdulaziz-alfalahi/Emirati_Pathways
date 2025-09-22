
import React from 'react';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { Users, Award, BookOpen, Target } from 'lucide-react';
import { CommunityLeadershipContent } from '@/components/community-leadership/CommunityLeadershipContent';

const CommunityLeadershipPage: React.FC = () => {
  const stats = [
    { value: "50+", label: "Training Programs", icon: BookOpen },
    { value: "200+", label: "Leadership Opportunities", icon: Target },
    { value: "1,500+", label: "Community Leaders", icon: Users },
    { value: "100+", label: "Success Stories", icon: Award }
  ];

  const tabs = [
    {
      id: 'training',
      label: 'Training & Workshops',
      icon: <BookOpen className="h-4 w-4" />,
      content: <CommunityLeadershipContent activeTab="training" />
    },
    {
      id: 'opportunities',
      label: 'Leadership Opportunities',
      icon: <Target className="h-4 w-4" />,
      content: <CommunityLeadershipContent activeTab="opportunities" />
    },
    {
      id: 'stories',
      label: 'Success Stories',
      icon: <Award className="h-4 w-4" />,
      content: <CommunityLeadershipContent activeTab="stories" />
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Community Leadership"
      description="Develop and exercise leadership skills within your community. Access training programs, discover leadership opportunities, and get inspired by success stories from community leaders across the UAE."
      icon={<Users className="h-8 w-8" />}
      stats={stats}
      tabs={tabs}
      defaultTab="training"
    />
  );
};

export default CommunityLeadershipPage;
