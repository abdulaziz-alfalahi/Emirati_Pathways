
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Library, FileText } from 'lucide-react';

interface DashboardHeaderProps {
  onCreateAssessment: () => void;
  onCreateTemplate?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onCreateAssessment,
  onCreateTemplate
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Collaborative Assessments</h1>
        <p className="text-muted-foreground">
          Create, manage, and collaborate on comprehensive assessments
        </p>
      </div>
      
      <div className="flex gap-2">
        {onCreateTemplate && (
          <Button variant="outline" onClick={onCreateTemplate}>
            <FileText className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        )}
        <Button onClick={onCreateAssessment}>
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </Button>
      </div>
    </div>
  );
};
