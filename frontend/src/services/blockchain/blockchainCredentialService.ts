
import { BlockchainCredential, CredentialIssueRequest, VerificationResult } from "@/types/blockchainCredentials";
import { credentialIssuerService } from "./credentialIssuerService";
import { credentialReaderService } from "./credentialReaderService";
import { credentialVerifierService } from "./credentialVerifierService";
import { credentialRevokerService } from "./credentialRevokerService";

class BlockchainCredentialService {
  async issueCredential(request: CredentialIssueRequest): Promise<BlockchainCredential> {
    return credentialIssuerService.issueCredential(request);
  }

  async getUserCredentials(userId: string): Promise<BlockchainCredential[]> {
    return credentialReaderService.getUserCredentials(userId);
  }

  async verifyCredential(credentialId: string, verifierUserId?: string): Promise<VerificationResult> {
    return credentialVerifierService.verifyCredential(credentialId, verifierUserId);
  }

  async revokeCredential(credentialId: string, reason: string, revokerUserId: string): Promise<boolean> {
    return credentialRevokerService.revokeCredential(credentialId, reason, revokerUserId);
  }
}

export const blockchainCredentialService = new BlockchainCredentialService();
