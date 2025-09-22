
import React from 'react';
import { CoachingRecommendation } from '@/types/assessments';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface SessionDetailsDialogProps {
  assignment: CoachingRecommendation;
}

export const SessionDetailsDialog: React.FC<SessionDetailsDialogProps> = ({ assignment }) => {
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Session Details</DialogTitle>
        <DialogDescription>
          Review assessment results for this coaching session
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <h3 className="text-lg font-semibold">Assessment Results</h3>
        {assignment.assessment_sessions?.results ? (
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-sm">
              {JSON.stringify(assignment.assessment_sessions.results, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-muted-foreground">No detailed results available for this assessment.</p>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium">Score</h4>
            <p>{assignment.assessment_sessions?.score !== null 
              ? `${assignment.assessment_sessions?.score}/100` 
              : "Not scored"}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Assessment Type</h4>
            <p>{assignment.assessment_sessions?.assessments?.assessment_type || "Unknown"}</p>
          </div>
        </div>
        
        {assignment.assessment_sessions?.feedback && (
          <div>
            <h4 className="font-medium">Previous Feedback</h4>
            <p className="text-sm">{assignment.assessment_sessions.feedback}</p>
          </div>
        )}
      </div>
    </DialogContent>
  );
};
