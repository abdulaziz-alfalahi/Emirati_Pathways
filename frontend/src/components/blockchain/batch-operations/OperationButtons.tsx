
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Share, X } from 'lucide-react';

interface OperationButtonsProps {
  isProcessing: boolean;
  canRevoke?: boolean;
  revocationReason: string;
  onRevocationReasonChange: (reason: string) => void;
  onBatchDownload: () => void;
  onBatchShare: () => void;
  onBatchRevoke: () => void;
}

const OperationButtons: React.FC<OperationButtonsProps> = ({
  isProcessing,
  canRevoke = false,
  revocationReason,
  onRevocationReasonChange,
  onBatchDownload,
  onBatchShare,
  onBatchRevoke
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        onClick={onBatchDownload}
        disabled={isProcessing}
        className="flex items-center"
      >
        <Download className="h-4 w-4 me-2" />
        Download All
      </Button>
      
      <Button
        variant="outline"
        onClick={onBatchShare}
        disabled={isProcessing}
        className="flex items-center"
      >
        <Share className="h-4 w-4 me-2" />
        Share All
      </Button>
      
      {canRevoke && (
        <div className="col-span-2">
          <Textarea
            placeholder="Enter revocation reason..."
            value={revocationReason}
            onChange={(e) => onRevocationReasonChange(e.target.value)}
            className="mb-2"
          />
          <Button
            variant="destructive"
            onClick={onBatchRevoke}
            disabled={isProcessing || !revocationReason.trim()}
            className="w-full flex items-center"
          >
            <X className="h-4 w-4 me-2" />
            Revoke All
          </Button>
        </div>
      )}
    </div>
  );
};

export default OperationButtons;
