
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, PlayCircle, CheckCircle2, Award } from 'lucide-react';
import type { CourseEnrollment } from '@/types/lms';

interface ProgressTrackerProps {
  enrollment: CourseEnrollment;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ enrollment }) => {
  // Mock course data since we don't have the full course details in enrollment
  const mockCourse = {
    id: enrollment.course_id,
    title: 'Course Title',
    description: 'Course description will be loaded from the database',
    thumbnail_url: null,
    category: 'Technical',
    duration_hours: 10
  };
  
  if (!mockCourse) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Course information not available</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (enrollment.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 me-1" />Completed</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800"><PlayCircle className="h-3 w-3 me-1" />In Progress</Badge>;
      case 'suspended':
        return <Badge variant="secondary">Suspended</Badge>;
      default:
        return <Badge variant="outline">Enrolled</Badge>;
    }
  };

  const handleContinueLearning = () => {
    // Navigate to course content
    window.location.href = `/lms/courses/${mockCourse.id}`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{mockCourse.title}</CardTitle>
            <CardDescription className="mt-1">{mockCourse.description}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {mockCourse.thumbnail_url && (
          <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
            <img
              src={mockCourse.thumbnail_url}
              alt={mockCourse.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center">
            <Clock className="h-4 w-4 me-1" />
            {mockCourse.duration_hours ? `${mockCourse.duration_hours}h` : 'Self-paced'}
          </span>
          <Badge variant="outline">{mockCourse.category}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Progress</span>
            <span>{enrollment.progress_percentage}%</span>
          </div>
          <Progress value={enrollment.progress_percentage} className="w-full" />
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
          </div>
          <div className="flex gap-2">
            {enrollment.status === 'completed' && enrollment.certificate_issued_at && (
              <Button variant="outline" size="sm">
                <Award className="h-4 w-4 me-2" />
                View Certificate
              </Button>
            )}
            <Button size="sm" onClick={handleContinueLearning}>
              {enrollment.status === 'completed' ? 'Review Course' : 'Continue Learning'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
