
import { supabase } from "@/integrations/supabase/client";
import { auditLogger } from "./auditLogger";

class CredentialRevokerService {
  async revokeCredential(credentialId: string, reason: string, revokerUserId: string): Promise<boolean> {
    try {
      // Log revocation attempt
      await auditLogger.logOperation({
        user_id: revokerUserId,
        credential_id: credentialId,
        operation_type: 'revoke',
        operation_details: {
          action: `Initiating credential revocation`,
          metadata: {
            revocation_reason: reason
          },
          result: 'pending'
        }
      });

      const { error } = await supabase
        .from('blockchain_credentials')
        .update({
          verification_status: 'revoked',
          revocation_reason: reason,
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', credentialId);

      const success = !error;

      // Log revocation result
      await auditLogger.logOperation({
        user_id: revokerUserId,
        credential_id: credentialId,
        operation_type: 'revoke',
        operation_details: {
          action: success ? 'Credential successfully revoked' : 'Failed to revoke credential',
          metadata: {
            revocation_reason: reason,
            revoked_at: new Date().toISOString()
          },
          result: success ? 'success' : 'failure',
          error_message: error?.message
        }
      });

      return success;
    } catch (error) {
      await auditLogger.logOperation({
        user_id: revokerUserId,
        credential_id: credentialId,
        operation_type: 'revoke',
        operation_details: {
          action: 'Revocation failed due to system error',
          metadata: {
            revocation_reason: reason
          },
          result: 'failure',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      console.error('Error revoking credential:', error);
      return false;
    }
  }
}

export const credentialRevokerService = new CredentialRevokerService();
