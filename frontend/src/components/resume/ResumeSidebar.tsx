
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Lightbulb, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { ResumeData } from './types';
import ImportOptions from './ImportOptions';

interface ResumeSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  resumeData: ResumeData;
  onImportComplete: (data: ResumeData) => void;
}

const ResumeSidebar: React.FC<ResumeSidebarProps> = ({
  activeSection,
  onSectionChange,
  resumeData,
  onImportComplete
}) => {
  const sections = [
    { id: 'personal', label: 'Personal Info', icon: <User size={16} /> },
    { id: 'summary', label: 'Summary', icon: <FileText size={16} /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase size={16} /> },
    { id: 'education', label: 'Education', icon: <GraduationCap size={16} /> },
    { id: 'skills', label: 'Skills & Languages', icon: <Lightbulb size={16} /> },
  ];

  // Helper function to get completion status
  const getSectionCompletionStatus = (sectionId: string): 'complete' | 'partial' | 'empty' => {
    switch (sectionId) {
      case 'personal':
        const personalFields = Object.values(resumeData.personal).filter(Boolean).length;
        const totalPersonalFields = Object.keys(resumeData.personal).length;
        if (personalFields === 0) return 'empty';
        return personalFields >= totalPersonalFields / 2 ? 'complete' : 'partial';
      
      case 'summary':
        return resumeData.summary && resumeData.summary.length > 10 ? 'complete' : 'empty';
      
      case 'experience':
        return resumeData.experience.length > 0 ? 'complete' : 'empty';
      
      case 'education':
        return resumeData.education.length > 0 ? 'complete' : 'empty';
      
      case 'skills':
        const hasSkills = resumeData.skills.length > 0;
        const hasLanguages = resumeData.languages.length > 0;
        if (!hasSkills && !hasLanguages) return 'empty';
        return hasSkills && hasLanguages ? 'complete' : 'partial';
      
      default:
        return 'empty';
    }
  };

  return (
    <div className="w-64 border-r bg-muted/40 p-4 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Import Options</h3>
        <ImportOptions 
          onImportComplete={onImportComplete} 
          currentData={resumeData} 
        />
      </div>
      
      <Separator className="my-4" />
      
      <div className="mb-2">
        <h3 className="text-sm font-medium">Resume Sections</h3>
        <p className="text-xs text-muted-foreground">
          Complete all sections for best results
        </p>
      </div>
      
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-1">
          {sections.map((section) => {
            const status = getSectionCompletionStatus(section.id);
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start relative"
                onClick={() => onSectionChange(section.id)}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
                
                {/* Status indicator */}
                <div className="ml-auto flex items-center">
                  {status === 'complete' && (
                    <div className="w-2 h-2 rounded-full bg-green-500" title="Complete" />
                  )}
                  {status === 'partial' && (
                    <div className="w-2 h-2 rounded-full bg-amber-500" title="Partially complete" />
                  )}
                  {activeSection === section.id && (
                    <ChevronRight size={14} className="ml-1" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="mt-auto pt-4">
        <div className="text-xs text-muted-foreground">
          <p className="mb-1">Resume completion:</p>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div 
              className="bg-primary rounded-full h-2" 
              style={{ 
                width: `${calculateCompletionPercentage(resumeData)}%` 
              }}
            />
          </div>
          <p>{calculateCompletionPercentage(resumeData)}% complete</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate overall completion percentage
const calculateCompletionPercentage = (data: ResumeData): number => {
  let totalPoints = 0;
  let earnedPoints = 0;
  
  // Personal info (max 7 points)
  const personalFields = Object.values(data.personal).filter(Boolean).length;
  totalPoints += 7;
  earnedPoints += personalFields;
  
  // Summary (max 5 points)
  totalPoints += 5;
  if (data.summary) {
    const summaryLength = data.summary.length;
    earnedPoints += Math.min(5, Math.floor(summaryLength / 20));
  }
  
  // Experience (max 15 points, 5 per experience up to 3)
  totalPoints += 15;
  const experiencePoints = Math.min(3, data.experience.length) * 5;
  earnedPoints += experiencePoints;
  
  // Education (max 10 points, 5 per education up to 2)
  totalPoints += 10;
  const educationPoints = Math.min(2, data.education.length) * 5;
  earnedPoints += educationPoints;
  
  // Skills (max 5 points, 1 per skill up to 5)
  totalPoints += 5;
  const skillsPoints = Math.min(5, data.skills.length);
  earnedPoints += skillsPoints;
  
  // Languages (max 3 points, 1 per language up to 3)
  totalPoints += 3;
  const languagesPoints = Math.min(3, data.languages.length);
  earnedPoints += languagesPoints;
  
  return Math.round((earnedPoints / totalPoints) * 100);
};

export default ResumeSidebar;
