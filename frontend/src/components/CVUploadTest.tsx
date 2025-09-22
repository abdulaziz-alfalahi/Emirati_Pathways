import React from 'react';
import CVUpload from './candidate/CVUpload';

interface ParsedCVData {
  name: string;
  email: string;
  phone: string;
  experience: string;
  skills: string[];
  education: string;
  summary: string;
  languages: string[];
  certifications: string[];
}

const CVUploadTest: React.FC = () => {
  const handleUploadComplete = (data: ParsedCVData) => {
    console.log('Upload completed:', data);
    alert('CV Upload completed! Check console for details.');
  };

  const handleParsingComplete = (data: ParsedCVData) => {
    console.log('Parsing completed:', data);
    alert('CV Parsing completed! Check console for details.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CV Upload Test Page
          </h1>
          <p className="text-gray-600">
            Test the CV upload and parsing functionality
          </p>
        </div>
        
        <CVUpload 
          onUploadComplete={handleUploadComplete}
          onParsingComplete={handleParsingComplete}
          className="max-w-4xl mx-auto"
        />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This is a test page for the CV Upload component. 
            Check the browser console for detailed logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CVUploadTest;
