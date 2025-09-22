/**
 * Secure Scholarship Application Submission with Comprehensive Validation
 * Demonstrates complete input validation, sanitization, and audit logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

// CORS headers for web app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const uuidSchema = z.string().uuid('Invalid UUID format');

const sanitizedTextSchema = (minLength = 1, maxLength = 500) =>
  z.string()
    .min(minLength, `Text must be at least ${minLength} characters`)
    .max(maxLength, `Text cannot exceed ${maxLength} characters`)
    .trim()
    .transform((val) => val.replace(/[<>{}]/g, '').replace(/\s+/g, ' '));

const richTextSchema = (maxLength = 10000) =>
  z.string()
    .max(maxLength, `Content cannot exceed ${maxLength} characters`)
    .refine((val) => {
      const dangerousPatterns = [
        /<script/i, /javascript:/i, /on\w+\s*=/i, /<iframe/i, /<object/i, /<embed/i
      ];
      return !dangerousPatterns.some(pattern => pattern.test(val));
    }, 'Content contains potentially unsafe elements');

const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();

const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform((val) => val.replace(/\D/g, ''));

const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
  size: z.number()
    .min(1, 'File size must be greater than 0')
    .max(50 * 1024 * 1024, 'File size cannot exceed 50MB'),
  mimeType: z.string().refine((type) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'text/plain'
    ];
    return allowedTypes.includes(type);
  }, 'File type not allowed')
});

// Complete scholarship application schema
const scholarshipApplicationSchema = z.object({
  scholarshipId: uuidSchema,
  personalStatement: richTextSchema(2000),
  academicRecords: z.array(z.object({
    institution: sanitizedTextSchema(1, 200),
    degree: sanitizedTextSchema(1, 100),
    gpa: z.number().min(0).max(4.0),
    graduationYear: z.number().min(1900).max(new Date().getFullYear() + 10)
  })).max(10, 'Cannot exceed 10 academic records'),
  documents: z.array(fileUploadSchema).max(5, 'Cannot exceed 5 documents'),
  contactInformation: z.object({
    email: emailSchema,
    phone: phoneSchema.optional(),
    address: sanitizedTextSchema(1, 500).optional()
  }),
  additionalInfo: z.record(z.unknown()).optional()
});

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

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

const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Audit logging function
async function createAuditLog(
  supabase: any,
  userId: string,
  action: string,
  resource: string,
  resourceId: string | null,
  details: any,
  ipAddress: string | null,
  userAgent: string | null
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      details: JSON.stringify(details),
      ip_address: ipAddress,
      user_agent: userAgent?.substring(0, 500),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Input sanitization for database operations
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract request metadata for security
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = req.headers.get('user-agent');
    
    // Get user from auth token
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
      await createAuditLog(
        supabase, '', 'scholarship_application_failed', 'scholarship_applications', 
        null, { error: 'Unauthorized access attempt' }, clientIP, userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    if (!rateLimiter.isAllowed(user.id)) {
      await createAuditLog(
        supabase, user.id, 'rate_limit_exceeded', 'scholarship_applications', 
        null, { clientIP }, clientIP, userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input against schema
    const validationResult = scholarshipApplicationSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      
      await createAuditLog(
        supabase, user.id, 'validation_failed', 'scholarship_applications', 
        null, { errors, inputData: sanitizeForDatabase(requestBody) }, clientIP, userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedData = validationResult.data;

    // Verify scholarship exists and is active
    const { data: scholarship, error: scholarshipError } = await supabase
      .from('scholarships')
      .select('id, is_active, application_deadline')
      .eq('id', validatedData.scholarshipId)
      .single();

    if (scholarshipError || !scholarship) {
      await createAuditLog(
        supabase, user.id, 'scholarship_not_found', 'scholarship_applications', 
        validatedData.scholarshipId, { error: scholarshipError }, clientIP, userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Scholarship not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!scholarship.is_active) {
      return new Response(
        JSON.stringify({ error: 'Scholarship is no longer active' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if deadline has passed
    if (scholarship.application_deadline && new Date(scholarship.application_deadline) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Application deadline has passed' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing application
    const { data: existingApplication } = await supabase
      .from('scholarship_applications')
      .select('id')
      .eq('scholarship_id', validatedData.scholarshipId)
      .eq('student_id', user.id)
      .single();

    if (existingApplication) {
      return new Response(
        JSON.stringify({ error: 'Application already submitted for this scholarship' }), 
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize data for database insertion
    const sanitizedData = sanitizeForDatabase({
      scholarship_id: validatedData.scholarshipId,
      student_id: user.id,
      personal_statement: validatedData.personalStatement,
      academic_records: validatedData.academicRecords,
      documents_metadata: validatedData.documents,
      contact_information: validatedData.contactInformation,
      additional_info: validatedData.additionalInfo || {},
      status: 'pending',
      submitted_at: new Date().toISOString()
    });

    // Insert scholarship application
    const { data: application, error: insertError } = await supabase
      .from('scholarship_applications')
      .insert(sanitizedData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insertion error:', insertError);
      
      await createAuditLog(
        supabase, user.id, 'application_failed', 'scholarship_applications', 
        null, { error: insertError.message }, clientIP, userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Failed to submit application. Please try again.' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful application submission
    await createAuditLog(
      supabase, user.id, 'create', 'scholarship_applications', 
      application.id, { scholarshipId: validatedData.scholarshipId }, clientIP, userAgent
    );

    // Return success response (without sensitive data)
    return new Response(
      JSON.stringify({
        success: true,
        applicationId: application.id,
        message: 'Scholarship application submitted successfully',
        submittedAt: application.submitted_at
      }), 
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});