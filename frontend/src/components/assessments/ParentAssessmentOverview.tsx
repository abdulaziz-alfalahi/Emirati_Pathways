
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserAssessmentSessions } from '@/services/assessmentService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ParentAssessmentOverviewProps {
  childId: string;
  childName: string;
}

export const ParentAssessmentOverview: React.FC<ParentAssessmentOverviewProps> = ({
  childId,
  childName
}) => {
  const { data: assessmentSessions, isLoading, error } = useQuery({
    queryKey: ['child-assessments', childId],
    queryFn: () => fetchUserAssessmentSessions(childId),
    enabled: !!childId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{childName}'s Assessments</CardTitle>
          <CardDescription>Error loading assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            There was an error loading the assessment data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!assessmentSessions || assessmentSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{childName}'s Assessments</CardTitle>
          <CardDescription>No assessments found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {childName} hasn't taken any assessments yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group assessments by status
  const completedAssessments = assessmentSessions.filter(
    session => session.status === 'completed'
  );
  const upcomingAssessments = assessmentSessions.filter(
    session => session.status === 'scheduled'
  );
  const inProgressAssessments = assessmentSessions.filter(
    session => session.status === 'in_progress'
  );

  // Get coaching recommendations
  const recommendedCoaching = assessmentSessions.filter(
    session => session.coaching_recommended
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{childName}'s Assessments</CardTitle>
        <CardDescription>Track your child's assessment progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coaching Recommendations Section */}
        {recommendedCoaching.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 me-2 text-primary" />
              Coaching Recommendations
            </h3>
            <div className="space-y-3">
              {recommendedCoaching.map(session => (
                <div key={`coaching-${session.id}`} className="p-3 border rounded-lg bg-primary/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{session.assessments?.title || "Assessment"}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {session.coaching_notes || "Coaching recommended based on assessment results"}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary">Recommended</Badge>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" variant="default">Schedule Coaching</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Assessments */}
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Calendar className="h-5 w-5 me-2 text-blue-500" />
            Upcoming Assessments
          </h3>
          {upcomingAssessments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAssessments.map(session => (
                <div key={`upcoming-${session.id}`} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{session.assessments?.title || "Assessment"}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Type: {session.assessments?.assessment_type || "Unknown"}
                      </p>
                    </div>
                    <Badge>Scheduled</Badge>
                  </div>
                  {session.scheduled_date && (
                    <div className="flex items-center mt-3 text-sm">
                      <Clock className="h-4 w-4 me-1 text-muted-foreground" />
                      <span>{format(new Date(session.scheduled_date), 'PPP p')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No upcoming assessments scheduled</p>
          )}
        </div>

        {/* Completed Assessments */}
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 me-2 text-green-500" />
            Completed Assessments
          </h3>
          {completedAssessments.length > 0 ? (
            <div className="space-y-3">
              {completedAssessments.map(session => (
                <div key={`completed-${session.id}`} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{session.assessments?.title || "Assessment"}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {session.completed_date && (
                          <span>Completed on {format(new Date(session.completed_date), 'PPP')}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-end">
                      {session.score !== null ? (
                        <span className="text-lg font-bold">{session.score}/100</span>
                      ) : (
                        <Badge variant="outline">No Score</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No completed assessments</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
