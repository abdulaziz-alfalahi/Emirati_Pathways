
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Briefcase, Users } from 'lucide-react';
import DashboardActions from '@/components/dashboard/DashboardActions';

const CandidatesTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recruitment Tools</CardTitle>
        <CardDescription>Manage your recruitment activities</CardDescription>
      </CardHeader>
      <CardContent>
        <DashboardActions 
          actions={[
            { title: "Post Job", description: "Create new listings", icon: Briefcase, link: "/job-descriptions" },
            { title: "Job Matching", description: "Find suitable candidates", icon: Users, link: "/matching" },
            { title: "Candidate Search", description: "Find talented candidates", icon: Users },
            { title: "Emiratization Tracker", description: "Monitor compliance", icon: BarChart4 }
          ]}
        />
      </CardContent>
    </Card>
  );
};

export default CandidatesTab;
