
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { VerificationRequest } from './types.ts';
import { 
  performOAuthVerification,
  performApiKeyVerification,
  performCertificateVerification
} from './verification-handlers.ts';
import { createCredentialFromVerification } from './credential-utils.ts';
import {
  getDatabaseConfig,
  createVerificationRequest,
  updateVerificationRequest,
  createVerifiedCredential
} from './database-operations.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body: VerificationRequest = await req.json();
      
      // Validate input
      if (!body.verification_type || !body.database_source || !body.data) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get database configuration
      const config = await getDatabaseConfig(supabaseClient, body.database_source);
      if (!config) {
        return new Response(
          JSON.stringify({ error: 'Database configuration not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create verification request record
      const verificationRequest = await createVerificationRequest(supabaseClient, user.id, body);

      // Perform external verification based on authentication type
      let verificationResult;
      
      try {
        switch (config.authentication_type) {
          case 'oauth':
            verificationResult = await performOAuthVerification(config, body.verification_type, body.data);
            break;
          case 'api_key':
            verificationResult = await performApiKeyVerification(config, body.verification_type, body.data);
            break;
          case 'certificate':
            verificationResult = await performCertificateVerification(config, body.verification_type, body.data);
            break;
          default:
            throw new Error('Unsupported authentication type');
        }
      } catch (verificationError) {
        // Update request status to failed
        await updateVerificationRequest(supabaseClient, verificationRequest.id, {
          success: false,
          error: verificationError.message
        });

        return new Response(
          JSON.stringify({ 
            error: 'External verification failed', 
            verification_id: verificationRequest.id 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update verification request with results
      await updateVerificationRequest(supabaseClient, verificationRequest.id, verificationResult);

      // If verification successful, create verified credential record
      if (verificationResult.success) {
        const credentialData = createCredentialFromVerification(body.verification_type, body.data, verificationResult);
        await createVerifiedCredential(supabaseClient, user.id, body.verification_type, credentialData, body.database_source, verificationResult);
      }

      return new Response(
        JSON.stringify({
          success: verificationResult.success,
          verification_id: verificationRequest.id,
          data: verificationResult.success ? verificationResult.data : undefined,
          error: verificationResult.success ? undefined : verificationResult.error
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
