
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, Eye } from 'lucide-react';
import { BlockchainCredential } from '@/types/blockchainCredentials';

interface CredentialActionsProps {
  credential: BlockchainCredential;
  onPreview: (credential: BlockchainCredential) => void;
  onDownload: (credential: BlockchainCredential) => void;
  onShare: (credential: BlockchainCredential) => void;
}

export const CredentialActions: React.FC<CredentialActionsProps> = React.memo(({
  credential,
  onPreview,
  onDownload,
  onShare
}) => {
  const handlePreview = useCallback(() => {
    onPreview(credential);
  }, [onPreview, credential]);

  const handleDownload = useCallback(() => {
    onDownload(credential);
  }, [onDownload, credential]);

  const handleShare = useCallback(() => {
    onShare(credential);
  }, [onShare, credential]);

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreview}
        className="flex items-center gap-2"
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
});

CredentialActions.displayName = 'CredentialActions';
