
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Eye, 
  Users, 
  Share, 
  Download, 
  TrendingUp, 
  Calendar,
  Globe,
  MapPin,
  Clock
} from 'lucide-react';

interface PortfolioAnalyticsProps {
  portfolio: any;
}

const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({ portfolio }) => {
  const [timeRange, setTimeRange] = useState('30d');

  // Mock analytics data
  const viewsData = [
    { date: '2024-01-01', views: 45 },
    { date: '2024-01-02', views: 52 },
    { date: '2024-01-03', views: 48 },
    { date: '2024-01-04', views: 61 },
    { date: '2024-01-05', views: 55 },
    { date: '2024-01-06', views: 67 },
    { date: '2024-01-07', views: 71 }
  ];

  const sectionData = [
    { name: 'Projects', views: 420, engagement: 8.5 },
    { name: 'About', views: 380, engagement: 6.2 },
    { name: 'Media Gallery', views: 295, engagement: 9.1 },
    { name: 'Achievements', views: 210, engagement: 5.8 },
    { name: 'Timeline', views: 180, engagement: 4.9 },
    { name: 'Testimonials', views: 145, engagement: 7.3 }
  ];

  const trafficSources = [
    { name: 'Direct', value: 35, color: '#006E6D' },
    { name: 'LinkedIn', value: 28, color: '#4A9B9A' },
    { name: 'Search', value: 20, color: '#79B8B7' },
    { name: 'Social Media', value: 12, color: '#A6CDCC' },
    { name: 'Email', value: 5, color: '#D4E6E5' }
  ];

  const visitorLocations = [
    { country: 'UAE', visitors: 145, percentage: 42 },
    { country: 'Saudi Arabia', visitors: 89, percentage: 26 },
    { country: 'Qatar', visitors: 34, percentage: 10 },
    { country: 'Kuwait', visitors: 28, percentage: 8 },
    { country: 'Bahrain', visitors: 21, percentage: 6 },
    { country: 'Other', visitors: 27, percentage: 8 }
  ];

  const topProjects = [
    { name: 'Dubai Smart City Initiative', views: 234, shares: 18, downloads: 12 },
    { name: 'Financial Technology Platform', views: 187, shares: 15, downloads: 8 },
    { name: 'Sustainability Dashboard', views: 156, shares: 12, downloads: 6 },
    { name: 'Mobile Banking App', views: 134, shares: 9, downloads: 4 },
    { name: 'E-commerce Analytics', views: 98, shares: 7, downloads: 3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Analytics</h2>
          <p className="text-muted-foreground">Track your portfolio performance and visitor engagement</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,923</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">147</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15.7%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Views Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Views</CardTitle>
              <CardDescription>Daily portfolio views over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#006E6D" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Projects</CardTitle>
              <CardDescription>Projects with the highest engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProjects.map((project, index) => (
                  <div key={project.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {project.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share className="h-3 w-3" />
                            {project.shares}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {project.downloads}
                          </span>
                        </div>
                      </div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Performance</CardTitle>
              <CardDescription>Views and engagement by portfolio section</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#006E6D" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={trafficSources}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {trafficSources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {trafficSources.map((source) => (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: source.color }}
                        />
                        <span className="text-sm">{source.name}</span>
                      </div>
                      <span className="text-sm font-medium">{source.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visitor Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Visitor Locations</CardTitle>
                <CardDescription>Geographic distribution of visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visitorLocations.map((location) => (
                    <div key={location.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{location.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${location.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm w-12 text-right">{location.visitors}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>How visitors interact with your portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Average Time on Page</span>
                  </div>
                  <span className="font-medium">2:34</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>Bounce Rate</span>
                  </div>
                  <span className="font-medium">32%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Return Visitors</span>
                  </div>
                  <span className="font-medium">28%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Share className="h-4 w-4 text-muted-foreground" />
                    <span>Social Shares</span>
                  </div>
                  <span className="font-medium">147</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest visitor interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Project downloaded - Dubai Smart City</span>
                    <span className="text-muted-foreground ml-auto">2 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Portfolio shared on LinkedIn</span>
                    <span className="text-muted-foreground ml-auto">5 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>New visitor from Saudi Arabia</span>
                    <span className="text-muted-foreground ml-auto">12 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span>Contact form submitted</span>
                    <span className="text-muted-foreground ml-auto">18 min ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Media gallery viewed</span>
                    <span className="text-muted-foreground ml-auto">25 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioAnalytics;
