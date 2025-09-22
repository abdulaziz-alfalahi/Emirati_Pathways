
import { ResumeData } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { convertDateToYYYYMM } from '../dateUtils';

// Extract work experience from resume content
export const extractExperience = (content: string): ResumeData['experience'] => {
  const experiences: ResumeData['experience'] = [];
  
  // Look for sections that might contain work experience
  const experienceSectionRegex = /(?:work experience|professional experience|employment history|work history|experience)(?:[\s\S]*?)(?:education|skills|certification|languages|references|projects|$)/i;
  const experienceSection = content.match(experienceSectionRegex);
  
  if (experienceSection && experienceSection[0]) {
    const expContent = experienceSection[0];
    
    // Try to identify individual roles/positions - enhanced regex patterns
    const patterns = [
      // Pattern 1: Company - Position format with dates
      /(?:^|\n)([A-Za-z0-9\s&.,'"]+)(?:\s*[-|–]\s*|\s*\|\s*|\n)([A-Za-z0-9\s&.,'"]+)(?:\n|\s+)(?:((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})\s*(?:[-–]\s*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|Present|Current))?/gmi,
      
      // Pattern 2: Position at Company format
      /(?:^|\n)([A-Za-z0-9\s&.,'"]+)\s+(?:at|@)\s+([A-Za-z0-9\s&.,'"]+)(?:\n|\s+)(?:((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})\s*(?:[-–]\s*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|Present|Current))?/gmi,
      
      // Pattern 3: Date-first format
      /(?:^|\n)(?:((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})\s*(?:[-–]\s*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|Present|Current))(?:\n|\s+)([A-Za-z0-9\s&.,'"]+)(?:\s*[-|–]\s*|\s*\|\s*|\s+at\s+|\s*,\s*)([A-Za-z0-9\s&.,'"]+)/gmi,
      
      // Pattern 4: Company (Date - Date) Position format
      /(?:^|\n)([A-Za-z0-9\s&.,'"]+)\s*\((?:((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})\s*(?:[-–]\s*)((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|Present|Current))\)\s*(?:\n|\s+)([A-Za-z0-9\s&.,'"]+)/gmi
    ];
    
    // Process each pattern
    for (const pattern of patterns) {
      let match;
      
      while ((match = pattern.exec(expContent)) !== null) {
        let company, position, startDate, endDateRaw;
        
        // Different parsing based on pattern type
        if (pattern.source.startsWith('/(?:^|\\n)(?:((?:Jan|Feb|Mar')) {
          // Pattern 3: Date-first format
          startDate = match[1];
          endDateRaw = match[2];
          position = match[3].trim();
          company = match[4].trim();
        } else if (pattern.source.includes('\\((?:((?:Jan|Feb|Mar')) {
          // Pattern 4: Company (Date - Date) Position format
          company = match[1].trim();
          startDate = match[2];
          endDateRaw = match[3];
          position = match[4].trim();
        } else if (pattern.source.includes('at|@')) {
          // Pattern 2: Position at Company format
          position = match[1].trim();
          company = match[2].trim();
          startDate = match[3];
          endDateRaw = match[4];
        } else {
          // Pattern 1: Company - Position format
          company = match[1].trim();
          position = match[2].trim();
          startDate = match[3];
          endDateRaw = match[4];
        }
        
        const current = endDateRaw && endDateRaw.toLowerCase().includes('present') || 
                       endDateRaw && endDateRaw.toLowerCase().includes('current');
        const endDate = current ? undefined : endDateRaw ? convertDateToYYYYMM(endDateRaw) : '';
        
        // Get the description - text between this match and the next match or section end
        const startIdx = match.index + match[0].length;
        const nextMatchIdx = pattern.lastIndex;
        let endIdx;
        
        // Find the next experience entry or section end
        for (const p of patterns) {
          p.lastIndex = startIdx; // Reset to search from current position
          const nextMatch = p.exec(expContent);
          if (nextMatch && (nextMatchIdx === 0 || nextMatch.index < nextMatchIdx)) {
            endIdx = nextMatch.index;
            break;
          }
        }
        
        if (!endIdx) {
          endIdx = nextMatchIdx > 0 ? nextMatchIdx : expContent.length;
        }
        
        let description = expContent.substring(startIdx, endIdx).trim();
        
        // Clean up description - remove bullet points, etc.
        description = description
          .replace(/•\s+/g, '• ')  // Normalize bullet points
          .replace(/\n+/g, '\n')   // Remove excessive newlines
          .trim();
        
        // Only add if we have both company and position
        if (company && position) {
          experiences.push({
            id: uuidv4(),
            company,
            position,
            startDate: startDate ? convertDateToYYYYMM(startDate) : '',
            endDate,
            current: !!current,
            description,
          });
        }
      }
    }
  }
  
  return experiences;
};
