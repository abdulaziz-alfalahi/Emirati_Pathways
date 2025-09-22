
import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, Star, BookOpen } from 'lucide-react';
import type { Course } from '@/types/lms';

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  onView?: (courseId: string) => void;
  isEnrolled?: boolean;
  showEnrollButton?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = React.memo(({
  course,
  onEnroll,
  onView,
  isEnrolled = false,
  showEnrollButton = true
}) => {
  const handleEnroll = useCallback(() => {
    onEnroll?.(course.id);
  }, [onEnroll, course.id]);

  const handleView = useCallback(() => {
    onView?.(course.id);
  }, [onView, course.id]);

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        {course.thumbnail_url && (
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-3">
              {course.description}
            </CardDescription>
          </div>
          {course.is_featured && (
            <Badge variant="secondary" className="ml-2">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <CourseBadges category={course.category} difficultyLevel={course.difficulty_level} />

        <CourseMetrics durationHours={course.duration_hours} />

        {course.price > 0 && (
          <div className="text-lg font-semibold">
            {course.currency} {course.price}
          </div>
        )}

        <CourseActions
          isEnrolled={isEnrolled}
          showEnrollButton={showEnrollButton}
          onEnroll={handleEnroll}
          onView={handleView}
        />
      </CardContent>
    </Card>
  );
});

CourseCard.displayName = 'CourseCard';

interface CourseBadgesProps {
  category: string;
  difficultyLevel: string;
}

const CourseBadges: React.FC<CourseBadgesProps> = React.memo(({ category, difficultyLevel }) => (
  <div className="flex flex-wrap gap-2">
    <Badge variant="outline">{category}</Badge>
    <Badge variant="outline">{difficultyLevel}</Badge>
  </div>
));

CourseBadges.displayName = 'CourseBadges';

interface CourseMetricsProps {
  durationHours?: number;
}

const CourseMetrics: React.FC<CourseMetricsProps> = React.memo(({ durationHours }) => (
  <div className="flex items-center justify-between text-sm text-muted-foreground">
    {durationHours && (
      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-1" />
        {durationHours}h
      </div>
    )}
    <div className="flex items-center">
      <BookOpen className="h-4 w-4 mr-1" />
      Course
    </div>
  </div>
));

CourseMetrics.displayName = 'CourseMetrics';

interface CourseActionsProps {
  isEnrolled: boolean;
  showEnrollButton: boolean;
  onEnroll: () => void;
  onView: () => void;
}

const CourseActions: React.FC<CourseActionsProps> = React.memo(({
  isEnrolled,
  showEnrollButton,
  onEnroll,
  onView
}) => (
  <div className="flex gap-2">
    <Button 
      variant="outline" 
      className="flex-1"
      onClick={onView}
    >
      View Details
    </Button>
    {showEnrollButton && !isEnrolled && (
      <Button 
        className="flex-1"
        onClick={onEnroll}
      >
        Enroll Now
      </Button>
    )}
    {isEnrolled && (
      <Button 
        variant="secondary"
        className="flex-1"
        onClick={onView}
      >
        Continue Learning
      </Button>
    )}
  </div>
));

CourseActions.displayName = 'CourseActions';
