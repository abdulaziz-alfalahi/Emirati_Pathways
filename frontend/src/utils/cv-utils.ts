// Clean CV Utilities - No Duplicate Exports
// Location: emirati-journey-platform/src/utils/cv-utils.ts

import { CV, PersonalInfo, Experience, Education, Skill } from '@/types/cv';
import { UAE_HIGH_DEMAND_SKILLS, UAE_SALARY_RANGES } from './uae-data';

/* -------------------------------------------------------
 * Helpers
 * ----------------------------------------------------- */
const rankByLevel: Record<Skill['level'], number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
  Expert: 3,
};

const safeDate = (value?: string) => (value ? new Date(value) : undefined);

/**
 * Format a date range like "Sep 2021 – Present" or "Jan 2020 – May 2023".
 * Matches components that import `formatDateRange` from cv-utils.
 */
export const formatDateRange = (
  startDate: string,
  endDate?: string,
  isCurrent?: boolean,
  locale = 'en'
): string => {
  const start = safeDate(startDate);
  const end = isCurrent ? undefined : safeDate(endDate);

  if (!start) return '';

  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
  const startStr = fmt.format(start);
  const endStr = isCurrent ? 'Present' : end ? fmt.format(end) : '';

  return endStr ? `${startStr} – ${endStr}` : startStr;
};

/* -------------------------------------------------------
 * CV Completion Scoring
 * ----------------------------------------------------- */
export const calculateCompletionScore = (cvData: Partial<CV>): number => {
  if (!cvData) return 0;

  const weights = {
    personal_info: 25,
    professional_summary: 20,
    experience: 25,
    education: 15,
    skills: 10,
    languages: 5,
  } as const;

  let totalScore = 0;

  // Personal Info Score
  if (cvData.personalInfo) {
    const personalInfo = cvData.personalInfo;
    const requiredFields: (keyof PersonalInfo)[] = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'emirate',
      'city',
    ];
    const optionalFields: (keyof PersonalInfo)[] = [
      'arabicFirstName',
      'arabicLastName',
      'emiratesId',
      'linkedinUrl',
      'portfolioUrl',
    ];

    const requiredCompleted = requiredFields.filter((f) => !!personalInfo[f]).length;
    const optionalCompleted = optionalFields.filter((f) => !!personalInfo[f]).length;

    const personalScore =
      (requiredCompleted / requiredFields.length) * 0.8 +
      (optionalCompleted / optionalFields.length) * 0.2;

    totalScore += personalScore * weights.personal_info;
  }

  // Professional Summary Score
  const summary = cvData.personalInfo?.profileSummary ?? '';
  if (summary) {
    if (summary.length > 100) totalScore += weights.professional_summary;
    else if (summary.length > 50) totalScore += weights.professional_summary * 0.7;
    else totalScore += weights.professional_summary * 0.3;
  }

  // Experience Score
  if (cvData.experience && cvData.experience.length > 0) {
    const experiences = cvData.experience;
    const avgCompleteness =
      experiences.reduce((acc, exp) => {
        const requiredFields: (keyof Experience)[] = ['company', 'jobTitle', 'startDate', 'description'];
        const completedFields = requiredFields.filter((f) => !!exp[f]).length;
        return acc + completedFields / requiredFields.length;
      }, 0) / experiences.length;

    totalScore += avgCompleteness * weights.experience;
  }

  // Education Score
  if (cvData.education && cvData.education.length > 0) {
    const edus = cvData.education;
    const avgCompleteness =
      edus.reduce((acc, edu) => {
        const requiredFields: (keyof Education)[] = ['institution', 'degree', 'fieldOfStudy', 'startDate'];
        const completedFields = requiredFields.filter((f) => !!edu[f]).length;
        return acc + completedFields / requiredFields.length;
      }, 0) / edus.length;

    totalScore += avgCompleteness * weights.education;
  }

  // Skills Score
  if (cvData.skills && cvData.skills.length > 0) {
    const skillsScore = Math.min(cvData.skills.length / 8, 1); // Optimal: 8+ skills
    totalScore += skillsScore * weights.skills;
  }

  // Languages Score
  if (cvData.languages && cvData.languages.length > 0) {
    const languagesScore = Math.min(cvData.languages.length / 3, 1); // Optimal: 3+ languages
    totalScore += languagesScore * weights.languages;
  }

  return Math.round(totalScore);
};

/* -------------------------------------------------------
 * Suggestions
 * ----------------------------------------------------- */
