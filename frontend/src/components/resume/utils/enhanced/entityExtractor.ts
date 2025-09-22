
/**
 * Entity extractor module for enhanced resume parsing
 * Extracts personal information and other entities from resume text
 */
import { ResumeData } from '../../types';

// Entity extraction for personal information
export const extractPersonalInfo = (sections: Record<string, string>): ResumeData['personal'] => {
  const personal: ResumeData['personal'] = {
    fullName: '',
    jobTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: ''
  };

  // Email pattern
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  
  // Phone pattern (handles various formats)
  const phoneRegex = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  
  // LinkedIn pattern
  const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=|linkedin\.com\/pub\/)[\w-]+/gi;
  
  // Website pattern
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.[\w-]+(?:\.[\w-]+)*(?:\/[\w-./?%&=]*)?/gi;

  // Combine relevant sections for extraction
  let text = '';
  for (const section of ['HEADER', 'SUMMARY', 'PROFILE', 'CONTACT']) {
    if (sections[section]) {
      text += sections[section] + '\n';
    }
  }

  // Extract email
  const emailMatches = text.match(emailRegex);
  if (emailMatches) {
    personal.email = emailMatches[0];
  }
  
  // Extract phone
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches) {
    personal.phone = phoneMatches[0];
  }
  
  // Extract LinkedIn
  const linkedinMatches = text.match(linkedinRegex);
  if (linkedinMatches) {
    const linkedin = linkedinMatches[0];
    personal.linkedin = linkedin.startsWith('http') ? linkedin : `https://${linkedin}`;
  }
  
  // Extract website (that's not LinkedIn)
  const websiteMatches = text.match(websiteRegex);
  if (websiteMatches) {
    for (const site of websiteMatches) {
      if (!site.includes('linkedin')) {
        personal.website = site.startsWith('http') ? site : `https://${site}`;
        break;
      }
    }
  }

  // Try to extract name and job title from the beginning
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    // First non-empty line is likely the name
    const firstLine = lines[0].trim();
    if (firstLine.length < 50 && !emailRegex.test(firstLine) && !phoneRegex.test(firstLine)) {
      personal.fullName = firstLine;
      
      // Second non-empty line might be job title
      if (lines.length > 1) {
        const secondLine = lines[1].trim();
        if (secondLine.length < 70 && !emailRegex.test(secondLine) && !phoneRegex.test(secondLine)) {
          personal.jobTitle = secondLine;
        }
      }
    }
  }

  // Try to extract location
  const locationPatterns = [
    /(?:located in|location|address|residing at|based in)\s+([^,\n]+(?:,\s*[^,\n]+)?)/i,
    /([A-Za-z\s]+,\s*[A-Za-z\s]+(?:,\s*[A-Za-z\s]+)?)/i,
    /\b([A-Za-z\s]+,\s*(?:USA|United States|UK|Canada|Australia|UAE|India|Germany|France|Italy|Spain|Japan|China))\b/i,
    /\b([A-Za-z\s]+,\s*[A-Z]{2})\b/i, // City, State abbreviation
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      personal.location = match[1].trim();
      break;
    }
  }

  return personal;
};
