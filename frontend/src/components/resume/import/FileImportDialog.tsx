
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { ResumeData } from '../types';
import { FileInput } from './components/FileInput';
import { UploadError } from './components/UploadError';
import { useFileUpload } from './hooks/useFileUpload';

interface FileImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (data: ResumeData) => void;
  onError?: (error: Error) => void;
  currentData: ResumeData;
}

const FileImportDialog: React.FC<FileImportDialogProps> = ({ 
  open, 
  onOpenChange, 
  onImportComplete,
  onError,
  currentData 
}) => {
  const {
    isUploading,
    uploadError,
    selectedFile,
    fileInputRef,
    handleFileChange,
    handleFileUpload,
  } = useFileUpload({
    onImportComplete,
    onError,
    currentData
  });

  const handleSubmit = async () => {
    try {
      const success = await handleFileUpload();
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error in file upload submit:", error);
      // Error is already handled in the useFileUpload hook
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from File</DialogTitle>
          <DialogDescription>
            Upload your resume to import your professional information.
            Supported formats include PDF, DOCX, TXT, and RTF.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <UploadError error={uploadError} />
          
          <FileInput 
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <div className="flex justify-between">
            <Button 
              variant="ghost" 
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            
            {selectedFile && (
              <Button 
                variant="default" 
                onClick={handleSubmit}
                disabled={isUploading}
              >
                <FileUp size={16} className="mr-2" />
                {isUploading ? "Processing..." : "Import Resume"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileImportDialog;
