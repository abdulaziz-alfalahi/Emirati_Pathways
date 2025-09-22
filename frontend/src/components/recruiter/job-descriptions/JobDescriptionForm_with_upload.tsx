import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Corrected import path for useJobDescription based on user's info:
// JobDescriptionForm_with_upload.tsx is in src/components/recruiter/job-descriptions/
// useJobDescription.js is in src/components/job-matching/hooks/
import { useJobDescription } from '../../job-matching/hooks/useJobDescription.js'; 
import { JobDescriptionInput } from '@/components/job-matching/form/JobDescriptionInput';
import { ApiStatusAlerts } from '@/components/job-matching/form/ApiStatusAlerts';
import { ParsedDataForm } from '@/components/job-matching/form/ParsedDataForm';
import { Actions } from '@/components/job-matching/form/Actions';
import { Button } from '@/components/ui/button';

export function JobDescriptionFormWithUpload() {
  const {
    jobDescription,
    setJobDescription,
    parsedData,
    isLoading,
    isUploading, 
    isSaving,
    apiStatus,
    errorMessage,
    manualFields,
    setManualFields,
    handleSubmit, 
    handleFileUpload, 
    handleSaveToDatabase,
    testDatabaseInsert,
    viewSavedJobDescriptions,
  } = useJobDescription();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (handleFileUpload) {
        handleFileUpload(Array.from(files));
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Job Description Parser</CardTitle>
              <CardDescription>
                Parse job descriptions to extract structured information for matching with candidates
              </CardDescription>
            </div>
            <Actions 
              testDatabaseInsert={testDatabaseInsert}
              viewSavedJobDescriptions={viewSavedJobDescriptions}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">Upload Job Description Files</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Upload one or more job description files (e.g., .txt, .pdf, .docx).
            </p>
            <div className="flex gap-4">
              <Button type="button" onClick={triggerFileDialog} variant="outline" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload JD(s)'}
              </Button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              multiple 
              className="hidden" 
              accept=".pdf,.doc,.docx,.txt"
            />
          </div>

          <div className="mb-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-2">Or Paste Job Description Text</h3>
            <JobDescriptionInput
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              handleSubmit={handleSubmit}
              isLoading={isLoading} 
            />
          </div>
          
          <div className="mt-4">
            <ApiStatusAlerts 
              apiStatus={apiStatus} 
              errorMessage={errorMessage} 
            />
          </div>
          
          {parsedData && Object.keys(parsedData).length > 0 && (
            <ParsedDataForm
              parsedData={parsedData}
              manualFields={manualFields}
              setManualFields={setManualFields}
              handleSaveToDatabase={handleSaveToDatabase}
              isSaving={isSaving}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

