
import { ResumeData } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Extract skills from resume content
export const extractSkills = (content: string): ResumeData['skills'] => {
  const skills: ResumeData['skills'] = [];
  
  // Look for sections that might contain skills
  const skillsSectionRegex = /(?:skills|technical skills|core competencies|expertise|proficiencies|qualifications)(?:[\s\S]*?)(?:work experience|education|certification|languages|references|projects|$)/i;
  const skillsSection = content.match(skillsSectionRegex);
  
  if (skillsSection && skillsSection[0]) {
    const skillsContent = skillsSection[0];
    
    // Extract skills using multiple strategies
    const extractedSkills = new Set<string>();
    
    // Strategy 1: Extract bullet points
    const bulletPointRegex = /[•\-*]\s*([A-Za-z0-9#\+\s.,-]+?)(?=\n|$|[•\-*])/g;
    let match;
    while ((match = bulletPointRegex.exec(skillsContent)) !== null) {
      const skill = match[1].trim();
      if (skill.length > 1 && !isCommonWord(skill)) {
        // Check if it's a comma-separated list
        if (skill.includes(',')) {
          skill.split(',').forEach(s => {
            const trimmed = s.trim();
            if (trimmed.length > 1 && !isCommonWord(trimmed)) {
              extractedSkills.add(trimmed);
            }
          });
        } else {
          extractedSkills.add(skill);
        }
      }
    }
    
    // Strategy 2: Look for comma-separated lists
    const commaSeparatedRegex = /(?:^|\n)([^•\-*\n:]{10,}?)(?:\n|$)/g;
    while ((match = commaSeparatedRegex.exec(skillsContent)) !== null) {
      const line = match[1].trim();
      if (line.includes(',')) {
        line.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed.length > 1 && !isCommonWord(trimmed)) {
            extractedSkills.add(trimmed);
          }
        });
      }
    }
    
    // Strategy 3: Look for specific technical skills
    const technicalSkillsRegex = /\b(?:javascript|typescript|react|angular|vue|node\.js|python|java|c\+\+|c#|ruby|php|html|css|sass|aws|azure|gcp|docker|kubernetes|mongodb|mysql|postgresql|sql|nosql|git|github|gitlab|jenkins|ci\/cd|agile|scrum|rest|graphql|api|frontend|backend|fullstack|mobile|android|ios|swift|kotlin|flutter|react native|wordpress|shopify|figma|sketch|adobe|photoshop|illustrator|indesign|xd|ui\/ux|seo|digital marketing|social media|content creation|project management|team leadership|machine learning|artificial intelligence|data science|analytics|tableau|power bi|excel|word|powerpoint|office 365|google workspace)\b/gi;
    while ((match = technicalSkillsRegex.exec(content)) !== null) {
      extractedSkills.add(match[0].trim());
    }
    
    // Convert to skill objects and determine levels
    Array.from(extractedSkills).forEach(skill => {
      skills.push({
        id: uuidv4(),
        name: skill,
        level: determineSkillLevel(skill, content),
      });
    });
  }
  
  return skills;
};

// Helper function to check if a string is a common non-skill word
const isCommonWord = (text: string): boolean => {
  const commonWords = [
    'and', 'or', 'with', 'years', 'including', 'etc', 'such', 'as', 'various', 'other',
    'skills', 'ability', 'knowledge', 'experience', 'proficiency', 'proficient',
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'from'
  ];
  
  return text.length < 2 || commonWords.includes(text.toLowerCase());
};

// Helper function to determine skill level
const determineSkillLevel = (skill: string, content: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  // Create a regex that looks for the skill in context
  const skillRegex = new RegExp(`.{0,100}${escapeRegExp(skill)}.{0,100}`, 'i');
  const contextMatches = content.match(skillRegex);
  
  if (!contextMatches) return 'intermediate';
  
  const contextText = contextMatches[0].toLowerCase();
  
  // Check for experience indicators
  if (/\b(\d+)\+?\s*years?\b/.test(contextText)) {
    const yearsMatch = contextText.match(/\b(\d+)\+?\s*years?\b/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years >= 5) return 'expert';
      if (years >= 3) return 'advanced';
      if (years >= 1) return 'intermediate';
      return 'beginner';
    }
  }
  
  // Check for explicit level indicators
  if (contextText.includes('expert') || contextText.includes('mastery') || contextText.includes('extensive')) {
    return 'expert';
  } else if (contextText.includes('advanced') || contextText.includes('proficient') || contextText.includes('strong')) {
    return 'advanced';
  } else if (contextText.includes('beginner') || contextText.includes('basic') || contextText.includes('familiar')) {
    return 'beginner';
  }
  
  return 'intermediate';
};

// Helper to escape special regex characters in a string
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
