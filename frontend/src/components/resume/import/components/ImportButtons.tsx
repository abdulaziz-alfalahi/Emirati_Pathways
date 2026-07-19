
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Image, Linkedin, Upload } from 'lucide-react';

interface ImportButtonsProps {
  onOpenFileImport: () => void;
  onOpenImageImport: () => void;
  onOpenLinkedInImport: () => void;
}

export const ImportButtons: React.FC<ImportButtonsProps> = ({
  onOpenFileImport,
  onOpenImageImport,
  onOpenLinkedInImport
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full" 
        onClick={onOpenFileImport}
      >
        <FileText size={16} className="me-2" />
        Import from File
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full" 
        onClick={onOpenImageImport}
      >
        <Image size={16} className="me-2" />
        Import from Image
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full" 
        onClick={onOpenLinkedInImport}
      >
        <Linkedin size={16} className="me-2" />
        Import from LinkedIn
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full" 
        disabled
      >
        <Upload size={16} className="me-2" />
        More Options
      </Button>
    </div>
  );
};
