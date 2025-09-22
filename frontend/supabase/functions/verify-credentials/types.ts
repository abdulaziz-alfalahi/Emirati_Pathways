
export interface VerificationRequest {
  verification_type: 'education' | 'employment' | 'certification';
  database_source: string;
  data: Record<string, any>;
  user_id: string;
}

export interface VerificationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface DatabaseConfig {
  id: string;
  database_name: string;
  api_endpoint: string;
  authentication_type: 'oauth' | 'api_key' | 'certificate';
  is_active: boolean;
  rate_limit_per_minute: number;
  timeout_seconds: number;
}
