
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Briefcase, Building, Lightbulb, LineChart, Users } from 'lucide-react';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardActions from '@/components/dashboard/DashboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EntrepreneurDashboardProps {
  activeTab: string;
}

const EntrepreneurDashboard: React.FC<EntrepreneurDashboardProps> = ({ activeTab }) => (
  <Tabs defaultValue={activeTab} className="space-y-8">
    <TabsList className="mb-4">
      <TabsTrigger value="overview"><Building className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
      <TabsTrigger value="opportunities"><Lightbulb className="h-4 w-4 mr-2" /> Opportunities</TabsTrigger>
      <TabsTrigger value="resources"><LineChart className="h-4 w-4 mr-2" /> Resources</TabsTrigger>
    </TabsList>
    
    <TabsContent value="overview" className="space-y-8">
      <DashboardOverview 
        metrics={[
          { title: "Startup Growth", value: "+18%", change: "", description: "Year-over-year business growth" },
          { title: "Funding Opportunities", value: "12", change: "", description: "Available grants and investments" },
          { title: "Networking Events", value: "5", change: "", description: "Upcoming this month" }
        ]}
      />
    </TabsContent>
    
    <TabsContent value="opportunities" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Business Opportunities</CardTitle>
          <CardDescription>Discover growth and funding opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg divide-y">
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">UAE Innovation Grant</h3>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Open</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Up to AED 500,000 • Deadline in 45 days</p>
            </div>
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Dubai SME Accelerator</h3>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Open</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Mentorship & AED 250,000 • Applications closing soon</p>
            </div>
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Abu Dhabi Investment Round</h3>
                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Coming Soon</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Series A funding • Opens in 14 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
    
    <TabsContent value="resources" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Entrepreneurial Resources</CardTitle>
          <CardDescription>Access tools and support for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardActions 
            actions={[
              { title: "Business Plan Builder", description: "Create professional plans", icon: Building },
              { title: "Investor Connect", description: "Meet potential investors", icon: Users },
              { title: "Market Research", description: "Access market insights", icon: BarChart4 },
              { title: "Mentorship Program", description: "Connect with industry experts", icon: Briefcase }
            ]}
          />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
);

export default EntrepreneurDashboard;
