
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface CreateAssessmentDialogProps {
  onOpenChange?: (open: boolean) => void;
}

const CreateAssessmentDialog: React.FC<CreateAssessmentDialogProps> = ({
  onOpenChange
}) => {
  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Assessment</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Assessment creation form would go here</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssessmentDialog;
