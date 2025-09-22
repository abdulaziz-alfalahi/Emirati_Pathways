
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Briefcase, Calendar, Clock, User, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DashboardActions from '@/components/dashboard/DashboardActions';

const InterviewsTab: React.FC = () => {
  return (
    <>
      <UpcomingInterviewsCard />
      <InterviewToolsCard />
    </>
  );
};

// Helper component for Upcoming Interviews card
const UpcomingInterviewsCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Upcoming Interviews</CardTitle>
      <CardDescription>Your scheduled candidate interviews</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="border rounded-lg divide-y">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">Technical Interview - Frontend Developer</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Today, 2:00 PM
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> 45 minutes
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" /> Ahmed Hassan
                </div>
              </div>
            </div>
            <Link to="/career-advisory/interviews">
              <Button size="sm" variant="outline">Join</Button>
            </Link>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">Behavioral Interview - Project Manager</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Tomorrow, 10:30 AM
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> 60 minutes
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" /> Sara Al Mahmoud
                </div>
              </div>
            </div>
            <Link to="/career-advisory/interviews">
              <Button size="sm" variant="outline">View Details</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center pt-2">
        <Link to="/career-advisory/interviews/schedule">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule New Interview
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

// Helper component for Interview Tools card
const InterviewToolsCard: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Interview Tools</CardTitle>
      <CardDescription>Access your interview resources</CardDescription>
    </CardHeader>
    <CardContent>
      <DashboardActions 
        actions={[
          { 
            title: "Schedule Interview", 
            description: "Set up new interviews", 
            icon: Calendar, 
            link: "/career-advisory/interviews/schedule" 
          },
          { 
            title: "Video Interviews", 
            description: "Conduct online interviews", 
            icon: Video, 
            link: "/career-advisory/interviews" 
          },
          { 
            title: "Interview Templates", 
            description: "Standardized questions", 
            icon: Briefcase 
          },
          { 
            title: "Assessment Reports", 
            description: "View candidate results", 
            icon: BarChart4 
          }
        ]}
      />
    </CardContent>
  </Card>
);

export default InterviewsTab;
