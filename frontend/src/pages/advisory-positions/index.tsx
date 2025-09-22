
import React from 'react';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { AdvisoryPositionsContent } from '@/components/advisory-positions/AdvisoryPositionsContent';
import { Users, Target, Award, TrendingUp } from 'lucide-react';

const AdvisoryPositionsPage: React.FC = () => {
  const stats = [
    {
      value: "25+",
      label: "Active Positions",
      icon: Target,
    },
    {
      value: "150+",
      label: "Organizations",
      icon: Users,
    },
    {
      value: "500+",
      label: "Advisors Placed",
      icon: Award,
    },
    {
      value: "85%",
      label: "Success Rate",
      icon: TrendingUp,
    },
  ];

  return (
    <ProfessionalGrowthLayout
      title="Advisory Positions"
      description="Discover prestigious advisory roles and contribute your expertise to shape the future of organizations across the UAE. From startups to government entities, find opportunities that match your experience and passion."
      icon={<Users className="h-8 w-8" />}
      stats={stats}
      tabs={[]}
    >
      <AdvisoryPositionsContent />
    </ProfessionalGrowthLayout>
  );
};

export default AdvisoryPositionsPage;
