
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UploadJobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isUploading: boolean;
}

const UploadJobDialog = ({ 
  isOpen, 
  onOpenChange, 
  onFileUpload, 
  isUploading 
}: UploadJobDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Job Descriptions</DialogTitle>
          <DialogDescription>
            Upload job description files (.txt, .docx, .pdf)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="job-files">Job Description Files</Label>
          <Input
            id="job-files"
            type="file"
            multiple
            accept=".txt,.docx,.pdf"
            onChange={onFileUpload}
            disabled={isUploading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadJobDialog;
