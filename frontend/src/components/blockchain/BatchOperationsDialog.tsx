
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BlockchainCredential } from '@/types/blockchainCredentials';
import { batchCredentialService, BatchOperationResult } from '@/services/blockchain/batchCredentialService';
import { toast } from 'sonner';
import SelectedCredentialsSection from './batch-operations/SelectedCredentialsSection';
import OperationButtons from './batch-operations/OperationButtons';
import ProcessingState from './batch-operations/ProcessingState';
import ResultsDisplay from './batch-operations/ResultsDisplay';

interface BatchOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCredentials: BlockchainCredential[];
  userId: string;
  canRevoke?: boolean;
}

const BatchOperationsDialog: React.FC<BatchOperationsDialogProps> = ({
  isOpen,
  onClose,
  selectedCredentials,
  userId,
  canRevoke = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [operation, setOperation] = useState<'download' | 'share' | 'revoke' | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [result, setResult] = useState<BatchOperationResult | null>(null);
  const [progress, setProgress] = useState(0);

  const handleBatchDownload = async () => {
    setIsProcessing(true);
    setOperation('download');
    setProgress(0);

    try {
      const credentialIds = selectedCredentials.map(c => c.id);
      const result = await batchCredentialService.batchDownload(credentialIds, userId);
      
      setResult(result);
      setProgress(100);

      if (result.downloadUrl) {
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = `batch-credentials-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(result.downloadUrl);
      }

      toast.success(`Downloaded ${result.successful.length} credentials successfully`);
    } catch (error) {
      console.error('Batch download failed:', error);
      toast.error('Batch download failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchShare = async () => {
    setIsProcessing(true);
    setOperation('share');
    setProgress(0);

    try {
      const credentialIds = selectedCredentials.map(c => c.id);
      const result = await batchCredentialService.batchShare(credentialIds, userId);
      
      setResult(result);
      setProgress(100);

      toast.success(`Shared ${result.successful.length} credentials successfully`);
    } catch (error) {
      console.error('Batch share failed:', error);
      toast.error('Batch share failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchRevoke = async () => {
    if (!revocationReason.trim()) {
      toast.error('Please provide a revocation reason');
      return;
    }

    setIsProcessing(true);
    setOperation('revoke');
    setProgress(0);

    try {
      const credentialIds = selectedCredentials.map(c => c.id);
      const result = await batchCredentialService.batchRevoke(credentialIds, revocationReason, userId);
      
      setResult(result);
      setProgress(100);

      toast.success(`Revoked ${result.successful.length} credentials successfully`);
    } catch (error) {
      console.error('Batch revocation failed:', error);
      toast.error('Batch revocation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setOperation(null);
    setResult(null);
    setProgress(0);
    setRevocationReason('');
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Batch Operations</DialogTitle>
          <DialogDescription>
            Manage {selectedCredentials.length} selected credentials
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SelectedCredentialsSection credentials={selectedCredentials} />

          {!operation && !result && (
            <OperationButtons
              isProcessing={isProcessing}
              canRevoke={canRevoke}
              revocationReason={revocationReason}
              onRevocationReasonChange={setRevocationReason}
              onBatchDownload={handleBatchDownload}
              onBatchShare={handleBatchShare}
              onBatchRevoke={handleBatchRevoke}
            />
          )}

          <ProcessingState operation={operation} progress={progress} />

          {result && <ResultsDisplay result={result} onReset={resetDialog} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchOperationsDialog;
