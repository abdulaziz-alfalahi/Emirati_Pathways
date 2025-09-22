import { LogLevel, IntegrationLogEntry, LogMetadata, LogSummary } from './types';

export class LoggerCore {
  private logs: IntegrationLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private createLogEntry(
    level: LogLevel,
    service: string,
    operation: string,
    message: string,
    metadata?: LogMetadata
  ): IntegrationLogEntry {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      service,
      operation,
      message,
      userId: metadata?.userId,
      requestId: metadata?.requestId,
      error: metadata?.error,
      duration: metadata?.duration,
      metadata: metadata?.additionalData
    };
  }

  private addLog(entry: IntegrationLogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Always log to console for development
    this.logToConsole(entry);
  }

  private logToConsole(entry: IntegrationLogEntry): void {
    const consoleMessage = `[${entry.level.toUpperCase()}] ${entry.service}:${entry.operation} - ${entry.message}`;
    
    switch (entry.level) {
      case 'error':
        console.error(consoleMessage, entry.error || entry.metadata);
        break;
      case 'warn':
        console.warn(consoleMessage, entry.metadata);
        break;
      case 'info':
        console.info(consoleMessage, entry.metadata);
        break;
      case 'debug':
        console.debug(consoleMessage, entry.metadata);
        break;
    }
  }

  logError(
    service: string,
    operation: string,
    message: string,
    error: any,
    metadata?: LogMetadata
  ): void {
    this.addLog(this.createLogEntry('error', service, operation, message, {
      ...metadata,
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        ...error
      }
    }));
  }

  logWarning(
    service: string,
    operation: string,
    message: string,
    metadata?: LogMetadata
  ): void {
    this.addLog(this.createLogEntry('warn', service, operation, message, metadata));
  }

  logInfo(
    service: string,
    operation: string,
    message: string,
    metadata?: LogMetadata
  ): void {
    this.addLog(this.createLogEntry('info', service, operation, message, metadata));
  }

  logDebug(
    service: string,
    operation: string,
    message: string,
    metadata?: LogMetadata
  ): void {
    this.addLog(this.createLogEntry('debug', service, operation, message, metadata));
  }

  getRecentLogs(limit: number = 100): IntegrationLogEntry[] {
    return this.logs.slice(-limit);
  }

  getLogsByService(service: string, limit: number = 100): IntegrationLogEntry[] {
    return this.logs
      .filter(log => log.service === service)
      .slice(-limit);
  }

  getLogsByLevel(level: LogLevel, limit: number = 100): IntegrationLogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-limit);
  }

  getLogsByUser(userId: string, limit: number = 100): IntegrationLogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogSummary(): LogSummary {
    const byLevel: Record<string, number> = {};
    const byService: Record<string, number> = {};

    this.logs.forEach(log => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      byService[log.service] = (byService[log.service] || 0) + 1;
    });

    const recentErrors = this.logs
      .filter(log => log.level === 'error')
      .slice(-10);

    return {
      total: this.logs.length,
      byLevel,
      byService,
      recentErrors
    };
  }
}
