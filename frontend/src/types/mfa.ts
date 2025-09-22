
export type MFAFactor = {
  id: string;
  factor_type: 'totp' | 'phone';
  friendly_name?: string;
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
};

export type MFAChallenge = {
  id: string;
  type: 'totp' | 'phone';
  expires_at: number;
};

export type MFASettings = {
  enabled: boolean;
  required: boolean;
  factors: MFAFactor[];
  backup_codes?: string[];
  recovery_email?: string;
};

export type MFASetupStep = 'select_method' | 'configure_totp' | 'configure_phone' | 'verify' | 'backup_codes' | 'complete';

export type MFAMethod = 'totp' | 'sms' | 'email';

export type MFARequirement = 'none' | 'optional' | 'required' | 'progressive';

export type RoleMFAConfig = {
  role: string;
  requirement: MFARequirement;
  enforced_methods?: MFAMethod[];
  grace_period_hours?: number;
};

export type ProgressiveMFATrigger = {
  action: string;
  threshold?: number;
  condition: string;
  mfa_required: boolean;
};

export type MFAStatus = {
  enabled: boolean;
  required: boolean;
  grace_period_remaining?: number;
  setup_required: boolean;
  available_methods: MFAMethod[];
  verified_factors: MFAFactor[];
};
