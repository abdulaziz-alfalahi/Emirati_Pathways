
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart4, BookOpen, Briefcase, User, Users } from 'lucide-react';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardActions from '@/components/dashboard/DashboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DefaultDashboardProps {
  userRole: string;
  activeTab: string;
}

const DefaultDashboard: React.FC<DefaultDashboardProps> = ({ userRole, activeTab }) => {
  // Map of role keys to display names
  const roleLabels: {[key: string]: string} = {
    school_student: 'School Student',
    national_service_participant: 'National Service Participant', 
    university_student: 'University Student',
    intern: 'Internship Trainee',
    full_time_employee: 'Full-Time Employee',
    part_time_employee: 'Part-Time Employee',
    gig_worker: 'Gig Worker',
    jobseeker: 'Jobseeker',
    lifelong_learner: 'Lifelong Learner',
    entrepreneur: 'Entrepreneur',
    retiree: 'Retiree',
    educational_institution: 'Educational Institution',
    parent: 'Parent',
    private_sector_recruiter: 'Private Sector Recruiter',
    government_representative: 'Government Representative',
    retiree_advocate: 'Retiree Advocate',
    training_center: 'Training Center',
    assessment_center: 'Assessment Center',
    mentor: 'Mentor',
    career_advisor: 'Career Advisor',
    platform_operator: 'Platform Operator',
    administrator: 'Administrator',
    super_user: 'Super User'
  };

  return (
    <Tabs defaultValue={activeTab} className="space-y-8">
      <TabsList className="mb-4">
        <TabsTrigger value="overview"><User className="h-4 w-4 me-2" /> Overview</TabsTrigger>
        <TabsTrigger value="journey"><BarChart4 className="h-4 w-4 me-2" /> Journey</TabsTrigger>
        <TabsTrigger value="resources"><BookOpen className="h-4 w-4 me-2" /> Resources</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-8">
        <Alert className="mb-8">
          <User className="h-4 w-4" />
          <AlertTitle className="font-semibold">Welcome to your {roleLabels[userRole] || userRole} Dashboard!</AlertTitle>
          <AlertDescription>
            This is your personalized dashboard. More features specific to your role will be available soon.
          </AlertDescription>
        </Alert>
        
        <DashboardOverview 
          metrics={[
            { title: "Journey Status", value: roleLabels[userRole] || userRole, change: "", description: "Your current position" },
            { title: "Recommended Services", value: "5", change: "", description: "Based on your role" },
            { title: "Network", value: "0", change: "", description: "Your professional connections" }
          ]}
        />
      </TabsContent>
      
      <TabsContent value="journey" className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Career Journey</CardTitle>
            <CardDescription>Track your progress and plan your next steps</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <div className="absolute start-0 top-0 h-full w-1 bg-gray-200"></div>
              
              <div className="relative ps-8 pb-8">
                <div className="absolute start-0 top-0 h-4 w-4 rounded-full bg-emirati-teal"></div>
                <h3 className="font-medium text-lg">Education</h3>
                <p className="text-sm text-muted-foreground">Completed primary and secondary education</p>
              </div>
              
              <div className="relative ps-8 pb-8">
                <div className="absolute start-0 top-0 h-4 w-4 rounded-full bg-emirati-teal"></div>
                <h3 className="font-medium text-lg">Current: {roleLabels[userRole] || userRole}</h3>
                <p className="text-sm text-muted-foreground">You are here in your journey</p>
              </div>
              
              <div className="relative ps-8">
                <div className="absolute start-0 top-0 h-4 w-4 rounded-full bg-gray-300"></div>
                <h3 className="font-medium text-lg text-muted-foreground">Next Steps</h3>
                <p className="text-sm text-muted-foreground">Set your goals and plan your career path</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="resources" className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Available Tools</CardTitle>
            <CardDescription>Services and resources for you</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardActions 
              actions={[
                { title: "Career Planning", description: "Explore opportunities", icon: Briefcase },
                { title: "Skill Development", description: "Enhance your skills", icon: BookOpen },
                { title: "Mentorship", description: "Connect with mentors", icon: Users },
                { title: "Networking", description: "Build relationships", icon: Users }
              ]}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default DefaultDashboard;
