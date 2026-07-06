import { ResumeData } from "@/components/resume/types";
import { toast } from "sonner";
import { createAffindaClient } from "./affindaClient";
import { getAffindaApiKey } from "./apiKeyService";
import { mapAffindaResponseToResumeData } from "./dataMappers";
import { AffindaResponseData, ParsingResult } from "./types";
import { saveResumeToSupabase } from "./storageService";

// --- BEGIN MODIFICATION: Added for Local Flask API ---
const FLASK_API_BASE_URL = import.meta.env.VITE_FLASK_API_BASE_URL;
console.log("[parseService.ts] Top-level: VITE_FLASK_API_BASE_URL =", FLASK_API_BASE_URL);

export const parseResumeWithLocalApi = async (
  file: File
): Promise<Partial<ResumeData>> => {
  console.log("[parseService.ts] parseResumeWithLocalApi: Entered function.");
  if (!FLASK_API_BASE_URL) {
    console.error("[parseService.ts] parseResumeWithLocalApi: Flask API base URL is not configured. VITE_FLASK_API_BASE_URL is missing or empty.");
    throw new Error("Flask API base URL is not configured. Please set VITE_FLASK_API_BASE_URL in your .env file.");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log(`[parseService.ts] parseResumeWithLocalApi: Attempting to parse resume with Local Flask API: ${file.name} at ${FLASK_API_BASE_URL}/parse_resume`);
    const response = await fetch(`${FLASK_API_BASE_URL}/parse_resume`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorDetails = "Failed to parse response from API";
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || JSON.stringify(errorData);
        console.error("[parseService.ts] parseResumeWithLocalApi: Error response from Local Flask API:", errorData);
      } catch (e) {
        errorDetails = await response.text();
        console.error("[parseService.ts] parseResumeWithLocalApi: Non-JSON error response from Local Flask API:", errorDetails);
      }
      throw new Error(`Resume parsing failed with status ${response.status}: ${errorDetails}`);
    }

    const parsedData = await response.json();
    console.log("[parseService.ts] parseResumeWithLocalApi: Local Flask API response successfully received and parsed:", parsedData);
    return parsedData as Partial<ResumeData>; 

  } catch (error) {
    console.error("[parseService.ts] parseResumeWithLocalApi: Exception during call to Local Flask API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Resume parsing call failed: ${errorMessage}`);
  }
};
// --- END MODIFICATION ---

