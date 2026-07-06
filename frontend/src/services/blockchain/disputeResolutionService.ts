import { auditLogger } from "./auditLogger";
import { smartContractService } from "./smartContractService";

export interface CredentialDispute {
  id: string;
  credential_id: string;
  disputed_by: string;
  dispute_type: 'incorrect_info' | 'unauthorized_issuance' | 'revocation_request' | 'identity_theft';
  dispute_reason: string;
  evidence?: any;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  assigned_to?: string;
  resolution_notes?: string;
  smart_contract_dispute_id?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DisputeRequest {
  credentialId: string;
  disputeType: CredentialDispute['dispute_type'];
  disputeReason: string;
  evidence?: any;
}

export interface DisputeResolution {
  status: 'resolved' | 'rejected';
  resolutionNotes: string;
  actionTaken?: 'revoke_credential' | 'update_credential' | 'no_action';
}

class DisputeResolutionService {
  async fileDispute(disputedBy: string, request: DisputeRequest): Promise<CredentialDispute> {
    try {
      const { data, error } = await supabase
        .from('credential_disputes')
        .insert({
          credential_id: request.credentialId,
          disputed_by: disputedBy,
          dispute_type: request.disputeType,
          dispute_reason: request.disputeReason,
          evidence: request.evidence,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Type assertion to ensure proper typing
      const dispute = data as CredentialDispute;

      // Log the dispute filing
      await auditLogger.logOperation({
        user_id: disputedBy,
        credential_id: request.credentialId,
        operation_type: 'revoke',
        operation_details: {
          action: `Filed dispute`,
          metadata: {
            dispute_type: request.disputeType,
            dispute_id: dispute.id
          },
          result: 'success'
        }
      });

      // Create smart contract dispute if available
      await this.createSmartContractDispute(dispute.id, request);

      return dispute;
    } catch (error) {
      console.error('Error filing dispute:', error);
      throw error;
    }
  }

  private async createSmartContractDispute(disputeId: string, request: DisputeRequest) {
    try {
      const contracts = await smartContractService.getActiveContracts();
      const disputeContract = contracts.find(c => c.contract_type === 'dispute_resolution');

      if (disputeContract) {
        const interaction = await smartContractService.interactWithContract(
          disputeContract.id,
          'createDispute',
          {
            credentialId: request.credentialId,
            disputeType: request.disputeType,
            disputeReason: request.disputeReason,
            evidence: request.evidence
          },
          'system'
        );

        // Update dispute with smart contract reference
        await supabase
          .from('credential_disputes')
          .update({ smart_contract_dispute_id: interaction.transaction_hash })
          .eq('id', disputeId);
      }
    } catch (error) {
      console.error('Error creating smart contract dispute:', error);
      // Continue without smart contract dispute - don't fail the main operation
    }
  }

  async assignDispute(disputeId: string, assignedTo: string, assignedBy: string): Promise<CredentialDispute> {
    try {
      const { data, error } = await supabase
        .from('credential_disputes')
        .update({
          assigned_to: assignedTo,
          status: 'under_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', disputeId)
        .select()
        .single();

      if (error) throw error;

      const dispute = data as CredentialDispute;

      await auditLogger.logOperation({
        user_id: assignedBy,
        operation_type: 'revoke',
        operation_details: {
          action: `Assigned dispute to reviewer`,
          metadata: {
            dispute_id: disputeId,
            assigned_to: assignedTo
          },
          result: 'success'
        }
      });

      return dispute;
    } catch (error) {
      console.error('Error assigning dispute:', error);
      throw error;
    }
  }

  async resolveDispute(
    disputeId: string,
    resolution: DisputeResolution,
    resolvedBy: string
  ): Promise<CredentialDispute> {
    try {
      const { data, error } = await supabase
        .from('credential_disputes')
        .update({
          status: resolution.status,
          resolution_notes: resolution.resolutionNotes,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', disputeId)
        .select()
        .single();

      if (error) throw error;

      const dispute = data as CredentialDispute;

      // Execute resolution action if needed
      if (resolution.actionTaken === 'revoke_credential') {
        await this.revokeCredentialFromDispute(dispute.credential_id, resolvedBy);
      }

      await auditLogger.logOperation({
        user_id: resolvedBy,
        credential_id: dispute.credential_id,
        operation_type: 'revoke',
        operation_details: {
          action: `Resolved dispute`,
          metadata: {
            dispute_id: disputeId,
            resolution_status: resolution.status,
            action_taken: resolution.actionTaken
          },
          result: 'success'
        }
      });

      return dispute;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    }
  }

  private async revokeCredentialFromDispute(credentialId: string, revokedBy: string) {
    await supabase
      .from('blockchain_credentials')
      .update({
        verification_status: 'revoked',
        revocation_reason: 'Revoked due to dispute resolution',
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', credentialId);
  }

  async getUserDisputes(userId: string): Promise<CredentialDispute[]> {
    const { data, error } = await supabase
      .from('credential_disputes')
      .select('*')
      .eq('disputed_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CredentialDispute[];
  }

  async getAssignedDisputes(reviewerId: string): Promise<CredentialDispute[]> {
    const { data, error } = await supabase
      .from('credential_disputes')
      .select('*')
      .eq('assigned_to', reviewerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CredentialDispute[];
  }

  async getAllDisputes(): Promise<CredentialDispute[]> {
    const { data, error } = await supabase
      .from('credential_disputes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CredentialDispute[];
  }

  async getDisputeById(disputeId: string): Promise<CredentialDispute | null> {
    const { data, error } = await supabase
      .from('credential_disputes')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (error) return null;
    return data as CredentialDispute;
  }
}

export const disputeResolutionService = new DisputeResolutionService();
