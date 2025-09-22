
export interface VerificationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
}
