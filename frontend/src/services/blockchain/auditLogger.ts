export interface AuditLogEntry {
  id?: string;
  user_id: string;
  credential_id?: string;
  operation_type: 'issue' | 'verify' | 'revoke' | 'view' | 'download' | 'share';
  operation_details: {
    action: string;
    target?: string;
    metadata?: Record<string, any>;
    result?: 'success' | 'failure' | 'pending';
    error_message?: string;
  };
  ip_address?: string;
  user_agent?: string;
  transaction_hash?: string;
  block_number?: number;
  gas_used?: number;
  timestamp: string;
}

export interface AuditFilter {
  user_id?: string;
  credential_id?: string;
  operation_type?: string;
  date_from?: string;
  date_to?: string;
  result?: string;
}

class AuditLogger {
  async logOperation(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      };

      // In a real implementation, this would go to a dedicated audit table
      console.log('Audit Log:', auditEntry);
      
      // Store in local storage for demo purposes
      this.storeLocalAuditLog(auditEntry);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async getAuditTrail(filter: AuditFilter = {}): Promise<AuditLogEntry[]> {
    try {
      // In a real implementation, this would query the audit table
      const logs = this.getLocalAuditLogs();
      
      return logs.filter(log => {
        if (filter.user_id && log.user_id !== filter.user_id) return false;
        if (filter.credential_id && log.credential_id !== filter.credential_id) return false;
        if (filter.operation_type && log.operation_type !== filter.operation_type) return false;
        if (filter.result && log.operation_details.result !== filter.result) return false;
        if (filter.date_from && log.timestamp < filter.date_from) return false;
        if (filter.date_to && log.timestamp > filter.date_to) return false;
        return true;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to retrieve audit trail:', error);
      return [];
    }
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    return this.getAuditTrail({ user_id: userId }).then(logs => logs.slice(0, limit));
  }

  async getCredentialHistory(credentialId: string): Promise<AuditLogEntry[]> {
    return this.getAuditTrail({ credential_id: credentialId });
  }

  private async getClientIP(): Promise<string> {
    try {
      // In a real implementation, this would get the actual client IP
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private storeLocalAuditLog(entry: AuditLogEntry): void {
    try {
      const existingLogs = this.getLocalAuditLogs();
      const newLogs = [{ ...entry, id: crypto.randomUUID() }, ...existingLogs];
      
      // Keep only the last 1000 logs
      const trimmedLogs = newLogs.slice(0, 1000);
      
      localStorage.setItem('blockchain_audit_logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to store audit log locally:', error);
    }
  }

  private getLocalAuditLogs(): AuditLogEntry[] {
    try {
      const logs = localStorage.getItem('blockchain_audit_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }
}

export const auditLogger = new AuditLogger();
