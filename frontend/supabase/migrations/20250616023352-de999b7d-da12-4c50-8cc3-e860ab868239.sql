
-- Add smart contract integration tables
CREATE TABLE smart_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_address TEXT NOT NULL UNIQUE,
  contract_type TEXT NOT NULL, -- 'credential_registry', 'verification', 'dispute_resolution'
  network TEXT NOT NULL DEFAULT 'ethereum', -- 'ethereum', 'polygon', 'binance'
  abi JSONB NOT NULL,
  deployment_transaction_hash TEXT NOT NULL,
  deployment_block_number INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add institutional API keys and configuration
CREATE TABLE institutional_api_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL,
  institution_name TEXT NOT NULL,
  institution_type TEXT NOT NULL, -- 'educational', 'professional', 'employer', 'government'
  api_key_hash TEXT NOT NULL,
  api_endpoint TEXT,
  webhook_url TEXT,
  supported_credential_types TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add privacy controls for credential sharing
CREATE TABLE credential_sharing_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES blockchain_credentials(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  shared_with_type TEXT NOT NULL, -- 'public', 'specific_user', 'organization', 'verification_service'
  shared_with_id UUID, -- user_id or organization_id when applicable
  permission_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'verify', 'full_access'
  fields_accessible TEXT[] NOT NULL DEFAULT '{}', -- specific fields they can access
  expires_at TIMESTAMP WITH TIME ZONE,
  sharing_token TEXT UNIQUE, -- for secure link sharing
  access_count INTEGER NOT NULL DEFAULT 0,
  max_access_count INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add standardized export formats
CREATE TABLE credential_export_formats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  format_name TEXT NOT NULL UNIQUE, -- 'open_badges', 'europass', 'json_ld', 'pdf_standard'
  format_version TEXT NOT NULL,
  schema_definition JSONB NOT NULL,
  mime_type TEXT NOT NULL,
  file_extension TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add credential exports log
CREATE TABLE credential_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES blockchain_credentials(id),
  user_id UUID NOT NULL,
  export_format_id UUID NOT NULL REFERENCES credential_export_formats(id),
  exported_data JSONB NOT NULL,
  file_url TEXT,
  access_token TEXT UNIQUE,
  downloaded_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add dispute resolution system
CREATE TABLE credential_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES blockchain_credentials(id),
  disputed_by UUID NOT NULL, -- user filing the dispute
  dispute_type TEXT NOT NULL, -- 'incorrect_info', 'unauthorized_issuance', 'revocation_request', 'identity_theft'
  dispute_reason TEXT NOT NULL,
  evidence JSONB, -- supporting documents, links, etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'rejected'
  assigned_to UUID, -- admin/reviewer handling the case
  resolution_notes TEXT,
  smart_contract_dispute_id TEXT, -- reference to blockchain dispute
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add smart contract interactions log
CREATE TABLE smart_contract_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES smart_contracts(id),
  transaction_hash TEXT NOT NULL,
  function_name TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB,
  gas_used INTEGER,
  gas_price BIGINT,
  transaction_fee NUMERIC,
  status TEXT NOT NULL, -- 'pending', 'confirmed', 'failed'
  block_number INTEGER,
  confirmation_count INTEGER DEFAULT 0,
  error_message TEXT,
  initiated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Add enhanced audit capabilities
CREATE TABLE credential_verification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES blockchain_credentials(id),
  verifier_id UUID,
  verification_method TEXT NOT NULL, -- 'blockchain', 'api', 'qr_code', 'smart_contract'
  verification_result BOOLEAN NOT NULL,
  verification_details JSONB,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB, -- geolocation if available
  verification_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_smart_contracts_address ON smart_contracts(contract_address);
CREATE INDEX idx_smart_contracts_type ON smart_contracts(contract_type);
CREATE INDEX idx_institutional_api_configs_institution ON institutional_api_configs(institution_id);
CREATE INDEX idx_credential_sharing_permissions_credential ON credential_sharing_permissions(credential_id);
CREATE INDEX idx_credential_sharing_permissions_owner ON credential_sharing_permissions(owner_id);
CREATE INDEX idx_credential_sharing_permissions_token ON credential_sharing_permissions(sharing_token);
CREATE INDEX idx_credential_disputes_credential ON credential_disputes(credential_id);
CREATE INDEX idx_credential_disputes_status ON credential_disputes(status);
CREATE INDEX idx_smart_contract_interactions_contract ON smart_contract_interactions(contract_id);
CREATE INDEX idx_smart_contract_interactions_hash ON smart_contract_interactions(transaction_hash);
CREATE INDEX idx_verification_logs_credential ON credential_verification_logs(credential_id);
CREATE INDEX idx_verification_logs_created_at ON credential_verification_logs(created_at);

-- Add RLS policies
ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutional_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_sharing_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_export_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_contract_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_verification_logs ENABLE ROW LEVEL SECURITY;

-- Smart contracts - admin only
CREATE POLICY "Admins can manage smart contracts" ON smart_contracts
  FOR ALL USING (is_admin());

CREATE POLICY "Users can view active smart contracts" ON smart_contracts
  FOR SELECT USING (is_active = true);

-- Institutional API configs - admin and institution staff
CREATE POLICY "Admins can manage institutional configs" ON institutional_api_configs
  FOR ALL USING (is_admin());

CREATE POLICY "Institution staff can view their configs" ON institutional_api_configs
  FOR SELECT USING (
    institution_id IN (
      SELECT ur.user_id FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('educational_institution', 'training_center')
    )
  );

-- Credential sharing permissions - owner controls
CREATE POLICY "Users can manage their credential sharing" ON credential_sharing_permissions
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Shared users can view permissions" ON credential_sharing_permissions
  FOR SELECT USING (
    shared_with_id = auth.uid() OR 
    shared_with_type = 'public'
  );

-- Export formats - public read, admin write
CREATE POLICY "Anyone can view export formats" ON credential_export_formats
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage export formats" ON credential_export_formats
  FOR ALL USING (is_admin());

-- Credential exports - user owns
CREATE POLICY "Users can manage their exports" ON credential_exports
  FOR ALL USING (user_id = auth.uid());

-- Disputes - user can create and view their own
CREATE POLICY "Users can create disputes" ON credential_disputes
  FOR INSERT WITH CHECK (disputed_by = auth.uid());

CREATE POLICY "Users can view their disputes" ON credential_disputes
  FOR SELECT USING (
    disputed_by = auth.uid() OR 
    is_admin() OR
    assigned_to = auth.uid()
  );

CREATE POLICY "Admins can manage disputes" ON credential_disputes
  FOR ALL USING (is_admin());

-- Smart contract interactions - user initiated
CREATE POLICY "Users can view their interactions" ON smart_contract_interactions
  FOR SELECT USING (initiated_by = auth.uid() OR is_admin());

CREATE POLICY "Users can create interactions" ON smart_contract_interactions
  FOR INSERT WITH CHECK (initiated_by = auth.uid());

CREATE POLICY "Admins can manage interactions" ON smart_contract_interactions
  FOR ALL USING (is_admin());

-- Verification logs - verifier and credential owner
CREATE POLICY "Users can view verification logs" ON credential_verification_logs
  FOR SELECT USING (
    verifier_id = auth.uid() OR 
    credential_id IN (
      SELECT id FROM blockchain_credentials WHERE recipient_id = auth.uid()
    ) OR
    is_admin()
  );

CREATE POLICY "Anyone can create verification logs" ON credential_verification_logs
  FOR INSERT WITH CHECK (true);

-- Insert default export formats
INSERT INTO credential_export_formats (format_name, format_version, schema_definition, mime_type, file_extension) VALUES
('open_badges', '3.0', '{"type": "object", "properties": {"@context": {"type": "string"}, "type": {"type": "string"}, "id": {"type": "string"}, "name": {"type": "string"}, "description": {"type": "string"}, "image": {"type": "string"}, "criteria": {"type": "object"}, "issuer": {"type": "object"}, "issuanceDate": {"type": "string"}, "credentialSubject": {"type": "object"}}}', 'application/json', 'json'),
('europass', '1.0', '{"type": "object", "properties": {"credentialSubject": {"type": "object"}, "issuer": {"type": "object"}, "type": {"type": "array"}, "@context": {"type": "array"}, "issuanceDate": {"type": "string"}, "expirationDate": {"type": "string"}}}', 'application/json', 'json'),
('json_ld', '1.1', '{"type": "object", "properties": {"@context": {"type": "array"}, "@type": {"type": "string"}, "id": {"type": "string"}, "issuer": {"type": "object"}, "issuanceDate": {"type": "string"}, "credentialSubject": {"type": "object"}, "proof": {"type": "object"}}}', 'application/ld+json', 'jsonld'),
('pdf_standard', '1.0', '{"type": "object", "properties": {"template": {"type": "string"}, "data": {"type": "object"}, "styling": {"type": "object"}}}', 'application/pdf', 'pdf');
