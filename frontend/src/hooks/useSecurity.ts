
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SecurityUtils, authRateLimiter, sensitiveRateLimiter } from '@/lib/security';

export interface SecurityMetrics {
  suspiciousActivity: number;
  rateLimitViolations: number;
  lastSecurityCheck: Date;
  securityScore: number;
}

export interface SecurityEvent {
  id: string;
  type: 'rate_limit' | 'suspicious_input' | 'unauthorized_access' | 'mfa_bypass_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  clientIP?: string;
  userAgent?: string;
  timestamp: Date;
}

export const useSecurity = () => {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    suspiciousActivity: 0,
    rateLimitViolations: 0,
    lastSecurityCheck: new Date(),
    securityScore: 100
  });
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const { user, roles } = useAuth();
  const { toast } = useToast();

  // Check if user has admin privileges for security monitoring
  const canAccessSecurityData = roles.some(role => 
    ['admin', 'super_user', 'platform_operator'].includes(role)
  );

  // Log security event
  const logSecurityEvent = useCallback(async (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setSecurityEvents(prev => [securityEvent, ...prev.slice(0, 99)]); // Keep last 100 events

    // Store in database if user is authenticated and has permissions
    if (user && canAccessSecurityData) {
      try {
        // TODO: Connect to Flask API - await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'security_event',
          resource: 'security_monitoring',
          details: {
            type: event.type,
            severity: event.severity,
            description: event.description,
            client_ip: event.clientIP,
            user_agent: event.userAgent
          },
          severity: event.severity,
          category: 'security_event'
        });
      } catch (error) {
        console.error('Failed to log security event:', error);
      }
    }

    // Show critical alerts to user
    if (event.severity === 'critical') {
      toast({
        title: 'Security Alert',
        description: event.description,
        variant: 'destructive'
      });
    }
  }, [user, canAccessSecurityData, toast]);

  // Check rate limits for authentication
  const checkAuthRateLimit = useCallback(async (identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    requiresCaptcha: boolean;
  }> => {
    const clientIP = await getClientIP();
    const result = await authRateLimiter.checkLimit(identifier, clientIP);

    if (!result.allowed) {
      await logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        description: `Authentication rate limit exceeded for ${SecurityUtils.hashForLogging(identifier)}`,
        clientIP
      });

      setSecurityMetrics(prev => ({
        ...prev,
        rateLimitViolations: prev.rateLimitViolations + 1,
        securityScore: Math.max(0, prev.securityScore - 5)
      }));
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      requiresCaptcha: result.requiresCaptcha
    };
  }, [logSecurityEvent]);

  // Check sensitive operation rate limits
  const checkSensitiveOperationLimit = useCallback(async (operation: string): Promise<boolean> => {
    if (!user) return false;

    const clientIP = await getClientIP();
    const result = await sensitiveRateLimiter.checkLimit(`${user.id}:${operation}`, clientIP);

    if (!result.allowed) {
      await logSecurityEvent({
        type: 'rate_limit',
        severity: 'high',
        description: `Sensitive operation rate limit exceeded: ${operation}`,
        clientIP
      });

      toast({
        title: 'Rate Limit Exceeded',
        description: 'Too many sensitive operations. Please wait before trying again.',
        variant: 'destructive'
      });

      return false;
    }

    return true;
  }, [user, logSecurityEvent, toast]);

  // Validate user input for security threats
  const validateInput = useCallback(async (input: string, context: string): Promise<{
    valid: boolean;
    threats: string[];
  }> => {
    const analysis = SecurityUtils.detectSuspiciousInput(input);
    
    if (analysis.suspicious) {
      const clientIP = await getClientIP();
      
      await logSecurityEvent({
        type: 'suspicious_input',
        severity: 'medium',
        description: `Suspicious input detected in ${context}: ${analysis.reasons.join(', ')}`,
        clientIP
      });

      setSecurityMetrics(prev => ({
        ...prev,
        suspiciousActivity: prev.suspiciousActivity + 1,
        securityScore: Math.max(0, prev.securityScore - 10)
      }));

      return {
        valid: false,
        threats: analysis.reasons
      };
    }

    return {
      valid: true,
      threats: []
    };
  }, [logSecurityEvent]);

  // Get client IP address
  const getClientIP = useCallback(async (): Promise<string> => {
    try {
      // In a real application, this would be provided by your server
      // For client-side, we can't reliably get the real IP
      return 'client-side';
    } catch {
      return 'unknown';
    }
  }, []);

  // Perform security audit
  const performSecurityAudit = useCallback(async () => {
    if (!canAccessSecurityData) return;

    setIsMonitoring(true);
    
    try {
      // Audit environment
      const envAudit = SecurityUtils.auditEnvironment();
      
      if (!envAudit.secure) {
        await logSecurityEvent({
          type: 'suspicious_input', // Using available type
          severity: 'medium',
          description: `Environment security issues: ${envAudit.issues.join(', ')}`
        });
      }

      // Check for recent security events
      const { data: recentAlerts } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('category', 'security_event')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentAlerts) {
        setSecurityMetrics(prev => ({
          ...prev,
          lastSecurityCheck: new Date(),
          securityScore: Math.max(50, 100 - (recentAlerts.length * 2))
        }));
      }

    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      setIsMonitoring(false);
    }
  }, [canAccessSecurityData, logSecurityEvent]);

  // Load security metrics on mount
  useEffect(() => {
    if (canAccessSecurityData) {
      performSecurityAudit();
      
      // Set up periodic security checks
      const interval = setInterval(performSecurityAudit, 10 * 60 * 1000); // Every 10 minutes
      
      return () => clearInterval(interval);
    }
  }, [canAccessSecurityData, performSecurityAudit]);

  // Monitor suspicious activity patterns
  const monitorActivity = useCallback(async (activity: {
    action: string;
    resource: string;
    success: boolean;
  }) => {
    if (!user) return;

    // Detect patterns that might indicate malicious activity
    const recentFailures = securityEvents.filter(event => 
      event.timestamp > new Date(Date.now() - 5 * 60 * 1000) && // Last 5 minutes
      event.type === 'unauthorized_access'
    ).length;

    if (!activity.success && recentFailures > 3) {
      await logSecurityEvent({
        type: 'unauthorized_access',
        severity: 'high',
        description: `Multiple failed ${activity.action} attempts detected for ${activity.resource}`
      });
    }
  }, [user, securityEvents, logSecurityEvent]);

  return {
    securityMetrics,
    securityEvents,
    isMonitoring,
    canAccessSecurityData,
    checkAuthRateLimit,
    checkSensitiveOperationLimit,
    validateInput,
    logSecurityEvent,
    performSecurityAudit,
    monitorActivity
  };
};
