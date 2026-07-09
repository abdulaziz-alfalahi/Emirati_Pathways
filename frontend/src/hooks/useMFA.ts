import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MFAFactor, MFAChallenge, MFAStatus, MFARequirement } from '@/types/mfa';

export const useMFA = () => {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<MFAChallenge | null>(null);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({
    enabled: false,
    required: false,
    setup_required: false,
    available_methods: ['totp', 'sms'],
    verified_factors: []
  });
  // FIXED: Initial loading state should be false to match test expectations
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, roles } = useAuth();
  const { toast } = useToast();

  // Determine MFA requirement based on user roles
  const getMFARequirement = useCallback((): MFARequirement => {
    const adminRoles = ['admin', 'super_user', 'platform_operator'];
    const sensitiveRoles = ['training_center', 'assessment_center', 'recruiter'];
    
    if (roles.some(role => adminRoles.includes(role))) {
      return 'required';
    } else if (roles.some(role => sensitiveRoles.includes(role))) {
      return 'optional';
    }
    return 'none';
  }, [roles]);

  // Load MFA factors and status
  const loadMFAData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // TODO: Connect to Flask API - const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;

      const verifiedFactors = data.all.filter(factor => factor.status === 'verified');
      const requirement = getMFARequirement();
      
      setFactors(data.all as MFAFactor[]);
      setMfaStatus({
        enabled: verifiedFactors.length > 0,
        required: requirement === 'required',
        setup_required: requirement === 'required' && verifiedFactors.length === 0,
        available_methods: ['totp', 'sms'],
        verified_factors: verifiedFactors as MFAFactor[],
        grace_period_remaining: requirement === 'required' && verifiedFactors.length === 0 ? 24 : undefined
      });
    } catch (error: any) {
      console.error('Failed to load MFA data:', error);
      toast({
        title: 'MFA Error',
        description: 'Failed to load multi-factor authentication settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, getMFARequirement, toast]);

  // Create MFA challenge
  const createChallenge = useCallback(async (factorId?: string): Promise<MFAChallenge | null> => {
    if (!user || factors.length === 0) return null;
    
    const targetFactor = factorId 
      ? factors.find(f => f.id === factorId)
      : factors.find(f => f.status === 'verified');
    
    if (!targetFactor) return null;
    
    try {
      // TODO: Connect to Flask API - const { data, error } = await supabase.auth.mfa.challenge({ factorId: targetFactor.id });
      
      if (error) throw error;

      const challenge: MFAChallenge = {
        id: data.id,
        type: targetFactor.factor_type,
        expires_at: Date.now() + (5 * 60 * 1000) // 5 minutes
      };
      
      setActiveChallenge(challenge);
      return challenge;
    } catch (error: any) {
      toast({
        title: 'Challenge Failed',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  }, [user, factors, toast]);

  // Verify MFA challenge
  const verifyChallenge = useCallback(async (
    challengeId: string, 
    code: string, 
    factorId: string
  ): Promise<boolean> => {
    try {
      // TODO: Connect to Flask API - const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });

      if (error) throw error;

      setActiveChallenge(null);
      return true;
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Check if MFA is required for a specific action
  const isMFARequired = useCallback((action?: string): boolean => {
    const requirement = getMFARequirement();
    
    // Always required for admin roles
    if (requirement === 'required') return true;
    
    // Progressive MFA for sensitive actions
    const sensitiveActions = [
      'admin_access',
      'financial_data_access',
      'user_management',
      'system_settings',
      'credential_issuance',
      'bulk_operations'
    ];
    
    if (action && sensitiveActions.includes(action)) {
      return requirement !== 'none';
    }
    
    return false;
  }, [getMFARequirement]);

  // Enforce MFA for sensitive operations
  const requireMFA = useCallback(async (action?: string): Promise<boolean> => {
    if (!isMFARequired(action)) return true;
    
    if (mfaStatus.verified_factors.length === 0) {
      toast({
        title: 'MFA Required',
        description: 'Please set up multi-factor authentication to continue',
        variant: 'destructive'
      });
      return false;
    }
    
    // Create challenge for verification
    const challenge = await createChallenge();
    return challenge !== null;
  }, [isMFARequired, mfaStatus.verified_factors.length, createChallenge, toast]);

  // Initialize MFA data on component mount
  useEffect(() => {
    if (user) {
      loadMFAData();
    }
  }, [user, loadMFAData]);

  return {
    factors,
    activeChallenge,
    mfaStatus,
    isLoading,
    loadMFAData,
    createChallenge,
    verifyChallenge,
    isMFARequired,
    requireMFA,
    getMFARequirement
  };
};

