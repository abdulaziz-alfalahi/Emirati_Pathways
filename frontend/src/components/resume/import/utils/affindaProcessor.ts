import { AffindaAPI, AffindaCredential } from '@affinda/affinda';
import { ResumeData } from '../../types';
import { toast } from 'sonner';
import { ProcessedResult } from './processorTypes';

// Affinda API client initialization
const createAffindaClient = (apiKey?: string) => {
  const key = apiKey || import.meta.env.VITE_AFFINDA_API_KEY || '';
  if (!key) {
    console.warn('No Affinda API key provided');
    return null;
  }
  
  const credential = new AffindaCredential(key);
  return new AffindaAPI(credential);
};

// Map Affinda resume data to our internal format
const mapAffindaDataToResumeData = (affindaData: any): Partial<ResumeData> => {
  try {
    console.log('Mapping Affinda data to resume format:', affindaData);
    
    const data: Partial<ResumeData> = {
      personal: {
        fullName: affindaData.name?.text || '',
        jobTitle: affindaData.profession?.text || affindaData.jobTitle?.text || '',
        email: affindaData.emails?.[0] || '',
        phone: affindaData.phoneNumbers?.[0]?.text || '',
        location: affindaData.location?.text || '',
        linkedin: affindaData.linkedin || '',
        website: affindaData.websites?.[0] || ''
      },
      summary: affindaData.summary?.text || '',
      experience: (affindaData.workExperience || []).map((exp: any) => ({
        id: crypto.randomUUID(),
        company: exp.organization?.text || '',
        position: exp.jobTitle?.text || '',
        location: exp.location?.text || '',
        startDate: exp.dates?.startDate || '',
        endDate: exp.dates?.endDate || '',
        current: Boolean(exp.dates?.isCurrent) || false,
        description: exp.jobDescription?.text || ''
      })),
      education: (affindaData.education || []).map((edu: any) => ({
        id: crypto.randomUUID(),
        institution: edu.organization?.text || '',
        degree: edu.accreditation?.education || '',
        field: edu.accreditation?.inputStr || '',
        location: edu.location?.text || '',
        startDate: edu.dates?.startDate || '',
        endDate: edu.dates?.endDate || '',
        current: Boolean(edu.dates?.isCurrent) || false
      })),
      skills: (affindaData.skills || []).map((skill: any) => ({
        id: crypto.randomUUID(),
        name: skill.name?.text || '',
        level: skill.level || 'intermediate'
      })),
      languages: (affindaData.languages || []).map((lang: any) => ({
        id: crypto.randomUUID(),
        name: lang.name || '',
        proficiency: lang.level || 'conversational'
      }))
    };
    
    // Add metadata
    data.metadata = {
      parsingMethod: 'affinda',
      parsedAt: new Date().toISOString(),
      confidence: affindaData.confidence || 0,
      processingTime: 0 // We'll update this later
    };
    
    return data;
  } catch (error) {
    console.error('Error mapping Affinda data:', error);
    throw new Error('Failed to map Affinda data to resume format');
  }
};

/**
 * Process a resume file using Affinda API
 * @param file File to process
 * @param apiKey Optional Affinda API key
 */
export const processResumeWithAffinda = async (
  file: File,
  apiKey?: string
): Promise<ProcessedResult> => {
  const toastId = toast.loading("Processing with Affinda API", {
    description: "Analyzing your resume document...",
  });
  
  try {
    const client = createAffindaClient(apiKey);
    if (!client) {
      toast.error("Missing API Key", {
        id: toastId,
        description: "Affinda API key is required for resume parsing.",
      });
      throw new Error('Affinda API key is required');
    }
    
    console.log('Uploading resume to Affinda for parsing:', file.name);
    
    // Convert file to format required by Affinda
    const fileBuffer = await file.arrayBuffer();
    const startTime = Date.now();
    
    // Upload and parse resume - removed collection parameter
    const response = await client.createDocument({
      file: Buffer.from(fileBuffer),
      fileName: file.name,
      wait: 'true' // String 'true' as required by Affinda API
    });
    
    console.log('Received Affinda parsing response:', response);
    
    if (!response.data) {
      throw new Error('No data in Affinda response');
    }
    
    // Map Affinda data to our format
    const parsedData = mapAffindaDataToResumeData(response.data);
    
    // Update processing time in metadata
    if (parsedData.metadata) {
      parsedData.metadata.processingTime = Date.now() - startTime;
    }
    
    toast.success("Resume Processed", {
      id: toastId,
      description: "Your resume has been processed successfully.",
    });
    
    return {
      parsedData,
      parsingMethod: 'affinda',
      usedFallback: false,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('Error processing resume with Affinda:', error);
    
    toast.error("Processing Failed", {
      id: toastId,
      description: error instanceof Error ? error.message : "Failed to process with Affinda",
    });
    
    throw new Error(`Affinda processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
