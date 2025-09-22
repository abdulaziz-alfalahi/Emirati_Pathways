/**
 * Centralized Audit Logging Service
 * Provides comprehensive audit trail for all system operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const auditLogSchema = z.object({
  action: z.enum([
    'create', 'read', 'update', 'delete', 
    'login', 'logout', 'failed_login', 
    'permission_denied', 'rate_limit_exceeded',
    'validation_failed', 'file_upload', 'file_download',
    'password_change', 'email_change', 'role_change'
  ]),
  resource: z.string().min(1).max(100),
  resourceId: z.string().uuid().optional(),
  details: z.record(z.unknown()).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.enum([
    'authentication', 'authorization', 'data_access', 
    'data_modification', 'system_access', 'security_event'
  ]).default('data_access')
});

const auditQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0)
});

// Rate limiting for audit log queries
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private maxRequests: number = 100, private windowMs: number = 60000) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter(100, 60000);

// Security alert thresholds
const SECURITY_THRESHOLDS = {
  failed_login_attempts: 5,
  rate_limit_violations: 10,
  permission_denials: 20,
  suspicious_time_window: 5 * 60 * 1000 // 5 minutes
};

// Check for security patterns
async function detectSecurityPatterns(
  supabase: any, 
  userId: string | null, 
  ipAddress: string | null, 
  action: string
): Promise<{ alerts: string[], riskLevel: string }> {
  const alerts: string[] = [];
  let riskLevel = 'low';

  if (!userId && !ipAddress) return { alerts, riskLevel };

  const fiveMinutesAgo = new Date(Date.now() - SECURITY_THRESHOLDS.suspicious_time_window).toISOString();

  try {
    // Check for multiple failed login attempts
    if (action === 'failed_login') {
      const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'failed_login')
        .gte('created_at', fiveMinutesAgo)
        .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`);

      if (count && count >= SECURITY_THRESHOLDS.failed_login_attempts) {
        alerts.push(`Multiple failed login attempts detected: ${count} attempts in 5 minutes`);
        riskLevel = 'high';
      }
    }

    // Check for rate limit violations
    if (action === 'rate_limit_exceeded') {
      const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'rate_limit_exceeded')
        .gte('created_at', fiveMinutesAgo)
        .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`);

      if (count && count >= SECURITY_THRESHOLDS.rate_limit_violations) {
        alerts.push(`Excessive rate limit violations: ${count} violations in 5 minutes`);
        riskLevel = 'critical';
      }
    }

    // Check for permission denials
    if (action === 'permission_denied') {
      const { count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'permission_denied')
        .gte('created_at', fiveMinutesAgo)
        .or(`user_id.eq.${userId},ip_address.eq.${ipAddress}`);

      if (count && count >= SECURITY_THRESHOLDS.permission_denials) {
        alerts.push(`Multiple permission denials: ${count} denials in 5 minutes`);
        riskLevel = 'high';
      }
    }

  } catch (error) {
    console.error('Error detecting security patterns:', error);
  }

  return { alerts, riskLevel };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = req.headers.get('user-agent');

    // GET: Query audit logs (admin only)
    if (req.method === 'GET') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization header required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(role => 
        ['administrator', 'super_user', 'platform_operator'].includes(role.role)
      );

      if (!isAdmin) {
        // Log unauthorized access attempt
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'permission_denied',
          resource: 'audit_logs',
          details: JSON.stringify({ attempted_action: 'read_audit_logs' }),
          ip_address: clientIP,
          user_agent: userAgent?.substring(0, 500),
          severity: 'high',
          category: 'authorization',
          created_at: new Date().toISOString()
        });

        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rate limiting for admin queries
      if (!rateLimiter.isAllowed(user.id)) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse query parameters
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      
      const validationResult = auditQuerySchema.safeParse(queryParams);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({ error: 'Invalid query parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const query = validationResult.data;

      // Build query
      let auditQuery = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(query.offset, query.offset + query.limit - 1);

      if (query.userId) auditQuery = auditQuery.eq('user_id', query.userId);
      if (query.action) auditQuery = auditQuery.eq('action', query.action);
      if (query.resource) auditQuery = auditQuery.eq('resource', query.resource);
      if (query.severity) auditQuery = auditQuery.eq('severity', query.severity);
      if (query.startDate) auditQuery = auditQuery.gte('created_at', query.startDate);
      if (query.endDate) auditQuery = auditQuery.lte('created_at', query.endDate);

      const { data: auditLogs, error: queryError } = await auditQuery;

      if (queryError) {
        console.error('Audit query error:', queryError);
        return new Response(
          JSON.stringify({ error: 'Failed to query audit logs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          logs: auditLogs,
          pagination: {
            offset: query.offset,
            limit: query.limit,
            total: auditLogs.length
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST: Create audit log entry
    if (req.method === 'POST') {
      // Parse request body
      let requestBody;
      try {
        requestBody = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate input
      const validationResult = auditLogSchema.safeParse(requestBody);
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        return new Response(
          JSON.stringify({ error: 'Validation failed', details: errors }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validatedData = validationResult.data;

      // Extract user ID from auth if available
      let userId: string | null = null;
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        userId = user?.id || null;
      }

      // Create audit log entry
      const auditEntry = {
        user_id: userId,
        action: validatedData.action,
        resource: validatedData.resource,
        resource_id: validatedData.resourceId || null,
        details: JSON.stringify(validatedData.details || {}),
        ip_address: clientIP,
        user_agent: userAgent?.substring(0, 500),
        severity: validatedData.severity,
        category: validatedData.category,
        created_at: new Date().toISOString()
      };

      const { data: createdLog, error: insertError } = await supabase
        .from('audit_logs')
        .insert(auditEntry)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create audit log:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create audit log' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for security patterns
      const { alerts, riskLevel } = await detectSecurityPatterns(
        supabase, userId, clientIP, validatedData.action
      );

      // Create security alerts if needed
      if (alerts.length > 0) {
        await supabase.from('security_alerts').insert({
          user_id: userId,
          ip_address: clientIP,
          risk_level: riskLevel,
          alerts: JSON.stringify(alerts),
          created_at: new Date().toISOString()
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          logId: createdLog.id,
          securityAlerts: alerts,
          riskLevel
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});