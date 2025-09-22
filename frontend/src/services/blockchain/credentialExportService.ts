
import { supabase } from "@/integrations/supabase/client";
import { BlockchainCredential } from "@/types/blockchainCredentials";
import { auditLogger } from "./auditLogger";

export interface ExportFormat {
  id: string;
  format_name: string;
  format_version: string;
  schema_definition: any;
  mime_type: string;
  file_extension: string;
  is_active: boolean;
  created_at: string;
}

export interface CredentialExport {
  id: string;
  credential_id: string;
  user_id: string;
  export_format_id: string;
  exported_data: any;
  file_url?: string;
  access_token: string;
  downloaded_count: number;
  expires_at?: string;
  created_at: string;
}

class CredentialExportService {
  async getAvailableFormats(): Promise<ExportFormat[]> {
    const { data, error } = await supabase
      .from('credential_export_formats')
      .select('*')
      .eq('is_active', true)
      .order('format_name');

    if (error) throw error;
    return data || [];
  }

  async exportCredential(
    credential: BlockchainCredential,
    formatId: string,
    userId: string
  ): Promise<CredentialExport> {
    try {
      // Get export format
      const { data: format, error: formatError } = await supabase
        .from('credential_export_formats')
        .select('*')
        .eq('id', formatId)
        .single();

      if (formatError || !format) {
        throw new Error('Export format not found');
      }

      // Transform credential data based on format
      const exportedData = this.transformCredentialData(credential, format);
      const accessToken = crypto.randomUUID();

      const { data, error } = await supabase
        .from('credential_exports')
        .insert({
          credential_id: credential.id,
          user_id: userId,
          export_format_id: formatId,
          exported_data: exportedData,
          access_token: accessToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      await auditLogger.logOperation({
        user_id: userId,
        credential_id: credential.id,
        operation_type: 'download',
        operation_details: {
          action: `Exported credential in ${format.format_name} format`,
          metadata: {
            format_name: format.format_name,
            format_version: format.format_version
          },
          result: 'success'
        }
      });

      return data;
    } catch (error) {
      console.error('Error exporting credential:', error);
      throw error;
    }
  }

  private transformCredentialData(credential: BlockchainCredential, format: ExportFormat): any {
    // Safely access metadata properties
    const metadata = credential.metadata as Record<string, any> || {};
    const issuerName = metadata.issuer_name || 'Unknown Issuer';

    switch (format.format_name) {
      case 'open_badges':
        return {
          "@context": "https://w3id.org/openbadges/v3",
          "type": ["VerifiableCredential", "OpenBadgeCredential"],
          "id": `urn:uuid:${credential.id}`,
          "name": credential.title,
          "description": credential.description || "",
          "image": "https://example.com/badge-image.png",
          "criteria": {
            "narrative": credential.description || ""
          },
          "issuer": {
            "id": `urn:uuid:${credential.issuer_id}`,
            "name": issuerName,
            "type": "Profile"
          },
          "issuanceDate": credential.issued_date,
          "credentialSubject": {
            "id": `urn:uuid:${credential.recipient_id}`,
            "type": "AchievementSubject",
            "achievement": {
              "type": "Achievement",
              "name": credential.title,
              "description": credential.description,
              "criteria": metadata
            }
          },
          "proof": {
            "type": "MerkleProof2019",
            "created": credential.issued_date,
            "verificationMethod": credential.transaction_hash,
            "merkleRoot": credential.credential_hash,
            "targetHash": credential.merkle_proof[0]
          }
        };

      case 'europass':
        return {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          "type": ["VerifiableCredential", "EuropassCredential"],
          "issuer": {
            "id": `urn:uuid:${credential.issuer_id}`,
            "name": issuerName
          },
          "issuanceDate": credential.issued_date,
          "expirationDate": credential.expiry_date,
          "credentialSubject": {
            "id": `urn:uuid:${credential.recipient_id}`,
            "learningAchievement": {
              "title": credential.title,
              "description": credential.description,
              "learningOutcome": credential.skills || []
            }
          }
        };

      case 'json_ld':
        return {
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
          ],
          "@type": "VerifiableCredential",
          "id": `urn:uuid:${credential.id}`,
          "issuer": {
            "id": `urn:uuid:${credential.issuer_id}`,
            "name": issuerName
          },
          "issuanceDate": credential.issued_date,
          "credentialSubject": {
            "id": `urn:uuid:${credential.recipient_id}`,
            "type": credential.credential_type,
            "name": credential.title,
            "description": credential.description,
            "skills": credential.skills
          },
          "proof": {
            "type": "MerkleProof2019",
            "created": credential.issued_date,
            "verificationMethod": credential.transaction_hash,
            "merkleRoot": credential.credential_hash
          }
        };

      case 'pdf_standard':
        return {
          template: "standard_certificate",
          data: {
            title: credential.title,
            recipient: `Recipient ID: ${credential.recipient_id}`,
            issuer: issuerName,
            issuedDate: new Date(credential.issued_date).toLocaleDateString(),
            description: credential.description,
            skills: credential.skills?.join(', ') || '',
            verificationHash: credential.credential_hash,
            blockchainTx: credential.transaction_hash
          },
          styling: {
            primaryColor: "#1e40af",
            secondaryColor: "#64748b",
            font: "Arial",
            logo: "https://example.com/logo.png"
          }
        };

      default:
        return credential;
    }
  }

  async getUserExports(userId: string): Promise<CredentialExport[]> {
    const { data, error } = await supabase
      .from('credential_exports')
      .select(`
        *,
        credential_export_formats(format_name, format_version, file_extension)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async downloadExport(accessToken: string): Promise<any> {
    try {
      const { data: exportRecord, error } = await supabase
        .from('credential_exports')
        .select('*')
        .eq('access_token', accessToken)
        .single();

      if (error || !exportRecord) {
        throw new Error('Export not found');
      }

      // Check expiration
      if (exportRecord.expires_at && new Date(exportRecord.expires_at) < new Date()) {
        throw new Error('Export has expired');
      }

      // Increment download count
      await supabase
        .from('credential_exports')
        .update({ downloaded_count: exportRecord.downloaded_count + 1 })
        .eq('id', exportRecord.id);

      return exportRecord.exported_data;
    } catch (error) {
      console.error('Error downloading export:', error);
      throw error;
    }
  }
}

export const credentialExportService = new CredentialExportService();
