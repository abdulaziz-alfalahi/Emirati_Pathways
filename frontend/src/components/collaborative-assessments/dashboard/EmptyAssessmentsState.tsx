
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';

interface EmptyAssessmentsStateProps {
  onCreateAssessment: () => void;
}

export const EmptyAssessmentsState: React.FC<EmptyAssessmentsStateProps> = ({ onCreateAssessment }) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No assessments yet</h3>
            <p className="text-muted-foreground">
              Create your first collaborative assessment to get started.
            </p>
          </div>
          <Button onClick={onCreateAssessment}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
