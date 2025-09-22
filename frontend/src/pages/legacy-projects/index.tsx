
import React from 'react';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { Landmark, Users, Building, Award } from 'lucide-react';
import { LegacyProjectsContent } from '@/components/legacy-projects/LegacyProjectsContent';

const LegacyProjectsPage: React.FC = () => {
  const stats = [
    { value: "25+", label: "Active Projects", icon: Landmark },
    { value: "500+", label: "Contributors", icon: Users },
    { value: "15+", label: "Partner Organizations", icon: Building },
    { value: "2M+", label: "AED Raised", icon: Award }
  ];

  const tabs = [
    {
      id: 'explore',
      label: 'Explore Projects',
      icon: <Landmark className="h-4 w-4" />,
      content: <LegacyProjectsContent activeTab="explore" />
    },
    {
      id: 'contributions',
      label: 'My Contributions',
      icon: <Award className="h-4 w-4" />,
      content: <LegacyProjectsContent activeTab="contributions" />
    },
    {
      id: 'propose',
      label: 'Propose a Project',
      icon: <Building className="h-4 w-4" />,
      content: <LegacyProjectsContent activeTab="propose" />
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Legacy Projects"
      description="Create lasting positive impact on society, culture, and the environment. Discover meaningful projects, contribute your skills and resources, or propose your own vision for change."
      icon={<Landmark className="h-8 w-8" />}
      stats={stats}
      tabs={tabs}
      defaultTab="explore"
    />
  );
};

export default LegacyProjectsPage;
