
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Clipboard, BarChart4, FileText, Calendar, Users, Activity } from 'lucide-react';
import DashboardActions from '@/components/dashboard/DashboardActions';

const AssessmentTools: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Tools</CardTitle>
        <CardDescription>Quick access to assessment tools and functions</CardDescription>
      </CardHeader>
      <CardContent>
        <DashboardActions 
          actions={[
            { 
              title: "Test Builder", 
              description: "Create custom assessments", 
              icon: Clipboard,
              link: "/assessments"
            },
            { 
              title: "Result Analysis", 
              description: "Review performance data", 
              icon: BarChart4,
              link: "/assessments"
            },
            { 
              title: "Certification Management", 
              description: "Track & issue certificates", 
              icon: FileText 
            },
            { 
              title: "Schedule Assessments", 
              description: "Set dates and venues", 
              icon: Calendar 
            },
            { 
              title: "Candidate Profiles", 
              description: "View candidate information", 
              icon: Users,
              link: "/assessments"
            },
            { 
              title: "Performance Insights", 
              description: "Analytics and trends", 
              icon: Activity,
              link: "/analytics"
            },
            { 
              title: "Document Library", 
              description: "Access shared resources", 
              icon: FileText 
            },
            { 
              title: "Reporting Tools", 
              description: "Generate assessment reports", 
              icon: BarChart4 
            }
          ]}
        />
      </CardContent>
    </Card>
  );
};

export default AssessmentTools;
