
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import DashboardOverview from './DashboardOverview';
import RecommendationsWidget from './RecommendationsWidget';

interface OverviewProps {
  activeRole: string;
}

export const Overview: React.FC<OverviewProps> = ({ activeRole }) => {
  const { user } = useAuth();

  const getMetricsForRole = (role: string) => {
    switch (role) {
      case 'candidate':
        return [
          { title: 'Applications Submitted', value: '12', description: 'This month', change: '+3 from last month' },
          { title: 'Profile Views', value: '48', description: 'By employers', change: '+15% increase' },
          { title: 'Skill Assessments', value: '4', description: 'Completed', change: '2 pending' }
        ];
      case 'candidate':
        return [
          { title: 'Courses Enrolled', value: '6', description: 'This semester', change: '2 in progress' },
          { title: 'Assignments Due', value: '3', description: 'This week', change: '1 overdue' },
          { title: 'Grade Average', value: '88%', description: 'Current GPA', change: '+2% improvement' }
        ];
      default:
        return [
          { title: 'Profile Completion', value: '75%', description: 'Complete your profile', change: '+10% this week' },
          { title: 'Activities', value: '8', description: 'This month', change: '3 pending' },
          { title: 'Connections', value: '24', description: 'Professional network', change: '+5 new' }
        ];
    }
  };

  const metrics = getMetricsForRole(activeRole);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Your personalized dashboard for {activeRole.replace('_', ' ')} activities
        </p>
      </div>

      <DashboardOverview metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationsWidget maxItems={3} />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeRole === 'candidate' && (
                <>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">Update Resume</button>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">Search Jobs</button>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">Practice Interview</button>
                </>
              )}
              {activeRole === 'candidate' && (
                <>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">View Assignments</button>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">Join Study Group</button>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">Schedule Mentoring</button>
                </>
              )}
              {!['candidate', 'candidate'].includes(activeRole) && (
                <>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">Complete Profile</button>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">Explore Opportunities</button>
                  <button className="w-full text-start p-2 hover:bg-muted rounded">Connect with Mentors</button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
