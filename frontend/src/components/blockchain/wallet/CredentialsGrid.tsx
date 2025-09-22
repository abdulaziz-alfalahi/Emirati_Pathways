
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Download, Share } from 'lucide-react';
import { BlockchainCredential } from '@/types/blockchainCredentials';
import CredentialTemplate from '../CredentialTemplate';

interface CredentialsGridProps {
  credentials: BlockchainCredential[];
  selectedCredentials: string[];
  onSelectCredential: (credentialId: string, isSelected: boolean) => void;
  onPreviewCredential: (credential: BlockchainCredential) => void;
  onDownloadCredential: (credential: BlockchainCredential) => void;
  onShareCredential: (credential: BlockchainCredential) => void;
}

const CredentialsGrid: React.FC<CredentialsGridProps> = ({
  credentials,
  selectedCredentials,
  onSelectCredential,
  onPreviewCredential,
  onDownloadCredential,
  onShareCredential
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {credentials.map((credential) => (
        <div key={credential.id} className="relative">
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedCredentials.includes(credential.id)}
              onCheckedChange={(checked) => 
                onSelectCredential(credential.id, checked as boolean)
              }
              className="bg-white/90 border-gray-300"
            />
          </div>
          
          <CredentialTemplate credential={credential} variant="card" />
          
          <div className="flex justify-center space-x-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onPreviewCredential(credential)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDownloadCredential(credential)}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onShareCredential(credential)}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CredentialsGrid;
