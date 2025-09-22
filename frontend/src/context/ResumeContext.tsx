
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ResumeData } from '@/components/resume/types';
import { toast } from 'sonner';

// Default empty resume data structure
const defaultResumeData: ResumeData = {
  personal: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: ""
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  interests: [],
  metadata: {
    parsingMethod: "manual",
    parsedAt: new Date().toISOString()
  }
};

// Context type definition
interface ResumeContextType {
  resumeData: ResumeData;
  setResumeData: (data: ResumeData) => void;
  updateResumeSection: <K extends keyof ResumeData>(section: K, data: ResumeData[K]) => void;
  resetResume: () => void;
  isResumeEmpty: boolean;
}

// Create the context with default values
export const ResumeContext = createContext<ResumeContextType>({
  resumeData: defaultResumeData,
  setResumeData: () => {}, // No-op function as default
  updateResumeSection: () => {}, // No-op function as default
  resetResume: () => {}, // No-op function as default
  isResumeEmpty: true
});

// Create a hook to use the resume context
export const useResume = () => useContext(ResumeContext);

// Provider component
export const ResumeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Initialize state with default or from localStorage if available
  const [resumeData, setResumeDataState] = useState<ResumeData>(() => {
    if (typeof window !== 'undefined') {
      const savedResume = localStorage.getItem("savedResume");
      if (savedResume) {
        try {
          const parsedData = JSON.parse(savedResume);
          console.log('Loaded resume data from localStorage:', parsedData);
          return parsedData;
        } catch (error) {
          console.error("Error parsing saved resume:", error);
          // If there's an error parsing, return the default
          return defaultResumeData;
        }
      }
    }
    return defaultResumeData;
  });

  // Calculate if resume is essentially empty
  const isResumeEmpty = !resumeData.personal.fullName && 
                        !resumeData.summary && 
                        resumeData.experience.length === 0 && 
                        resumeData.education.length === 0 && 
                        resumeData.skills.length === 0;

  // Safe wrapper for setResumeData to handle potential errors
  const setResumeData = (data: ResumeData) => {
    try {
      console.log('Context: setResumeData called with data:', data);
      
      // Ensure we have a fully sanitized data object with default values for missing properties
      const sanitizedData: ResumeData = {
        personal: {
          fullName: data.personal?.fullName || "",
          jobTitle: data.personal?.jobTitle || "",
          email: data.personal?.email || "",
          phone: data.personal?.phone || "",
          location: data.personal?.location || "",
          linkedin: data.personal?.linkedin || "",
          website: data.personal?.website || ""
        },
        summary: data.summary || "",
        experience: Array.isArray(data.experience) ? data.experience : [],
        education: Array.isArray(data.education) ? data.education : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        interests: Array.isArray(data.interests) ? data.interests : [],
        metadata: {
          ...(data.metadata || {}),
          lastUpdated: new Date().toISOString()
        }
      };
      
      setResumeDataState(prevState => {
        // Compare with previous state to avoid unnecessary updates
        if (JSON.stringify(prevState) === JSON.stringify(sanitizedData)) {
          console.log('Resume data unchanged, skipping update');
          return prevState;
        }
        
        console.log('Resume data updated:', sanitizedData);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("savedResume", JSON.stringify(sanitizedData));
        }
        
        return sanitizedData;
      });
    } catch (error) {
      console.error('Error in setResumeData:', error);
      toast.error('Failed to update resume data');
    }
  };

  // Helper to update just one section of the resume
  const updateResumeSection = <K extends keyof ResumeData>(section: K, data: ResumeData[K]) => {
    console.log(`ResumeContext: Updating resume section "${section}" with:`, data);
    
    // Create a new object with the updated section
    const updatedData = {
      ...resumeData,
      [section]: data,
      metadata: {
        ...(resumeData.metadata || {}),
        lastUpdated: new Date().toISOString(),
        updatedSection: section
      }
    };
    
    setResumeData(updatedData);
    // Provide user feedback
    toast.success(`Updated ${section} section`);
  };

  // Reset resume to default empty state
  const resetResume = () => {
    console.log('Resetting resume to default state');
    setResumeData({
      ...defaultResumeData,
      metadata: {
        parsingMethod: "manual",
        parsedAt: new Date().toISOString(),
        reset: true
      }
    });
    toast.success('Resume has been reset');
  };

  // Save to localStorage whenever resumeData changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("savedResume", JSON.stringify(resumeData));
    }
  }, [resumeData]);

  return (
    <ResumeContext.Provider 
      value={{ 
        resumeData, 
        setResumeData, 
        updateResumeSection, 
        resetResume, 
        isResumeEmpty 
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export default ResumeProvider;
