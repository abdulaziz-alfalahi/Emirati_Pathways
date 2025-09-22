// src/utils/validation.ts
import { z } from 'zod';

/* ---------------------------------------------------
 * BASIC VALIDATION SCHEMAS
 * --------------------------------------------------*/

export const emailSchema = z.string().email('Invalid email format');

// ✅ Renamed earlier: keep canonical name AND alias for compatibility
export const phoneSchema = z
  .string()
  .refine((phone) => {
    const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    // Common UAE mobile prefixes under +971 (adjust as needed)
    return /^\+971(50|52|53|54|55|56|58)\d{7}$/.test(cleaned);
  }, 'Invalid UAE phone number format');

// Back-compat alias (so imports using uaePhoneSchema still compile)
export const uaePhoneSchema = phoneSchema;

export const emiratesIdSchema = z
  .string()
  .refine((id) => {
    const cleaned = id.replace(/\D/g, '');
    return cleaned.length === 15 && cleaned.startsWith('784');
  }, 'Invalid Emirates ID format');

/* ---------------------------------------------------
 * UAE PHONE HELPERS
 * --------------------------------------------------*/

export const validateUAEPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  return /^\+971(50|52|53|54|55|56|58)\d{7}$/.test(cleaned);
};

export const formatUAEPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('971')) {
    const number = cleaned.substring(3);
    if (number.length >= 9) {
      return `+971 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 9)}`;
    }
  } else if (cleaned.startsWith('0')) {
    const number = cleaned.substring(1);
    if (number.length >= 9) {
      return `+971 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 9)}`;
    }
  } else if (cleaned.length >= 9 && !cleaned.startsWith('+')) {
    return `+971 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 9)}`;
  }

  return phone;
};

/* ---------------------------------------------------
 * EMIRATES ID HELPERS
 * --------------------------------------------------*/

export const validateEmiratesId = (id: string): boolean => {
  const cleaned = id.replace(/\D/g, '');
  return cleaned.length === 15 && cleaned.startsWith('784');
};

export const formatEmiratesId = (id: string): string => {
  const cleaned = id.replace(/\D/g, '');

  if (cleaned.length >= 15) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7, 14)}-${cleaned.substring(14, 15)}`;
  } else if (cleaned.length >= 11) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length >= 7) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length >= 3) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  }

  return cleaned;
};

/* ---------------------------------------------------
 * TEXT HELPERS
 * --------------------------------------------------*/

export const validateText = (text: string, minLength = 1, maxLength = 1000): boolean => {
  const t = text.trim();
  return t.length >= minLength && t.length <= maxLength;
};

export const sanitizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

/* ---------------------------------------------------
 * CV SECTION SCHEMAS
 * --------------------------------------------------*/

// ✅ Canonical schema (and export alias below for back-compat)
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phone: phoneSchema,
  emirate: z.string().min(1, 'Emirate is required'),
  city: z.string().min(1, 'City is required'),
  arabicFirstName: z.string().optional(),
  arabicLastName: z.string().optional(),
  emiratesId: emiratesIdSchema.optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  profileSummary: z.string().optional()
});

// Back-compat alias for old imports
export const cvPersonalInfoSchema = personalInfoSchema;

export const experienceSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrentJob: z.boolean(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  achievements: z.array(z.string()).optional()
});

export const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrentStudy: z.boolean(),
  gpa: z.string().optional(),
  fieldOfStudy: z.string().optional()
});

export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  category: z.string().min(1, 'Category is required'),
  isStrategic: z.boolean().optional()
});

// ✅ Fix: use `certifications` (plural) and make isNative optional
export const languageSchema = z.object({
  name: z.string().min(1, 'Language name is required'),
  proficiency: z.enum(['Basic', 'Conversational', 'Fluent', 'Native']),
  isNative: z.boolean().optional(),
  certifications: z.array(z.string()).optional(),
  certificationDate: z.string().optional(),
  testScore: z.string().optional()
});

/* ---------------------------------------------------
 * FIELD VALIDATION HELPERS
 * --------------------------------------------------*/

// Canonical function
export const validateCVField = (
  _fieldName: string,
  value: unknown,
  schema: z.ZodTypeAny
): { isValid: boolean; error?: string } => {
  const result = schema.safeParse(value);
  if (result.success) return { isValid: true };
  const first = result.error.issues[0];
  return { isValid: false, error: first?.message || 'Validation failed' };
};

// Back-compat alias (so imports using validateField still work)
export const validateField = validateCVField;

export const validatePersonalInfo = (data: unknown) =>
  validateCVField('personalInfo', data, personalInfoSchema);

export const validateExperience = (data: unknown) =>
  validateCVField('experience', data, experienceSchema);

export const validateEducation = (data: unknown) =>
  validateCVField('education', data, educationSchema);

export const validateSkill = (data: unknown) =>
  validateCVField('skill', data, skillSchema);

export const validateLanguage = (data: unknown) =>
  validateCVField('language', data, languageSchema);

// Convenience helper used in a few places
export const validateEmail = (value: string): boolean =>
  emailSchema.safeParse(value).success;

/* ---------------------------------------------------
 * DEFAULT EXPORT (optional convenience)
 * --------------------------------------------------*/

export default {
  emailSchema,
  phoneSchema,
  uaePhoneSchema,
  emiratesIdSchema,
  validateUAEPhone,
  formatUAEPhone,
  validateEmiratesId,
  formatEmiratesId,
  validateText,
  sanitizeText,
  personalInfoSchema,
  cvPersonalInfoSchema,
  experienceSchema,
  educationSchema,
  skillSchema,
  languageSchema,
  validateCVField,
  validateField,
  validatePersonalInfo,
  validateExperience,
  validateEducation,
  validateSkill,
  validateLanguage,
  validateEmail
};
