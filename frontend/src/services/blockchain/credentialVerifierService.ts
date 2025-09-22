
import { VerificationResult } from "@/types/blockchainCredentials";
import { auditLogger } from "./auditLogger";
import { credentialReaderService } from "./credentialReaderService";
import { credentialHashingService } from "./credentialHashingService";

class CredentialVerifierService {
  async verifyCredential(credentialId: string, verifierUserId?: string): Promise<VerificationResult> {
    try {
      // Log verification attempt
      if (verifierUserId) {
        await this.logVerificationAttempt(credentialId, verifierUserId);
      }

      const credential = await credentialReaderService.getCredentialById(credentialId);

      if (!credential) {
        const result = await this.handleCredentialNotFound(credentialId, verifierUserId);
        return result;
      }

      const isValid = this.validateCredentialHash(credential);
      const result = this.buildVerificationResult(credential, isValid);

      // Log verification result
      if (verifierUserId) {
        await this.logVerificationResult(credential, isValid, verifierUserId);
      }

      return result;
    } catch (error) {
      return await this.handleVerificationError(credentialId, verifierUserId, error);
    }
  }

  private async logVerificationAttempt(credentialId: string, verifierUserId: string) {
    await auditLogger.logOperation({
      user_id: verifierUserId,
      credential_id: credentialId,
      operation_type: 'verify',
      operation_details: {
        action: `Initiating verification for credential ${credentialId}`,
        result: 'pending'
      }
    });
  }

  private async handleCredentialNotFound(credentialId: string, verifierUserId?: string): Promise<VerificationResult> {
    const result = {
      isValid: false,
      status: 'not_found' as const,
      message: 'Credential not found'
    };

    if (verifierUserId) {
      await auditLogger.logOperation({
        user_id: verifierUserId,
        credential_id: credentialId,
        operation_type: 'verify',
        operation_details: {
          action: `Verification failed - credential not found`,
          result: 'failure',
          error_message: 'Credential not found in blockchain'
        }
      });
    }

    return result;
  }

  private validateCredentialHash(credential: any): boolean {
    const expectedHash = credentialHashingService.generateCredentialHash({
      id: credential.id,
      recipient_id: credential.recipient_id,
      issuer_id: credential.issuer_id,
      credential_type: credential.credential_type,
      title: credential.title,
      description: credential.description,
      issued_date: credential.issued_date,
      metadata: credential.metadata,
      skills: credential.skills
    });

    return expectedHash === credential.credential_hash;
  }

  private buildVerificationResult(credential: any, isValid: boolean): VerificationResult {
    return {
      isValid,
      status: isValid ? 'verified' : 'invalid',
      message: isValid ? 'Credential is valid and verified' : 'Credential hash verification failed',
      credential: isValid ? credential : undefined,
      verificationDetails: {
        blockNumber: credential.block_number,
        transactionHash: credential.transaction_hash,
        merkleProof: credential.merkle_proof,
        verifiedAt: new Date().toISOString()
      }
    };
  }

  private async logVerificationResult(credential: any, isValid: boolean, verifierUserId: string) {
    await auditLogger.logOperation({
      user_id: verifierUserId,
      credential_id: credential.id,
      operation_type: 'verify',
      operation_details: {
        action: `Verification ${isValid ? 'successful' : 'failed'} for credential ${credential.title}`,
        metadata: {
          credential_title: credential.title,
          verification_status: credential.verification_status,
          block_number: credential.block_number,
          hash_valid: isValid
        },
        result: isValid ? 'success' : 'failure'
      },
      transaction_hash: credential.transaction_hash,
      block_number: credential.block_number
    });
  }

  private async handleVerificationError(credentialId: string, verifierUserId: string | undefined, error: unknown): Promise<VerificationResult> {
    if (verifierUserId) {
      await auditLogger.logOperation({
        user_id: verifierUserId,
        credential_id: credentialId,
        operation_type: 'verify',
        operation_details: {
          action: 'Verification failed due to system error',
          result: 'failure',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }

    console.error('Error verifying credential:', error);
    return {
      isValid: false,
      status: 'error',
      message: 'Verification failed due to system error'
    };
  }
}

export const credentialVerifierService = new CredentialVerifierService();
