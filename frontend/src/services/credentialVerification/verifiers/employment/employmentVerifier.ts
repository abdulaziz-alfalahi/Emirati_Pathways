import { EmploymentVerificationData, VerificationResponse } from "@/types/credentialVerification";
import { EmploymentValidation } from "./employmentValidation";
import { EmploymentProcessor } from "./employmentProcessor";
import { integrationLogger } from "../../utils/logger";

export class EmploymentVerifier {
  private processor = new EmploymentProcessor();
  private readonly serviceName = 'EmploymentVerifier';

  async verify(userId: string, data: EmploymentVerificationData): Promise<VerificationResponse> {
    const requestId = crypto.randomUUID();

    try {
      integrationLogger.logInfo(
        this.serviceName,
        'verify',
        'Starting employment credential verification',
        {
          userId,
          requestId,
          additionalData: {
            employer: data.employer_name,
            position: data.job_title,
            startDate: data.start_date
          }
        }
      );

      // Validate input data
      EmploymentValidation.validateEmploymentData(data);

      // Process the verification
      return await this.processor.processVerification(userId, data, requestId);

    } catch (error) {
      integrationLogger.logError(
        this.serviceName,
        'verify',
        'Employment verification failed during initialization',
        error,
        {
          userId,
          requestId,
          additionalData: {
            employer: data.employer_name,
            position: data.job_title
          }
        }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        verification_id: requestId
      };
    }
  }
}
