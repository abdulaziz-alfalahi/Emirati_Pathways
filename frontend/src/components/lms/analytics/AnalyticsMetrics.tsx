
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, Award, Clock } from 'lucide-react';

interface AnalyticsData {
  totalLearners: number;
  activeCoursesCount: number;
  averageCompletionRate: number;
  totalStudyHours: number;
}

interface AnalyticsMetricsProps {
  data: AnalyticsData;
  loading: boolean;
}

export const AnalyticsMetrics: React.FC<AnalyticsMetricsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="h-32">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Learners</p>
              <p className="text-2xl font-bold">{data.totalLearners}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Courses</p>
              <p className="text-2xl font-bold">{data.activeCoursesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Completion</p>
              <p className="text-2xl font-bold">{data.averageCompletionRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Study Hours</p>
              <p className="text-2xl font-bold">{data.totalStudyHours}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
