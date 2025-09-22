
/**
 * Enhanced Resume Parser class implementation
 * Core class that orchestrates the resume parsing process
 */
import { ResumeData } from '../../types';
import { extractDataFromContent } from '../resumeContentParser';
import { mergeResumeData } from '../resumeDataUtils';
import { processDocument } from './documentProcessor';
import { identifySections } from './sectionIdentifier';
import { extractPersonalInfo } from './entityExtractor';
import { validateResumeData, structureResumeData } from './dataValidator';

// Main parser class
export class EnhancedResumeParser {
  /**
   * Detects if the text appears to be corrupted PDF data rather than resume content
   * @param text The text to check
   * @returns True if the text appears to be corrupted PDF data
   */
  private isCorruptedPdfData(text: string): boolean {
    // Common patterns found in corrupted PDF data
    const corruptionPatterns = [
      /%PDF-/i, // PDF header
      /\/Type\s*\/\w+/i, // PDF type declarations
      /\/Metadata\s+\d+\s+\d+\s+R/i, // PDF metadata references
      /\/ObjStm/i, // PDF object streams
      /endobj|endstream/i, // PDF object markers
      /xref|startxref/i, // PDF cross references
      /\/Contents\s+\d+\s+\d+/i, // PDF content references
      /\/Linearized/i, // Linearized PDF marker
      /\/Outlines/i, // PDF outlines
      /\/OpenAction/i, // PDF open action
      /\/Page\s+\/\w+/i, // PDF page declarations
    ];
    
    // Check if any corruption patterns are found
    const corruptionMatches = corruptionPatterns.filter(pattern => pattern.test(text));
    
    // If we find multiple corruption patterns, it's likely corrupted PDF data
    const isCorrupted = corruptionMatches.length >= 3;
    console.log(`EnhancedResumeParser.isCorruptedPdfData: Found ${corruptionMatches.length} corruption patterns, isCorrupted: ${isCorrupted}`);
    return isCorrupted;
  }

  /**
   * Parse resume content and extract structured information
   * 
   * @param fileContent Content of the resume file
   * @param fileType MIME type of the file
   * @returns Parsed resume data
   */
  parseResumeContent(fileContent: string, fileType: string): Partial<ResumeData> {
    try {
      console.log('EnhancedResumeParser.parseResumeContent: Starting enhanced resume parsing...');
      console.log(`EnhancedResumeParser.parseResumeContent: Content length: ${fileContent.length}, type: ${fileType}`);
      
      // Check for corrupted PDF data
      if (this.isCorruptedPdfData(fileContent)) {
        console.error('EnhancedResumeParser.parseResumeContent: Detected corrupted PDF data instead of resume content');
        return {
          personal: {
            fullName: "",
            jobTitle: "",
            email: "",
            phone: "",
            location: "",
            linkedin: "",
            website: ""
          },
          summary: "Could not extract text from this PDF. It might be password-protected or corrupted. Please try using a different PDF or convert it to another format first.",
          experience: [],
          education: [],
          skills: [],
          languages: [],
          metadata: {
            processingError: "corrupted_pdf_data",
            parsingMethod: "enhanced-parser-error-detection",
            processingMessage: "The PDF appears to contain binary or corrupted data rather than extractable text."
          }
        };
      }
      
      // Step 1: Process document and extract text
      console.log('EnhancedResumeParser.parseResumeContent: Processing document...');
      const { text, metadata } = processDocument(fileContent, fileType);
      console.log('EnhancedResumeParser.parseResumeContent: Document processed, metadata:', metadata);
      console.log('EnhancedResumeParser.parseResumeContent: Processed text sample:', text.substring(0, 200) + '...');
      
      // Step 2: Identify and segment resume sections
      console.log('EnhancedResumeParser.parseResumeContent: Identifying sections...');
      const sections = identifySections(text);
      console.log('EnhancedResumeParser.parseResumeContent: Sections identified:', Object.keys(sections));
      
      // Step 3: Extract entities using our enhanced extractors
      console.log('EnhancedResumeParser.parseResumeContent: Extracting personal info...');
      const personalInfo = extractPersonalInfo(sections);
      console.log('EnhancedResumeParser.parseResumeContent: Personal info extracted:', personalInfo);
      
      // Step 4: Extract other entities from the content parser
      console.log('EnhancedResumeParser.parseResumeContent: Extracting data using content parser...');
      const extractedData = extractDataFromContent(text, fileType);
      console.log('EnhancedResumeParser.parseResumeContent: Data extracted using content parser:', Object.keys(extractedData).length > 0 ? 'Success' : 'No data extracted');
      
      // Step 5: Combine enhanced extraction with default extraction
      console.log('EnhancedResumeParser.parseResumeContent: Combining extracted data...');
      let result: Partial<ResumeData> & { metadata?: any } = {
        ...extractedData,
        personal: {
          ...extractedData.personal,
          ...personalInfo
        },
        metadata: {
          ...metadata,
          sectionCount: Object.keys(sections).length,
          sectionNames: Object.keys(sections),
          parser: 'EnhancedResumeParser'
        }
      };
      
      // Step 6: Validate and structure the data
      console.log('EnhancedResumeParser.parseResumeContent: Validating data...');
      const validation = validateResumeData(result);
      console.log('EnhancedResumeParser.parseResumeContent: Validation results:', validation);
      
      // Step 7: Structure the data to ensure it matches the expected schema
      console.log('EnhancedResumeParser.parseResumeContent: Structuring data...');
      result = structureResumeData(result);
      
      // Add validation results to metadata
      result.metadata.validation = validation;
      
      console.log('EnhancedResumeParser.parseResumeContent: Parsing complete.');
      return result;
    } catch (error) {
      console.error('Error in enhanced resume parsing:', error);
      // Return basic structure with error info
      return {
        personal: {
          fullName: "",
          jobTitle: "",
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          website: ""
        },
        summary: "An error occurred while parsing your resume. Please try again or use a different file format.",
        experience: [],
        education: [],
        skills: [],
        languages: [],
        metadata: {
          processingError: error instanceof Error ? error.message : "unknown_error",
          parsingMethod: "enhanced-parser-error-handling",
          processingTimestamp: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Parse multiple resume contents in batch
   * 
   * @param files Array of file objects with content and type
   * @returns Array of parsed resume data
   */
  parseResumeBatch(files: Array<{content: string, type: string}>): Array<Partial<ResumeData>> {
    return files.map(file => this.parseResumeContent(file.content, file.type));
  }
  
  /**
   * Merge new resume data with existing data
   * 
   * @param currentData Current resume data
   * @param newData New parsed resume data to merge
   * @returns Merged resume data
   */
  mergeResumeData(currentData: ResumeData, newData: Partial<ResumeData>): ResumeData {
    return mergeResumeData(currentData, newData);
  }
}

// Export singleton instance for easy import
export const enhancedResumeParser = new EnhancedResumeParser();
