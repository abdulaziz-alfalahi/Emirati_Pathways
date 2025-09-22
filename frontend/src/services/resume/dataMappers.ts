
import { ResumeData } from '@/components/resume/types';
import { AffindaResponseData } from './types';

/**
 * Map Affinda API response to ResumeData structure
 */
export const mapAffindaResponseToResumeData = (
  responseData: AffindaResponseData,
  file?: File
): Partial<ResumeData> => {
  // Extract personal information
  const personal = {
    fullName: responseData.name?.raw || responseData.name?.text || '',
    jobTitle: responseData.profession?.raw || responseData.profession?.text || '',
    email: responseData.emails?.[0] || '',
    phone: responseData.phoneNumbers?.[0]?.raw || responseData.phoneNumbers?.[0]?.text || '',
    location: responseData.location?.raw || responseData.location?.text || '',
    linkedin: responseData.linkedin || '',
    website: responseData.websites?.[0] || ''
  };

  // Extract experiences
  const experience = (responseData.workExperience || []).map(exp => ({
    id: crypto.randomUUID(),
    company: exp.organization?.raw || exp.organization?.text || '',
    position: exp.jobTitle?.raw || exp.jobTitle?.text || '',
    location: exp.location?.raw || exp.location?.text || '',
    startDate: exp.dates?.startDate || '',
    endDate: exp.dates?.endDate || null,
    current: exp.dates?.isCurrent || false,
    description: exp.jobDescription || exp.jobDescription?.text || ''
  }));

  // Extract education
  const education = (responseData.education || []).map(edu => ({
    id: crypto.randomUUID(),
    institution: edu.organization?.raw || edu.organization?.text || '',
    degree: edu.accreditation?.education || '',
    field: edu.accreditation?.inputStr || '',
    location: edu.location?.raw || edu.location?.text || '',
    startDate: edu.dates?.startDate || '',
    endDate: edu.dates?.endDate || null,
    current: edu.dates?.isCurrent || false
  }));

  // Extract skills
  const skills = (responseData.skills || []).map(skill => ({
    id: crypto.randomUUID(),
    name: skill.name || '',
    level: ''
  }));

  // Extract languages
  const languages = (responseData.languages || []).map(language => {
    const languageName = typeof language === 'string' ? language : language?.name || '';
    return {
      id: crypto.randomUUID(),
      name: languageName,
      proficiency: 'Conversational'
    };
  });

  // Build metadata
  const metadata = {
    parsingMethod: 'affinda-api',
    parsedAt: new Date().toISOString(),
    fileType: file?.type,
    fileSize: file?.size,
    fileName: file?.name,
    processingId: `affinda_${Date.now()}`
  };

  // Build the resume data
  const resumeData: Partial<ResumeData> = {
    personal,
    summary: responseData.summary?.text || '',
    experience,
    education,
    skills,
    languages,
    certifications: [],
    projects: [],
    metadata
  };

  return resumeData;
};
