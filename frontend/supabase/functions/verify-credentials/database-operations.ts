
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DatabaseConfig } from './types.ts';

export async function getDatabaseConfig(supabaseClient: any, databaseSource: string): Promise<DatabaseConfig | null> {
  const { data: config, error: configError } = await supabaseClient
    .from('external_database_configs')
    .select('*')
    .eq('database_name', databaseSource)
    .eq('is_active', true)
    .single();

  if (configError || !config) {
    return null;
  }

  return config;
}

export async function createVerificationRequest(supabaseClient: any, userId: string, body: any) {
  const { data: verificationRequest, error: requestError } = await supabaseClient
    .from('credential_verification_requests')
    .insert({
      user_id: userId,
      database_source: body.database_source,
      verification_type: body.verification_type,
      request_data: body.data,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();

  if (requestError) {
    throw new Error('Failed to create verification request');
  }

  return verificationRequest;
}

export async function updateVerificationRequest(supabaseClient: any, requestId: string, verificationResult: any) {
  const updateData: any = {
    status: verificationResult.success ? 'verified' : 'failed',
    response_data: verificationResult,
    updated_at: new Date().toISOString()
  };

  if (verificationResult.success) {
    updateData.verified_at = new Date().toISOString();
  }

  await supabaseClient
    .from('credential_verification_requests')
    .update(updateData)
    .eq('id', requestId);
}

export async function createVerifiedCredential(supabaseClient: any, userId: string, verificationType: string, credentialData: any, databaseSource: string, verificationResult: any) {
  await supabaseClient
    .from('verified_credentials')
    .insert({
      user_id: userId,
      credential_type: verificationType,
      institution_name: credentialData.institution_name,
      credential_title: credentialData.credential_title,
      issue_date: credentialData.issue_date,
      verification_source: databaseSource,
      metadata: verificationResult.data
    });
}
