
import { supabase } from "@/integrations/supabase/client";
import { BlockchainCredential, CredentialIssueRequest } from "@/types/blockchainCredentials";
import { auditLogger } from "./auditLogger";
import { credentialHashingService } from "./credentialHashingService";

class CredentialIssuerService {
  async issueCredential(request: CredentialIssueRequest): Promise<BlockchainCredential> {
    try {
      // Log the start of credential issuance
      await auditLogger.logOperation({
        user_id: request.issuerId,
        operation_type: 'issue',
        operation_details: {
          action: `Initiating credential issuance for ${request.title}`,
          target: request.recipientId,
          metadata: {
            credential_type: request.credentialType,
            title: request.title,
            skills: request.skills
          },
          result: 'pending'
        }
      });

      const credentialData = this.prepareCredentialData(request);
      const credentialHash = credentialHashingService.generateCredentialHash(credentialData);
      const blockchainData = credentialHashingService.generateBlockchainData(credentialHash);

      const blockchainCredential: BlockchainCredential = {
        ...credentialData,
        credential_hash: credentialHash,
        merkle_proof: blockchainData.merkleProof,
        block_number: blockchainData.blockNumber,
        transaction_hash: blockchainData.transactionHash,
        verification_status: 'verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('blockchain_credentials')
        .insert(blockchainCredential)
        .select()
        .single();

      if (error) throw error;

      await this.logSuccessfulIssuance(request, data, credentialHash, blockchainData);

      return data;
    } catch (error) {
      await this.logFailedIssuance(request, error);
      console.error('Error issuing blockchain credential:', error);
      throw error;
    }
  }

  private prepareCredentialData(request: CredentialIssueRequest) {
    return {
      id: crypto.randomUUID(),
      recipient_id: request.recipientId,
      issuer_id: request.issuerId,
      credential_type: request.credentialType,
      title: request.title,
      description: request.description,
      issued_date: new Date().toISOString(),
      metadata: request.metadata || {},
      skills: request.skills || []
    };
  }

  private async logSuccessfulIssuance(
    request: CredentialIssueRequest, 
    data: BlockchainCredential, 
    credentialHash: string, 
    blockchainData: any
  ) {
    await auditLogger.logOperation({
      user_id: request.issuerId,
      credential_id: data.id,
      operation_type: 'issue',
      operation_details: {
        action: `Successfully issued credential: ${request.title}`,
        target: request.recipientId,
        metadata: {
          credential_id: data.id,
          credential_hash: credentialHash,
          block_number: blockchainData.blockNumber
        },
        result: 'success'
      },
      transaction_hash: blockchainData.transactionHash,
      block_number: blockchainData.blockNumber
    });
  }

  private async logFailedIssuance(request: CredentialIssueRequest, error: unknown) {
    await auditLogger.logOperation({
      user_id: request.issuerId,
      operation_type: 'issue',
      operation_details: {
        action: `Failed to issue credential: ${request.title}`,
        target: request.recipientId,
        metadata: {
          credential_type: request.credentialType,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        result: 'failure',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

export const credentialIssuerService = new CredentialIssuerService();
