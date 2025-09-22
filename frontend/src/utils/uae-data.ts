// src/utils/uae-data.ts

// ---- Core data (readonly sources) ----
export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah'
] as const;

export const UAE_CITIES_BY_EMIRATE = {
  'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Zayed City', 'Ruwais', 'Liwa', 'Madinat Zayed'],
  'Dubai': [
    'Dubai City', 'Deira', 'Bur Dubai', 'Jumeirah', 'Dubai Marina',
    'Downtown Dubai', 'Business Bay', 'DIFC', 'JLT', 'Palm Jumeirah'
  ],
  'Sharjah': ['Sharjah City', 'Kalba', 'Khor Fakkan', 'Dibba Al-Hisn', 'Mleiha'],
  'Ajman': ['Ajman City', 'Manama', 'Masfout'],
  'Umm Al Quwain': ['Umm Al Quwain City', 'Falaj Al Mualla'],
  'Ras Al Khaimah': ['Ras Al Khaimah City', 'Julfar', 'Rams', 'Dhayah'],
  'Fujairah': ['Fujairah City', 'Dibba', 'Masafi', 'Bidiyah', 'Al Hayl']
} as const;

export const UAE_PHONE_PREFIXES = ['050', '052', '053', '054', '055', '056', '058'] as const;

// ---- Convenience (mutable) forms to avoid readonly → string[] assignment issues ----
/** Flattened cities list as a mutable array for components that require `string[]`. */
export const UAE_CITIES: string[] = Object.values(UAE_CITIES_BY_EMIRATE)
  .flat()
  .map((c) => c as string);

/** Mutable version of emirates list (if any consumer needs `string[]`). */
export const UAE_EMIRATES_LIST: string[] = [...UAE_EMIRATES];

/** Mutable version of phone prefixes (if needed). */
export const UAE_PHONE_PREFIXES_LIST: string[] = [...UAE_PHONE_PREFIXES];

// ---- Domain enumerations often used by the CV builder ----
export const UAE_LANGUAGES: string[] = [
  'Arabic', 'English', 'Hindi', 'Urdu', 'French', 'German', 'Spanish', 'Mandarin', 'Russian', 'Japanese'
];

export const UAE_INDUSTRIES: string[] = [
  'Government', 'Healthcare', 'Education', 'Finance', 'Technology', 'Construction', 'Energy',
  'Transportation', 'Hospitality', 'Retail', 'Manufacturing', 'Logistics', 'Media', 'Consulting'
];

export const UAE_EXPERIENCE_LEVELS: string[] = [
  'Internship', 'Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'
];

export const UAE_EDUCATION_LEVELS: string[] = [
  'High School', 'Diploma', 'Associate', 'Bachelor', 'Postgraduate Diploma', 'Master', 'Doctorate'
];

// ---- Utilities ----
export const getCitiesByEmirate = (emirate: string): string[] => {
  const cities = UAE_CITIES_BY_EMIRATE[emirate as keyof typeof UAE_CITIES_BY_EMIRATE];
  return cities ? [...(cities as readonly string[])] as string[] : [];
};

export const getEmirateByCity = (city: string): string | undefined => {
  // Widen tuple element type so `.includes(string)` is valid
  for (const [emirate, cities] of Object.entries(UAE_CITIES_BY_EMIRATE)) {
    const list = cities as unknown as string[]; // widen from readonly tuple of literals -> string[]
    if (list.includes(city)) return emirate;
  }
  return undefined;
};

export const isValidUAEEmirate = (emirate: string): boolean => {
  return UAE_EMIRATES_LIST.includes(emirate);
};

// Back-compat alias (some code imports validateUAEEmirate)
export const validateUAEEmirate = isValidUAEEmirate;

export const validateUAELocation = (emirate: string, city: string): boolean => {
  return getCitiesByEmirate(emirate).includes(city);
};

// Back-compat alias (some code imports isValidUAELocation)
export const isValidUAELocation = validateUAELocation;

export const validateUAELanguage = (lang: string): boolean => {
  return UAE_LANGUAGES.includes(lang);
};

