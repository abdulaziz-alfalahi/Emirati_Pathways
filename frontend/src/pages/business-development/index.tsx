
import React from 'react';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Briefcase, 
  BarChart,
  Handshake,
  Globe,
  DollarSign
} from 'lucide-react';

const BusinessDevelopmentPage: React.FC = () => {
  const stats: StatItem[] = [
    {
      value: "200+",
      label: "Active Projects",
      icon: TrendingUp
    },
    {
      value: "85+",
      label: "Business Partners",
      icon: Handshake
    },
    {
      value: "1,500+",
      label: "Professionals",
      icon: Users
    },
    {
      value: "78%",
      label: "Success Rate",
      icon: Target
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "opportunities",
      label: "Growth Opportunities",
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Business Growth Opportunities"
          icon={<TrendingUp className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Discover opportunities for business expansion and professional growth"
        >
          <EmptyTabContent
            icon={TrendingUp}
            title="Growth Opportunities"
            description="Explore business development opportunities, market expansion possibilities, and growth strategies."
            actionLabel="Explore Opportunities"
            onAction={() => console.log("Explore growth opportunities")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "partnerships",
      label: "Strategic Partnerships",
      icon: <Handshake className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Strategic Partnerships"
          icon={<Handshake className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Build strategic partnerships and collaborative business relationships"
        >
          <EmptyTabContent
            icon={Handshake}
            title="Strategic Partnerships"
            description="Connect with potential business partners and build strategic alliances for mutual growth."
            actionLabel="Find Partners"
            onAction={() => console.log("Find strategic partners")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "market-analysis",
      label: "Market Intelligence",
      icon: <BarChart className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Market Intelligence"
          icon={<BarChart className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Access market research, trends, and business intelligence insights"
        >
          <EmptyTabContent
            icon={BarChart}
            title="Market Intelligence"
            description="Access comprehensive market research, industry trends, and business intelligence to inform your decisions."
            actionLabel="View Insights"
            onAction={() => console.log("View market intelligence")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "funding",
      label: "Funding & Investment",
      icon: <DollarSign className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Funding & Investment"
          icon={<DollarSign className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Explore funding opportunities and investment possibilities"
        >
          <EmptyTabContent
            icon={DollarSign}
            title="Funding & Investment"
            description="Discover funding opportunities, investment options, and financial resources for business development."
            actionLabel="Explore Funding"
            onAction={() => console.log("Explore funding options")}
          />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Business Development"
      description="Accelerate your business growth through strategic partnerships, market intelligence, and comprehensive development resources designed for the UAE market"
      icon={<TrendingUp className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="opportunities"
    />
  );
};

export default BusinessDevelopmentPage;
