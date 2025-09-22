
import { supabase } from "@/integrations/supabase/client";
import { BlockchainCredential } from "@/types/blockchainCredentials";
import { auditLogger } from "../auditLogger";

export interface BatchDownloadResult {
  successful: string[];
  failed: { id: string; error: string }[];
  totalProcessed: number;
  downloadUrl?: string;
}

class BatchDownloadService {
  async downloadCredentials(credentialIds: string[], userId: string): Promise<BatchDownloadResult> {
    const result: BatchDownloadResult = {
      successful: [],
      failed: [],
      totalProcessed: credentialIds.length
    };

    try {
      const { data: credentials, error } = await supabase
        .from('blockchain_credentials')
        .select('*')
        .in('id', credentialIds)
        .eq('recipient_id', userId);

      if (error) throw error;

      const validCredentials: BlockchainCredential[] = [];
      
      for (const id of credentialIds) {
        const credential = credentials?.find(c => c.id === id);
        if (credential) {
          validCredentials.push(credential);
          result.successful.push(id);
        } else {
          result.failed.push({ id, error: 'Credential not found' });
        }
      }

      if (validCredentials.length > 0) {
        const batchData = {
          credentials: validCredentials,
          downloaded_at: new Date().toISOString(),
          batch_id: crypto.randomUUID(),
          download_format: 'JSON'
        };

        const blob = new Blob([JSON.stringify(batchData, null, 2)], {
          type: 'application/json'
        });

        result.downloadUrl = URL.createObjectURL(blob);

        await this.logDownloadSuccess(userId, validCredentials, batchData.batch_id, result);
      }

      return result;
    } catch (error) {
      await this.logDownloadFailure(userId, credentialIds, error);
      throw error;
    }
  }

  private async logDownloadSuccess(
    userId: string, 
    credentials: BlockchainCredential[], 
    batchId: string, 
    result: BatchDownloadResult
  ): Promise<void> {
    await auditLogger.logOperation({
      user_id: userId,
      operation_type: 'download',
      operation_details: {
        action: `Batch downloaded ${credentials.length} credentials`,
        metadata: {
          credential_count: credentials.length,
          successful_downloads: result.successful.length,
          failed_downloads: result.failed.length,
          batch_id: batchId
        },
        result: 'success'
      }
    });
  }

  private async logDownloadFailure(userId: string, credentialIds: string[], error: unknown): Promise<void> {
    await auditLogger.logOperation({
      user_id: userId,
      operation_type: 'download',
      operation_details: {
        action: 'Batch download failed',
        metadata: {
          credential_count: credentialIds.length
        },
        result: 'failure',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

export const batchDownloadService = new BatchDownloadService();
