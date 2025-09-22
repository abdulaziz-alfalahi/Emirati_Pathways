/**
 * Validation Middleware Service
 * Provides centralized validation and sanitization for all API endpoints
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generic validation request schema
const validationRequestSchema = z.object({
  schemaType: z.enum([
    'email', 'phone', 'uuid', 'url', 'sanitizedText', 'richText',
    'fileUpload', 'userProfile', 'scholarshipApplication', 
    'assessmentSubmission', 'financialGoal', 'pagination'
  ]),
  data: z.unknown(),
  options: z.record(z.unknown()).optional()
});

// Dynamic schema creation based on type
function createValidationSchema(schemaType: string, options: any = {}) {
  switch (schemaType) {
    case 'email':
      return z.string().email('Invalid email format').toLowerCase().trim();
    
    case 'phone':
      return z.string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
        .transform((val) => val.replace(/\D/g, ''));
    
    case 'uuid':
      return z.string().uuid('Invalid UUID format');
    
    case 'url':
      return z.string().url('Invalid URL format').refine((url) => {
        const allowedProtocols = ['http:', 'https:'];
        try {
          const parsed = new URL(url);
          return allowedProtocols.includes(parsed.protocol);
        } catch {
          return false;
        }
      }, 'Only HTTP and HTTPS URLs are allowed');
    
    case 'sanitizedText':
      const minLength = options.minLength || 1;
      const maxLength = options.maxLength || 500;
      return z.string()
        .min(minLength, `Text must be at least ${minLength} characters`)
        .max(maxLength, `Text cannot exceed ${maxLength} characters`)
        .trim()
        .transform((val) => val.replace(/[<>{}]/g, '').replace(/\s+/g, ' '));
    
    case 'richText':
      const richMaxLength = options.maxLength || 10000;
      return z.string()
        .max(richMaxLength, `Content cannot exceed ${richMaxLength} characters`)
        .refine((val) => {
          const dangerousPatterns = [
            /<script/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i, /<object/i, /<embed/i
          ];
          return !dangerousPatterns.some(pattern => pattern.test(val));
        }, 'Content contains potentially unsafe elements');
    
    case 'fileUpload':
      return z.object({
        filename: z.string()
          .min(1, 'Filename is required')
          .max(255, 'Filename too long')
          .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
        size: z.number()
          .min(1, 'File size must be greater than 0')
          .max(options.maxSize || 50 * 1024 * 1024, `File size cannot exceed ${(options.maxSize || 50 * 1024 * 1024) / 1024 / 1024}MB`),
        mimeType: z.string().refine((type) => {
          const allowedTypes = options.allowedTypes || [
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/png', 'text/plain'
          ];
          return allowedTypes.includes(type);
        }, 'File type not allowed')
      });
    
    case 'userProfile':
      return z.object({
        fullName: z.string().min(2).max(100).trim(),
        email: z.string().email().toLowerCase().trim(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
        bio: z.string().max(1000).optional(),
        location: z.string().max(100).optional(),
        website: z.string().url().optional(),
        dateOfBirth: z.string().datetime().optional()
      });
    
    case 'scholarshipApplication':
      return z.object({
        scholarshipId: z.string().uuid(),
        personalStatement: z.string().max(2000),
        academicRecords: z.array(z.object({
          institution: z.string().min(1).max(200),
          degree: z.string().min(1).max(100),
          gpa: z.number().min(0).max(4.0),
          graduationYear: z.number().min(1900).max(new Date().getFullYear() + 10)
        })).max(10),
        contactInformation: z.object({
          email: z.string().email(),
          phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
          address: z.string().max(500).optional()
        })
      });
    
    case 'assessmentSubmission':
      return z.object({
        assessmentId: z.string().uuid(),
        responses: z.array(z.object({
          questionId: z.string().uuid(),
          answer: z.union([z.string(), z.number(), z.array(z.string()), z.boolean()])
        })).min(1),
        timeSpent: z.number().min(1)
      });
    
    case 'financialGoal':
      return z.object({
        title: z.string().min(1).max(100),
        targetAmount: z.number().min(0.01).max(1000000000),
        currentAmount: z.number().min(0).max(1000000000),
        deadline: z.string().datetime().optional(),
        priority: z.enum(['low', 'medium', 'high']),
        category: z.enum(['savings', 'investment', 'debt_payoff', 'major_purchase', 'emergency_fund', 'other'])
      });
    
    case 'pagination':
      return z.object({
        page: z.number().int().min(1).max(1000).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        sortBy: z.string().max(50).optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      });
    
    default:
      throw new Error(`Unsupported schema type: ${schemaType}`);
  }
}

// Input sanitization utility
function sanitizeForDatabase(input: unknown): unknown {
  if (typeof input === 'string') {
    return input.replace(/['";\\]/g, '').trim().substring(0, 10000);
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeForDatabase);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 100);
      if (cleanKey) {
        sanitized[cleanKey] = sanitizeForDatabase(value);
      }
    }
    return sanitized;
  }
  
  return input;
}

// XSS prevention utility
function preventXSS(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}

// Security validation utility
function performSecurityChecks(data: any): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for common injection patterns
  const jsonString = JSON.stringify(data);
  
  if (jsonString.includes('DROP TABLE') || jsonString.includes('DELETE FROM')) {
    issues.push('Potential SQL injection detected');
  }
  
  if (jsonString.includes('<script') || jsonString.includes('javascript:')) {
    issues.push('Potential XSS attack detected');
  }
  
  if (jsonString.includes('eval(') || jsonString.includes('Function(')) {
    issues.push('Potential code injection detected');
  }
  
  // Check for excessively long strings that might indicate buffer overflow attempts
  if (jsonString.length > 1000000) { // 1MB limit
    issues.push('Request payload too large');
  }
  
  return {
    passed: issues.length === 0,
    issues
  };
}

// Rate limiting
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

    // Rate limiting
    if (!rateLimiter.isAllowed(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Validate request structure
    const requestValidation = validationRequestSchema.safeParse(requestBody);
    if (!requestValidation.success) {
      const errors = requestValidation.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      return new Response(
        JSON.stringify({ error: 'Invalid request structure', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { schemaType, data, options } = requestValidation.data;

    // Perform security checks
    const securityCheck = performSecurityChecks(data);
    if (!securityCheck.passed) {
      // Log security violation
      try {
        await supabase.from('audit_logs').insert({
          action: 'security_violation',
          resource: 'validation_middleware',
          details: JSON.stringify({ 
            issues: securityCheck.issues, 
            schemaType 
          }),
          ip_address: clientIP,
          severity: 'high',
          category: 'security_event',
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to log security violation:', error);
      }

      return new Response(
        JSON.stringify({ 
          error: 'Security validation failed', 
          issues: securityCheck.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create and apply validation schema
    try {
      const schema = createValidationSchema(schemaType, options);
      const validationResult = schema.safeParse(data);

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        );
        return new Response(
          JSON.stringify({ 
            valid: false, 
            errors,
            schemaType 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sanitize the validated data
      const sanitizedData = sanitizeForDatabase(validationResult.data);

      // Apply XSS prevention for string fields
      let xssCleanedData = sanitizedData;
      if (typeof sanitizedData === 'string') {
        xssCleanedData = preventXSS(sanitizedData);
      } else if (sanitizedData && typeof sanitizedData === 'object') {
        xssCleanedData = JSON.parse(
          preventXSS(JSON.stringify(sanitizedData))
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          data: xssCleanedData,
          originalData: validationResult.data,
          schemaType,
          validationPassed: true,
          securityChecks: {
            xssProtection: true,
            sqlInjectionProtection: true,
            sanitized: true
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Schema creation error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid schema type or options',
          schemaType 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});