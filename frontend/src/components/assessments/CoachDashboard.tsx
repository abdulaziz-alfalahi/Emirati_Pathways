
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCoachAssignments } from '@/services/assessmentService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from './coach-dashboard/LoadingState';
import { ErrorState } from './coach-dashboard/ErrorState';
import { EmptyState } from './coach-dashboard/EmptyState';
import { DashboardTabs } from './coach-dashboard/DashboardTabs';

export const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = React.useState<string | null>(null);

  // Query to fetch coach assignments
  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['coach-assignments', user?.id],
    queryFn: () => user?.id ? fetchCoachAssignments(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  if (!assignments || assignments.length === 0) {
    return <EmptyState />;
  }

  // Group assignments by date
  const today = new Date();
  const upcomingAssignments = assignments.filter(
    a => a.scheduled_date && new Date(a.scheduled_date) >= today
  );
  const pastAssignments = assignments.filter(
    a => a.scheduled_date && new Date(a.scheduled_date) < today
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coach Dashboard</CardTitle>
        <CardDescription>Manage your coaching sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <DashboardTabs 
          upcomingAssignments={upcomingAssignments}
          pastAssignments={pastAssignments}
          openDialogId={openDialog}
          onOpenChange={setOpenDialog}
        />
      </CardContent>
    </Card>
  );
};
