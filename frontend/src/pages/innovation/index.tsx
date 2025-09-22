
import React from 'react';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { 
  Lightbulb, 
  Rocket, 
  Users, 
  TrendingUp, 
  Award,
  Briefcase,
  BookOpen,
  Target
} from 'lucide-react';

const InnovationHubPage: React.FC = () => {
  const stats: StatItem[] = [
    {
      value: "150+",
      label: "Innovation Projects",
      icon: Lightbulb
    },
    {
      value: "75+",
      label: "Startup Ventures",
      icon: Rocket
    },
    {
      value: "500+",
      label: "Innovators",
      icon: Users
    },
    {
      value: "85%",
      label: "Success Rate",
      icon: TrendingUp
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "projects",
      label: "Innovation Projects",
      icon: <Lightbulb className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Innovation Projects"
          icon={<Lightbulb className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Explore cutting-edge innovation projects and contribute to groundbreaking initiatives"
        >
          <EmptyTabContent
            icon={Lightbulb}
            title="Innovation Projects"
            description="Discover and participate in innovation projects that are shaping the future of various industries."
            actionLabel="Browse Projects"
            onAction={() => console.log("Browse innovation projects")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "startups",
      label: "Startup Ventures",
      icon: <Rocket className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Startup Ventures"
          icon={<Rocket className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Connect with startup opportunities and entrepreneurial ventures"
        >
          <EmptyTabContent
            icon={Rocket}
            title="Startup Ventures"
            description="Explore startup opportunities and connect with entrepreneurial ventures across the UAE."
            actionLabel="View Startups"
            onAction={() => console.log("View startup ventures")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "incubators",
      label: "Incubators",
      icon: <Target className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Innovation Incubators"
          icon={<Target className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Access world-class incubators and accelerator programs"
        >
          <EmptyTabContent
            icon={Target}
            title="Innovation Incubators"
            description="Connect with leading incubators and accelerator programs to fast-track your innovation journey."
            actionLabel="Find Incubators"
            onAction={() => console.log("Find incubators")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "resources",
      label: "Resources",
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Innovation Resources"
          icon={<BookOpen className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Access comprehensive resources for innovation and entrepreneurship"
        >
          <EmptyTabContent
            icon={BookOpen}
            title="Innovation Resources"
            description="Explore guides, tools, and resources to support your innovation and entrepreneurship journey."
            actionLabel="Browse Resources"
            onAction={() => console.log("Browse innovation resources")}
          />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Innovation Hub"
      description="Connect with cutting-edge innovation projects, startup ventures, and entrepreneurial opportunities that are shaping the future of the UAE"
      icon={<Lightbulb className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="projects"
    />
  );
};

export default InnovationHubPage;
