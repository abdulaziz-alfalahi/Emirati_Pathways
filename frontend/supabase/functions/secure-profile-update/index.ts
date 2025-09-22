/**
 * Secure Profile Update with Comprehensive Input Validation
 * Demonstrates profile data validation, sanitization, and change tracking
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const emailSchema = z.string().email('Invalid email format').toLowerCase().trim();

const sanitizedTextSchema = (minLength = 1, maxLength = 500) =>
  z.string()
    .min(minLength, `Text must be at least ${minLength} characters`)
    .max(maxLength, `Text cannot exceed ${maxLength} characters`)
    .trim()
    .transform((val) => val.replace(/[<>{}]/g, '').replace(/\s+/g, ' '));

const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform((val) => val.replace(/\D/g, ''));

const urlSchema = z.string()
  .url('Invalid URL format')
  .refine((url) => {
    const allowedProtocols = ['http:', 'https:'];
    try {
      const parsed = new URL(url);
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Only HTTP and HTTPS URLs are allowed');

const profileUpdateSchema = z.object({
  fullName: sanitizedTextSchema(2, 100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  bio: sanitizedTextSchema(1, 1000).optional(),
  dateOfBirth: z.string().datetime().optional().refine((dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120;
  }, 'Invalid date of birth'),
  location: sanitizedTextSchema(1, 100).optional(),
  website: urlSchema.optional(),
  skills: z.array(sanitizedTextSchema(1, 50)).max(20, 'Cannot exceed 20 skills').optional(),
  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    language: z.enum(['en', 'ar']).optional(),
    timezone: sanitizedTextSchema(1, 50).optional()
  }).optional()
});

// Rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private maxRequests: number = 20, private windowMs: number = 60000) {}

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

const rateLimiter = new RateLimiter(20, 60000); // 20 profile updates per minute

// Change tracking utility
function generateChangeLog(oldData: any, newData: any): any {
  const changes: any = {};
  
  for (const [key, newValue] of Object.entries(newData)) {
    if (oldData[key] !== newValue) {
      changes[key] = {
        from: oldData[key],
        to: newValue,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  return changes;
}

// Audit logging
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

    // Authentication
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
        supabase, '', 'profile_update_failed', 'profiles',
        null, { error: 'Unauthorized access attempt' }, clientIP, userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    if (!rateLimiter.isAllowed(user.id)) {
      await createAuditLog(
        supabase, user.id, 'rate_limit_exceeded', 'profiles',
        user.id, { clientIP }, clientIP, userAgent
      );
      
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

    // Validate input
    const validationResult = profileUpdateSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      
      await createAuditLog(
        supabase, user.id, 'validation_failed', 'profiles',
        user.id, { errors }, clientIP, userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedData = validationResult.data;

    // Get current profile data for change tracking
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch current profile:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch current profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== currentProfile.email) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', validatedData.email)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Email address is already in use' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate change log
    const changeLog = generateChangeLog(currentProfile, validatedData);

    // Prepare update data
    const updateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    };

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      
      await createAuditLog(
        supabase, user.id, 'update_failed', 'profiles',
        user.id, { error: updateError.message }, clientIP, userAgent
      );
      
      return new Response(
        JSON.stringify({ error: 'Failed to update profile. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful profile update with change tracking
    await createAuditLog(
      supabase, user.id, 'update', 'profiles',
      user.id, { changes: changeLog }, clientIP, userAgent
    );

    // Return updated profile (excluding sensitive fields)
    const { email, ...safeProfile } = updatedProfile;
    
    return new Response(
      JSON.stringify({
        success: true,
        profile: {
          ...safeProfile,
          email: user.email // Use auth email for consistency
        },
        changesApplied: Object.keys(changeLog),
        message: 'Profile updated successfully'
      }),
      { 
        status: 200, 
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