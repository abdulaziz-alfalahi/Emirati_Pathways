
export interface Internship {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  start_date?: string;
  end_date?: string;
  application_deadline: string;
  is_paid: boolean;
  stipend_amount?: number;
  currency?: string;
  requirements?: string[];
  skills_required?: string[];
  industry: string;
  department?: string;
  education_level?: string;
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface InternshipApplication {
  id: string;
  internship_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  submitted_at: string;
  updated_at?: string;
  notes?: string;
  internship?: Internship;
}

export interface InternshipWithApplications extends Internship {
  applications: {
    pending: number;
    approved: number;
    rejected: number;
    withdrawn: number;
    total: number;
  };
}
