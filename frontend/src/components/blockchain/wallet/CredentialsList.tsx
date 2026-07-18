
import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Award, 
  Building2, 
  Shield, 
  Calendar, 
  ExternalLink, 
  Eye, 
  Download, 
  Share 
} from 'lucide-react';
import { BlockchainCredential } from '@/types/blockchainCredentials';

interface CredentialsListProps {
  credentials: BlockchainCredential[];
  selectedCredentials: string[];
  onSelectCredential: (credentialId: string, isSelected: boolean) => void;
  onPreviewCredential: (credential: BlockchainCredential) => void;
  onDownloadCredential: (credential: BlockchainCredential) => void;
  onShareCredential: (credential: BlockchainCredential) => void;
}

const CredentialsList: React.FC<CredentialsListProps> = ({
  credentials,
  selectedCredentials,
  onSelectCredential,
  onPreviewCredential,
  onDownloadCredential,
  onShareCredential
}) => {
  const getCredentialTypeIcon = (type: string) => {
    switch (type) {
      case 'certification':
        return <Award className="h-5 w-5" />;
      case 'degree':
        return <Building2 className="h-5 w-5" />;
      case 'skill_badge':
        return <Shield className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'revoked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="grid gap-4">
      {credentials.map((credential) => (
        <Card key={credential.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={selectedCredentials.includes(credential.id)}
                  onCheckedChange={(checked) => 
                    onSelectCredential(credential.id, checked as boolean)
                  }
                />
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  {getCredentialTypeIcon(credential.credential_type)}
                </div>
                <div>
                  <h3 className="font-semibold">{credential.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {credential.credential_type.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-white ${getStatusColor(credential.verification_status)}`}
              >
                {credential.verification_status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {credential.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {credential.description}
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-3 w-3 me-1" />
                Issued: {formatDate(credential.issued_date)}
              </div>
              
              {credential.expiry_date && (
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-3 w-3 me-1" />
                  Expires: {formatDate(credential.expiry_date)}
                </div>
              )}
              
              <div className="flex items-center text-muted-foreground">
                <Shield className="h-3 w-3 me-1" />
                Block: #{credential.block_number}
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <ExternalLink className="h-3 w-3 me-1" />
                Tx: {credential.transaction_hash.substring(0, 12)}...
              </div>
            </div>

            {credential.skills && credential.skills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Skills Certified:</p>
                <div className="flex flex-wrap gap-1">
                  {credential.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onPreviewCredential(credential)}
              >
                <Eye className="h-4 w-4 me-2" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDownloadCredential(credential)}
              >
                <Download className="h-4 w-4 me-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onShareCredential(credential)}
              >
                <Share className="h-4 w-4 me-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CredentialsList;
