
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ResumePreview from '../ResumePreview';
import { ResumeData, ResumeTemplate } from '../types';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResumePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResumeData;
  template: ResumeTemplate;
  theme: "classic" | "modern" | "minimalist";
  previewRef: React.RefObject<HTMLDivElement>;
}

const ResumePreviewDialog: React.FC<ResumePreviewDialogProps> = ({
  isOpen,
  onOpenChange,
  data,
  template,
  theme,
  previewRef
}) => {
  const navigate = useNavigate();

  const handleMatchJobs = () => {
    // Close the dialog
    onOpenChange(false);
    // Navigate to the matching page with candidates tab selected
    navigate('/matching?tab=candidates');
  };

  // Ensure data object has all required properties to prevent undefined issues
  const safeData = {
    ...data,
    personal: {
      fullName: data.personal?.fullName || '',
      jobTitle: data.personal?.jobTitle || '',
      email: data.personal?.email || '',
      phone: data.personal?.phone || '',
      location: data.personal?.location || '',
      linkedin: data.personal?.linkedin || '',
      website: data.personal?.website || ''
    },
    summary: data.summary || '',
    experience: data.experience || [],
    education: data.education || [],
    skills: data.skills || [],
    languages: data.languages || [],
    certifications: data.certifications || [],
    projects: data.projects || [],
    interests: data.interests || [],
    metadata: data.metadata || {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Resume Preview</DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-auto max-h-[80vh]">
          <div ref={previewRef} className="resume-preview-wrapper">
            <ResumePreview 
              data={safeData} 
              template={template} 
              theme={theme}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleMatchJobs}
            className="gap-2"
          >
            <Briefcase size={16} />
            Match to Jobs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewDialog;
