
import { supabase } from "@/integrations/supabase/client";
import { auditLogger } from "./auditLogger";

export interface CredentialSharingPermission {
  id: string;
  credential_id: string;
  owner_id: string;
  shared_with_type: 'public' | 'specific_user' | 'organization' | 'verification_service';
  shared_with_id?: string;
  permission_level: 'view' | 'verify' | 'full_access';
  fields_accessible: string[];
  expires_at?: string;
  sharing_token?: string;
  access_count: number;
  max_access_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharingRequest {
  credentialId: string;
  sharedWithType: CredentialSharingPermission['shared_with_type'];
  sharedWithId?: string;
  permissionLevel: CredentialSharingPermission['permission_level'];
  fieldsAccessible: string[];
  expiresAt?: string;
  maxAccessCount?: number;
}

class PrivacyControlService {
  async createSharingPermission(
    ownerId: string,
    request: SharingRequest
  ): Promise<CredentialSharingPermission> {
    try {
      const sharingToken = request.sharedWithType === 'public' 
        ? crypto.randomUUID() 
        : undefined;

      const { data, error } = await supabase
        .from('credential_sharing_permissions')
        .insert({
          credential_id: request.credentialId,
          owner_id: ownerId,
          shared_with_type: request.sharedWithType,
          shared_with_id: request.sharedWithId,
          permission_level: request.permissionLevel,
          fields_accessible: request.fieldsAccessible,
          expires_at: request.expiresAt,
          sharing_token: sharingToken,
          max_access_count: request.maxAccessCount,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      const permission = data as CredentialSharingPermission;

      await auditLogger.logOperation({
        user_id: ownerId,
        credential_id: request.credentialId,
        operation_type: 'share',
        operation_details: {
          action: `Created sharing permission`,
          metadata: {
            shared_with_type: request.sharedWithType,
            permission_level: request.permissionLevel,
            fields_accessible: request.fieldsAccessible
          },
          result: 'success'
        }
      });

      return permission;
    } catch (error) {
      console.error('Error creating sharing permission:', error);
      throw error;
    }
  }

  async updateSharingPermission(
    permissionId: string,
    updates: Partial<SharingRequest>,
    userId: string
  ): Promise<CredentialSharingPermission> {
    try {
      const { data, error } = await supabase
        .from('credential_sharing_permissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', permissionId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (error) throw error;

      const permission = data as CredentialSharingPermission;

      await auditLogger.logOperation({
        user_id: userId,
        credential_id: permission.credential_id,
        operation_type: 'share',
        operation_details: {
          action: `Updated sharing permission`,
          metadata: updates,
          result: 'success'
        }
      });

      return permission;
    } catch (error) {
      console.error('Error updating sharing permission:', error);
      throw error;
    }
  }

  async revokeSharingPermission(permissionId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('credential_sharing_permissions')
        .update({ is_active: false })
        .eq('id', permissionId)
        .eq('owner_id', userId);

      if (error) throw error;

      await auditLogger.logOperation({
        user_id: userId,
        operation_type: 'share',
        operation_details: {
          action: `Revoked sharing permission`,
          metadata: { permission_id: permissionId },
          result: 'success'
        }
      });
    } catch (error) {
      console.error('Error revoking sharing permission:', error);
      throw error;
    }
  }

  async getCredentialSharingPermissions(credentialId: string): Promise<CredentialSharingPermission[]> {
    const { data, error } = await supabase
      .from('credential_sharing_permissions')
      .select('*')
      .eq('credential_id', credentialId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CredentialSharingPermission[];
  }

  async getUserSharingPermissions(userId: string): Promise<CredentialSharingPermission[]> {
    const { data, error } = await supabase
      .from('credential_sharing_permissions')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as CredentialSharingPermission[];
  }

  async validateSharingAccess(
    sharingToken: string,
    requestedFields: string[]
  ): Promise<{ hasAccess: boolean; permission?: CredentialSharingPermission }> {
    try {
      const { data: permission, error } = await supabase
        .from('credential_sharing_permissions')
        .select('*')
        .eq('sharing_token', sharingToken)
        .eq('is_active', true)
        .single();

      if (error || !permission) {
        return { hasAccess: false };
      }

      const typedPermission = permission as CredentialSharingPermission;

      // Check expiration
      if (typedPermission.expires_at && new Date(typedPermission.expires_at) < new Date()) {
        return { hasAccess: false };
      }

      // Check access count limit
      if (typedPermission.max_access_count && typedPermission.access_count >= typedPermission.max_access_count) {
        return { hasAccess: false };
      }

      // Check field access
      const hasFieldAccess = requestedFields.every(field => 
        typedPermission.fields_accessible.includes(field) || typedPermission.fields_accessible.includes('*')
      );

      if (!hasFieldAccess) {
        return { hasAccess: false };
      }

      // Increment access count
      await supabase
        .from('credential_sharing_permissions')
        .update({ access_count: typedPermission.access_count + 1 })
        .eq('id', typedPermission.id);

      return { hasAccess: true, permission: typedPermission };
    } catch (error) {
      console.error('Error validating sharing access:', error);
      return { hasAccess: false };
    }
  }
}

export const privacyControlService = new PrivacyControlService();
