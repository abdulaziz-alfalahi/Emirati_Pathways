
/**
 * Section identifier module for enhanced resume parsing
 * Identifies and segments resume sections
 */

// Advanced section identification
export const identifySections = (text: string): Record<string, string> => {
  // Common section headers in resumes
  const sectionHeaders = [
    'SUMMARY', 'PROFESSIONAL SUMMARY', 'PROFILE', 'OBJECTIVE',
    'EXPERIENCE', 'WORK EXPERIENCE', 'EMPLOYMENT HISTORY', 'PROFESSIONAL EXPERIENCE',
    'EDUCATION', 'ACADEMIC BACKGROUND', 'EDUCATIONAL BACKGROUND', 'QUALIFICATIONS',
    'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'EXPERTISE',
    'LANGUAGES', 'LANGUAGE PROFICIENCY',
    'CERTIFICATIONS', 'CERTIFICATES', 'ACCREDITATIONS', 'LICENSES',
    'PROJECTS', 'KEY PROJECTS', 'PROJECT EXPERIENCE', 'PORTFOLIO',
    'ACHIEVEMENTS', 'AWARDS', 'HONORS', 'RECOGNITIONS',
    'PUBLICATIONS', 'RESEARCH', 'PAPERS', 'PRESENTATIONS',
    'VOLUNTEERING', 'VOLUNTEER EXPERIENCE', 'COMMUNITY SERVICE',
    'REFERENCES', 'PROFESSIONAL REFERENCES'
  ];
  
  // Create the sections object with initial "HEADER" section
  const sections: Record<string, string> = {
    'HEADER': ''
  };
  
  // Regular expression patterns for various section header formats
  // This regex catches headers that are:
  // 1. All caps
  // 2. Possibly preceded by numbers (like "1. EXPERIENCE")
  // 3. Possibly followed by a colon
  // 4. Possibly underlined with ===== or -----
  const headerRegexPatterns = [
    // Basic all-caps pattern
    new RegExp(`^(${sectionHeaders.join('|')})\\s*:?\\s*$`, 'i'),
    
    // With numbers prefix (1. EXPERIENCE)
    new RegExp(`^\\d+\\.?\\s+(${sectionHeaders.join('|')})\\s*:?\\s*$`, 'i'),
    
    // Underlined with === or ---
    new RegExp(`^(${sectionHeaders.join('|')})\\s*:?\\s*$\\n[=\\-]+`, 'im')
  ];
  
  // Process line by line to identify sections
  let currentSection = 'HEADER';
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if this line matches any section header pattern
    let isHeader = false;
    
    // First, use our predefined regex patterns
    for (const pattern of headerRegexPatterns) {
      if (pattern.test(line)) {
        // Extract the header name
        const match = line.match(new RegExp(`(${sectionHeaders.join('|')})`, 'i'));
        
        if (match && match[0]) {
          currentSection = match[0].toUpperCase();
          if (!sections[currentSection]) sections[currentSection] = '';
          isHeader = true;
          break;
        }
      }
    }
    
    // If no match with regex patterns, check for exact matches
    if (!isHeader) {
      const upperLine = line.toUpperCase();
      
      // Check for exact matches with section headers
      const exactMatch = sectionHeaders.find(header => 
        upperLine === header || 
        upperLine === header + ':' || 
        upperLine === header + ' :'
      );
      
      if (exactMatch) {
        currentSection = exactMatch;
        if (!sections[currentSection]) sections[currentSection] = '';
        isHeader = true;
      }
    }
    
    // If not a header, add line to current section
    if (!isHeader) {
      sections[currentSection] += line + '\n';
    }
  }
  
  // Clean up each section (trim whitespace)
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });
  
  console.log('Identified sections:', Object.keys(sections));
  return sections;
};
