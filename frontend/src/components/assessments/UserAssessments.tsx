
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchUserAssessmentSessions } from '@/services/assessments/sessionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssessmentSession, AssessmentType } from '@/types/assessments';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, Clock, Award, AlertCircle } from 'lucide-react';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500/10 text-blue-500';
    case 'completed':
      return 'bg-green-500/10 text-green-500';
    case 'in_progress':
      return 'bg-amber-500/10 text-amber-500';
    case 'cancelled':
      return 'bg-red-500/10 text-red-500';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

const getAssessmentTypeIcon = (type: AssessmentType) => {
  switch (type) {
    case 'skills':
      return <Badge className="bg-blue-500/10 text-blue-500 border-none">Skills</Badge>;
    case 'behaviors':
      return <Badge className="bg-green-500/10 text-green-500 border-none">Behaviors</Badge>;
    case 'capabilities':
      return <Badge className="bg-purple-500/10 text-purple-500 border-none">Capabilities</Badge>;
    default:
      return null;
  }
};

export const UserAssessments = () => {
  const { user } = useAuth();

  const { data: assessmentSessions = [], isLoading } = useQuery({
    queryKey: ['user-assessments', user?.id],
    queryFn: () => user ? fetchUserAssessmentSessions(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Assessments</CardTitle>
          <CardDescription>Please sign in to view your assessment schedule</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Assessments</CardTitle>
        <CardDescription>Your scheduled and completed assessments</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : assessmentSessions.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/40">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">No assessments scheduled</h3>
            <p className="text-muted-foreground mt-1">
              You haven't scheduled any assessments yet
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentSessions.map((session: AssessmentSession) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {session.assessments?.title || 'Unknown Assessment'}
                  </TableCell>
                  <TableCell>
                    {session.assessments?.assessment_type && 
                      getAssessmentTypeIcon(session.assessments.assessment_type)}
                  </TableCell>
                  <TableCell>
                    {session.scheduled_date ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {format(new Date(session.scheduled_date), 'MMM d, yyyy')}
                      </div>
                    ) : 'Not scheduled'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {session.score !== null ? (
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                        {session.score}/100
                      </div>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
