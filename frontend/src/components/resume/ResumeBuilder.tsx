
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeTemplate, ResumeData } from './types';
import ResumeSidebar from './ResumeSidebar';
import { useAuth } from "@/context/AuthContext";
import { useResume } from "@/context/ResumeContext";

// Import our new components
import ResumeBuilderHeader from './components/ResumeBuilderHeader';
import ResumePreviewDialog from './components/ResumePreviewDialog';
import ResumeSectionRenderer from './components/ResumeSectionRenderer';
import { useResumeOperations } from './hooks/useResumeOperations';

interface ResumeBuilderProps {
  template: ResumeTemplate;
  onBack: () => void;
  initialData?: ResumeData | null;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ 
  template, 
  onBack, 
  initialData 
}) => {
  const { user } = useAuth();
  const { resumeData, setResumeData, updateResumeSection } = useResume();
  
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [resumeTheme, setResumeTheme] = useState<"classic" | "modern" | "minimalist">("classic");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Use our new hook for resume operations
  const { 
    saveResume, 
    exportToPdf, 
    isSaving, 
    isExporting 
  } = useResumeOperations({
    resumeData,
    template,
    resumeTheme
  });

  // Use initialData only for first load if needed
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setResumeData(initialData);
    }
  }, [initialData, setResumeData]);

  // Handler functions
  const handlePersonalInfoChange = (personal: ResumeData['personal']) => {
    updateResumeSection('personal', personal);
  };

  const handleSummaryChange = (summary: string) => {
    updateResumeSection('summary', summary);
  };

  const handleExperienceChange = (experience: ResumeData['experience']) => {
    updateResumeSection('experience', experience);
  };

  const handleEducationChange = (education: ResumeData['education']) => {
    updateResumeSection('education', education);
  };

  const handleSkillsChange = (skills: ResumeData['skills']) => {
    updateResumeSection('skills', skills);
  };

  const handleLanguagesChange = (languages: ResumeData['languages']) => {
    updateResumeSection('languages', languages);
  };

  const handleExportPdf = () => {
    exportToPdf(previewRef, setIsPreviewOpen);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with action buttons */}
      <ResumeBuilderHeader
        onBack={onBack}
        onPreview={() => setIsPreviewOpen(true)}
        onExport={handleExportPdf}
        onSave={saveResume}
        isExporting={isExporting}
        isSaving={isSaving}
      />
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <ResumeSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          resumeData={resumeData}
          onImportComplete={setResumeData}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <Card>
            <CardContent className="p-6">
              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills & Languages</TabsTrigger>
                </TabsList>
                <TabsContent value={activeSection} className="mt-0">
                  <ResumeSectionRenderer
                    activeSection={activeSection}
                    resumeData={resumeData}
                    onPersonalInfoChange={handlePersonalInfoChange}
                    onSummaryChange={handleSummaryChange}
                    onExperienceChange={handleExperienceChange}
                    onEducationChange={handleEducationChange}
                    onSkillsChange={handleSkillsChange}
                    onLanguagesChange={handleLanguagesChange}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Resume preview dialog */}
      <ResumePreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        data={resumeData}
        template={template}
        theme={resumeTheme}
        previewRef={previewRef}
      />
    </div>
  );
};

export default ResumeBuilder;
