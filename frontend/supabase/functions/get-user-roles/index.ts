
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { userId } = await req.json();

    // Validate inputs
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user from request to verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify the user is requesting their own roles or is an admin
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden - Cannot request other users roles' }), { 
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Query user roles directly using service role
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error querying user roles:', error);
      return new Response(JSON.stringify({ error: 'Error fetching user roles' }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Extract roles and return them
    const roles = data.map(item => item.role);
    
    // Special case for email-based role assignment
    if (user.email) {
      // Special case: if email contains 'admin', also include administrator role
      if (user.email.includes('admin') && !roles.includes('administrator')) {
        roles.push('administrator');
      }
      
      // Special case: if email contains 'university-student', include university_student role
      if ((user.email.includes('university-student') || user.email.includes('university_student')) && !roles.includes('university_student')) {
        roles.push('university_student');
      }
      
      // Special case: if email contains 'training-center', include training_center role
      if ((user.email.includes('training-center') || user.email.includes('training_center')) && !roles.includes('training_center')) {
        roles.push('training_center');
      }

      // Special case: if email contains 'assessment-center', include assessment_center role
      if ((user.email.includes('assessment-center') || user.email.includes('assessment_center')) && !roles.includes('assessment_center')) {
        roles.push('assessment_center');
      }
      
      // Special case: if email contains 'career-advisor', include career_advisor and mentor roles
      if ((user.email.includes('career-advisor') || user.email.includes('career_advisor')) && !roles.includes('career_advisor')) {
        roles.push('career_advisor');
        roles.push('mentor');
      }
      
      // Special case: if email contains 'recruit', include private_sector_recruiter role
      if (user.email.includes('recruit') && !roles.includes('private_sector_recruiter')) {
        roles.push('private_sector_recruiter');
      }
      
      // Special case: if email contains 'parent', include parent role
      if (user.email.includes('parent') && !roles.includes('parent')) {
        roles.push('parent');
      }
      
      // Special case: if email contains 'school' or 'edu', include educational_institution role
      if ((user.email.includes('school') || user.email.includes('edu')) && !roles.includes('educational_institution')) {
        roles.push('educational_institution');
      }
      
      // Special case: if email contains 'retiree', include retiree role
      if (user.email.includes('retiree') && !roles.includes('retiree')) {
        roles.push('retiree');
      }
      
      // Special case: if email contains 'entrepreneur', include entrepreneur role
      if (user.email.includes('entrepreneur') && !roles.includes('entrepreneur')) {
        roles.push('entrepreneur');
      }
    }

    return new Response(JSON.stringify(roles), { 
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
