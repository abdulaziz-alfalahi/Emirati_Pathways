
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BlockchainCredential } from '@/types/blockchainCredentials';

interface SelectedCredentialsSectionProps {
  credentials: BlockchainCredential[];
}

const SelectedCredentialsSection: React.FC<SelectedCredentialsSectionProps> = ({
  credentials
}) => {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <h4 className="font-medium mb-2">Selected Credentials ({credentials.length})</h4>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {credentials.map((credential) => (
          <div key={credential.id} className="text-sm flex items-center justify-between">
            <span className="truncate">{credential.title}</span>
            <Badge variant="outline" className="ms-2">
              {credential.credential_type}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedCredentialsSection;
