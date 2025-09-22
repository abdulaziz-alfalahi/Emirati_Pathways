
import { ResumeData } from '../../types';

/**
 * Parse resume from uploaded image file
 * @param file Image file to parse
 * @returns Promise resolving to parsed resume data
 */
export const parseResumeFromImage = async (file: File): Promise<Partial<ResumeData>> => {
  console.log(`Processing image file: ${file.name}`);
  
  // This is just a mock implementation
  // In a real application, this would call an OCR service or API
  return {
    personal: {
      fullName: "John Doe",
      jobTitle: "Software Engineer",
      email: "john.doe@example.com",
      phone: "+1 123-456-7890",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/johndoe",
      website: "johndoe.com"
    },
    summary: "Experienced software engineer with a passion for creating elegant and efficient solutions.",
    experience: [
      {
        id: "exp1",
        company: "Example Corp",
        position: "Senior Developer",
        location: "San Francisco, CA",
        startDate: "2018-01",
        endDate: null,
        current: true,
        description: "Led development of core product features."
      }
    ],
    education: [
      {
        id: "edu1",
        institution: "Example University",
        degree: "Bachelor",
        field: "Computer Science",
        location: "San Francisco, CA",
        startDate: "2014-09",
        endDate: "2018-06",
        current: false,
        description: "Graduated with honors"
      }
    ],
    skills: [
      {
        id: "skill1",
        name: "JavaScript",
        level: "Expert"
      },
      {
        id: "skill2",
        name: "React",
        level: "Advanced"
      }
    ],
    languages: [
      {
        id: "lang1",
        name: "English",
        proficiency: "Native"
      }
    ],
    metadata: {
      parsingMethod: "image-ocr",
      processingTime: 1200
    }
  };
};
