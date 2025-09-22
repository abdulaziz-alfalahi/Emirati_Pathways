import { ResumeData, Personal } from '../../../types';
import { supabase } from '@/integrations/supabase/client';
import { isEmptyResumeData, sanitizeResumeData } from '../../helpers/validation';
import { toast } from 'sonner';

interface EdgeFunctionError {
  message: string;
  status?: number;
  context?: any;
}

interface EdgeFunctionResponse {
  error: EdgeFunctionError | null;
  data?: Partial<ResumeData>;
  [key: string]: any;
}

export const processWithEdgeFunction = async (
  imageData: string,
  file: File,
  startTime: number
): Promise<{ parsedData: Partial<ResumeData>; success: boolean; error?: Error }> => {
  try {
    console.log(`Processing ${file.type} with size ${file.size} using Edge Function...`);
    
    console.log('Edge function request details:', {
      fileType: file.type,
      fileSize: file.size,
      fileName: file.name,
      imageDataLength: imageData.length,
      imageDataPrefix: imageData.substring(0, 50) + '...'
    });
    
    const apiPromise = supabase.functions.invoke<EdgeFunctionResponse>('extract-resume-from-image', {
      body: { 
        imageData,
        fileName: file.name,
        fileType: file.type 
      },
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Edge function processing timed out after 50 seconds')), 50000);
    });
    
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    if (response.error) {
      console.error('Resume image extraction error:', response.error);
      
      console.error('Edge function error details:', {
        message: response.error.message,
        status: response.error.status,
        context: response.error.context
      });
      
      if (file.type === 'application/pdf' && 
          response.error.message && 
          response.error.message.includes('Invalid MIME type')) {
        
        console.log('PDF format not supported by image API. Providing guidance to user...');
        toast.error("PDF Format Not Supported", {
          description: "Our AI vision service doesn't accept PDFs directly. Please convert your PDF to JPG or PNG first.",
          duration: 8000
        });
        
        throw new Error("PDF format not directly supported by our image AI. Please convert your PDF to JPG or PNG first.");
      }
      
      throw new Error(`Image extraction failed: ${response.error.message}`);
    }
    
    const extractedData = response.data as Partial<ResumeData>;
    
    console.log('Edge function response:', {
      success: true,
      dataReceived: !!extractedData,
      dataKeys: extractedData ? Object.keys(extractedData) : [],
      processingTime: Date.now() - startTime
    });
    
    if (!extractedData) {
      throw new Error('No data returned from image extraction service');
    }
    
    console.log('Image extraction successful');
    console.log('Raw data from edge function:', JSON.stringify(extractedData, null, 2));
    
    const sanitizedData = sanitizeResumeData(extractedData);
    console.log('Sanitized data:', JSON.stringify(sanitizedData, null, 2));
    
    if (isEmptyResumeData(sanitizedData)) {
      console.warn('Extracted data appears empty after sanitization, but proceeding anyway');
      console.log('Original data keys:', Object.keys(extractedData));
      console.log('Sanitized data keys:', Object.keys(sanitizedData));
      
      const emptyPersonalInfo: Personal = {
        fullName: "",
        jobTitle: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: ""
      };
      
      if (!sanitizedData.personal) sanitizedData.personal = emptyPersonalInfo;
      if (!sanitizedData.experience) sanitizedData.experience = [];
      if (!sanitizedData.education) sanitizedData.education = [];
      if (!sanitizedData.skills) sanitizedData.skills = [];
      
      toast.warning("Limited Data Extracted", {
        description: "We could only extract limited information. You may need to fill in some details manually.",
        duration: 8000
      });
    } else {
      console.log('Data validation passed successfully');
    }
    
    sanitizedData.metadata = {
      ...(sanitizedData.metadata || {}),
      parsingMethod: 'image-edge-function',
      parsedAt: new Date().toISOString(),
      fileType: file.type,
      fileSize: file.size,
      processingTime: Date.now() - startTime
    };
    
    return { parsedData: sanitizedData, success: true };
  } catch (error) {
    console.error('Error in edge function processor:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      fileType: file.type,
      fileSize: file.size,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime
    };
    
    console.error('Error details:', errorDetails);
    
    return { 
      parsedData: {}, 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
};
