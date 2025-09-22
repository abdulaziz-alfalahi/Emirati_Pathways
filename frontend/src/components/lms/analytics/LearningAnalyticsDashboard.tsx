
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, BookOpen, Award, Clock, Target } from 'lucide-react';

export const LearningAnalyticsDashboard: React.FC = () => {
  // Mock analytics data - in real app, this would come from API
  const analytics = {
    totalCourses: 45,
    enrolledStudents: 2847,
    completionRate: 78,
    certificatesIssued: 1234,
    averageTime: 15.5,
    skillsAcquired: 89
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    description: string;
    icon: React.ReactNode;
    trend?: string;
  }> = ({ title, value, description, icon, trend }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center text-xs text-green-600 mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-ehrdc-teal to-ehrdc-light-teal rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">Learning Analytics Dashboard</h1>
        <p className="text-xl opacity-90 mb-6">
          Track your learning progress and discover insights about your educational journey.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Courses"
          value={analytics.totalCourses}
          description="Available courses"
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
          trend="+12% from last month"
        />
        <StatCard
          title="Enrolled Students"
          value={analytics.enrolledStudents.toLocaleString()}
          description="Active learners"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend="+8% from last month"
        />
        <StatCard
          title="Completion Rate"
          value={`${analytics.completionRate}%`}
          description="Course completion"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          trend="+5% from last month"
        />
        <StatCard
          title="Certificates Issued"
          value={analytics.certificatesIssued.toLocaleString()}
          description="Total certifications"
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
          trend="+15% from last month"
        />
        <StatCard
          title="Average Study Time"
          value={`${analytics.averageTime}h`}
          description="Per week per user"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Skills Acquired"
          value={analytics.skillsAcquired}
          description="New skills learned"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend="+22% from last month"
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Popular Course Categories</CardTitle>
            <CardDescription>Most enrolled course categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Technical', percentage: 35, count: 987 },
                { category: 'Professional', percentage: 28, count: 765 },
                { category: 'Leadership', percentage: 22, count: 543 },
                { category: 'Language', percentage: 15, count: 321 }
              ].map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-ehrdc-teal rounded-full"></div>
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-ehrdc-teal h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>Your recent learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Personal Analytics</h3>
                <p className="text-muted-foreground">
                  Sign in to view your personalized learning analytics and progress tracking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
