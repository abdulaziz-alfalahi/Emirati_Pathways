
export type ScholarshipTable = {
  id: string;
  title: string;
  description: string | null;
  provider: string;
  provider_type: string;
  eligibility_criteria: Record<string, any> | null;
  amount: number | null;
  currency: string | null;
  application_deadline: string | null;
  requirements: string[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: string;
}

export type ScholarshipApplicationTable = {
  id: string;
  scholarship_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected';
  application_data: Record<string, any> | null;
  submitted_at: string;
  updated_at: string | null;
}

// Extend the Database interface to include our new tables
export type Database = {
  public: {
    Tables: {
      scholarships: {
        Row: ScholarshipTable;
        Insert: Omit<ScholarshipTable, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ScholarshipTable, 'id' | 'created_at' | 'updated_at'>>;
      };
      scholarship_applications: {
        Row: ScholarshipApplicationTable;
        Insert: Omit<ScholarshipApplicationTable, 'id' | 'submitted_at' | 'updated_at'>;
        Update: Partial<Omit<ScholarshipApplicationTable, 'id' | 'submitted_at' | 'updated_at'>>;
      };
    };
  };
};
