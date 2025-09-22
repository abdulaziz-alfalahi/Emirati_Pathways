
import { VerificationRequestOperations } from './verificationRequestOperations';
import { VerifiedCredentialOperations } from './verifiedCredentialOperations';
import { VerifiedCredential } from "@/types/credentialVerification";

export class DatabaseOperations {
  private verificationRequestOps = new VerificationRequestOperations();
  private verifiedCredentialOps = new VerifiedCredentialOperations();

  async createVerificationRequest(
    userId: string,
    databaseSource: string,
    verificationType: string,
    requestData: any
  ) {
    return this.verificationRequestOps.createVerificationRequest(
      userId,
      databaseSource,
      verificationType,
      requestData
    );
  }

  async updateVerificationRequestStatus(
    requestId: string,
    status: 'verified' | 'failed',
    responseData?: any
  ) {
    return this.verificationRequestOps.updateVerificationRequestStatus(
      requestId,
      status,
      responseData
    );
  }

  async createVerifiedCredential(
    userId: string,
    credentialType: string,
    institutionName: string,
    credentialTitle: string,
    issueDate: string,
    verificationSource: string,
    metadata: any
  ): Promise<VerifiedCredential> {
    return this.verifiedCredentialOps.createVerifiedCredential(
      userId,
      credentialType,
      institutionName,
      credentialTitle,
      issueDate,
      verificationSource,
      metadata
    );
  }
}
