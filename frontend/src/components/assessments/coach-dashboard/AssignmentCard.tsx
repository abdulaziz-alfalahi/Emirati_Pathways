
import React from 'react';
import { CoachingRecommendation } from '@/types/assessments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { SessionDetailsDialog } from './SessionDetailsDialog';

interface AssignmentCardProps {
  assignment: CoachingRecommendation;
  isPast?: boolean;
  openDialogId: string | null;
  onOpenChange: (id: string | null) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ 
  assignment, 
  isPast = false,
  openDialogId,
  onOpenChange
}) => {
  return (
    <div 
      key={assignment.id} 
      className={`p-4 border rounded-lg bg-background ${isPast ? 'opacity-80' : 'hover:bg-accent/5 transition-colors'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">
          {assignment.assessment_sessions?.assessments?.title || "Coaching Session"}
        </h3>
        <Badge variant={isPast ? "outline" : "default"}>
          {isPast ? "Completed" : "Upcoming"}
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
        {assignment.scheduled_date && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{format(new Date(assignment.scheduled_date), isPast ? 'PPP' : 'PPP p')}</span>
          </div>
        )}
        
        {!isPast && assignment.assessment_sessions?.assessments?.assessment_type && (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Assessment Type: {assignment.assessment_sessions.assessments.assessment_type}</span>
          </div>
        )}
      </div>

      {!isPast && (
        <Dialog 
          open={openDialogId === assignment.id} 
          onOpenChange={(open) => onOpenChange(open ? assignment.id : null)}
        >
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="mr-2">
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </DialogTrigger>
          <SessionDetailsDialog assignment={assignment} />
        </Dialog>
      )}
      
      {isPast ? (
        <Button size="sm" variant="outline">View Notes</Button>
      ) : (
        <Button size="sm">
          Prepare Session
        </Button>
      )}
    </div>
  );
};
