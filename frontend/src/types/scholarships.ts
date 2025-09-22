
export interface Scholarship {
  id: string;
  title: string;
  description?: string;
  provider: string;
  provider_type: string; // 'government', 'private_sector', 'university'
  eligibility_criteria?: Record<string, any>;
  amount?: number;
  currency?: string;
  application_deadline?: string;
  requirements?: string[];
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  created_by: string;
}

export interface Application {
  id: string;
  scholarship_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected';
  application_data?: Record<string, any>;
  submitted_at: string;
  updated_at?: string;
  scholarship?: Scholarship;
}

export interface ScholarshipWithApplications extends Scholarship {
  applications: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
}
