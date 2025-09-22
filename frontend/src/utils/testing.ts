// Fixed testing utilities for resume parsing
import { parseCV, CVData } from '@/integrations/groq';

export interface TestResult {
  accuracy: number;
  processingTime: number;
  errors: string[];
  warnings: string[];
}

export interface ResumeTestingFramework {
  testAccuracy: (file: File) => Promise<TestResult>;
  benchmarkPerformance: (files: File[]) => Promise<TestResult[]>;
  validateParsing: (data: CVData) => boolean;
}

// Mock implementation for testing framework
export const createTestingFramework = (): ResumeTestingFramework => {
  return {
    async testAccuracy(file: File): Promise<TestResult> {
      try {
        const startTime = Date.now();
        const parsedData = await parseCV(file);
        const processingTime = Date.now() - startTime;
        
        // Calculate accuracy based on data completeness
        let accuracy = 0;
        let totalFields = 0;
        let filledFields = 0;
        
        // Check personal info
        if (parsedData.personalInfo) {
          totalFields += 4; // name, email, phone, address
          if (parsedData.personalInfo.fullName) filledFields++;
          if (parsedData.personalInfo.email) filledFields++;
          if (parsedData.personalInfo.phone) filledFields++;
          if (parsedData.personalInfo.address) filledFields++;
        }
        
        // Check experience
        totalFields += 1;
        if (parsedData.experience && parsedData.experience.length > 0) filledFields++;
        
        // Check education
        totalFields += 1;
        if (parsedData.education && parsedData.education.length > 0) filledFields++;
        
        // Check skills
        totalFields += 2;
        if (parsedData.skills?.technical && parsedData.skills.technical.length > 0) filledFields++;
        if (parsedData.skills?.soft && parsedData.skills.soft.length > 0) filledFields++;
        
        accuracy = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
        
        return {
          accuracy,
          processingTime,
          errors: [],
          warnings: accuracy < 80 ? ['Low accuracy detected'] : []
        };
      } catch (error) {
        return {
          accuracy: 0,
          processingTime: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: []
        };
      }
    },
    
    async benchmarkPerformance(files: File[]): Promise<TestResult[]> {
      const results: TestResult[] = [];
      
      for (const file of files) {
        const result = await this.testAccuracy(file);
        results.push(result);
      }
      
      return results;
    },
    
    validateParsing(data: CVData): boolean {
      // Basic validation
      if (!data.personalInfo?.fullName) return false;
      if (!data.personalInfo?.email) return false;
      if (!data.experience || data.experience.length === 0) return false;
      
      return true;
    }
  };
};

// Export default testing framework instance
export const testingFramework = createTestingFramework();

// Test function for compatibility
export async function testResumeParser(file: File): Promise<TestResult> {
  return testingFramework.testAccuracy(file);
}

