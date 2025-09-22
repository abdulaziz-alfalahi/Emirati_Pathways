
import { ResumeData } from '../../../types';

/**
 * Detects corrupted PDF content in parsed data
 * @param data Partial resume data to check for corruption
 * @returns Boolean indicating if corruption was detected
 */
export function isPdfContentCorrupted(data: Partial<ResumeData>): boolean {
  if (!data.personal) return false;
  
  const corruptionPatterns = [
    /%[A-F0-9]{2}/i,            // PDF header markers like %PDF
    /\/[A-Z][a-z]+ \d+ \d+ R/i,  // PDF internal references
    /endobj|endstream|xref/i,     // PDF structure markers
    /\/Font|\/Type|\/Page/i,      // PDF element markers
    />>/,                        // PDF dictionary ending
    /^\s*l"%\d+/,                // Specific corrupted pattern
  ];
  
  // Check personal fields for corruption patterns
  let corruptionScore = 0;
  
  // Check name field for obvious corruption
  if (data.personal.fullName) {
    const name = data.personal.fullName;
    if (name.includes('%') || name.includes('/') || name.length === 1 || 
        name.includes('>>') || name.includes('Font') ||
        /^[^a-zA-Z]+$/.test(name)) {  // Name with no letters
      corruptionScore += 2;
    }
  }
  
  // Check job title for corruption
  if (data.personal.jobTitle) {
    const title = data.personal.jobTitle;
    if (title.includes('Font') || title.includes('R') || title.includes('<<') ||
        title.includes('/') || title.includes('stream') ||
        /^[^a-zA-Z]+$/.test(title)) {  // Title with no letters
      corruptionScore += 2;
    }
  }
  
  // Check other personal fields
  Object.values(data.personal).forEach(value => {
    if (typeof value === 'string') {
      corruptionPatterns.forEach(pattern => {
        if (pattern.test(value)) {
          corruptionScore++;
        }
      });
    }
  });
  
  // Also check if there's a suspicious lack of real data
  const hasAnyRealData = Object.values(data.personal).some(value => {
    if (typeof value !== 'string') return false;
    // Real data usually has words without special characters
    return /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(value);
  });
  
  if (!hasAnyRealData && Object.values(data.personal).some(v => !!v)) {
    corruptionScore += 2;
  }
  
  return corruptionScore >= 3;
}

/**
 * Clean corrupted PDF data
 * @param parsedData Data that has been detected as corrupted
 * @returns Cleaned data with corrupted fields removed
 */
export function cleanPdfCorruptedData(parsedData: Partial<ResumeData>): Partial<ResumeData> {
  // Create a clean version without corrupted data
  return {
    ...parsedData,
    personal: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: ""
    },
    summary: "We couldn't extract text properly from this document. It might contain formatting that prevents text extraction. Please try uploading a different format.",
    metadata: {
      ...(parsedData.metadata || {}),
      processingError: "detected_corrupted_data",
      cleanedAt: new Date().toISOString()
    }
  };
}
