
import React from 'react';
import { CoachingRecommendation } from '@/types/assessments';
import { AssignmentCard } from './AssignmentCard';
import { TabsContent } from '@/components/ui/tabs';

interface AssignmentsListProps {
  assignments: CoachingRecommendation[];
  isPast?: boolean;
  openDialogId: string | null;
  onOpenChange: (id: string | null) => void;
}

export const AssignmentsList: React.FC<AssignmentsListProps> = ({ 
  assignments, 
  isPast = false,
  openDialogId,
  onOpenChange
}) => {
  return (
    <TabsContent value={isPast ? "past" : "upcoming"} className="space-y-4">
      {assignments.map((assignment) => (
        <AssignmentCard 
          key={assignment.id}
          assignment={assignment}
          isPast={isPast}
          openDialogId={openDialogId}
          onOpenChange={onOpenChange}
        />
      ))}
      
      {assignments.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          You don't have any {isPast ? "past" : "upcoming"} coaching sessions.
        </p>
      )}
    </TabsContent>
  );
};
