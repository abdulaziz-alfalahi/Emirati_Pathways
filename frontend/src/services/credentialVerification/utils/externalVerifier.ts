import { supabase } from "@/integrations/supabase/client";
import { ExternalDatabaseConfig } from "@/types/credentialVerification";
import { VerificationResult } from "../types";
import { retryMechanism } from "./retryMechanism";
import { integrationLogger } from "./logger";

export class ExternalVerifier {
  async getDatabaseConfig(databaseName: string): Promise<ExternalDatabaseConfig | null> {
    const operation = async () => {
      const { data, error } = await supabase
        .from('external_database_configs')
        .select('*')
        .eq('database_name', databaseName)
        .eq('is_active', true)
        .single();

      if (error) {
        throw new Error(`Database config fetch failed: ${error.message}`);
      }
      
      return {
        ...data,
        authentication_type: data.authentication_type as 'oauth' | 'api_key' | 'certificate'
      };
    };

    const result = await retryMechanism.executeWithRetry(
      operation,
      `getDatabaseConfig-${databaseName}`,
      {
        maxRetries: 2, // Lower retries for config fetch
        baseDelayMs: 500
      }
    );

    if (result.success) {
      integrationLogger.logDebug(
        'ExternalVerifier',
        'getDatabaseConfig',
        `Database config retrieved successfully for ${databaseName}`,
        { additionalData: { attempts: result.attempts, duration: result.totalDuration } }
      );
      return result.data || null;
    } else {
      integrationLogger.logError(
        'ExternalVerifier',
        'getDatabaseConfig',
        `Failed to retrieve database config for ${databaseName}`,
        result.error,
        { additionalData: { attempts: result.attempts, duration: result.totalDuration } }
      );
      return null;
    }
  }

  async performExternalVerification(
    config: ExternalDatabaseConfig,
    verificationType: string,
    data: any
  ): Promise<VerificationResult> {
    const operation = async () => {
      console.log(`Simulating ${verificationType} verification with ${config.database_name}`);
      
      // Add timeout to the simulation delay
      const simulationPromise = new Promise(resolve => 
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );
      
      await retryMechanism.withTimeout(simulationPromise, config.timeout_seconds * 1000);
      
      // Simulate verification logic based on data
      const isValid = this.simulateVerification(verificationType, data);
      
      if (isValid) {
        return {
          success: true,
          data: {
            verified: true,
            verification_date: new Date().toISOString(),
            source: config.database_name,
            details: data
          }
        };
      } else {
        throw new Error('Credentials could not be verified with external database');
      }
    };

    const result = await retryMechanism.executeWithRetry(
      operation,
      `externalVerification-${verificationType}-${config.database_name}`,
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 8000,
        retryableErrors: [
          'NETWORK_ERROR',
          'TIMEOUT',
          'SERVICE_UNAVAILABLE',
          'RATE_LIMIT_EXCEEDED',
          'CONNECTION_REFUSED'
        ]
      }
    );

    if (result.success) {
      integrationLogger.logInfo(
        'ExternalVerifier',
        'performExternalVerification',
        `External verification successful for ${verificationType}`,
        {
          additionalData: { 
            source: config.database_name,
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      return result.data!;
    } else {
      integrationLogger.logError(
        'ExternalVerifier',
        'performExternalVerification',
        `External verification failed for ${verificationType}`,
        result.error,
        {
          additionalData: { 
            source: config.database_name,
            attempts: result.attempts,
            duration: result.totalDuration
          }
        }
      );
      return {
        success: false,
        error: result.error?.message || 'External verification failed'
      };
    }
  }

  private simulateVerification(verificationType: string, data: any): boolean {
    switch (verificationType) {
      case 'education':
        return data.emirates_id && data.institution_name && data.degree_type && data.graduation_year;
      case 'employment':
        return data.emirates_id && data.employer_name && data.job_title && data.start_date;
      case 'certification':
        return data.emirates_id && data.certification_name && data.issuing_organization && data.certification_number;
      default:
        return false;
    }
  }
}
