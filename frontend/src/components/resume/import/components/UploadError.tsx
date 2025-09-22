
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface UploadErrorProps {
  error: string | null;
}

export const UploadError: React.FC<UploadErrorProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-start space-x-2">
      <AlertCircle size={18} className="text-red-500 mt-0.5" />
      <div className="text-sm text-red-700">
        <p className="font-medium mb-1">Error Processing Resume</p>
        <p>{error}</p>
      </div>
    </div>
  );
};