export const generateCVSuggestions = (cvData: Partial<CV>): string[] => {
  const suggestions: string[] = [];
  if (!cvData) return suggestions;

  // Personal Info Suggestions
  if (!cvData.personalInfo?.emiratesId) {
    suggestions.push('Add your Emirates ID to verify UAE nationality');
  }
  if (!cvData.personalInfo?.linkedinUrl) {
    suggestions.push('Add your LinkedIn profile to increase credibility');
  }
  if (!cvData.personalInfo?.arabicFirstName) {
    suggestions.push('Consider adding your Arabic name for local employers');
  }

  // Professional Summary Suggestions
  if (!cvData.personalInfo?.profileSummary || cvData.personalInfo.profileSummary.length < 100) {
    suggestions.push('Expand your professional summary to 150-300 words');
  }

  // Experience Suggestions
  if (!cvData.experience || cvData.experience.length === 0) {
    suggestions.push('Add your work experience to showcase your career progression');
  } else if (cvData.experience.length < 2) {
    suggestions.push('Add more work experiences to demonstrate career growth');
  }

  // Skills Suggestions
  if (!cvData.skills || cvData.skills.length < 5) {
    suggestions.push('Add more skills to increase your marketability (aim for 8-12 skills)');
  }

  const hasHighDemandSkills = cvData.skills?.some((s) => UAE_HIGH_DEMAND_SKILLS.includes(s.name as any));
  if (!hasHighDemandSkills) {
    suggestions.push('Consider adding high-demand skills like AI, Data Science, or Digital Marketing');
  }

  // Languages Suggestions
  if (!cvData.languages || cvData.languages.length < 2) {
    suggestions.push('Add language skills - multilingual candidates are highly valued in UAE');
  }

  const hasArabic = cvData.languages?.some((lang) => lang.name === 'Arabic');
  if (!hasArabic) {
    suggestions.push('Consider adding Arabic language skills for government and local companies');
  }

  return suggestions.slice(0, 5);
};

/* -------------------------------------------------------
 * Section Validation
 * ----------------------------------------------------- */
