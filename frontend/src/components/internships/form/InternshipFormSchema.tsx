
import * as z from 'zod';

// Create schema for form validation
export const internshipFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  company: z.string().min(2, { message: "Company name is required" }),
  location: z.string().min(2, { message: "Location is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  industry: z.string().min(1, { message: "Industry is required" }),
  department: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  application_deadline: z.date(),
  is_paid: z.boolean().default(false),
  stipend_amount: z.string().transform((val) => val ? parseFloat(val) : undefined).optional(),
  currency: z.string().default("AED"),
  requirements: z.string().optional().transform(val => val ? val.split('\n').filter(Boolean) : undefined),
  skills_required: z.string().optional().transform(val => val ? val.split(',').map(skill => skill.trim()).filter(Boolean) : undefined),
  education_level: z.string().optional(),
  contact_email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  website_url: z.string().url({ message: "Invalid URL" }).optional().or(z.literal(''))
}).refine(data => {
  // If start_date and end_date are both provided, ensure end_date is after start_date
  if (data.start_date && data.end_date) {
    return data.end_date > data.start_date;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"]
});

export type InternshipFormValues = z.infer<typeof internshipFormSchema>;

export const defaultFormValues: Partial<InternshipFormValues> = {
  title: '',
  company: '',
  location: '',
  description: '',
  industry: '',
  department: '',
  is_paid: false,
  currency: 'AED',
  education_level: 'Undergraduate'
};
