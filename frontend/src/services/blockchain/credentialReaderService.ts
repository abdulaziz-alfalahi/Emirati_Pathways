
import { supabase } from "@/integrations/supabase/client";
import { BlockchainCredential } from "@/types/blockchainCredentials";
import { auditLogger } from "./auditLogger";

class CredentialReaderService {
  async getUserCredentials(userId: string): Promise<BlockchainCredential[]> {
    try {
      // Log credential retrieval
      await auditLogger.logOperation({
        user_id: userId,
        operation_type: 'view',
        operation_details: {
          action: 'Retrieved user credentials from digital wallet',
          result: 'success'
        }
      });

      const { data, error } = await supabase
        .from('blockchain_credentials')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      await auditLogger.logOperation({
        user_id: userId,
        operation_type: 'view',
        operation_details: {
          action: 'Failed to retrieve user credentials',
          result: 'failure',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      console.error('Error fetching user credentials:', error);
      return [];
    }
  }

  async getCredentialById(credentialId: string): Promise<BlockchainCredential | null> {
    try {
      const { data: credential, error } = await supabase
        .from('blockchain_credentials')
        .select('*')
        .eq('id', credentialId)
        .single();

      if (error || !credential) {
        return null;
      }

      return credential;
    } catch (error) {
      console.error('Error fetching credential by ID:', error);
      return null;
    }
  }
}

export const credentialReaderService = new CredentialReaderService();
