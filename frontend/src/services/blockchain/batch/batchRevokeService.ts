
import { supabase } from "@/integrations/supabase/client";
import { auditLogger } from "../auditLogger";

export interface BatchOperationResult {
  successful: string[];
  failed: { id: string; error: string }[];
  totalProcessed: number;
}

class BatchRevokeService {
  async revokeCredentials(credentialIds: string[], reason: string, revokerUserId: string): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      successful: [],
      failed: [],
      totalProcessed: credentialIds.length
    };

    try {
      for (const credentialId of credentialIds) {
        try {
          const { error } = await supabase
            .from('blockchain_credentials')
            .update({
              verification_status: 'revoked',
              revocation_reason: reason,
              revoked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', credentialId);

          if (error) {
            result.failed.push({ id: credentialId, error: error.message });
          } else {
            result.successful.push(credentialId);
          }
        } catch (error) {
          result.failed.push({ 
            id: credentialId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      await this.logRevocationResult(revokerUserId, reason, credentialIds, result);
      return result;
    } catch (error) {
      await this.logRevocationFailure(revokerUserId, reason, credentialIds, error);
      throw error;
    }
  }

  private async logRevocationResult(
    revokerUserId: string, 
    reason: string, 
    credentialIds: string[], 
    result: BatchOperationResult
  ): Promise<void> {
    await auditLogger.logOperation({
      user_id: revokerUserId,
      operation_type: 'revoke',
      operation_details: {
        action: `Batch revoked ${result.successful.length} credentials`,
        metadata: {
          revocation_reason: reason,
          credential_count: credentialIds.length,
          successful_revocations: result.successful.length,
          failed_revocations: result.failed.length
        },
        result: result.successful.length > 0 ? 'success' : 'failure'
      }
    });
  }

  private async logRevocationFailure(
    revokerUserId: string, 
    reason: string, 
    credentialIds: string[], 
    error: unknown
  ): Promise<void> {
    await auditLogger.logOperation({
      user_id: revokerUserId,
      operation_type: 'revoke',
      operation_details: {
        action: 'Batch revocation failed',
        metadata: {
          revocation_reason: reason,
          credential_count: credentialIds.length
        },
        result: 'failure',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

export const batchRevokeService = new BatchRevokeService();