export const validateCVSection = (
  sectionName: string,
  sectionData: unknown
): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (sectionName) {
    case 'personalInfo': {
      const d = sectionData as CV['personalInfo'];
      if (!d?.firstName) errors.push('First name is required');
      if (!d?.lastName) errors.push('Last name is required');
      if (!d?.email) errors.push('Email is required');
      if (!d?.phone) errors.push('Phone number is required');
      if (!d?.emirate) errors.push('Emirate is required');
      if (!d?.city) errors.push('City is required');

      if (!d?.emiratesId) warnings.push('Emirates ID recommended for UAE nationals');
      if (!d?.linkedinUrl) warnings.push('LinkedIn profile recommended');
      break;
    }

    case 'experience': {
      const arr = sectionData as Experience[] | undefined;
      if (!Array.isArray(arr) || arr.length === 0) {
        errors.push('At least one work experience is required');
      } else {
        arr.forEach((exp, i) => {
          if (!exp.company) errors.push(`Experience ${i + 1}: Company name is required`);
          if (!exp.jobTitle) errors.push(`Experience ${i + 1}: Job title is required`);
          if (!exp.description) errors.push(`Experience ${i + 1}: Description is required`);
        });
      }
      break;
    }

    case 'education': {
      const arr = sectionData as Education[] | undefined;
      if (!Array.isArray(arr) || arr.length === 0) {
        errors.push('At least one education entry is required');
      } else {
        arr.forEach((edu, i) => {
          if (!edu.institution) errors.push(`Education ${i + 1}: Institution is required`);
          if (!edu.degree) errors.push(`Education ${i + 1}: Degree is required`);
          if (!edu.fieldOfStudy) errors.push(`Education ${i + 1}: Field of study is required`);
        });
      }
      break;
    }

    case 'skills': {
      const arr = sectionData as Skill[] | undefined;
      if (!Array.isArray(arr) || arr.length < 3) {
        warnings.push('Add more skills to improve your profile (recommended: 8+ skills)');
      }
      break;
    }

    case 'languages': {
      const arr = sectionData as CV['languages'] | undefined;
      if (!Array.isArray(arr) || arr.length < 1) {
        warnings.push('Add at least one language (Arabic is a strong advantage)');
      }
      break;
    }

    default:
      break;
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/* -------------------------------------------------------
 * Strengths & Weaknesses
 * ----------------------------------------------------- */
export const getCVStrengths = (cvData: Partial<CV>): string[] => {
  const strengths: string[] = [];
  if (!cvData) return strengths;

  // UAE National Status
  if (cvData.personalInfo?.emiratesId) {
    strengths.push('UAE National - Priority hiring advantage');
  }

  // Experience Strengths
  if (cvData.experience && cvData.experience.length > 3) {
    strengths.push('Rich professional experience with diverse background');
  }

  // Education Strengths
  if (cvData.education?.some((e) => e.degree?.includes('Master') || e.degree?.includes('PhD'))) {
    strengths.push('Advanced education credentials');
  }

  // Skills Strengths
  const highDemandCount = cvData.skills?.filter((s) => UAE_HIGH_DEMAND_SKILLS.includes(s.name as any)).length ?? 0;
  if (highDemandCount > 3) {
    strengths.push(`${highDemandCount} high-demand skills aligned with UAE market needs`);
  }

  // Language Strengths
  if (cvData.languages && cvData.languages.length > 2) {
    strengths.push("Multilingual capabilities - valuable in UAE's diverse market");
  }
  if (cvData.languages?.some((l) => l.name === 'Arabic')) {
    strengths.push('Arabic language skills - advantage for local and government positions');
  }

  // Professional Links
  if (cvData.personalInfo?.linkedinUrl && cvData.personalInfo?.portfolioUrl) {
    strengths.push('Strong online professional presence');
  }

  return strengths;
};

export const getCVWeaknesses = (cvData: Partial<CV>): string[] => {
  const weaknesses: string[] = [];
  if (!cvData) return ['No CV data available'];

  if (!cvData.experience || cvData.experience.length === 0) {
    weaknesses.push('No work experience listed');
  }
  if (!cvData.education || cvData.education.length === 0) {
    weaknesses.push('No education background provided');
  }
  if (!cvData.skills || cvData.skills.length < 5) {
    weaknesses.push('Limited skills listed - add more to improve marketability');
  }
  if (!cvData.personalInfo?.profileSummary || cvData.personalInfo.profileSummary.length < 100) {
    weaknesses.push('Professional summary needs expansion');
  }
  if (!cvData.personalInfo?.emiratesId) {
    weaknesses.push('Emirates ID not provided - may limit opportunities for UAE nationals');
  }
  if (!cvData.languages?.some((l) => l.name === 'Arabic')) {
    weaknesses.push('Arabic language skills not listed - valuable for UAE market');
  }

  return weaknesses.slice(0, 5);
};

/* -------------------------------------------------------
 * Salary Estimation Utilities (uses UAE_SALARY_RANGES)
 * ----------------------------------------------------- */
export const estimateSalaryForSkillLevel = (level: Skill['level']) => {
  return UAE_SALARY_RANGES[level];
};

export const estimateSalaryForSkillset = (skills: Skill[] = []) => {
  if (skills.length === 0) return undefined;
  const strongest = skills.reduce<Skill['level']>(
    (best, curr) => (rankByLevel[curr.level] > rankByLevel[best] ? curr.level : best),
    'Beginner'
  );
  return estimateSalaryForSkillLevel(strongest);
};

/* -------------------------------------------------------
 * Export Formatting
 * ----------------------------------------------------- */
type ExportOptions = {
  language?: 'en' | 'ar' | 'bilingual';
  optimizeForATS?: boolean;
};

export const formatCVForExport = (cvData: Partial<CV>, options: ExportOptions = {}) => {
  if (!cvData) return null;

  const formatted: Partial<CV> & {
    export_metadata: {
      generated_at: string;
      format_version: string;
      optimized_for: string;
      language: string;
      ats_optimized: boolean;
    };
  } = {
    ...cvData,
    export_metadata: {
      generated_at: new Date().toISOString(),
      format_version: '1.0',
      optimized_for: 'UAE Job Market',
      language: options.language ?? 'en',
      ats_optimized: options.optimizeForATS ?? true,
    },
  };

  // Normalize phone number spacing for export
  if (formatted.personalInfo?.phone) {
    formatted.personalInfo.phone = formatted.personalInfo.phone.replace(/\s+/g, ' ');
  }

  // Sort experience by start date (most recent first)
  if (formatted.experience) {
    formatted.experience = [...formatted.experience].sort(
      (a: Experience, b: Experience) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  // Sort education by start date (most recent first)
  if (formatted.education) {
    formatted.education = [...formatted.education].sort(
      (a: Education, b: Education) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  return formatted;
};
