
/**
 * Data validator module for enhanced resume parsing
 * Validates and structures resume data
 */
import { ResumeData, Skill, Experience, Education, Language } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Data validation and structuring functions
export const validateResumeData = (data: Partial<ResumeData>): { valid: boolean; missing: string[]; warnings: string[] } => {
  const validation = {
    valid: true,
    missing: [] as string[],
    warnings: [] as string[]
  };

  // Check required personal fields
  if (!data.personal?.fullName) {
    validation.missing.push('Full Name');
    validation.valid = false;
  }
  
  if (!data.personal?.email) {
    validation.warnings.push('Email not found');
  }
  
  if (!data.personal?.phone) {
    validation.warnings.push('Phone number not found');
  }

  // Check if there's no experience
  if (!data.experience || data.experience.length === 0) {
    validation.warnings.push('No work experience found');
  }
  
  // Check if there's no education
  if (!data.education || data.education.length === 0) {
    validation.warnings.push('No education found');
  }
  
  // Check if there's no skills
  if (!data.skills || data.skills.length === 0) {
    validation.warnings.push('No skills found');
  }

  return validation;
};

export const structureResumeData = (rawData: Partial<ResumeData>): Partial<ResumeData> => {
  // Create a structured copy
  const structuredData: Partial<ResumeData> = { ...rawData };
  
  // Ensure all arrays are initialized
  structuredData.experience = structuredData.experience || [];
  structuredData.education = structuredData.education || [];
  structuredData.skills = structuredData.skills || [];
  structuredData.languages = structuredData.languages || [];
  structuredData.certifications = structuredData.certifications || [];
  
  // Ensure all experience entries have IDs
  structuredData.experience = structuredData.experience.map(exp => ({
    ...exp,
    id: exp.id || uuidv4()
  }));
  
  // Ensure all education entries have IDs
  structuredData.education = structuredData.education.map(edu => ({
    ...edu,
    id: edu.id || uuidv4()
  }));
  
  // Ensure all skill entries have IDs and levels
  structuredData.skills = (structuredData.skills as Array<Skill>).map(skill => ({
    ...skill,
    id: skill.id || uuidv4(),
    level: skill.level || 'intermediate'
  }));
  
  // Ensure all language entries have IDs and proficiency
  structuredData.languages = structuredData.languages.map(lang => ({
    ...lang,
    id: lang.id || uuidv4(),
    proficiency: lang.proficiency || 'conversational'
  }));
  
  // Ensure all certification entries have IDs
  if (structuredData.certifications) {
    structuredData.certifications = structuredData.certifications.map(cert => ({
      ...cert,
      id: cert.id || uuidv4()
    }));
  }
  
  // Ensure personal information is complete
  if (structuredData.personal) {
    structuredData.personal = {
      fullName: structuredData.personal.fullName || '',
      jobTitle: structuredData.personal.jobTitle || '',
      email: structuredData.personal.email || '',
      phone: structuredData.personal.phone || '',
      location: structuredData.personal.location || '',
      linkedin: structuredData.personal.linkedin || '',
      website: structuredData.personal.website || '',
      ...structuredData.personal
    };
  }
  
  return structuredData;
};
