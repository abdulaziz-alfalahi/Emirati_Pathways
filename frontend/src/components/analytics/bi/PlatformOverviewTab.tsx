
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, TrendingUp, CheckCircle } from 'lucide-react';
import { CrossFilterableChart } from '@/components/analytics/CrossFilterableChart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlatformOverviewTabProps {
  timeRange: string;
  stakeholderView: string;
  selectedPhases: string[];
}

// Mock data - would be fetched from analytics service
const mockPlatformData = [
  { month: 'Jan', users: 2400, activities: 1800, completions: 320 },
  { month: 'Feb', users: 2800, activities: 2200, completions: 380 },
  { month: 'Mar', users: 3200, activities: 2600, completions: 440 },
  { month: 'Apr', users: 3600, activities: 2900, completions: 520 },
  { month: 'May', users: 4100, activities: 3400, completions: 580 },
  { month: 'Jun', users: 4500, activities: 3800, completions: 640 },
];

export const PlatformOverviewTab: React.FC<PlatformOverviewTabProps> = ({
  timeRange,
  stakeholderView,
  selectedPhases
}) => {
  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,547</div>
            <p className="text-xs text-muted-foreground">+15.2% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38,247</div>
            <p className="text-xs text-muted-foreground">+8.7% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72.3%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+23.5% from last period</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Usage Trends</CardTitle>
          <CardDescription>
            User engagement and activity patterns over time ({timeRange})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CrossFilterableChart filterType="time_series">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockPlatformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Active Users"
                />
                <Area 
                  type="monotone" 
                  dataKey="activities" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Activities"
                />
                <Area 
                  type="monotone" 
                  dataKey="completions" 
                  stackId="3" 
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  fillOpacity={0.6}
                  name="Completions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CrossFilterableChart>
        </CardContent>
      </Card>

      {/* Phase Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Phase Distribution</CardTitle>
            <CardDescription>
              User distribution across lifecycle phases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Education</span>
                <span className="text-sm">1,547 users (34%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{width: '34%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Career Development</span>
                <span className="text-sm">1,284 users (28%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{width: '28%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Employment</span>
                <span className="text-sm">1,126 users (25%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{width: '25%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Retirement</span>
                <span className="text-sm">590 users (13%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '13%'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stakeholder Engagement</CardTitle>
            <CardDescription>
              Engagement levels by stakeholder type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Government Services</span>
                <span className="text-sm font-bold text-green-600">95%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Educational Institutions</span>
                <span className="text-sm font-bold text-green-600">87%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Private Employers</span>
                <span className="text-sm font-bold text-yellow-600">72%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Community Organizations</span>
                <span className="text-sm font-bold text-yellow-600">68%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Platform Insights</CardTitle>
          <CardDescription>
            Current activity and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">247</div>
              <div className="text-sm text-blue-700">Active Users Right Now</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">1,456</div>
              <div className="text-sm text-green-700">Actions Completed Today</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">98.7%</div>
              <div className="text-sm text-purple-700">System Uptime (30 days)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
