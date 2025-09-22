
export interface JobDescription {
  title: string;
  company: string;
  location: string;
  employmentType: string;
  workMode: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  salary: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  applicationDeadline: string;
  postedDate: string;
  keywords: string[];
  isActive: boolean;
}

export class JobDescriptionParser {
  private extractTitle(text: string): string {
    const titlePattern = /job title|position|role|opening for|hiring|seeking/i;
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (titlePattern.test(line)) {
        return line.replace(titlePattern, '').trim();
      }
    }
    
    // If no clear title found, return first non-empty line
    return lines.find(line => line.trim().length > 0) || '';
  }

  private extractCompany(text: string): string {
    const companyPattern = /(?:at|with|for)\s+([A-Za-z0-9\s&]+?)(?:\sin|\s-|\.|$)/i;
    const match = text.match(companyPattern);
    return match ? match[1].trim() : '';
  }

  private extractLocation(text: string): string {
    const locationPattern = /location:\s*([^.|\n]+)|(?:in|at)\s+([A-Za-z\s,]+)(?:\.|$)/i;
    const match = text.match(locationPattern);
    return match ? (match[1] || match[2]).trim() : '';
  }

  private extractEmploymentType(text: string): string {
    const types = ['full-time', 'part-time', 'contract', 'temporary', 'internship'];
    const employmentPattern = new RegExp(`(${types.join('|')})`, 'i');
    const match = text.match(employmentPattern);
    return match ? match[1].toLowerCase() : '';
  }

  private extractWorkMode(text: string): string {
    const modes = ['remote', 'hybrid', 'on-site', 'in-office'];
    const workModePattern = new RegExp(`(${modes.join('|')})`, 'i');
    const match = text.match(workModePattern);
    return match ? match[1].toLowerCase() : '';
  }

  private extractResponsibilities(text: string): string[] {
    const responsibilitiesPattern = /responsibilities:|key duties:|you will:|what you'll do:/i;
    const sections = text.split(/\n\n+/);
    
    for (const section of sections) {
      if (responsibilitiesPattern.test(section)) {
        return section
          .split(/\n/)
          .filter(line => line.trim().length > 0 && !responsibilitiesPattern.test(line))
          .map(line => line.replace(/^[-•*]\s*/, '').trim());
      }
    }
    
    return [];
  }

  private extractRequirements(text: string): string[] {
    const requirementsPattern = /requirements:|qualifications:|what you need:|you should have:/i;
    const sections = text.split(/\n\n+/);
    
    for (const section of sections) {
      if (requirementsPattern.test(section)) {
        return section
          .split(/\n/)
          .filter(line => line.trim().length > 0 && !requirementsPattern.test(line))
          .map(line => line.replace(/^[-•*]\s*/, '').trim());
      }
    }
    
    return [];
  }

  private extractBenefits(text: string): string[] {
    const benefitsPattern = /benefits:|perks:|what we offer:|package includes:/i;
    const sections = text.split(/\n\n+/);
    
    for (const section of sections) {
      if (benefitsPattern.test(section)) {
        return section
          .split(/\n/)
          .filter(line => line.trim().length > 0 && !benefitsPattern.test(line))
          .map(line => line.replace(/^[-•*]\s*/, '').trim());
      }
    }
    
    return [];
  }

  private extractSalary(text: string): { min?: number; max?: number; currency?: string; period?: string } {
    const salaryPattern = /\$?\s*(\d+[,\d]*\.?\d*)\s*-?\s*\$?(\d+[,\d]*\.?\d*)?(?:\s*(k|thousand|million))?\s*(?:per\s+(\w+))?/i;
    const match = text.match(salaryPattern);
    
    if (!match) return {};
    
    const min = match[1] ? parseFloat(match[1].replace(/,/g, '')) : undefined;
    const max = match[2] ? parseFloat(match[2].replace(/,/g, '')) : undefined;
    const multiplier = match[3]?.toLowerCase() === 'k' || match[3]?.toLowerCase() === 'thousand' ? 1000 : 1;
    
    return {
      min: min ? min * multiplier : undefined,
      max: max ? max * multiplier : undefined,
      currency: text.includes('$') ? 'USD' : undefined,
      period: match[4]?.toLowerCase()
    };
  }

  private extractDates(text: string): { postedDate: string; applicationDeadline: string } {
    const postedPattern = /posted:?\s*([^.|\n]+)/i;
    const deadlinePattern = /deadline:?\s*([^.|\n]+)/i;
    
    const postedMatch = text.match(postedPattern);
    const deadlineMatch = text.match(deadlinePattern);
    
    return {
      postedDate: postedMatch ? postedMatch[1].trim() : '',
      applicationDeadline: deadlineMatch ? deadlineMatch[1].trim() : ''
    };
  }

  private extractKeywords(text: string): string[] {
    const keywords: Set<string> = new Set();
    const keywordPatterns = [
      /\b(?:javascript|python|java|typescript|react|angular|vue|node|sql|aws|azure)\b/gi,
      /\b(?:senior|junior|lead|manager|architect|developer|engineer|analyst)\b/gi,
      /\b(?:agile|scrum|kanban|waterfall)\b/gi,
      /\b(?:bachelor'?s?|master'?s?|phd|degree)\b/gi
    ];
    
    keywordPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.toLowerCase()));
      }
    });
    
    return Array.from(keywords);
  }

  public parseJobDescription(text: string): JobDescription {
    const { postedDate, applicationDeadline } = this.extractDates(text);
    
    return {
      title: this.extractTitle(text),
      company: this.extractCompany(text),
      location: this.extractLocation(text),
      employmentType: this.extractEmploymentType(text),
      workMode: this.extractWorkMode(text),
      description: text,
      responsibilities: this.extractResponsibilities(text),
      requirements: this.extractRequirements(text),
      benefits: this.extractBenefits(text),
      salary: this.extractSalary(text),
      applicationDeadline,
      postedDate,
      keywords: this.extractKeywords(text),
      isActive: true
    };
  }
}
