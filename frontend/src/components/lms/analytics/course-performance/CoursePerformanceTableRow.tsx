
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CoursePerformance } from './types';

interface CoursePerformanceTableRowProps {
  course: CoursePerformance;
}

export const CoursePerformanceTableRow: React.FC<CoursePerformanceTableRowProps> = ({ course }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCompletionRateBadge = (rate: number) => {
    if (rate >= 85) return 'default';
    if (rate >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{course.courseName}</TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{course.enrollments}</div>
          <div className="text-sm text-muted-foreground">
            {course.completions} completed
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <Badge variant={getCompletionRateBadge(course.completionRate)}>
            {course.completionRate}%
          </Badge>
          <Progress value={course.completionRate} className="h-2" />
        </div>
      </TableCell>
      <TableCell>
        <div className="text-center">
          <div className="font-medium">{course.averageScore}%</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{course.engagementRate}%</div>
          <div className="text-sm text-red-500">
            {course.dropoffRate}% dropoff
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {getTrendIcon(course.trend)}
        </div>
      </TableCell>
    </TableRow>
  );
};
