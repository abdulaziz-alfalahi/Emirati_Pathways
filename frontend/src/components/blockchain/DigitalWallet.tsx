
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { blockchainCredentialService } from '@/services/blockchain/blockchainCredentialService';
import { auditLogger } from '@/services/blockchain/auditLogger';
import { BlockchainCredential } from '@/types/blockchainCredentials';
import TransactionHistory from './TransactionHistory';
import BatchOperationsDialog from './BatchOperationsDialog';
import CredentialPreviewDialog from './CredentialPreviewDialog';
import WalletHeader from './wallet/WalletHeader';
import WalletEmptyState from './wallet/WalletEmptyState';
import WalletLoadingState from './wallet/WalletLoadingState';
import BatchOperationsHeader from './wallet/BatchOperationsHeader';
import CredentialsGrid from './wallet/CredentialsGrid';
import CredentialsList from './wallet/CredentialsList';
import { useToast } from '@/hooks/use-toast';

const DigitalWallet: React.FC = () => {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<BlockchainCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([]);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [previewCredential, setPreviewCredential] = useState<BlockchainCredential | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    if (user) {
      loadCredentials();
    }
  }, [user]);

  const loadCredentials = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userCredentials = await blockchainCredentialService.getUserCredentials(user.id);
      setCredentials(userCredentials);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toast({
        title: "Error",
        description: "Failed to load credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCredential = (credentialId: string, isSelected: boolean) => {
    setSelectedCredentials(prev => 
      isSelected 
        ? [...prev, credentialId]
        : prev.filter(id => id !== credentialId)
    );
  };

  const handleSelectAll = () => {
    if (selectedCredentials.length === credentials.length) {
      setSelectedCredentials([]);
    } else {
      setSelectedCredentials(credentials.map(c => c.id));
    }
  };

  const getSelectedCredentials = () => {
    return credentials.filter(c => selectedCredentials.includes(c.id));
  };

  const canRevokeCredentials = roles.includes('training_center') || 
                              roles.includes('educational_institution') || 
                              roles.includes('admin');

  const handlePreviewCredential = (credential: BlockchainCredential) => {
    setPreviewCredential(credential);
    setShowPreviewDialog(true);
  };

  const handleDownloadCredential = async (credential: BlockchainCredential) => {
    try {
      // Log download action
      await auditLogger.logOperation({
        user_id: user!.id,
        credential_id: credential.id,
        operation_type: 'download',
        operation_details: {
          action: `Downloaded credential: ${credential.title}`,
          metadata: {
            credential_type: credential.credential_type,
            format: 'JSON'
          },
          result: 'success'
        }
      });

      // Create downloadable credential data
      const credentialData = {
        ...credential,
        downloaded_at: new Date().toISOString(),
        download_format: 'JSON'
      };

      const blob = new Blob([JSON.stringify(credentialData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credential-${credential.title.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Credential downloaded successfully"
      });
    } catch (error) {
      await auditLogger.logOperation({
        user_id: user!.id,
        credential_id: credential.id,
        operation_type: 'download',
        operation_details: {
          action: `Failed to download credential: ${credential.title}`,
          result: 'failure',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download credential",
        variant: "destructive"
      });
    }
  };

  const handleShareCredential = async (credential: BlockchainCredential) => {
    try {
      const shareUrl = `${window.location.origin}/blockchain-credentials/verify?id=${credential.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Blockchain Credential: ${credential.title}`,
          text: `Verify my ${credential.credential_type} credential on the blockchain`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Success",
          description: "Verification link copied to clipboard"
        });
      }

      // Log share action
      await auditLogger.logOperation({
        user_id: user!.id,
        credential_id: credential.id,
        operation_type: 'share',
        operation_details: {
          action: `Shared credential: ${credential.title}`,
          metadata: {
            share_method: navigator.share ? 'native_share' : 'clipboard',
            verification_url: shareUrl
          },
          result: 'success'
        }
      });
    } catch (error) {
      await auditLogger.logOperation({
        user_id: user!.id,
        credential_id: credential.id,
        operation_type: 'share',
        operation_details: {
          action: `Failed to share credential: ${credential.title}`,
          result: 'failure',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      console.error('Share failed:', error);
      toast({
        title: "Error",
        description: "Failed to share credential",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Wallet className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-muted-foreground">Please log in to access your digital wallet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <WalletHeader />
        <CardContent>
          <Tabs defaultValue="credentials" className="space-y-6">
            <TabsList>
              <TabsTrigger value="credentials">My Credentials</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials">
              {isLoading ? (
                <WalletLoadingState />
              ) : credentials.length === 0 ? (
                <WalletEmptyState />
              ) : (
                <div className="space-y-4">
                  <BatchOperationsHeader
                    selectedCredentials={selectedCredentials}
                    totalCredentials={credentials.length}
                    viewMode={viewMode}
                    onSelectAll={handleSelectAll}
                    onViewModeChange={setViewMode}
                    onBatchOperations={() => setShowBatchDialog(true)}
                  />

                  {viewMode === 'grid' ? (
                    <CredentialsGrid
                      credentials={credentials}
                      selectedCredentials={selectedCredentials}
                      onSelectCredential={handleSelectCredential}
                      onPreviewCredential={handlePreviewCredential}
                      onDownloadCredential={handleDownloadCredential}
                      onShareCredential={handleShareCredential}
                    />
                  ) : (
                    <CredentialsList
                      credentials={credentials}
                      selectedCredentials={selectedCredentials}
                      onSelectCredential={handleSelectCredential}
                      onPreviewCredential={handlePreviewCredential}
                      onDownloadCredential={handleDownloadCredential}
                      onShareCredential={handleShareCredential}
                    />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <TransactionHistory />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Batch Operations Dialog */}
      <BatchOperationsDialog
        isOpen={showBatchDialog}
        onClose={() => setShowBatchDialog(false)}
        selectedCredentials={getSelectedCredentials()}
        userId={user.id}
        canRevoke={canRevokeCredentials}
      />

      {/* Credential Preview Dialog */}
      <CredentialPreviewDialog
        isOpen={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        credential={previewCredential}
        onDownload={handleDownloadCredential}
        onShare={handleShareCredential}
      />
    </div>
  );
};

export default DigitalWallet;
