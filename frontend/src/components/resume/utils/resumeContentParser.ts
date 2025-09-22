
import { ResumeData } from '../types';
import { extractPersonalInfo } from './parsers/personalParser';
import { extractExperience } from './parsers/experienceParser';
import { extractEducation } from './parsers/educationParser';
import { extractSkills } from './parsers/skillsParser';
import { extractLanguages } from './parsers/languagesParser';

// Preprocess the content to make it more parseable
const preprocessContent = (content: string): string => {
  return content
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    // Replace multiple newlines with a single newline
    .replace(/\n+/g, '\n')
    // Remove PDF artifacts like page numbers
    .replace(/Page \d+ of \d+/gi, '')
    // Clean up common resume headers/footers
    .replace(/curriculum vitae|resume|cv/gi, '')
    // Normalize bullet points
    .replace(/[•◦◘○●]/g, '•')
    // Add newlines before section headers to help with section detection
    .replace(/([^\n])(work experience|education|skills|languages|certifications|projects)/gi, '$1\n\n$2')
    // Add a newline before bullet points if there isn't one
    .replace(/([^\n])([•\-\*])/g, '$1\n$2')
    // Trim each line
    .split('\n').map(line => line.trim()).join('\n')
    // Remove empty lines
    .replace(/\n+/g, '\n');
};

// Extract data from file content based on file type
export const extractDataFromContent = (content: string, fileType: string): Partial<ResumeData> => {
  // Preprocess content first
  const processedContent = preprocessContent(content);
  
  const parsedData: Partial<ResumeData> = {
    personal: { 
      fullName: '', 
      jobTitle: '', 
      email: '', 
      phone: '', 
      location: '',
      linkedin: '', // Added the missing linkedin property
      website: ''  // Added the missing website property
    },
    experience: [],
    education: [],
    skills: [],
    languages: []
  };
  
  console.log('Extracting data from resume content...');
  
  // Extract personal information
  parsedData.personal = extractPersonalInfo(processedContent);
  console.log('Extracted personal info:', JSON.stringify(parsedData.personal));
  
  // Extract experience
  parsedData.experience = extractExperience(processedContent);
  console.log(`Extracted ${parsedData.experience.length} experiences`);
  
  // Extract education
  parsedData.education = extractEducation(processedContent);
  console.log(`Extracted ${parsedData.education.length} education entries`);
  
  // Extract skills
  parsedData.skills = extractSkills(processedContent);
  console.log(`Extracted ${parsedData.skills.length} skills`);
  
  // Extract languages
  parsedData.languages = extractLanguages(processedContent);
  console.log(`Extracted ${parsedData.languages.length} languages`);
  
  return parsedData;
};