// Skills helpers
export const getRecommendedSkills = (category: string): string[] => {
  const skillsByCategory: Record<string, string[]> = {
    Technical: [
      'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cloud Computing',
      'Cybersecurity', 'Blockchain', 'IoT Development', 'Digital Transformation',
      'Software Development', 'Web Development'
    ],
    Strategic: [
      'Strategic Planning', 'Innovation Management', 'Digital Strategy', 'Business Transformation',
      'Change Management', 'Future Planning', 'Sustainability Planning',
      'Smart City Development', 'Economic Diversification'
    ],
    Cultural: [
      'Arabic Language', 'Cultural Intelligence', 'Cross-cultural Communication',
      'UAE Business Culture', 'Islamic Finance', 'Regional Market Knowledge',
      'Diplomatic Relations', 'Heritage Preservation', 'Cultural Adaptation',
      'Multicultural Leadership'
    ],
    Soft: [
      'Leadership', 'Communication', 'Problem Solving', 'Team Management',
      'Project Management', 'Customer Service', 'Negotiation',
      'Presentation Skills', 'Time Management'
    ],
    Language: [
      'Arabic', 'English', 'Hindi', 'Urdu', 'French', 'German', 'Spanish', 'Mandarin', 'Russian', 'Japanese'
    ]
  };
  return skillsByCategory[category] || [];
};

export const formatUAEAddress = (emirate: string, city: string, address?: string): string => {
  const parts = [address, city, emirate, 'United Arab Emirates'].filter(Boolean);
  return parts.join(', ');
};

// ---- Market/demand data ----
export const UAE_HIGH_DEMAND_SKILLS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Cloud Computing',
  'Digital Marketing',
  'Project Management',
  'Strategic Planning',
  'Arabic Language',
  'Cultural Intelligence'
] as const;

export const UAE_SALARY_RANGES = {
  Beginner: { min: 3000, max: 8000 },
  Intermediate: { min: 8000, max: 15000 },
  Advanced: { min: 15000, max: 25000 },
  Expert: { min: 25000, max: 50000 }
} as const;

export const getSkillMarketDemand = (skillName: string): 'High' | 'Medium' | 'Low' => {
  const highDemandSkills = [
    'artificial intelligence', 'machine learning', 'data science', 'cybersecurity',
    'cloud computing', 'digital transformation', 'blockchain', 'arabic language',
    'cultural intelligence', 'strategic planning'
  ];
  const mediumDemandSkills = [
    'project management', 'digital marketing', 'web development', 'mobile development',
    'business analysis', 'quality assurance', 'customer service', 'sales'
  ];
  const s = (skillName || '').toLowerCase();
  if (highDemandSkills.some((k) => s.includes(k))) return 'High';
  if (mediumDemandSkills.some((k) => s.includes(k))) return 'Medium';
  return 'Low';
};

/**
 * calculateMarketDemand
 * - If passed a single skill name (string), returns a % based on that skill’s demand.
 * - If passed a CV-like object with `skills: { name: string }[]`, returns an averaged %.
 * This keeps compatibility with components calling `calculateMarketDemand(cvData)`.
 */
export const calculateMarketDemand = (
  input: string | { skills?: Array<{ name?: string }> } | null | undefined
): number => {
  const levelToPct = (level: 'High' | 'Medium' | 'Low') =>
    level === 'High' ? 85 : level === 'Medium' ? 60 : 30;

  if (typeof input === 'string') {
    return levelToPct(getSkillMarketDemand(input));
  }

  const skills = input?.skills ?? [];
  if (!skills.length) return 0;

  const total = skills.reduce((acc, s) => acc + levelToPct(getSkillMarketDemand(s.name ?? '')), 0);
  return Math.round(total / skills.length);
};

// Re-export to satisfy code importing UAE_STRATEGIC_SKILLS from uae-data
export { UAE_STRATEGIC_SKILLS } from '../types/cv';

// ---- Default export (for modules using default import) ----
export default {
  UAE_EMIRATES,
  UAE_EMIRATES_LIST,
  UAE_CITIES_BY_EMIRATE,
  UAE_CITIES,
  UAE_PHONE_PREFIXES,
  UAE_PHONE_PREFIXES_LIST,
  UAE_LANGUAGES,
  UAE_INDUSTRIES,
  UAE_EXPERIENCE_LEVELS,
  UAE_EDUCATION_LEVELS,
  getCitiesByEmirate,
  getEmirateByCity,
  isValidUAEEmirate,
  validateUAEEmirate,     // alias exported too
  validateUAELocation,
  isValidUAELocation,     // alias exported too
  validateUAELanguage,
  getRecommendedSkills,
  formatUAEAddress,
  UAE_HIGH_DEMAND_SKILLS,
  UAE_SALARY_RANGES,
  getSkillMarketDemand,
  calculateMarketDemand
};
