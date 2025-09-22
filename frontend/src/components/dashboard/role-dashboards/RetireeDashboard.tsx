
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BarChart4, BookOpen, Heart, Users } from 'lucide-react';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardActions from '@/components/dashboard/DashboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecommendedJobs } from '@/components/job-matching/RecommendedJobs';

interface RetireeDashboardProps {
  activeTab: string;
}

const RetireeDashboard: React.FC<RetireeDashboardProps> = ({ activeTab }) => (
  <Tabs defaultValue={activeTab} className="space-y-8">
    <TabsList className="mb-4">
      <TabsTrigger value="overview"><Heart className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
      <TabsTrigger value="opportunities"><Award className="h-4 w-4 mr-2" /> Opportunities</TabsTrigger>
      <TabsTrigger value="community"><Users className="h-4 w-4 mr-2" /> Community</TabsTrigger>
    </TabsList>
    
    <TabsContent value="overview" className="space-y-8">
      <DashboardOverview 
        metrics={[
          { title: "Volunteering Roles", value: "8", change: "", description: "Opportunities near you" },
          { title: "Mentorship Programs", value: "5", change: "", description: "Share your expertise" },
          { title: "Community Events", value: "14", change: "", description: "Upcoming this month" }
        ]}
      />
    </TabsContent>
    
    <TabsContent value="opportunities" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Engagement Opportunities</CardTitle>
          <CardDescription>Ways to stay active and contribute to the community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg divide-y">
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Youth Mentorship Program</h3>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Open</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">5 hours/week • Starting next month</p>
            </div>
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Heritage Preservation Project</h3>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Open</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Cultural knowledge sharing • Flexible schedule</p>
            </div>
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Consultation Services</h3>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Open</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Part-time advisory • Knowledge transfer</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <RecommendedJobs limit={3} />
    </TabsContent>
    
    <TabsContent value="community" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Community Involvement</CardTitle>
          <CardDescription>Connect with others and share your experience</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardActions 
            actions={[
              { title: "Volunteer Opportunities", description: "Give back to society", icon: Heart },
              { title: "Knowledge Transfer", description: "Share your expertise", icon: BookOpen },
              { title: "Social Activities", description: "Stay connected", icon: Users },
              { title: "Wellness Programs", description: "Stay active and healthy", icon: BarChart4 }
            ]}
          />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
);

export default RetireeDashboard;
