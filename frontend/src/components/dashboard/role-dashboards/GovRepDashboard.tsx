
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Briefcase, Landmark, LineChart, PieChart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import DashboardActions from '@/components/dashboard/DashboardActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GovRepDashboardProps {
  activeTab: string;
}

const GovRepDashboard: React.FC<GovRepDashboardProps> = ({ activeTab }) => (
  <Tabs defaultValue={activeTab} className="space-y-8">
    <TabsList className="mb-4">
      <TabsTrigger value="overview"><LineChart className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
      <TabsTrigger value="emiratization"><Users className="h-4 w-4 mr-2" /> Emiratization</TabsTrigger>
      <TabsTrigger value="initiatives"><Landmark className="h-4 w-4 mr-2" /> Initiatives</TabsTrigger>
    </TabsList>
    
    <TabsContent value="overview" className="space-y-8">
      <DashboardOverview 
        metrics={[
          { title: "Emiratization Rate", value: "45%", change: "+2%", description: "Private sector compliance" },
          { title: "Active Initiatives", value: "8", change: "", description: "National employment programs" },
          { title: "Job Openings", value: "230", change: "+15", description: "Available for Emiratis" }
        ]}
      />
    </TabsContent>
    
    <TabsContent value="emiratization" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Emiratization Compliance</CardTitle>
          <CardDescription>Track private sector compliance with Emiratization targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg divide-y">
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Banking & Finance</h3>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">53% Compliance</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Target: 45% • 24 companies monitored</p>
            </div>
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Technology & IT</h3>
                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">37% Compliance</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Target: 40% • 18 companies monitored</p>
            </div>
            <div className="p-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Hospitality & Tourism</h3>
                <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">29% Compliance</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Target: 35% • 31 companies monitored</p>
            </div>
          </div>
          <Button className="w-full mt-4">Generate Compliance Report</Button>
        </CardContent>
      </Card>
    </TabsContent>
    
    <TabsContent value="initiatives" className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Government Initiatives</CardTitle>
          <CardDescription>Manage national employment programs and initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardActions 
            actions={[
              { title: "Nafis Program", description: "Manage salary support", icon: Briefcase },
              { title: "Skills Training", description: "National training programs", icon: Users },
              { title: "Company Compliance", description: "Track Emiratization targets", icon: PieChart },
              { title: "Analytics", description: "Employment statistics", icon: BarChart4 }
            ]}
          />
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
);

export default GovRepDashboard;
