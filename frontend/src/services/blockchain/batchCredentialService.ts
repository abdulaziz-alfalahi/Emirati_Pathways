import { batchDownloadService, BatchDownloadResult } from "./batch/batchDownloadService";
import { batchShareService } from "./batch/batchShareService";
import { batchRevokeService } from "./batch/batchRevokeService";

export interface BatchOperationResult {
  successful: string[];
  failed: { id: string; error: string }[];
  totalProcessed: number;
}

export type { BatchDownloadResult };

class BatchCredentialService {
  async batchDownload(credentialIds: string[], userId: string): Promise<BatchDownloadResult> {
    return batchDownloadService.downloadCredentials(credentialIds, userId);
  }

  async batchShare(credentialIds: string[], userId: string): Promise<BatchOperationResult> {
    return batchShareService.shareCredentials(credentialIds, userId);
  }

  async batchRevoke(credentialIds: string[], reason: string, revokerUserId: string): Promise<BatchOperationResult> {
    return batchRevokeService.revokeCredentials(credentialIds, reason, revokerUserId);
  }
}

export const batchCredentialService = new BatchCredentialService();
