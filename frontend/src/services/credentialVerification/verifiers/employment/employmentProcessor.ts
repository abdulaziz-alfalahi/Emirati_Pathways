import { EmploymentVerificationData, VerificationResponse } from "@/types/credentialVerification";
import { RateLimiter } from "../../utils/rateLimiter";
import { DatabaseOperations } from "../../utils/database";
import { ExternalVerifier } from "../../utils/externalVerifier";
import { integrationLogger } from "../../utils/logger";

export class EmploymentProcessor {
  private rateLimiter = new RateLimiter();
  private dbOps = new DatabaseOperations();
  private externalVerifier = new ExternalVerifier();
  private readonly serviceName = 'EmploymentProcessor';

  async processVerification(
    userId: string, 
    data: EmploymentVerificationData, 
    requestId: string
  ): Promise<VerificationResponse> {
    const startTime = Date.now();

    try {
      // Check rate limiting
      await this.checkRateLimit(userId, requestId);

      // Create verification request
      const request = await this.createVerificationRequest(userId, data, requestId);

      // Get database configuration
      const config = await this.getDatabaseConfig(userId, requestId);

      // Perform external verification
      const verificationResult = await this.performExternalVerification(
        config, data, userId, requestId, startTime
      );

      // Process verification result
      return await this.processVerificationResult(
        verificationResult, request, userId, data, requestId, startTime
      );

    } catch (error) {
      integrationLogger.logError(
        this.serviceName,
        'processVerification',
        'Employment verification process failed with unexpected error',
        error,
        {
          userId,
          requestId,
          duration: Date.now() - startTime,
          additionalData: {
            employer: data.employer_name,
            position: data.job_title
          }
        }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        verification_id: ''
      };
    }
  }

  private async checkRateLimit(userId: string, requestId: string): Promise<void> {
    try {
      await this.rateLimiter.checkRateLimit('uae_employment_authority');
      integrationLogger.logDebug(
        this.serviceName,
        'rate_limit_check',
        'Rate limit check passed',
        { userId, requestId }
      );
    } catch (rateLimitError) {
      integrationLogger.logError(
        this.serviceName,
        'rate_limit_check',
        'Rate limit exceeded for employment verification',
        rateLimitError,
        { userId, requestId }
      );
      throw rateLimitError;
    }
  }

  private async createVerificationRequest(
    userId: string, 
    data: EmploymentVerificationData, 
    requestId: string
  ) {
    try {
      const request = await this.dbOps.createVerificationRequest(
        userId,
        'uae_employment_authority',
        'employment',
        data
      );
      integrationLogger.logDebug(
        this.serviceName,
        'create_request',
        'Verification request created successfully',
        {
          userId,
          requestId,
          additionalData: { verificationRequestId: request.id }
        }
      );
      return request;
    } catch (dbError) {
      integrationLogger.logError(
        this.serviceName,
        'create_request',
        'Failed to create verification request in database',
        dbError,
        { userId, requestId }
      );
      throw dbError;
    }
  }

  private async getDatabaseConfig(userId: string, requestId: string) {
    try {
      const config = await this.externalVerifier.getDatabaseConfig('uae_employment_authority');
      if (!config) {
        throw new Error('Employment database configuration not found');
      }
      integrationLogger.logDebug(
        this.serviceName,
        'get_config',
        'Database configuration retrieved successfully',
        { userId, requestId }
      );
      return config;
    } catch (configError) {
      integrationLogger.logError(
        this.serviceName,
        'get_config',
        'Failed to retrieve database configuration',
        configError,
        { userId, requestId }
      );
      throw new Error('Employment database configuration not found');
    }
  }

  private async performExternalVerification(
    config: any, 
    data: EmploymentVerificationData, 
    userId: string, 
    requestId: string, 
    startTime: number
  ) {
    try {
      const verificationResult = await this.externalVerifier.performExternalVerification(
        config,
        'employment',
        data
      );
      integrationLogger.logInfo(
        this.serviceName,
        'external_verification',
        `External verification ${verificationResult.success ? 'succeeded' : 'failed'}`,
        {
          userId,
          requestId,
          duration: Date.now() - startTime,
          additionalData: {
            success: verificationResult.success,
            databaseSource: config.database_name
          }
        }
      );
      return verificationResult;
    } catch (verificationError) {
      integrationLogger.logError(
        this.serviceName,
        'external_verification',
        'External verification service call failed',
        verificationError,
        { userId, requestId, duration: Date.now() - startTime }
      );
      throw verificationError;
    }
  }

  private async processVerificationResult(
    verificationResult: any,
    request: any,
    userId: string,
    data: EmploymentVerificationData,
    requestId: string,
    startTime: number
  ): Promise<VerificationResponse> {
    if (verificationResult.success) {
      return await this.handleSuccessfulVerification(
        verificationResult, request, userId, data, requestId, startTime
      );
    } else {
      return await this.handleFailedVerification(
        verificationResult, request, userId, data, requestId, startTime
      );
    }
  }

  private async handleSuccessfulVerification(
    verificationResult: any,
    request: any,
    userId: string,
    data: EmploymentVerificationData,
    requestId: string,
    startTime: number
  ): Promise<VerificationResponse> {
    try {
      await this.dbOps.updateVerificationRequestStatus(request.id, 'verified', verificationResult.data);
      
      const credential = await this.dbOps.createVerifiedCredential(
        userId,
        'employment',
        data.employer_name,
        data.job_title,
        data.start_date,
        'uae_employment_authority',
        verificationResult.data
      );

      integrationLogger.logInfo(
        this.serviceName,
        'verification_complete',
        'Employment verification completed successfully',
        {
          userId,
          requestId,
          duration: Date.now() - startTime,
          additionalData: {
            credentialId: credential.id,
            employer: data.employer_name,
            position: data.job_title
          }
        }
      );

      return {
        success: true,
        data: credential,
        verification_id: request.id
      };
    } catch (dbUpdateError) {
      integrationLogger.logError(
        this.serviceName,
        'update_verification',
        'Failed to update verification status or create credential',
        dbUpdateError,
        { userId, requestId, duration: Date.now() - startTime }
      );
      throw dbUpdateError;
    }
  }

  private async handleFailedVerification(
    verificationResult: any,
    request: any,
    userId: string,
    data: EmploymentVerificationData,
    requestId: string,
    startTime: number
  ): Promise<VerificationResponse> {
    try {
      await this.dbOps.updateVerificationRequestStatus(request.id, 'failed', verificationResult.error);
      
      integrationLogger.logWarning(
        this.serviceName,
        'verification_failed',
        'Employment verification failed - external source could not verify credentials',
        {
          userId,
          requestId,
          duration: Date.now() - startTime,
          additionalData: {
            reason: verificationResult.error,
            employer: data.employer_name
          }
        }
      );

      return {
        success: false,
        error: verificationResult.error || 'Verification failed',
        verification_id: request.id
      };
    } catch (dbUpdateError) {
      integrationLogger.logError(
        this.serviceName,
        'update_verification_failed',
        'Failed to update verification request status for failed verification',
        dbUpdateError,
        { userId, requestId, duration: Date.now() - startTime }
      );
      throw dbUpdateError;
    }
  }
}
