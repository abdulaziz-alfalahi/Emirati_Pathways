import {
  CredentialVerificationRequest,
  VerifiedCredential,
  EducationVerificationData,
  EmploymentVerificationData,
  CertificationVerificationData,
  VerificationResponse
} from "@/types/credentialVerification";

import { EducationVerifier } from "./verifiers/educationVerifier";
import { EmploymentVerifier } from "./verifiers/employment";
import { CertificationVerifier } from "./verifiers/certificationVerifier";

class CredentialVerificationService {
  private educationVerifier = new EducationVerifier();
  private employmentVerifier = new EmploymentVerifier();
  private certificationVerifier = new CertificationVerifier();

  async verifyEducationCredentials(
    userId: string,
    data: EducationVerificationData
  ): Promise<VerificationResponse> {
    return this.educationVerifier.verify(userId, data);
  }

  async verifyEmploymentCredentials(
    userId: string,
    data: EmploymentVerificationData
  ): Promise<VerificationResponse> {
    return this.employmentVerifier.verify(userId, data);
  }

  async verifyCertificationCredentials(
    userId: string,
    data: CertificationVerificationData
  ): Promise<VerificationResponse> {
    return this.certificationVerifier.verify(userId, data);
  }

  async getUserVerifiedCredentials(userId: string): Promise<VerifiedCredential[]> {
    try {
      const { data, error } = await supabase
        .from('verified_credentials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        credential_type: item.credential_type as 'education' | 'employment' | 'certification',
        verification_status: item.verification_status as 'active' | 'expired' | 'revoked',
        metadata: (item.metadata as Record<string, any>) || {}
      }));
    } catch (error) {
      console.error("Error fetching user credentials:", error);
      return [];
    }
  }

  async getUserVerificationRequests(userId: string): Promise<CredentialVerificationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('credential_verification_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        verification_type: item.verification_type as 'education' | 'employment' | 'certification',
        status: item.status as 'pending' | 'verified' | 'failed' | 'expired',
        request_data: (item.request_data as Record<string, any>) || {},
        response_data: (item.response_data as Record<string, any>) || undefined
      }));
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      return [];
    }
  }
}

export const credentialVerificationService = new CredentialVerificationService();
