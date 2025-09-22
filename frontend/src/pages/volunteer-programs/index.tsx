
import React from 'react';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { Heart, Users, Building, Award } from 'lucide-react';
import { VolunteerProgramsContent } from '@/components/volunteer-programs/VolunteerProgramsContent';

const VolunteerProgramsPage: React.FC = () => {
  const stats = [
    { value: "50+", label: "Active Opportunities", icon: Heart },
    { value: "200+", label: "Volunteers", icon: Users },
    { value: "25+", label: "Partner Organizations", icon: Building },
    { value: "1000+", label: "Volunteer Hours", icon: Award }
  ];

  const tabs = [
    {
      id: 'opportunities',
      label: 'Browse Opportunities',
      icon: <Heart className="h-4 w-4" />,
      content: <VolunteerProgramsContent activeTab="opportunities" />
    },
    {
      id: 'history',
      label: 'My Volunteer History',
      icon: <Award className="h-4 w-4" />,
      content: <VolunteerProgramsContent activeTab="history" />
    },
    {
      id: 'organizations',
      label: 'Organizations',
      icon: <Building className="h-4 w-4" />,
      content: <VolunteerProgramsContent activeTab="organizations" />
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Volunteer Programs"
      description="Make a meaningful impact in your community by joining volunteer opportunities that align with your interests and skills. Connect with organizations and track your volunteer journey."
      icon={<Heart className="h-8 w-8" />}
      stats={stats}
      tabs={tabs}
      defaultTab="opportunities"
    />
  );
};

export default VolunteerProgramsPage;
