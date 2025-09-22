
import { LoggerCore } from './loggerCore';
import { LogLevel, IntegrationLogEntry, LogMetadata, LogSummary } from './types';

export class IntegrationLogger extends LoggerCore {
  private static instance: IntegrationLogger;

  private constructor() {
    super();
  }

  static getInstance(): IntegrationLogger {
    if (!IntegrationLogger.instance) {
      IntegrationLogger.instance = new IntegrationLogger();
    }
    return IntegrationLogger.instance;
  }
}

export const integrationLogger = IntegrationLogger.getInstance();

// Re-export types for convenience
export type { LogLevel, IntegrationLogEntry, LogMetadata, LogSummary };
