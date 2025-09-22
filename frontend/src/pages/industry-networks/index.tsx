
import React from 'react';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { 
  Building, 
  Users, 
  TrendingUp, 
  Award, 
  Briefcase,
  Network,
  Target,
  Globe
} from 'lucide-react';

const IndustryNetworksPage: React.FC = () => {
  const stats: StatItem[] = [
    {
      value: "25+",
      label: "Industry Sectors",
      icon: Building
    },
    {
      value: "3,000+",
      label: "Network Members",
      icon: Users
    },
    {
      value: "500+",
      label: "Partner Companies",
      icon: Briefcase
    },
    {
      value: "90%",
      label: "Connection Success",
      icon: TrendingUp
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "sectors",
      label: "Industry Sectors",
      icon: <Building className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Industry Sectors"
          icon={<Building className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Explore professional networks across various industry sectors"
        >
          <EmptyTabContent
            icon={Building}
            title="Industry Sectors"
            description="Discover professional networks across technology, finance, healthcare, energy, and other key UAE industry sectors."
            actionLabel="Explore Sectors"
            onAction={() => console.log("Explore industry sectors")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "connections",
      label: "My Networks",
      icon: <Network className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="My Professional Networks"
          icon={<Network className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Manage your industry connections and network relationships"
        >
          <EmptyTabContent
            icon={Network}
            title="My Networks"
            description="View and manage your professional connections across different industry networks and sectors."
            actionLabel="View My Networks"
            onAction={() => console.log("View my networks")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "opportunities",
      label: "Collaboration Opportunities",
      icon: <Target className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Collaboration Opportunities"
          icon={<Target className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Discover cross-industry collaboration and partnership opportunities"
        >
          <EmptyTabContent
            icon={Target}
            title="Collaboration Opportunities"
            description="Find opportunities for cross-industry collaboration, partnerships, and joint ventures."
            actionLabel="Find Opportunities"
            onAction={() => console.log("Find collaboration opportunities")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "global",
      label: "Global Networks",
      icon: <Globe className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Global Industry Networks"
          icon={<Globe className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Connect with international industry networks and global professionals"
        >
          <EmptyTabContent
            icon={Globe}
            title="Global Networks"
            description="Access international industry networks and connect with global professionals in your field."
            actionLabel="Explore Global Networks"
            onAction={() => console.log("Explore global networks")}
          />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Industry Networks"
      description="Connect with professional networks across key industry sectors and expand your reach through strategic partnerships and collaborative opportunities"
      icon={<Building className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="sectors"
    />
  );
};

export default IndustryNetworksPage;
