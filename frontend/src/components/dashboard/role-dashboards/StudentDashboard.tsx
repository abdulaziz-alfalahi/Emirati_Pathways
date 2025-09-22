
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Target, 
  Award, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  Clock,
  Star,
  Users,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { RecommendedJobs } from '@/components/job-matching/RecommendedJobs';
import AIRecommendations from '@/components/dashboard/AIRecommendations';

interface StudentDashboardProps {
  activeTab: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab }) => {
  const quickStats = [
    { label: 'Applications Submitted', value: '5', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
    { label: 'Interviews Scheduled', value: '2', icon: <Calendar className="h-4 w-4" />, color: 'text-blue-600' },
    { label: 'Skills Assessments', value: '3', icon: <Target className="h-4 w-4" />, color: 'text-purple-600' },
    { label: 'Networking Events', value: '1', icon: <Users className="h-4 w-4" />, color: 'text-orange-600' },
  ];

  const upcomingDeadlines = [
    { title: 'Emirates Scholarship Application', date: '2024-02-15', type: 'scholarship' },
    { title: 'Summer Internship at ADNOC', date: '2024-02-20', type: 'internship' },
    { title: 'Digital Skills Assessment', date: '2024-02-25', type: 'assessment' },
  ];

  const recentActivities = [
    { action: 'Applied for Software Developer position', time: '2 hours ago', type: 'application' },
    { action: 'Completed JavaScript Skills Assessment', time: '1 day ago', type: 'assessment' },
    { action: 'Joined Dubai Tech Networking Group', time: '3 days ago', type: 'networking' },
    { action: 'Updated resume with new project', time: '1 week ago', type: 'profile' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{deadline.title}</p>
                        <p className="text-xs text-muted-foreground">Due: {deadline.date}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {deadline.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <RecommendedJobs limit={3} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <AIRecommendations />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5" />
                  Skills Development
                </CardTitle>
                <CardDescription>Track your skill progression</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>JavaScript</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>React</span>
                      <span>70%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Analysis</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Achievements
                </CardTitle>
                <CardDescription>Your recent accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Assessment Completed</p>
                      <p className="text-xs text-muted-foreground">JavaScript Skills Assessment</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Course Completed</p>
                      <p className="text-xs text-muted-foreground">Advanced React Development</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">23</p>
                  <p className="text-sm text-muted-foreground">Available positions</p>
                  <Button size="sm" className="mt-2">Explore Jobs</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Training
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">12</p>
                  <p className="text-sm text-muted-foreground">Training programs</p>
                  <Button size="sm" className="mt-2">View Training</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Scholarships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">8</p>
                  <p className="text-sm text-muted-foreground">Open scholarships</p>
                  <Button size="sm" className="mt-2">Apply Now</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
