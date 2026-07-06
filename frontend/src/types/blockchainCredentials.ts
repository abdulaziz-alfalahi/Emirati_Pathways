export interface BlockchainCredential {
  id: string;
  recipient_id: string;
  issuer_id: string;
  credential_type: 'certification' | 'degree' | 'skill_badge' | 'completion_certificate';
  title: string;
  description?: string;
  issued_date: string;
  expiry_date?: string;
  credential_hash: string;
  merkle_proof: string[];
  block_number: number;
  transaction_hash: string;
  verification_status: 'verified' | 'pending' | 'revoked';
  revocation_reason?: string;
  revoked_at?: string;
  metadata?: any;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

export interface CredentialIssueRequest {
  recipientId: string;
  issuerId: string;
  credentialType: 'certification' | 'degree' | 'skill_badge' | 'completion_certificate';
  title: string;
  description?: string;
  expiryDate?: string;
  metadata?: Record<string, any>;
  skills?: string[];
}

export interface VerificationResult {
  isValid: boolean;
  status: 'verified' | 'invalid' | 'not_found' | 'revoked' | 'error';
  message: string;
  credential?: BlockchainCredential;
  verificationDetails?: {
    blockNumber: number;
    transactionHash: string;
    merkleProof: string[];
    verifiedAt: string;
  };
}

export interface DigitalWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  credentials: BlockchainCredential[];
  total_credentials: number;
  verified_credentials: number;
  created_at: string;
  updated_at: string;
}
