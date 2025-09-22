import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JobDescriptionParser } from "@/components/resume/utils/jobDescriptionParser"; // Original local parser
import { useQuery } from "@tanstack/react-query";

const FLASK_API_BASE_URL = import.meta.env.VITE_FLASK_API_BASE_URL;

// Fetch job descriptions
export const useJobDescriptions = () => {
  return useQuery({
    queryKey: ["jobDescriptions"],
    queryFn: async () => {
      console.log("[JobDescriptionUtils.ts] Fetching job descriptions from Supabase...");
      const { data, error } = await supabase
        .from("job_descriptions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("[JobDescriptionUtils.ts] Error fetching JDs from Supabase:", error);
        throw error;
      }
      console.log("[JobDescriptionUtils.ts] Successfully fetched JDs from Supabase:", data);
      return data || [];
    }
  });
};

// Handle file upload
export const useJobUploader = (refetch: () => void) => {
  const { toast } = useToast();
  
  const uploadJobDescriptions = async (files: FileList) => {
    if (!files || files.length === 0) return { success: false, error: "No files selected" };

    console.log("[JobDescriptionUtils.ts] uploadJobDescriptions called. FLASK_API_BASE_URL:", FLASK_API_BASE_URL);
    let firstParsedData = null;
    let allSuccessful = true;
    let firstError = null;

    if (FLASK_API_BASE_URL) {
      console.log("[JobDescriptionUtils.ts] Using Flask API for JD parsing.");
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`[JobDescriptionUtils.ts] Processing file: ${file.name} with Flask API`);

          const formData = new FormData();
          // Corrected: Changed "jd_file" to "file" to match Flask API expectation
          formData.append("file", file);

          const response = await fetch(`${FLASK_API_BASE_URL}/parse_jd`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json(); // Attempt to get JSON error from Flask
            const errorText = errorData.error || response.statusText;
            console.error(`[JobDescriptionUtils.ts] Flask API error for ${file.name}: ${response.status} ${errorText}`, errorData);
            toast({
              variant: "destructive",
              title: `Error parsing ${file.name}`,
              description: `Flask API Error: ${errorText}`,
            });
            if (!firstError) firstError = `Failed to parse ${file.name}: ${errorText}`;
            allSuccessful = false;
            continue; // Continue to next file if one fails
          }

          const parsedJD_from_api = await response.json();
          console.log(`[JobDescriptionUtils.ts] Successfully parsed ${file.name} with Flask API:`, parsedJD_from_api);
          
          if (i === 0) { // Store first successfully parsed data for display
            firstParsedData = parsedJD_from_api;
          }

          toast({
            title: "JD Parsed via Local API",
            description: `Successfully parsed ${file.name}. Data available for review.`,
          });
        }
        
        if (allSuccessful) {
            refetch(); 
            return { success: true, parsedData: firstParsedData };
        } else {
            return { success: false, error: firstError || "One or more files failed to parse.", parsedData: firstParsedData };
        }

      } catch (error) {
        console.error("[JobDescriptionUtils.ts] Error during Flask API JD parsing loop:", error);
        toast({
          variant: "destructive",
          title: "Flask API Upload Failed",
          description: error instanceof Error ? error.message : "There was an error uploading/parsing the job descriptions with the local API.",
        });
        return { success: false, error: error instanceof Error ? error.message : "Upload loop error" };
      }

    } else {
      console.warn("[JobDescriptionUtils.ts] FLASK_API_BASE_URL not set. Falling back to original local parser and Supabase logic.");
      // ... (original fallback logic remains unchanged) ...
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const parser = new JobDescriptionParser();
          
          const text = await file.text();
          const parsedJD = parser.parseJobDescription(text);
          
          console.log(`[JobDescriptionUtils.ts] Saving parsed JD (local parser) for ${file.name} to Supabase:`, parsedJD);
          const { error } = await supabase
            .from("job_descriptions")
            .insert({
              title: parsedJD.title,
              company: parsedJD.company,
              location: parsedJD.location,
              employment_type: parsedJD.employmentType,
              work_mode: parsedJD.workMode,
              description: parsedJD.description,
              responsibilities: parsedJD.responsibilities,
              requirements: parsedJD.requirements,
              benefits: parsedJD.benefits,
              salary: parsedJD.salary,
              application_deadline: parsedJD.applicationDeadline,
              posted_date: parsedJD.postedDate || new Date().toISOString(),
              keywords: parsedJD.keywords,
              is_active: true
            });
          
          if (error) {
            console.error(`[JobDescriptionUtils.ts] Supabase insert error for ${file.name}:`, error);
            throw error;
          }
        }
        
        toast({
          title: "Job Descriptions Uploaded (Local Parser)",
          description: `Successfully uploaded ${files.length} job description(s) using local parser and saved to Supabase.`,
        });
        
        refetch();
        return { success: true }; // Assuming local parsing doesn't return specific data for immediate display in the same way
      } catch (error) {
        console.error("[JobDescriptionUtils.ts] Error uploading job descriptions with local parser/Supabase:", error);
        toast({
          variant: "destructive",
          title: "Upload Failed (Local Parser)",
          description: "There was an error uploading the job descriptions.",
        });
        return { success: false, error: error instanceof Error ? error.message : "Local parser error" };
      }
    }
  };
  
  return { uploadJobDescriptions };
};

// Create job manually
export const useJobCreator = (refetch: () => void) => {
  const { toast } = useToast();
  
  const createJob = async (title: string, description: string) => {
    if (!title || !description) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide both a title and description for the job.",
      });
      return { success: false };
    }
    
    console.log("[JobDescriptionUtils.ts] createJob called. FLASK_API_BASE_URL:", FLASK_API_BASE_URL);

    try {
      const parser = new JobDescriptionParser();
      const parsedJD = parser.parseJobDescription(description);
      
      console.log("[JobDescriptionUtils.ts] Saving manually created JD to Supabase:", parsedJD);
      const { error } = await supabase
        .from("job_descriptions")
        .insert({
          title: title,
          company: parsedJD.company,
          location: parsedJD.location,
          employment_type: parsedJD.employmentType,
          work_mode: parsedJD.workMode,
          description: description, 
          responsibilities: parsedJD.responsibilities,
          requirements: parsedJD.requirements,
          benefits: parsedJD.benefits,
          salary: parsedJD.salary,
          application_deadline: parsedJD.applicationDeadline,
          posted_date: new Date().toISOString(),
          keywords: parsedJD.keywords,
          is_active: true
        });
      
      if (error) {
        console.error("[JobDescriptionUtils.ts] Supabase insert error for manual creation:", error);
        throw error;
      }
      
      toast({
        title: "Job Created",
        description: "The job description has been created successfully.",
      });
      
      refetch();
      return { success: true };
    } catch (error) {
      console.error("[JobDescriptionUtils.ts] Error creating job description:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "There was an error creating the job description.",
      });
      return { success: false };
    }
  };
  
  return { createJob };
};

