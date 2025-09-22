
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Updated USER_ROLES to match the frontend UserRole type exactly - this must be kept in sync
const USER_ROLES = [
  'school_student',
  'national_service_participant', 
  'university_student',
  'intern',
  'full_time_employee',
  'part_time_employee',
  'gig_worker',
  'jobseeker',
  'lifelong_learner',
  'entrepreneur',
  'retiree',
  'educational_institution',
  'parent',
  'private_sector_recruiter',
  'government_representative',
  'retiree_advocate',
  'training_center',
  'assessment_center',
  'mentor',
  'career_advisor',
  'platform_operator',
  'administrator',
  'super_user'
] as const;

const isValidUserRole = (role: string): boolean => {
  return USER_ROLES.includes(role as any);
};

const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 255); // Limit length and trim whitespace
};

const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get the authorization header
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authorization },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if the current user has admin privileges
    const { data: currentUserRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (rolesError) {
      throw new Error('Failed to check user permissions')
    }

    const hasAdminRole = currentUserRoles?.some(
      roleRecord => roleRecord.role === 'administrator' || roleRecord.role === 'super_user'
    )

    if (!hasAdminRole) {
      throw new Error('Permission denied: Only administrators can assign roles')
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON in request body');
    }

    const { userId, role } = requestBody;

    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Missing or invalid userId in request body')
    }

    if (!role || typeof role !== 'string') {
      throw new Error('Missing or invalid role in request body')
    }

    // Sanitize inputs
    const sanitizedUserId = sanitizeString(userId);
    const sanitizedRole = sanitizeString(role);

    // Validate UUID format
    if (!isValidUUID(sanitizedUserId)) {
      throw new Error('Invalid userId format')
    }

    // Validate that the role is one of the allowed roles
    if (!isValidUserRole(sanitizedRole)) {
      throw new Error('Invalid role specified')
    }

    // Check if target user exists
    const { data: targetUser, error: targetUserError } = await supabaseClient.auth.admin.getUserById(sanitizedUserId);
    if (targetUserError || !targetUser) {
      throw new Error('Target user not found');
    }

    // Check if the role assignment already exists
    const { data: existingRole } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('user_id', sanitizedUserId)
      .eq('role', sanitizedRole)
      .single()

    if (existingRole) {
      throw new Error('User already has this role')
    }

    // Insert the new role
    const { error: insertError } = await supabaseClient
      .from('user_roles')
      .insert([{ user_id: sanitizedUserId, role: sanitizedRole }])

    if (insertError) {
      console.error('Error inserting role:', insertError)
      throw new Error('Failed to assign role')
    }

    console.log(`Role "${sanitizedRole}" assigned to user ${sanitizedUserId} by admin ${user.id}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Role assigned successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in assign-user-role function:', error)
    
    // Determine appropriate HTTP status code
    let statusCode = 400;
    if (error.message.includes('Unauthorized') || error.message.includes('Permission denied')) {
      statusCode = 403;
    } else if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('Method not allowed')) {
      statusCode = 405;
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      },
    )
  }
})