export const parseResumeWithAffinda = async (
  file: File, 
  apiKey?: string
): Promise<Partial<ResumeData>> => {
  console.log("[parseService.ts] parseResumeWithAffinda: Entered function.");
  // This function remains as a fallback but won't be used if FLASK_API_BASE_URL is set for the demo
  try {
    let key = apiKey;
    if (!key) {
      key = await getAffindaApiKey();
      if (!key) {
        throw new Error("No Affinda API key available. Please configure your API key in settings.");
      }
    }
    
    const client = createAffindaClient(key);
    if (!client) {
      throw new Error("Failed to initialize Affinda client");
    }
    
    const fileBuffer = await file.arrayBuffer();
    console.log(`[parseService.ts] parseResumeWithAffinda: Parsing resume with Affinda: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    const response = await client.createDocument({
      file: Buffer.from(fileBuffer),
      fileName: file.name,
      wait: "true"
    });
    
    if (!response.data) {
      throw new Error("No data in Affinda response");
    }
    
    console.log("[parseService.ts] parseResumeWithAffinda: Affinda response received:", response.data);
    const responseData = response.data as AffindaResponseData;
    return mapAffindaResponseToResumeData(responseData, file);
  } catch (error) {
    console.error("[parseService.ts] parseResumeWithAffinda: Error parsing resume with Affinda:", error);
    throw new Error(`Resume parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const parseAndSaveResume = async (
  file: File,
  userId: string, // userId is kept for signature consistency, but might not be used if Supabase is bypassed
  onSuccess?: (data: Partial<ResumeData>, resumeId: string) => void,
  onError?: (error: Error) => void
): Promise<void> => {
  console.log("[parseService.ts] parseAndSaveResume: Entered function. File:", file.name, "UserId:", userId);
  console.log("[parseService.ts] parseAndSaveResume: Checking FLASK_API_BASE_URL value:", FLASK_API_BASE_URL);

  const toastId = toast.loading("Processing Resume", { 
    description: "Analyzing your resume..."
  });
  
  try {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.error("[parseService.ts] parseAndSaveResume: File size exceeds 10MB limit.");
      throw new Error("File size exceeds 10MB limit. Please upload a smaller file.");
    }
    
    let parsedData: Partial<ResumeData> | null = null;
    let parsingMethod = "unknown";
    let resumeIdForCallback = "local-demo-resume"; // Placeholder ID for local parsing

    if (FLASK_API_BASE_URL) {
      console.log("[parseService.ts] parseAndSaveResume: FLASK_API_BASE_URL is set. Attempting to parse with Local Flask API...");
      toast.loading("Processing with local parser (Demo Mode)...", { id: toastId });
      try {
        parsedData = await parseResumeWithLocalApi(file);
        parsingMethod = "local-flask-api (Demo)";
        console.log("[parseService.ts] parseAndSaveResume: Successfully parsed with Local Flask API.");
        
        // MODIFICATION: Bypass Supabase saving for demo when using Flask API
        console.log("[parseService.ts] parseAndSaveResume: Demo mode - Bypassing Supabase save.");
        toast.success("Resume Processed (Local Demo)", {
          id: toastId,
          description: `Your resume has been parsed locally. Data will not be saved to the database in this demo mode.`
        });
        
        if (parsedData && onSuccess) {
          parsedData.metadata = {
            ...(parsedData.metadata || {}),
            parsingMethod,
            parsedAt: new Date().toISOString(),
            fileType: file.type,
            fileName: file.name,
            note: "Parsed locally for demo, not saved to Supabase."
          };
          onSuccess(parsedData, resumeIdForCallback);
        }
        return; // Exit after local processing for demo

      } catch (localApiError) {
        console.error("[parseService.ts] parseAndSaveResume: Local Flask API parsing failed:", localApiError);
        // Let the main error handler below catch this
        throw localApiError; 
      }
    } else {
      // Original logic if FLASK_API_BASE_URL is not set (not recommended for current demo setup)
      console.warn("[parseService.ts] parseAndSaveResume: VITE_FLASK_API_BASE_URL is NOT set. Falling back to Affinda/Supabase logic.");
      toast.loading("Processing with Affinda...", { id: toastId });
      // For demo, we ideally want to force local. If this path is hit, it means .env is not set.
      // Consider throwing an error or clearly indicating this is not the intended demo path.
      // For now, let it proceed to Affinda if FLASK_API_BASE_URL is not set.
      try {
        parsedData = await parseResumeWithAffinda(file);
        parsingMethod = "affinda";
      } catch (affindaError) {
        console.error("[parseService.ts] parseAndSaveResume: Affinda parsing failed:", affindaError);
        throw affindaError;
      }
    }
    
    if (!parsedData || Object.keys(parsedData).length === 0) {
      console.error("[parseService.ts] parseAndSaveResume: Failed to extract any data from resume.");
      throw new Error("Failed to extract any data from your resume using the configured parsing method.");
    }
    if (!parsedData.personal && !parsedData.summary) { 
        console.warn("[parseService.ts] parseAndSaveResume: Parsed data might be incomplete or in an unexpected format:", parsedData);
    }
    
    console.log("[parseService.ts] parseAndSaveResume: Final parsed resume data before saving (Supabase path):", parsedData);
    
    parsedData.metadata = {
      ...(parsedData.metadata || {}),
      parsingMethod,
      parsedAt: new Date().toISOString(),
      fileType: file.type,
      fileName: file.name
    };
    
    // This part will only be reached if FLASK_API_BASE_URL was NOT set
    resumeIdForCallback = await saveResumeToSupabase(userId, parsedData);
    
    toast.success("Resume Processed & Saved", {
      id: toastId,
      description: `Your resume has been successfully processed using ${parsingMethod} and saved.`
    });
    
    if (onSuccess) {
      onSuccess(parsedData, resumeIdForCallback);
    }
  } catch (error) {
    console.error("[parseService.ts] parseAndSaveResume: Error in parseAndSaveResume:", error);
    toast.error("Resume Processing Failed", {
      id: toastId,
      description: error instanceof Error ? error.message : "An unknown error occurred"
    });
    if (onError && error instanceof Error) {
      onError(error);
    }
  }
};

