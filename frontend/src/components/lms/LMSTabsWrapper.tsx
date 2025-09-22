
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CoursesList } from './CoursesList';
import { ProgressTracker } from './ProgressTracker';
import { CourseCreator } from './CourseCreator';
import { LearningAnalyticsDashboard } from './analytics/LearningAnalyticsDashboard';
import { GamificationDashboard } from './gamification/GamificationDashboard';
import { BookOpen, Play, Award, Plus, BarChart3, Trophy } from 'lucide-react';
import type { CourseEnrollment } from '@/types/lms';

interface LMSTabsWrapperProps {
  user: any;
  isInstructor: boolean;
  enrollments: CourseEnrollment[];
  enrolledCourseIds: string[];
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const LMSTabsWrapper: React.FC<LMSTabsWrapperProps> = ({
  user,
  isInstructor,
  enrollments,
  enrolledCourseIds,
  loading,
  activeTab,
  setActiveTab
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="overflow-x-auto mb-8">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-white border min-w-max">
          <TabsTrigger value="browse" className="flex items-center gap-2 text-ehrdc-teal whitespace-nowrap">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">All Courses</span>
          </TabsTrigger>
          
          {user && (
            <TabsTrigger value="my-courses" className="flex items-center gap-2 text-ehrdc-teal whitespace-nowrap">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">My Courses</span>
            </TabsTrigger>
          )}
          
          {user && (
            <TabsTrigger value="completed" className="flex items-center gap-2 text-ehrdc-teal whitespace-nowrap">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Certificates</span>
            </TabsTrigger>
          )}
          
          {user && (
            <TabsTrigger value="gamification" className="flex items-center gap-2 text-ehrdc-teal whitespace-nowrap">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
          )}
          
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-ehrdc-teal whitespace-nowrap">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          
          {isInstructor && (
            <TabsTrigger value="create" className="flex items-center gap-2 text-ehrdc-teal whitespace-nowrap">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Course</span>
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <TabsContent value="browse">
        <Card>
          <CardContent className="p-6">
            <CoursesList 
              showEnrollButton={true}
              userEnrollments={enrolledCourseIds}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {user && (
        <TabsContent value="my-courses">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">My Courses</h2>
                  <p className="text-muted-foreground mb-6">
                    Track your progress and continue learning
                  </p>
                </div>
                {loading ? (
                  <div className="text-center">Loading your courses...</div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses enrolled</h3>
                    <p className="text-muted-foreground">
                      Browse our course catalog to start learning
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {enrollments.map(enrollment => (
                      <ProgressTracker key={enrollment.id} enrollment={enrollment} />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {user && (
        <TabsContent value="completed">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Certificates</h2>
                  <p className="text-muted-foreground mb-6">
                    View and download your earned certificates
                  </p>
                </div>
                {enrollments.filter(e => e.status === 'completed').length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
                    <p className="text-muted-foreground">
                      Complete courses to earn certificates
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {enrollments
                      .filter(enrollment => enrollment.status === 'completed')
                      .map(enrollment => (
                        <ProgressTracker key={enrollment.id} enrollment={enrollment} />
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {user && (
        <TabsContent value="gamification">
          <GamificationDashboard />
        </TabsContent>
      )}

      <TabsContent value="analytics">
        <LearningAnalyticsDashboard />
      </TabsContent>

      {isInstructor && (
        <TabsContent value="create">
          <CourseCreator />
        </TabsContent>
      )}
    </Tabs>
  );
};
