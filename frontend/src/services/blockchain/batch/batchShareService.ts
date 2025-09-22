
import { auditLogger } from "../auditLogger";

export interface BatchOperationResult {
  successful: string[];
  failed: { id: string; error: string }[];
  totalProcessed: number;
}

class BatchShareService {
  async shareCredentials(credentialIds: string[], userId: string): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      successful: [],
      failed: [],
      totalProcessed: credentialIds.length
    };

    try {
      const shareLinks: string[] = [];

      for (const credentialId of credentialIds) {
        try {
          const shareUrl = `${window.location.origin}/blockchain-credentials/verify?id=${credentialId}`;
          shareLinks.push(`${credentialId}: ${shareUrl}`);
          result.successful.push(credentialId);
        } catch (error) {
          result.failed.push({ 
            id: credentialId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      if (shareLinks.length > 0) {
        await this.executeShare(shareLinks);
        await this.logShareSuccess(userId, result);
      }

      return result;
    } catch (error) {
      await this.logShareFailure(userId, credentialIds, error);
      throw error;
    }
  }

  private async executeShare(shareLinks: string[]): Promise<void> {
    const shareText = `Verify my blockchain credentials:\n\n${shareLinks.join('\n')}`;
    
    if (navigator.share) {
      await navigator.share({
        title: `${shareLinks.length} Blockchain Credentials`,
        text: shareText
      });
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  }

  private async logShareSuccess(userId: string, result: BatchOperationResult): Promise<void> {
    await auditLogger.logOperation({
      user_id: userId,
      operation_type: 'share',
      operation_details: {
        action: `Batch shared ${result.successful.length} credentials`,
        metadata: {
          credential_count: result.successful.length,
          share_method: navigator.share ? 'native_share' : 'clipboard'
        },
        result: 'success'
      }
    });
  }

  private async logShareFailure(userId: string, credentialIds: string[], error: unknown): Promise<void> {
    await auditLogger.logOperation({
      user_id: userId,
      operation_type: 'share',
      operation_details: {
        action: 'Batch share failed',
        metadata: {
          credential_count: credentialIds.length
        },
        result: 'failure',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

export const batchShareService = new BatchShareService();
