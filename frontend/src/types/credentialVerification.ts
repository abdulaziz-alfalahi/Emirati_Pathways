
export interface ExternalDatabaseConfig {
  id: string;
  database_name: string;
  api_endpoint: string;
  authentication_type: 'oauth' | 'api_key' | 'certificate';
  is_active: boolean;
  rate_limit_per_minute: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface CredentialVerificationRequest {
  id: string;
  user_id: string;
  database_source: string;
  verification_type: 'education' | 'employment' | 'certification';
  request_data: Record<string, any>;
  status: 'pending' | 'verified' | 'failed' | 'expired';
  response_data?: Record<string, any>;
  verified_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VerifiedCredential {
  id: string;
  user_id: string;
  credential_type: 'education' | 'employment' | 'certification';
  institution_name: string;
  credential_title: string;
  issue_date?: string;
  expiry_date?: string;
  credential_number?: string;
  verification_source: string;
  verification_status: 'active' | 'expired' | 'revoked';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EducationVerificationData {
  emirates_id: string;
  institution_name: string;
  degree_type: string;
  field_of_study: string;
  graduation_year: number;
  gpa?: number;
}

export interface EmploymentVerificationData {
  emirates_id: string;
  employer_name: string;
  job_title: string;
  start_date: string;
  end_date?: string;
  salary_range?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship';
}

export interface CertificationVerificationData {
  emirates_id: string;
  certification_name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  certification_number: string;
}

export interface VerificationResponse {
  success: boolean;
  data?: VerifiedCredential;
  error?: string;
  verification_id: string;
}
