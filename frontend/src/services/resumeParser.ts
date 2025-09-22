
import { AffindaAPI, AffindaCredential } from '@affinda/affinda';
import { ResumeData, Experience, Education, Skill } from '../components/resume/types';

// Initialize the client with proper credential handling
const getAffindaClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_AFFINDA_API_KEY || 'YOUR_API_KEY';
  const credential = new AffindaCredential(apiKey);
  return new AffindaAPI(credential);
};

/**
 * Parse resume using Affinda API
 * @param file Resume file to parse
 * @returns Promise resolving to parsed ResumeData
 */
export async function parseResumeWithAffinda(file: File): Promise<Partial<ResumeData>> {
  try {
    // Get client with proper credentials
    const client = getAffindaClient();
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Call Affinda API - removed collection parameter
    const response = await client.createDocument({
      file: Buffer.from(fileBuffer),
      fileName: file.name,
      wait: 'true' // Using string instead of boolean for Affinda API
    });
    
    console.log('Affinda response:', response.data);
    const data = response.data as any; // Use 'any' to avoid type errors
    
    // Map Affinda response to your ResumeData structure
    const resumeData: Partial<ResumeData> = {
      personal: {
        fullName: data.name?.raw || '',
        jobTitle: data.profession || '',
        email: data.emails?.[0] || '',
        phone: data.phoneNumbers?.[0] || '',
        location: data.location?.raw || '',
        linkedin: data.linkedin || '',
        website: data.websites?.[0] || ''
      },
      summary: data.summary || '',
      experience: (data.workExperience || []).map((exp: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        company: exp.organization || '',
        position: exp.jobTitle || '',
        location: exp.location?.raw || '',
        startDate: exp.dates?.startDate || '',
        endDate: exp.dates?.endDate || null,
        current: exp.dates?.isCurrent || false,
        description: exp.jobDescription || ''
      })),
      education: (data.education || []).map((edu: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        institution: edu.organization || '',
        degree: edu.accreditation?.education || '',
        field: edu.accreditation?.inputStr || '',
        location: edu.location?.raw || '',
        startDate: edu.dates?.startDate || '',
        endDate: edu.dates?.endDate || null,
        current: edu.dates?.isCurrent || false
      })),
      skills: (data.skills || []).map((skill: any) => ({
        name: skill.name,
        level: ''
      })),
      languages: (data.languages || []).map((lang: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: lang,
        proficiency: 'Conversational'
      })),
      metadata: {
        parsingMethod: 'affinda-api',
        parsedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
        fileName: file.name,
        processingTime: 0, // Will be updated later
        processingId: `affinda_${Date.now()}`
      }
    };
    
    return resumeData;
  } catch (error) {
    console.error('Error parsing resume with Affinda:', error);
    throw new Error(`Resume parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
