
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, Image, Linkedin } from 'lucide-react';
import { ResumeData } from '../types';
import { ImageImportDialog } from './ImageImportDialog';
import FileImportDialog from './FileImportDialog';

interface ImportOptionsProps {
  onImportComplete: (data: ResumeData) => void;
  currentData: ResumeData;
}

const ImportOptions: React.FC<ImportOptionsProps> = ({
  onImportComplete,
  currentData
}) => {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  const handleImageImport = () => {
    setIsImageDialogOpen(true);
  };

  const handleFileUpload = () => {
    setIsFileDialogOpen(true);
  };

  const handleLinkedInImport = () => {
    // Placeholder for LinkedIn import functionality
    alert('LinkedIn import not implemented yet');
  };

  return (
    <div className="space-y-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full justify-start"
        onClick={handleFileUpload}
      >
        <FileUp size={16} className="mr-2" />
        Upload Resume File
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full justify-start"
        onClick={handleImageImport}
      >
        <Image size={16} className="mr-2" />
        Import from Image
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full justify-start"
        onClick={handleLinkedInImport}
      >
        <Linkedin size={16} className="mr-2" />
        Import from LinkedIn
      </Button>

      <ImageImportDialog 
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        onImportComplete={onImportComplete}
      />
      
      <FileImportDialog
        open={isFileDialogOpen}
        onOpenChange={setIsFileDialogOpen}
        onImportComplete={onImportComplete}
        currentData={currentData}
      />
    </div>
  );
};

export default ImportOptions;
