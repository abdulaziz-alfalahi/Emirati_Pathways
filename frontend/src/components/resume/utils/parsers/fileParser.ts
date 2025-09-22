
/**
 * Resume file parser utility for extracting data from uploaded resume files
 */
import { ResumeData } from '../../types';
import { ParsingError } from '../resumeParser';
import { parseFileContent } from './fileParserCore';

/**
 * Parse resume from uploaded file
 * @param file File object to parse
 * @returns Promise resolving to parsed resume data
 */
export const parseResumeFromFile = async (file: File): Promise<Partial<ResumeData>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        const parsedData = await parseFileContent(file, fileContent);
        resolve(parsedData);
      } catch (error) {
        console.error('Error parsing resume:', error);
        
        const parsingError = error instanceof Error ? error : new Error('Failed to parse resume file. Please try a different file.') as ParsingError;
        
        if (!(parsingError as ParsingError).code) {
          (parsingError as ParsingError).code = 'PARSING_FAILED';
        }
        
        if (!(parsingError as ParsingError).details) {
          (parsingError as ParsingError).details = {
            originalError: error instanceof Error ? error.message : String(error),
            fileType: file.type
          };
        }
        
        if (!(parsingError as ParsingError).parserType) {
          (parsingError as ParsingError).parserType = 'file';
        }
        
        reject(parsingError);
      }
    };
    
    reader.onerror = (event) => {
      const error = new Error('Error reading file. Please try again.') as ParsingError;
      error.code = 'FILE_READ_ERROR';
      error.details = { event };
      error.parserType = 'file';
      
      reject(error);
    };
    
    reader.readAsText(file);
  });
};
