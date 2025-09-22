
import React from 'react';
import { CoachingRecommendation } from '@/types/assessments';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignmentsList } from './AssignmentsList';

interface DashboardTabsProps {
  upcomingAssignments: CoachingRecommendation[];
  pastAssignments: CoachingRecommendation[];
  openDialogId: string | null;
  onOpenChange: (id: string | null) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ 
  upcomingAssignments,
  pastAssignments,
  openDialogId,
  onOpenChange
}) => {
  return (
    <Tabs defaultValue="upcoming" className="space-y-4">
      <TabsList>
        <TabsTrigger value="upcoming">
          Upcoming ({upcomingAssignments.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          Past ({pastAssignments.length})
        </TabsTrigger>
      </TabsList>
      
      <AssignmentsList 
        assignments={upcomingAssignments} 
        openDialogId={openDialogId}
        onOpenChange={onOpenChange}
      />
      
      <AssignmentsList 
        assignments={pastAssignments}
        isPast={true}
        openDialogId={openDialogId}
        onOpenChange={onOpenChange}
      />
    </Tabs>
  );
};
