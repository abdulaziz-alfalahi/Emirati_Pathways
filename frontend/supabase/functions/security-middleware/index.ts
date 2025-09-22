/**
 * Security Middleware Edge Function
 * Implements comprehensive API protection, rate limiting, and security headers
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for API security
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip, user-agent',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Security headers
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', 
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'X-DNS-Prefetch-Control': 'off'
};

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5, blockDurationMs: 30 * 60 * 1000 },
  api: { windowMs: 60 * 1000, maxRequests: 100, blockDurationMs: 5 * 60 * 1000 },
  sensitive: { windowMs: 60 * 1000, maxRequests: 5, blockDurationMs: 60 * 60 * 1000 }
};

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; firstRequest: number; blockedUntil?: number }>();

// IP-based suspicious activity tracking
const suspiciousIPs = new Set<string>();
const failedAttempts = new Map<string, number>();

class SecurityMiddleware {
  private supabase: any;

  constructor() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Extract client IP from request headers
  getClientIP(req: Request): string {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const remoteAddr = req.headers.get('remote-addr');
    
    return forwardedFor?.split(',')[0]?.trim() || 
           realIP || 
           remoteAddr || 
           'unknown';
  }

  // Check rate limits
  async checkRateLimit(identifier: string, limitType: keyof typeof RATE_LIMITS): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    blocked: boolean;
  }> {
    const config = RATE_LIMITS[limitType];
    const now = Date.now();
    const key = `${limitType}:${identifier}`;
    
    let record = rateLimitStore.get(key);
    
    // Reset if window expired
    if (!record || now - record.firstRequest > config.windowMs) {
      record = { count: 0, firstRequest: now };
      rateLimitStore.set(key, record);
    }

    // Check if blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockedUntil,
        blocked: true
      };
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > config.maxRequests) {
      record.blockedUntil = now + config.blockDurationMs;
      
      // Log rate limit violation
      await this.logSecurityEvent({
        type: 'rate_limit_exceeded',
        identifier,
        limitType,
        count: record.count,
        ip: identifier.includes(':') ? identifier.split(':')[1] : undefined
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockedUntil,
        blocked: true
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.firstRequest + config.windowMs,
      blocked: false
    };
  }

  // Detect suspicious input patterns
  detectSuspiciousInput(input: string): { suspicious: boolean; patterns: string[] } {
    const patterns = [
      { name: 'SQL Injection', regex: /(\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bunion\b|[\'"]\s*(or|and)\s*[\'"]/i },
      { name: 'XSS', regex: /<script|javascript:|on\w+\s*=/i },
      { name: 'Path Traversal', regex: /\.\.[\/\\]/i },
      { name: 'Command Injection', regex: /[;&|`$(){}]/i },
      { name: 'NoSQL Injection', regex: /\$where|\$regex|\$ne|\$gt|\$lt/i }
    ];

    const detected = patterns.filter(pattern => pattern.regex.test(input));
    
    return {
      suspicious: detected.length > 0,
      patterns: detected.map(p => p.name)
    };
  }

  // Validate request security
  async validateRequest(req: Request): Promise<{
    valid: boolean;
    issues: string[];
    requiresCaptcha: boolean;
    blockRequest: boolean;
  }> {
    const issues: string[] = [];
    const clientIP = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';
    
    // Check if IP is marked as suspicious
    if (suspiciousIPs.has(clientIP)) {
      issues.push('Request from suspicious IP address');
    }

    // Validate User-Agent
    if (!userAgent || userAgent.length < 10) {
      issues.push('Invalid or missing User-Agent');
    }

    // Check for suspicious User-Agent patterns
    const suspiciousUAPatterns = [
      /bot|crawler|spider|scraper/i,
      /curl|wget|httpie/i,
      /python-requests|axios|fetch/i
    ];

    if (suspiciousUAPatterns.some(pattern => pattern.test(userAgent))) {
      issues.push('Automated request detected');
    }

    // Check request body for suspicious content
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const body = await req.clone().text();
        if (body) {
          const inputAnalysis = this.detectSuspiciousInput(body);
          if (inputAnalysis.suspicious) {
            issues.push(`Suspicious input patterns: ${inputAnalysis.patterns.join(', ')}`);
            
            // Log security incident
            await this.logSecurityEvent({
              type: 'suspicious_input',
              ip: clientIP,
              userAgent,
              patterns: inputAnalysis.patterns,
              content: body.substring(0, 200) // Log first 200 chars only
            });
          }
        }
      } catch (error) {
        console.error('Error analyzing request body:', error);
      }
    }

    // Track failed attempts per IP
    const failureCount = failedAttempts.get(clientIP) || 0;
    
    return {
      valid: issues.length === 0,
      issues,
      requiresCaptcha: failureCount > 3 || issues.length > 1,
      blockRequest: failureCount > 10 || suspiciousIPs.has(clientIP)
    };
  }

  // Log security events
  async logSecurityEvent(event: any): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        action: 'security_event',
        resource: 'api_security',
        details: event,
        severity: this.getSeverity(event.type),
        category: 'security_event',
        ip_address: event.ip,
        user_agent: event.userAgent,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Determine event severity
  getSeverity(eventType: string): string {
    const severityMap: Record<string, string> = {
      'rate_limit_exceeded': 'medium',
      'suspicious_input': 'high',
      'blocked_request': 'high',
      'authentication_failure': 'medium',
      'unauthorized_access': 'high'
    };
    
    return severityMap[eventType] || 'low';
  }

  // Handle authentication failures
  async handleAuthFailure(clientIP: string): Promise<void> {
    const currentFailures = failedAttempts.get(clientIP) || 0;
    const newFailureCount = currentFailures + 1;
    
    failedAttempts.set(clientIP, newFailureCount);
    
    // Mark IP as suspicious after 5 failures
    if (newFailureCount >= 5) {
      suspiciousIPs.add(clientIP);
      
      await this.logSecurityEvent({
        type: 'suspicious_ip_detected',
        ip: clientIP,
        failureCount: newFailureCount
      });
    }
  }

  // Create secure response with headers
  createSecureResponse(body: any, status: number = 200, additionalHeaders: Record<string, string> = {}): Response {
    const headers = {
      ...corsHeaders,
      ...securityHeaders,
      ...additionalHeaders,
      'Content-Type': 'application/json'
    };

    return new Response(JSON.stringify(body), { status, headers });
  }
}

// Main handler
Deno.serve(async (req) => {
  const middleware = new SecurityMiddleware();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clientIP = middleware.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || '';

    // Validate request security
    const validation = await middleware.validateRequest(req);
    
    if (validation.blockRequest) {
      return middleware.createSecureResponse(
        { 
          error: 'Request blocked for security reasons',
          code: 'SECURITY_BLOCK'
        }, 
        403
      );
    }

    // Determine rate limit type based on endpoint
    let limitType: keyof typeof RATE_LIMITS = 'api';
    if (url.pathname.includes('/auth/')) {
      limitType = 'auth';
    } else if (url.pathname.includes('/admin/') || url.pathname.includes('/secure/')) {
      limitType = 'sensitive';
    }

    // Check rate limits
    const rateLimitResult = await middleware.checkRateLimit(`${clientIP}:${userAgent}`, limitType);
    
    if (!rateLimitResult.allowed) {
      return middleware.createSecureResponse(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        429,
        {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': RATE_LIMITS[limitType].maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
        }
      );
    }

    // If validation issues exist but not blocking, require additional verification
    if (!validation.valid) {
      return middleware.createSecureResponse(
        {
          error: 'Additional verification required',
          code: 'VERIFICATION_REQUIRED',
          issues: validation.issues,
          requiresCaptcha: validation.requiresCaptcha
        },
        400
      );
    }

    // Return success response with security headers
    return middleware.createSecureResponse(
      {
        success: true,
        message: 'Security middleware validation passed',
        rateLimitRemaining: rateLimitResult.remaining,
        securityHeaders: Object.keys(securityHeaders)
      },
      200,
      {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-Security-Score': validation.valid ? '100' : '50'
      }
    );

  } catch (error) {
    console.error('Security middleware error:', error);
    
    return middleware.createSecureResponse(
      {
        error: 'Internal security error',
        code: 'SECURITY_ERROR'
      },
      500
    );
  }
});