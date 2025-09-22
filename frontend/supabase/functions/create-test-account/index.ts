
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

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
    const { email, password, fullName, role } = await req.json();

    // Validate inputs
    if (!email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, password, fullName, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create the user
    const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm the email
      user_metadata: {
        full_name: fullName,
      }
    });

    if (signUpError) {
      console.error('Error creating user:', signUpError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user: ' + signUpError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign the role to the user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([
        { user_id: userData.user.id, role }
      ]);

    if (roleError) {
      console.error('Error assigning role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign role: ' + roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test account created successfully',
        user: {
          id: userData.user.id,
          email: userData.user.email,
          role
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
