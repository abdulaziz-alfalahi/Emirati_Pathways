
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface IntegrationLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  userId?: string;
  requestId?: string;
  message: string;
  error?: any;
  metadata?: Record<string, any>;
  duration?: number;
}

export interface LogMetadata {
  userId?: string;
  requestId?: string;
  error?: any;
  duration?: number;
  additionalData?: Record<string, any>;
}

export interface LogSummary {
  total: number;
  byLevel: Record<string, number>;
  byService: Record<string, number>;
  recentErrors: IntegrationLogEntry[];
}
