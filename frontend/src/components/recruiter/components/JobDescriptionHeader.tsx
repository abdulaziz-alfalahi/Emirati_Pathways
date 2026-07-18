import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UploadCloud } from 'lucide-react'; // Added UploadCloud for variety

interface JobDescriptionHeaderProps {
  onOpenCreateDialog: () => void;
  onOpenUploadDialog: () => void;
}

const JobDescriptionHeader = ({ onOpenCreateDialog, onOpenUploadDialog }: JobDescriptionHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Job Descriptions</h2>
        <p className="text-muted-foreground">Manage and post job openings</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onOpenCreateDialog}>
          <Plus className="me-2 h-4 w-4" /> Create Job Manually
        </Button>
        <Button variant="outline" onClick={onOpenUploadDialog}>
          <UploadCloud className="me-2 h-4 w-4" /> 
          Upload a JD
        </Button>
        <Button variant="outline" onClick={onOpenUploadDialog}> 
          <UploadCloud className="me-2 h-4 w-4" />
          Upload a Batch of JDs
        </Button>
      </div>
    </div>
  );
};

export default JobDescriptionHeader;

