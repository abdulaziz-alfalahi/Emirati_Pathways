
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, TrendingUp, Award, Users } from 'lucide-react';
import type { CourseEnrollment } from '@/types/lms';

interface LMSStatsOverviewProps {
  enrollments: CourseEnrollment[];
  loading: boolean;
}

export const LMSStatsOverview: React.FC<LMSStatsOverviewProps> = ({ 
  enrollments, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = {
    totalEnrollments: enrollments.length,
    completedCourses: enrollments.filter(e => e.status === 'completed').length,
    activeCourses: enrollments.filter(e => e.status === 'active').length,
    averageProgress: enrollments.length > 0 
      ? enrollments.reduce((acc, e) => acc + e.progress_percentage, 0) / enrollments.length 
      : 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
              <p className="text-lg font-semibold">{stats.totalEnrollments}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Courses</p>
              <p className="text-lg font-semibold">{stats.activeCourses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-lg font-semibold">{stats.completedCourses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
              <p className="text-lg font-semibold">{Math.round(stats.averageProgress)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
