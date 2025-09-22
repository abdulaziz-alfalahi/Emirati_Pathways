
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Program } from '@/types/training-center';

interface DocumentUploadDialogProps {
  program: Program | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (programId: number) => void;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  program,
  open,
  onOpenChange,
  onUpload
}) => {
  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Program Document</DialogTitle>
          <DialogDescription>
            Add documents related to "{program.title}" program.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="document">Select Document</Label>
            <Input id="document" type="file" />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="docType">Document Type</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="curriculum">Curriculum</option>
              <option value="schedule">Schedule</option>
              <option value="materials">Learning Materials</option>
              <option value="assessment">Assessment</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onUpload(program.id)}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;
