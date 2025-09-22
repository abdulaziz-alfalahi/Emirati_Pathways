
import { ResumeData } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Extract languages from resume content
export const extractLanguages = (content: string): ResumeData['languages'] => {
  const languages: ResumeData['languages'] = [];
  
  // Look for sections that might contain languages
  const languagesSectionRegex = /(?:languages|language proficiency|language skills|linguistic skills)(?:[\s\S]*?)(?:work experience|education|skills|certification|references|projects|$)/i;
  const languagesSection = content.match(languagesSectionRegex);
  
  // Common languages to look for
  const commonLanguages = [
    'English', 'Arabic', 'French', 'Spanish', 'German', 'Chinese', 'Japanese', 
    'Russian', 'Hindi', 'Urdu', 'Tagalog', 'Bengali', 'Portuguese', 'Italian',
    'Dutch', 'Korean', 'Turkish', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
    'Greek', 'Hebrew', 'Polish', 'Czech', 'Romanian', 'Hungarian', 'Thai', 
    'Vietnamese', 'Malay', 'Indonesian', 'Filipino', 'Cantonese', 'Mandarin'
  ];
  
  // Proficiency mapping patterns
  const proficiencyPatterns = [
    { pattern: /native|mother tongue|first language/i, level: 'native' },
    { pattern: /fluent|proficient|excellent|full professional|advanced/i, level: 'fluent' },
    { pattern: /intermediate|working|limited working|good|conversational/i, level: 'conversational' },
    { pattern: /basic|beginner|elementary|novice|limited/i, level: 'basic' }
  ];
  
  if (languagesSection && languagesSection[0]) {
    const langContent = languagesSection[0];
    
    // Strategy 1: Look for language: proficiency patterns
    const langProficiencyRegex = /([A-Za-z]+)\s*(?:[-:–]|:|\()\s*(native|fluent|proficient|intermediate|beginner|basic|advanced|conversational|elementary|mother tongue|working|limited)/gi;
    let match;
    
    while ((match = langProficiencyRegex.exec(langContent)) !== null) {
      const language = match[1].trim();
      const proficiencyDesc = match[2].toLowerCase();
      
      let proficiency: 'basic' | 'conversational' | 'fluent' | 'native' = 'conversational';
      
      // Determine proficiency level
      for (const { pattern, level } of proficiencyPatterns) {
        if (pattern.test(proficiencyDesc)) {
          proficiency = level as any;
          break;
        }
      }
      
      // Only add if it's a valid language name
      if (language.length > 1 && !isCommonWord(language)) {
        languages.push({
          id: uuidv4(),
          name: language,
          proficiency,
        });
      }
    }
    
    // Strategy 2: Check for common languages
    if (languages.length === 0) {
      for (const language of commonLanguages) {
        const langRegex = new RegExp(`\\b${language}\\b`, 'i');
        if (langRegex.test(langContent)) {
          let proficiency: 'basic' | 'conversational' | 'fluent' | 'native' = 'conversational';
          
          // Try to determine proficiency
          for (const { pattern, level } of proficiencyPatterns) {
            const contextRegex = new RegExp(`\\b${language}\\b[^.]*?${pattern.source}`, 'i');
            if (contextRegex.test(langContent)) {
              proficiency = level as any;
              break;
            }
          }
          
          languages.push({
            id: uuidv4(),
            name: language,
            proficiency,
          });
        }
      }
    }
    
    // Strategy 3: Look for bullet points with language names
    if (languages.length === 0) {
      const bulletLanguageRegex = /[•\-*]\s*([A-Za-z]+)/g;
      
      while ((match = bulletLanguageRegex.exec(langContent)) !== null) {
        const language = match[1].trim();
        
        // Skip common non-language words
        if (language.length > 2 && !isCommonWord(language)) {
          languages.push({
            id: uuidv4(),
            name: language,
            proficiency: 'conversational', // Default
          });
        }
      }
    }
  } else {
    // If no language section found, check entire content for common languages
    for (const language of commonLanguages) {
      // Only consider English mention if it's specifically mentioned as a language
      if (language === 'English' && !(/language.*English|English.*language/i.test(content))) {
        continue;
      }
      
      const langRegex = new RegExp(`\\b${language}\\b`, 'i');
      if (langRegex.test(content)) {
        let proficiency: 'basic' | 'conversational' | 'fluent' | 'native' = 'conversational';
        
        // For English, default to fluent if not otherwise specified
        if (language === 'English') {
          proficiency = 'fluent';
        }
        
        // Try to determine proficiency
        for (const { pattern, level } of proficiencyPatterns) {
          const contextRegex = new RegExp(`\\b${language}\\b[^.]*?${pattern.source}`, 'i');
          if (contextRegex.test(content)) {
            proficiency = level as any;
            break;
          }
        }
        
        languages.push({
          id: uuidv4(),
          name: language,
          proficiency,
        });
      }
    }
  }
  
  return languages;
};

// Helper function to check if a string is a common non-language word
const isCommonWord = (text: string): boolean => {
  const commonWords = [
    'skills', 'proficiency', 'include', 'languages', 'section', 'level', 'speak',
    'written', 'oral', 'and', 'or', 'the', 'native', 'fluent', 'basic', 'proficient',
    'beginner', 'intermediate', 'advanced', 'good', 'excellent'
  ];
  
  return text.length < 3 || commonWords.includes(text.toLowerCase());
};
