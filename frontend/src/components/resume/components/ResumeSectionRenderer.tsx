
import React from 'react';
import { ResumeData } from '../types';
import ResumePersonalSection from '../sections/ResumePersonalSection';
import ResumeSummarySection from '../sections/ResumeSummarySection';
import ResumeExperienceSection from '../sections/ResumeExperienceSection';
import ResumeEducationSection from '../sections/ResumeEducationSection';
import ResumeSkillsSection from '../sections/ResumeSkillsSection';

interface ResumeSectionRendererProps {
  activeSection: string;
  resumeData: ResumeData;
  onPersonalInfoChange: (personal: ResumeData['personal']) => void;
  onSummaryChange: (summary: string) => void;
  onExperienceChange: (experience: ResumeData['experience']) => void;
  onEducationChange: (education: ResumeData['education']) => void;
  onSkillsChange: (skills: ResumeData['skills']) => void;
  onLanguagesChange: (languages: ResumeData['languages']) => void;
}

const ResumeSectionRenderer: React.FC<ResumeSectionRendererProps> = ({
  activeSection,
  resumeData,
  onPersonalInfoChange,
  onSummaryChange,
  onExperienceChange,
  onEducationChange,
  onSkillsChange,
  onLanguagesChange
}) => {
  switch (activeSection) {
    case "personal":
      return <ResumePersonalSection data={resumeData.personal} onChange={onPersonalInfoChange} />;
    case "summary":
      return <ResumeSummarySection value={resumeData.summary || ""} onChange={onSummaryChange} />;
    case "experience":
      return <ResumeExperienceSection data={resumeData.experience} onChange={onExperienceChange} />;
    case "education":
      return <ResumeEducationSection data={resumeData.education} onChange={onEducationChange} />;
    case "skills":
      return (
        <ResumeSkillsSection 
          skills={resumeData.skills} 
          languages={resumeData.languages}
          onSkillsChange={onSkillsChange}
          onLanguagesChange={onLanguagesChange}
        />
      );
    default:
      return <div>Select a section to edit</div>;
  }
};

export default ResumeSectionRenderer;
