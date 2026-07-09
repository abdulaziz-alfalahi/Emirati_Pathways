import { retryMechanism } from "../retryMechanism";
import { integrationLogger } from "../logger";

export class VerificationRequestOperations {
  async createVerificationRequest(
    userId: string,
    databaseSource: string,
    verificationType: string,
    requestData: any
  ) {
    const operation = async () => {
      const { data, error } = await supabase
        .from('credential_verification_requests')
        .insert({
          user_id: userId,
          database_source: databaseSource,
          verification_type: verificationType,
          request_data: requestData,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create verification request: ${error.message}`);
      }

      return data;
    };

    const result = await retryMechanism.executeWithRetry(
      operation,
      `createVerificationRequest-${verificationType}`,
      {
        maxRetries: 2,
        baseDelayMs: 500,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED']
      }
    );

    if (result.success) {
      integrationLogger.logDebug(
        'VerificationRequestOperations',
        'createVerificationRequest',
        'Verification request created successfully',
        {
          additionalData: { 
            requestId: result.data?.id,
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      return result.data!;
    } else {
      integrationLogger.logError(
        'VerificationRequestOperations',
        'createVerificationRequest',
        'Failed to create verification request',
        result.error,
        {
          additionalData: { 
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      throw result.error!;
    }
  }

  async updateVerificationRequestStatus(
    requestId: string,
    status: 'verified' | 'failed',
    responseData?: any
  ) {
    const operation = async () => {
      const updateData: any = {
        status,
        response_data: responseData,
        updated_at: new Date().toISOString()
      };

      if (status === 'verified') {
        updateData.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('credential_verification_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) {
        throw new Error(`Failed to update verification request: ${error.message}`);
      }

      return true;
    };

    const result = await retryMechanism.executeWithRetry(
      operation,
      `updateVerificationRequestStatus-${requestId}`,
      {
        maxRetries: 2,
        baseDelayMs: 500,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED']
      }
    );

    if (result.success) {
      integrationLogger.logDebug(
        'VerificationRequestOperations',
        'updateVerificationRequestStatus',
        `Verification request updated to ${status}`,
        {
          additionalData: { 
            requestId,
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      return result.data!;
    } else {
      integrationLogger.logError(
        'VerificationRequestOperations',
        'updateVerificationRequestStatus',
        'Failed to update verification request status',
        result.error,
        {
          additionalData: { 
            requestId,
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      throw result.error!;
    }
  }
}
