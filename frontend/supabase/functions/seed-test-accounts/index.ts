
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PERSONAS = [
  { role: 'school_student', email: 'school-student@gmail.com', fullName: 'Ahmed Al School Student' },
  { role: 'national_service_participant', email: 'national-service@gmail.com', fullName: 'Khalid Al National Service' },
  { role: 'university_student', email: 'university-student@gmail.com', fullName: 'Mariam Al University Student' },
  { role: 'intern', email: 'intern@gmail.com', fullName: 'Noura Al Intern' },
  { role: 'full_time_employee', email: 'full-time@gmail.com', fullName: 'Saeed Al Full-Time Employee' },
  { role: 'part_time_employee', email: 'part-time@gmail.com', fullName: 'Hessa Al Part-Time Employee' },
  { role: 'gig_worker', email: 'gig-worker@gmail.com', fullName: 'Omar Al Gig Worker' },
  { role: 'jobseeker', email: 'jobseeker@gmail.com', fullName: 'Fatima Al Jobseeker' },
  { role: 'lifelong_learner', email: 'lifelong-learner@gmail.com', fullName: 'Mohammed Al Lifelong Learner' },
  { role: 'entrepreneur', email: 'entrepreneur@gmail.com', fullName: 'Aisha Al Entrepreneur' },
  { role: 'retiree', email: 'retiree@gmail.com', fullName: 'Ali Al Retiree' },
  { role: 'educational_institution', email: 'educational-institution@gmail.com', fullName: 'Zayed University' },
  { role: 'parent', email: 'parent@gmail.com', fullName: 'Hamad Al Parent' },
  { role: 'private_sector_recruiter', email: 'recruiter@gmail.com', fullName: 'Emirates Group Recruitment' },
  { role: 'government_representative', email: 'government@gmail.com', fullName: 'Ministry of Human Resources' },
  { role: 'retiree_advocate', email: 'retiree-advocate@gmail.com', fullName: 'Retirees Support Center' },
  { role: 'training_center', email: 'training-center@gmail.com', fullName: 'Emirates Skills Training Center' },
  { role: 'assessment_center', email: 'assessment-center@gmail.com', fullName: 'UAE Assessment Center' },
  { role: 'mentor', email: 'mentor@gmail.com', fullName: 'Rashid Al Mentor' },
  { role: 'career_advisor', email: 'career-advisor@gmail.com', fullName: 'Moza Al Career Advisor' },
  { role: 'platform_operator', email: 'platform-operator@gmail.com', fullName: 'Yousef Al Platform Operator' },
  { role: 'administrator', email: 'admin@gmail.com', fullName: 'System Administrator' },
  { role: 'super_user', email: 'super-user@gmail.com', fullName: 'Super User' }
];

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const password = 'journey123!';
    const createdAccounts = [];
    const existingAccounts = [];
    const failedAccounts = [];

    // Create each persona account
    for (const persona of PERSONAS) {
      try {
        // Check if user already exists
        const { data: existingUsers, error: existingUsersError } = await supabaseClient
          .from('profiles')
          .select('id, email')
          .eq('email', persona.email)
          .maybeSingle();

        if (existingUsersError) {
          console.error(`Error checking for existing user ${persona.email}:`, existingUsersError);
        }

        if (existingUsers) {
          // If user exists, ensure their email is confirmed
          await supabaseClient.auth.admin.updateUserById(existingUsers.id, {
            email_confirm: true,
            user_metadata: { email_verified: true }
          });
          existingAccounts.push(persona.email);
          continue;
        }

        // Create user with confirmed email
        const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
          email: persona.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: persona.fullName,
            email_verified: true
          }
        });

        if (authError) {
          console.error(`Failed to create user ${persona.email}:`, authError);
          failedAccounts.push({ email: persona.email, error: authError.message });
          continue;
        }

        // Add user role - use RPC for this to bypass RLS
        if (authData.user) {
          const { error: roleError } = await supabaseClient.rpc(
            'assign_role_to_user',
            { 
              user_id_param: authData.user.id,
              role_param: persona.role
            }
          );

          if (roleError) {
            console.error(`Failed to assign role to ${persona.email}:`, roleError);
            failedAccounts.push({ email: persona.email, error: roleError.message });
            continue;
          }

          createdAccounts.push(persona.email);
        }
      } catch (error) {
        console.error(`Error processing ${persona.email}:`, error);
        failedAccounts.push({ email: persona.email, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test accounts seeding completed',
        created: createdAccounts,
        existing: existingAccounts,
        failed: failedAccounts
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in seed-test-accounts function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});

