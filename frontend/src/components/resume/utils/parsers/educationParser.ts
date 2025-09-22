
import { ResumeData } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { convertDateToYYYYMM } from '../dateUtils';

// Extract education from resume content
export const extractEducation = (content: string): ResumeData['education'] => {
  const educations: ResumeData['education'] = [];
  
  // Look for sections that might contain education
  const educationSectionRegex = /(?:education|academic background|academic history|qualifications)(?:[\s\S]*?)(?:work experience|skills|certification|languages|references|projects|$)/i;
  const educationSection = content.match(educationSectionRegex);
  
  if (educationSection && educationSection[0]) {
    const eduContent = educationSection[0];
    
    // Try to identify individual education entries - improved patterns
    const patterns = [
      // Pattern 1: Institution - Degree format with dates
      /(?:^|\n)([A-Za-z\s&.,'"]+)(?:\s*[-|–]\s*|\s*\|\s*|\n)([A-Za-z0-9\s&.,'"]+)(?:\n|\s+)(?:((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})\s*(?:[-–]\s*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|Present|Current))?/gmi,
      
      // Pattern 2: Date-first format
      /(?:^|\n)(?:((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})\s*(?:[-–]\s*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|Present|Current))(?:\n|\s+)([A-Za-z0-9\s&.,'"]+)(?:\s*[-|–]\s*|\s*\|\s*|\s+at\s+|\s*,\s*)([A-Za-z0-9\s&.,'"]+)/gmi,
      
      // Pattern 3: Simple degree/institution format
      /(?:^|\n)(?:(?:Bachelor|Master|PhD|Doctorate|BSc|MSc|BA|MA|BBA|MBA|B\.S\.|M\.S\.|Ph\.D\.|B\. Tech|M\. Tech|Bachelor of|Master of|Doctor of)[^,\n]*),\s*([^,\n]+)/gmi,
      
      // Pattern 4: Year-only education format
      /(?:^|\n)([A-Za-z\s&.,'"]+),\s*([A-Za-z0-9\s&.,'"]+)(?:,|\s+)(?:.*?)(\d{4})(?:\s*[-–]\s*)?(\d{4}|Present|Current)?/gmi
    ];
    
    // Process each pattern
    for (const pattern of patterns) {
      let match;
      
      while ((match = pattern.exec(eduContent)) !== null) {
        let institution = '', degree = '', field = '', startDate = '', endDateRaw = '';
        
        // Different parsing based on pattern type
        if (pattern.source.includes('Bachelor|Master|PhD')) {
          // Pattern 3: Simple degree/institution format
          const degreePart = match[0].split(',')[0].trim();
          institution = match[1].trim();
          degree = degreePart;
          
          // Try to parse field from degree
          const fieldMatch = degree.match(/(?:in|of)\s+([^,]+)$/i);
          if (fieldMatch) {
            field = fieldMatch[1].trim();
            degree = degree.replace(fieldMatch[0], '').trim();
          }
        } else if (pattern.source.includes('\\d{4}(?:\\s*[-–]')) {
          // Pattern 4: Year-only education format
          institution = match[1].trim();
          degree = match[2].trim();
          startDate = match[3] ? `${match[3]}-01` : ''; // Add month to year
          endDateRaw = match[4] || '';
          
          if (endDateRaw && /^\d{4}$/.test(endDateRaw)) {
            endDateRaw = `${endDateRaw}-01`; // Add month to year
          }
        } else if (pattern.source.startsWith('/(?:^|\\n)(?:((?:Jan|Feb|Mar')) {
          // Pattern 2: Date-first format
          startDate = match[1];
          endDateRaw = match[2];
          degree = match[3].trim();
          institution = match[4].trim();
        } else {
          // Pattern 1: Institution - Degree format
          institution = match[1].trim();
          degree = match[2].trim();
          startDate = match[3] || '';
          endDateRaw = match[4] || '';
        }
        
        // Try to split degree and field
        if (!field && degree) {
          if (degree.includes(',')) {
            const parts = degree.split(',');
            degree = parts[0].trim();
            field = parts.slice(1).join(',').trim();
          } else if (degree.toLowerCase().includes(' in ')) {
            const parts = degree.split(/\s+in\s+/i);
            degree = parts[0].trim();
            field = parts.slice(1).join(' ').trim();
          } else if (degree.toLowerCase().includes(' of ')) {
            const parts = degree.split(/\s+of\s+/i);
            degree = parts[0].trim() + ' of';
            field = parts.slice(1).join(' ').trim();
          }
        }
        
        const current = endDateRaw && endDateRaw.toLowerCase().includes('present') || 
                       endDateRaw && endDateRaw.toLowerCase().includes('current');
        const endDate = current ? undefined : endDateRaw ? convertDateToYYYYMM(endDateRaw) : '';
        
        // Only add if we have both institution and degree
        if (institution && degree) {
          educations.push({
            id: uuidv4(),
            institution,
            degree,
            field: field || '',
            startDate: startDate ? convertDateToYYYYMM(startDate) : '',
            endDate,
            current: !!current,
          });
        }
      }
    }
  }
  
  return educations;
};
