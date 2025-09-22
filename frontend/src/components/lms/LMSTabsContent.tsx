
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, TrendingUp } from 'lucide-react';
import { CoursesList } from '@/components/lms/CoursesList';
import { CourseCreator } from '@/components/lms/CourseCreator';
import { ProgressTracker } from '@/components/lms/ProgressTracker';
import { LearningAnalyticsDashboard } from '@/components/lms/analytics/LearningAnalyticsDashboard';
import { GamificationDashboard } from '@/components/lms/gamification/GamificationDashboard';
import type { CourseEnrollment } from '@/types/lms';

interface LMSTabsContentProps {
  user: any;
  isInstructor: boolean;
  enrollments: CourseEnrollment[];
  enrolledCourseIds: string[];
  loading: boolean;
  setActiveTab: (tab: string) => void;
}

export const LMSTabsContent: React.FC<LMSTabsContentProps> = ({
  user,
  isInstructor,
  enrollments,
  enrolledCourseIds,
  loading,
  setActiveTab
}) => {
  console.log('LMSTabsContent: Rendering with props:', {
    user: !!user,
    isInstructor,
    enrollmentsCount: enrollments.length,
    enrolledCourseIdsCount: enrolledCourseIds.length,
    loading
  });

  try {
    return (
      <>
        <TabsContent value="browse">
          <CoursesList 
            showEnrollButton={!!user}
            userEnrollments={enrolledCourseIds}
          />
        </TabsContent>

        {user && (
          <TabsContent value="my-courses">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">My Enrolled Courses</h2>
                <Button onClick={() => setActiveTab('browse')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll in More Courses
                </Button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="h-64">
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses enrolled yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Start your learning journey by enrolling in courses
                    </p>
                    <Button onClick={() => setActiveTab('browse')}>
                      Browse Courses
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {enrollments.map(enrollment => (
                    <ProgressTracker
                      key={enrollment.id}
                      enrollment={enrollment}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {user && (
          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress Overview</CardTitle>
                <CardDescription>
                  Track your learning journey and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Detailed Progress Analytics</h3>
                  <p className="text-muted-foreground">
                    Advanced progress tracking and analytics coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {user && (
          <TabsContent value="analytics">
            <LearningAnalyticsDashboard />
          </TabsContent>
        )}

        {user && (
          <TabsContent value="gamification">
            <GamificationDashboard />
          </TabsContent>
        )}

        {isInstructor && (
          <TabsContent value="create">
            <CourseCreator />
          </TabsContent>
        )}
      </>
    );
  } catch (error) {
    console.error('LMSTabsContent: Error rendering:', error);
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Error Loading Content</h3>
            <p className="text-muted-foreground">
              There was an error loading the LMS content. Please refresh the page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
};
