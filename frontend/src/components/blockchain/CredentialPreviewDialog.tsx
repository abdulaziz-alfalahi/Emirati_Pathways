
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Share, Printer } from 'lucide-react';
import { BlockchainCredential } from '@/types/blockchainCredentials';
import CredentialTemplate from './CredentialTemplate';
import { toast } from 'sonner';

interface CredentialPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  credential: BlockchainCredential | null;
  onDownload?: (credential: BlockchainCredential) => void;
  onShare?: (credential: BlockchainCredential) => void;
}

const CredentialPreviewDialog: React.FC<CredentialPreviewDialogProps> = ({
  isOpen,
  onClose,
  credential,
  onDownload,
  onShare
}) => {
  if (!credential) return null;

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(credential);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(credential);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Credential Preview</DialogTitle>
          <DialogDescription>
            Preview your credential in different formats
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="certificate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="certificate">Certificate View</TabsTrigger>
            <TabsTrigger value="card">Card View</TabsTrigger>
            <TabsTrigger value="compact">Compact Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="certificate" className="mt-6">
            <div className="flex justify-center">
              <CredentialTemplate 
                credential={credential} 
                variant="certificate"
                className="w-full max-w-2xl"
              />
            </div>
          </TabsContent>

          <TabsContent value="card" className="mt-6">
            <div className="flex justify-center">
              <CredentialTemplate 
                credential={credential} 
                variant="card"
                className="w-full max-w-md"
              />
            </div>
          </TabsContent>

          <TabsContent value="compact" className="mt-6">
            <div className="flex justify-center">
              <CredentialTemplate 
                credential={credential} 
                variant="preview"
                className="w-full max-w-lg"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Credential ID: {credential.id}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 me-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 me-2" />
              Download
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share className="h-4 w-4 me-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CredentialPreviewDialog;
