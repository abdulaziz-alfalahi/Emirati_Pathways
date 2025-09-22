
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ImportAlertProps {
  parsingError: string | null;
  hasCorruptedData: boolean;
  isWordDocument: boolean;
}

export const ImportAlert: React.FC<ImportAlertProps> = ({ 
  parsingError, 
  hasCorruptedData, 
  isWordDocument 
}) => {
  if (!parsingError && !hasCorruptedData) return null;
  
  const errorMessage = parsingError || 
    (isWordDocument 
      ? "We're having trouble parsing your Word document. Word files can sometimes contain formatting that makes extraction difficult. Please save your document as a PDF and try again, or use the Image Upload option for better results."
      : "Your document contains formatting that couldn't be properly parsed. If you're uploading a Word document (.docx), please try saving it as PDF first or use the image upload option for better results."
    );

  return (
    <Alert variant="destructive" className="mb-3">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Document Parsing Issue</AlertTitle>
      <AlertDescription className="text-xs">
        {errorMessage}
      </AlertDescription>
    </Alert>
  );
};
