
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface CredentialIssueRequest {
  recipientId: string;
  credentialType: 'certification' | 'degree' | 'skill_badge' | 'completion_certificate';
  title: string;
  description?: string;
  skills?: string[];
  metadata?: Record<string, any>;
  expiryDate?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify API key and get institution config
    const { data: config, error: configError } = await supabaseClient
      .from('institutional_api_configs')
      .select('*')
      .eq('api_key_hash', apiKey)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const { count: recentRequests } = await supabaseClient
      .from('smart_contract_interactions')
      .select('id', { count: 'exact' })
      .eq('initiated_by', config.institution_id)
      .gte('created_at', oneHourAgo.toISOString());

    if (recentRequests && recentRequests >= config.rate_limit_per_hour) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === 'POST' && path.endsWith('/credentials/issue')) {
      return await handleCredentialIssuance(req, supabaseClient, config);
    } else if (req.method === 'GET' && path.includes('/credentials/')) {
      const credentialId = path.split('/').pop();
      return await handleCredentialRetrieval(credentialId!, supabaseClient, config);
    } else if (req.method === 'POST' && path.endsWith('/credentials/verify')) {
      return await handleCredentialVerification(req, supabaseClient, config);
    } else if (req.method === 'GET' && path.endsWith('/status')) {
      return await handleStatusCheck(supabaseClient, config);
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCredentialIssuance(
  req: Request, 
  supabaseClient: any, 
  config: any
): Promise<Response> {
  try {
    const request: CredentialIssueRequest = await req.json();

    // Validate credential type is supported
    if (!config.supported_credential_types.includes(request.credentialType)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Credential type '${request.credentialType}' not supported by this institution` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate blockchain data
    const credentialHash = generateCredentialHash(request);
    const merkleProof = generateMerkleProof(credentialHash);
    const blockNumber = Math.floor(Math.random() * 1000000) + 15000000;
    const transactionHash = `0x${crypto.randomUUID().replace(/-/g, '')}`;

    // Create credential record
    const { data: credential, error: credentialError } = await supabaseClient
      .from('blockchain_credentials')
      .insert({
        recipient_id: request.recipientId,
        issuer_id: config.institution_id,
        credential_type: request.credentialType,
        title: request.title,
        description: request.description,
        skills: request.skills || [],
        metadata: {
          ...request.metadata,
          issuer_name: config.institution_name,
          issuer_type: config.institution_type
        },
        expiry_date: request.expiryDate,
        credential_hash: credentialHash,
        merkle_proof: merkleProof,
        block_number: blockNumber,
        transaction_hash: transactionHash,
        verification_status: 'verified'
      })
      .select()
      .single();

    if (credentialError) {
      throw credentialError;
    }

    // Log the interaction
    await supabaseClient
      .from('smart_contract_interactions')
      .insert({
        contract_id: (await getOrCreateContract(supabaseClient, 'credential_registry')).id,
        transaction_hash: transactionHash,
        function_name: 'issueCredential',
        input_data: request,
        output_data: { credentialId: credential.id },
        status: 'confirmed',
        block_number: blockNumber,
        initiated_by: config.institution_id
      });

    // Update last sync time
    await supabaseClient
      .from('institutional_api_configs')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', config.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          credentialId: credential.id,
          transactionHash: transactionHash,
          blockNumber: blockNumber,
          verificationUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/verify-credential?id=${credential.id}`
        },
        message: 'Credential issued successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Credential issuance error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to issue credential' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCredentialRetrieval(
  credentialId: string,
  supabaseClient: any,
  config: any
): Promise<Response> {
  try {
    const { data: credential, error } = await supabaseClient
      .from('blockchain_credentials')
      .select('*')
      .eq('id', credentialId)
      .eq('issuer_id', config.institution_id)
      .single();

    if (error || !credential) {
      return new Response(
        JSON.stringify({ success: false, error: 'Credential not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: credential,
        message: 'Credential retrieved successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Credential retrieval error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to retrieve credential' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleCredentialVerification(
  req: Request,
  supabaseClient: any,
  config: any
): Promise<Response> {
  try {
    const { credentialId } = await req.json();

    const { data: credential, error } = await supabaseClient
      .from('blockchain_credentials')
      .select('*')
      .eq('id', credentialId)
      .single();

    if (error || !credential) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verification: { isValid: false, status: 'not_found' },
          error: 'Credential not found' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify credential hash
    const expectedHash = generateCredentialHash({
      recipientId: credential.recipient_id,
      credentialType: credential.credential_type,
      title: credential.title,
      description: credential.description,
      skills: credential.skills
    });

    const isValid = expectedHash === credential.credential_hash;

    // Log verification
    await supabaseClient
      .from('credential_verification_logs')
      .insert({
        credential_id: credentialId,
        verifier_id: config.institution_id,
        verification_method: 'api',
        verification_result: isValid,
        verification_details: {
          verifier_institution: config.institution_name,
          verification_timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        verification: {
          isValid,
          status: isValid ? 'verified' : 'invalid',
          credential: isValid ? credential : null,
          verificationDetails: {
            blockNumber: credential.block_number,
            transactionHash: credential.transaction_hash,
            verifiedAt: new Date().toISOString(),
            verifierInstitution: config.institution_name
          }
        },
        message: `Credential verification ${isValid ? 'successful' : 'failed'}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Credential verification error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to verify credential' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleStatusCheck(supabaseClient: any, config: any): Promise<Response> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const { count: requestsLastHour } = await supabaseClient
      .from('smart_contract_interactions')
      .select('id', { count: 'exact' })
      .eq('initiated_by', config.institution_id)
      .gte('created_at', oneHourAgo.toISOString());

    const { count: totalCredentials } = await supabaseClient
      .from('blockchain_credentials')
      .select('id', { count: 'exact' })
      .eq('issuer_id', config.institution_id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          institutionName: config.institution_name,
          institutionType: config.institution_type,
          isActive: config.is_active,
          rateLimit: {
            limit: config.rate_limit_per_hour,
            used: requestsLastHour || 0,
            remaining: config.rate_limit_per_hour - (requestsLastHour || 0)
          },
          supportedCredentialTypes: config.supported_credential_types,
          totalCredentialsIssued: totalCredentials || 0,
          lastSyncAt: config.last_sync_at
        },
        message: 'API status retrieved successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to get status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function generateCredentialHash(data: any): string {
  const hashInput = JSON.stringify({
    recipientId: data.recipientId,
    credentialType: data.credentialType,
    title: data.title,
    description: data.description,
    skills: data.skills
  });
  
  // Simple hash simulation - in production, use proper cryptographic hashing
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
}

function generateMerkleProof(hash: string): string[] {
  // Simple Merkle proof simulation
  return [
    hash,
    `0x${crypto.randomUUID().replace(/-/g, '')}`,
    `0x${crypto.randomUUID().replace(/-/g, '')}`
  ];
}

async function getOrCreateContract(supabaseClient: any, contractType: string) {
  let { data: contract } = await supabaseClient
    .from('smart_contracts')
    .select('*')
    .eq('contract_type', contractType)
    .eq('is_active', true)
    .single();

  if (!contract) {
    const { data: newContract } = await supabaseClient
      .from('smart_contracts')
      .insert({
        contract_address: `0x${crypto.randomUUID().replace(/-/g, '').substring(0, 40)}`,
        contract_type: contractType,
        network: 'ethereum',
        abi: {},
        deployment_transaction_hash: `0x${crypto.randomUUID().replace(/-/g, '')}`,
        deployment_block_number: Math.floor(Math.random() * 1000000) + 15000000
      })
      .select()
      .single();
    
    contract = newContract;
  }

  return contract;
}
