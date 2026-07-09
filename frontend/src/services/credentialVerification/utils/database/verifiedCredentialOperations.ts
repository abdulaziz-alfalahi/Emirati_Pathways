import { retryMechanism } from "../retryMechanism";
import { integrationLogger } from "../logger";
import { VerifiedCredential } from "@/types/credentialVerification";

export class VerifiedCredentialOperations {
  async createVerifiedCredential(
    userId: string,
    credentialType: string,
    institutionName: string,
    credentialTitle: string,
    issueDate: string,
    verificationSource: string,
    metadata: any
  ): Promise<VerifiedCredential> {
    const operation = async () => {
      const { data, error } = await supabase
        .from('verified_credentials')
        .insert({
          user_id: userId,
          credential_type: credentialType,
          institution_name: institutionName,
          credential_title: credentialTitle,
          issue_date: issueDate,
          verification_source: verificationSource,
          verification_status: 'active',
          metadata: metadata
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create verified credential: ${error.message}`);
      }

      return data;
    };

    const result = await retryMechanism.executeWithRetry(
      operation,
      `createVerifiedCredential-${credentialType}`,
      {
        maxRetries: 2,
        baseDelayMs: 500,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED']
      }
    );

    if (result.success) {
      integrationLogger.logDebug(
        'VerifiedCredentialOperations',
        'createVerifiedCredential',
        'Verified credential created successfully',
        {
          additionalData: { 
            credentialId: result.data?.id,
            credentialType,
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      
      // Cast the database result to match the VerifiedCredential interface
      const credential: VerifiedCredential = {
        ...result.data!,
        credential_type: result.data!.credential_type as 'education' | 'employment' | 'certification',
        verification_status: result.data!.verification_status as 'active' | 'expired' | 'revoked',
        metadata: (result.data!.metadata as Record<string, any>) || {}
      };
      
      return credential;
    } else {
      integrationLogger.logError(
        'VerifiedCredentialOperations',
        'createVerifiedCredential',
        'Failed to create verified credential',
        result.error,
        {
          additionalData: { 
            credentialType,
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      throw result.error!;
    }
  }
}
