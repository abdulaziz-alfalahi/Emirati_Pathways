
import { ResumeData, Skill, Experience, Education, Language } from '../types';
import { Personal } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates an empty resume data structure with default values
 */
export const createEmptyResumeData = (): ResumeData => {
  return {
    personal: {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: []
  };
};

/**
 * Validates if resume data has any content
 */
export const hasContent = (resume: Partial<ResumeData>): boolean => {
  // Check personal information
  const personalInfo = resume.personal;
  if (personalInfo) {
    if (
      personalInfo.fullName ||
      personalInfo.jobTitle ||
      personalInfo.email ||
      personalInfo.phone ||
      personalInfo.location ||
      personalInfo.linkedin ||
      personalInfo.website
    ) {
      return true;
    }
  }
  
  // Check other sections
  if (resume.summary && resume.summary.trim() !== '') return true;
  if (resume.experience && resume.experience.length > 0) return true;
  if (resume.education && resume.education.length > 0) return true;
  if (resume.skills && resume.skills.length > 0) return true;
  if (resume.languages && resume.languages.length > 0) return true;
  
  return false;
};

/**
 * Enhance skills array with IDs and default levels
 */
export const enhanceSkills = (skills: (string | Skill)[]): Skill[] => {
  return skills.map(skill => {
    if (typeof skill === 'string') {
      return {
        id: uuidv4(),
        name: skill,
        level: "3" // Default to intermediate level as a string
      };
    }
    // If level is a number, convert it to string
    if (typeof skill.level === 'number') {
      return {
        ...skill,
        level: String(skill.level)
      };
    }
    return skill;
  });
};

/**
 * Merges resume data, with the new data taking precedence
 */
export const mergeResumeData = (
  currentData: ResumeData,
  newData: Partial<ResumeData>
): ResumeData => {
  // Merge personal information
  const mergedPersonal: Personal = {
    ...currentData.personal,
    ...newData.personal
  };

  // Merge arrays carefully to avoid duplicates
  const mergedExperience = mergeArrayById<Experience>(
    currentData.experience || [],
    newData.experience || []
  );
  
  const mergedEducation = mergeArrayById<Education>(
    currentData.education || [],
    newData.education || []
  );

  // For skills and languages, we handle string and object formats
  const currentSkills = currentData.skills || [];
  const newSkills = newData.skills || [];
  const mergedSkills = enhanceSkills([...currentSkills, ...newSkills]);

  const mergedLanguages = mergeArrayById<Language>(
    currentData.languages || [],
    newData.languages || []
  );

  // Return the merged data
  return {
    personal: mergedPersonal,
    summary: newData.summary || currentData.summary || '',
    experience: mergedExperience,
    education: mergedEducation,
    skills: mergedSkills,
    languages: mergedLanguages
  };
};

/**
 * Helper function to merge arrays by ID
 */
function mergeArrayById<T extends { id: string }>(
  currentArray: T[],
  newArray: T[]
): T[] {
  // Create a map of current items by ID
  const currentMap = new Map<string, T>();
  for (const item of currentArray) {
    currentMap.set(item.id, item);
  }
  
  // Add or update with new items
  for (const item of newArray) {
    currentMap.set(item.id, item);
  }
  
  // Convert map back to array
  return Array.from(currentMap.values());
}

/**
 * Normalizes resume data to ensure all required fields exist
 */
export const normalizeResumeData = (data: Partial<ResumeData>): ResumeData => {
  const emptyData = createEmptyResumeData();
  
  // Ensure all skills have proper format
  let normalizedSkills: Skill[] = [];
  if (data.skills && data.skills.length > 0) {
    normalizedSkills = enhanceSkills(data.skills);
  }
  
  return {
    personal: {
      ...emptyData.personal,
      ...data.personal
    },
    summary: data.summary || emptyData.summary,
    experience: data.experience || emptyData.experience,
    education: data.education || emptyData.education,
    skills: normalizedSkills,
    languages: data.languages || emptyData.languages
  };
};
