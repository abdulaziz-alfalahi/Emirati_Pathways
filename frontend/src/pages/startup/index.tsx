
import React from 'react';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { 
  Rocket, 
  DollarSign, 
  Users, 
  Target, 
  Lightbulb,
  TrendingUp,
  Building,
  BookOpen
} from 'lucide-react';

const StartupEcosystemPage: React.FC = () => {
  const stats: StatItem[] = [
    {
      value: "300+",
      label: "Active Startups",
      icon: Rocket
    },
    {
      value: "AED 2.5B+",
      label: "Total Funding",
      icon: DollarSign
    },
    {
      value: "150+",
      label: "Investors",
      icon: Users
    },
    {
      value: "25+",
      label: "Accelerators",
      icon: Building
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "startups",
      label: "Startup Directory",
      icon: <Rocket className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Startup Directory"
          icon={<Rocket className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Explore the vibrant startup ecosystem in the UAE"
        >
          <EmptyTabContent
            icon={Rocket}
            title="Startup Directory"
            description="Discover innovative startups across various sectors and connect with entrepreneurial opportunities."
            actionLabel="Browse Startups"
            onAction={() => console.log("Browse startup directory")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "funding",
      label: "Funding Opportunities",
      icon: <DollarSign className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Funding Opportunities"
          icon={<DollarSign className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Access funding sources, investors, and financial support for startups"
        >
          <EmptyTabContent
            icon={DollarSign}
            title="Funding Opportunities"
            description="Connect with investors, venture capital firms, and funding programs supporting UAE startups."
            actionLabel="Explore Funding"
            onAction={() => console.log("Explore funding opportunities")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "accelerators",
      label: "Accelerators & Incubators",
      icon: <Building className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Accelerators & Incubators"
          icon={<Building className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Join leading accelerator and incubator programs"
        >
          <EmptyTabContent
            icon={Building}
            title="Accelerators & Incubators"
            description="Discover accelerator and incubator programs that can fast-track your startup's growth."
            actionLabel="Find Programs"
            onAction={() => console.log("Find accelerator programs")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "resources",
      label: "Startup Resources",
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Startup Resources"
          icon={<BookOpen className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Access comprehensive resources for startup success"
        >
          <EmptyTabContent
            icon={BookOpen}
            title="Startup Resources"
            description="Access guides, templates, legal resources, and tools essential for startup development and growth."
            actionLabel="Browse Resources"
            onAction={() => console.log("Browse startup resources")}
          />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Startup Ecosystem"
      description="Navigate the dynamic startup landscape with access to funding opportunities, accelerator programs, and comprehensive resources for entrepreneurial success"
      icon={<Rocket className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="startups"
    />
  );
};

export default StartupEcosystemPage;
