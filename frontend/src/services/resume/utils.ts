
import { ResumeData } from '@/components/resume/types';

/**
 * Merge new resume data with existing data
 * @param currentData Current resume data
 * @param newData New parsed resume data to merge
 * @returns Merged resume data
 */
export const mergeResumeData = (
  currentData: ResumeData,
  newData: Partial<ResumeData>
): ResumeData => {
  const merged: ResumeData = {
    ...currentData,
    ...newData,
    // Deep merge for nested objects and arrays
    personal: {
      ...currentData.personal,
      ...(newData.personal || {})
    },
    // Prefer new data for these fields if they exist and have content
    experience: newData.experience?.length ? newData.experience : currentData.experience,
    education: newData.education?.length ? newData.education : currentData.education,
    skills: newData.skills?.length ? newData.skills : currentData.skills,
    languages: newData.languages?.length ? newData.languages : currentData.languages,
    certifications: newData.certifications?.length ? newData.certifications : currentData.certifications,
    projects: newData.projects?.length ? newData.projects : currentData.projects,
    // Merge metadata
    metadata: {
      ...(currentData.metadata || {}),
      ...(newData.metadata || {}),
      lastMerged: new Date().toISOString()
    }
  };

  return merged;
};
