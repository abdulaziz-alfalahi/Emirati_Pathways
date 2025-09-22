
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ResumeData } from '../types';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (data: ResumeData) => void;
}

export const ImageImportDialog: React.FC<ImageImportDialogProps> = ({ 
  open, 
  onOpenChange, 
  onImportComplete 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>)  => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Show loading toast
    const toastId = toast.loading("Processing your resume...", {
      id: "resume-processing",
      duration: 60000 // 60 seconds timeout
    });
    
    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      
      console.log('Calling parse-resume edge function with file:', file.name, file.type);
      
      // Call the Edge Function for processing
      const response = await supabase.functions.invoke('parse-resume', {
        body: {
          fileData,
          fileName: file.name,
          fileType: file.type
        }
      });
      
      // Dismiss loading toast
      toast.dismiss(toastId);
      
      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(response.error.message || 'Failed to parse resume');
      }
      
      console.log('Resume parsed successfully:', response.data ? 'Data received' : 'No data');
      
      if (!response.data) {
        throw new Error('No data returned from resume parser');
      }
      
      // Handle the parsed data - making sure we have a complete ResumeData structure
      // Create default empty values for required fields to satisfy TypeScript
      const defaultData: ResumeData = {
        personal: {
          fullName: '',
          jobTitle: '',
          email: '',
          phone: '',
          location: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        languages: [],
        certifications: [],
        projects: [],
        metadata: {
          parsedAt: new Date().toISOString(),
          parsingMethod: 'affinda-api'
        }
      };
      
      const parsedData = {
        ...defaultData,
        ...(response.data as Partial<ResumeData>),
        // Make sure personal has at least the required fields
        personal: {
          ...defaultData.personal,
          ...(response.data.personal || {})
        }
      };
      
      // Call the onImportComplete callback with the parsed data
      onImportComplete(parsedData);
      
      // Close the dialog
      onOpenChange(false);
      
      toast.success("Resume Imported", {
        description: "Your resume has been successfully imported.",
      });
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(toastId);
      
      console.error('Error uploading resume:', error);
      
      toast.error("Import Failed", {
        description: error instanceof Error ? error.message : "Failed to import resume. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload an image of your resume, and we'll extract the information automatically.
          </p>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="resume-image" className="text-sm font-medium">Resume Image</Label>
            <input
              id="resume-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="cursor-pointer file:mr-4 file:cursor-pointer file:border-0 file:bg-primary file:py-2 file:px-4 file:text-white hover:file:bg-primary/90"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WEBP and PDF formats
            </p>
          </div>
          {isUploading && (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="ml-2 text-sm">Processing image...</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
